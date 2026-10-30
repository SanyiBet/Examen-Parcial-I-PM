import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ServicioEntity, EstadoServicio } from '../entities/servicio.entity';
import { VehiculoEntity } from '../entities/vehiculo.entity';
import { ClienteEntity } from '../entities/cliente.entity';
import { HistorialEstadoEntity } from '../entities/historial-estado.entity';
import { VehiculosService } from '../vehiculos/vehiculos.service';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(ServicioEntity)
    private readonly servicioRepo: Repository<ServicioEntity>,
    @InjectRepository(VehiculoEntity)
    private readonly vehiculoRepo: Repository<VehiculoEntity>,
    @InjectRepository(ClienteEntity)
    private readonly clienteRepo: Repository<ClienteEntity>,
    @InjectRepository(HistorialEstadoEntity)
    private readonly historialRepo: Repository<HistorialEstadoEntity>,
    private readonly vehiculosService: VehiculosService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query?: { estado?: EstadoServicio; clienteId?: string; vehiculoId?: string; page?: number; limit?: number }) {
    const qb = this.servicioRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.cliente', 'cliente')
      .leftJoinAndSelect('s.vehiculo', 'vehiculo');

    if (query?.estado) {
      qb.andWhere('s.estado = :estado', { estado: query.estado });
    }
    if (query?.clienteId) {
      qb.andWhere('s.clienteId = :clienteId', { clienteId: query.clienteId });
    }
    if (query?.vehiculoId) {
      qb.andWhere('s.vehiculoId = :vehiculoId', { vehiculoId: query.vehiculoId });
    }

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;

    qb.orderBy('s.fecha', 'DESC')
      .addOrderBy('s.horaInicio', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const s = await this.servicioRepo.findOne({
      where: { id },
      relations: { cliente: true, vehiculo: true, historial: true },
    });
    if (!s) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }
    return s;
  }

  private async validarSuperposicion(vehiculoId: string, fecha: string, inicio: string, fin: string, excludeServicioId?: string) {
    const qb = this.servicioRepo.createQueryBuilder('s')
      .where('s.vehiculoId = :vehiculoId', { vehiculoId })
      .andWhere('s.fecha = :fecha', { fecha })
      .andWhere('s.estado IN (:...estadosActivos)', { estadosActivos: ['Programado', 'En ejecucion'] });

    if (excludeServicioId) {
      qb.andWhere('s.id != :excludeServicioId', { excludeServicioId });
    }

    qb.andWhere('s.horaInicio < :fin AND s.horaFinEstimada > :inicio', { inicio, fin });

    const conflicto = await qb.getOne();
    if (conflicto) {
      throw new ConflictException(
        `Conflicto de horario: El vehículo ya tiene asignado el servicio ${conflicto.codigo} (${conflicto.horaInicio} - ${conflicto.horaFinEstimada}) en la fecha ${fecha}.`,
      );
    }
  }

  async simularTarifa(dto: { vehiculoId: string; distanciaKm: number; pesoCargaKg: number; recargaPlanificada?: boolean; fecha?: string }) {
    const vehiculo = await this.vehiculosService.findOne(dto.vehiculoId);
    const calculo = this.vehiculosService.calcularTarifa(
      vehiculo,
      Number(dto.distanciaKm),
      Number(dto.pesoCargaKg),
      dto.recargaPlanificada,
    );

    let recargoDistancia = 0;
    if (dto.distanciaKm > 300) {
      recargoDistancia = Number((calculo.tarifaBase * 0.06).toFixed(2));
    }

    let recargoDomingo = 0;
    let esDomingo = false;
    if (dto.fecha) {
      const parts = dto.fecha.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (d.getDay() === 0) {
        esDomingo = true;
        recargoDomingo = Number((calculo.tarifaBase * 0.12).toFixed(2));
      }
    }

    const totalRecargos = Number((calculo.recargoCargaAutonomia + recargoDistancia + recargoDomingo).toFixed(2));
    const totalTarifa = Number((calculo.tarifaBase + totalRecargos).toFixed(2));

    return {
      costoOperativo: calculo.costoOperativo,
      tarifaBase: calculo.tarifaBase,
      recargoCargaAutonomia: calculo.recargoCargaAutonomia,
      recargoDistancia,
      recargoDomingo,
      totalRecargos,
      totalTarifa,
      esDomingo,
      valido: true,
    };
  }

  async create(data: Partial<ServicioEntity>, usuarioId?: string) {
    if (!data.codigo || !data.clienteId || !data.vehiculoId || !data.origen || !data.destino) {
      throw new BadRequestException('Faltan campos obligatorios para el servicio');
    }

    if (!data.distanciaKm || data.distanciaKm <= 0) {
      throw new BadRequestException('La distancia debe ser estrictamente mayor a 0');
    }

    if (!data.pesoCargaKg || data.pesoCargaKg <= 0) {
      throw new BadRequestException('El peso de la carga debe ser estrictamente mayor a 0');
    }

    const existeCod = await this.servicioRepo.findOne({ where: { codigo: data.codigo } });
    if (existeCod) {
      throw new BadRequestException(`El código de servicio ${data.codigo} ya existe`);
    }

    const cliente = await this.clienteRepo.findOne({ where: { id: data.clienteId } });
    if (!cliente) {
      throw new BadRequestException('Cliente no encontrado');
    }

    await this.validarSuperposicion(
      data.vehiculoId,
      data.fecha || new Date().toISOString().split('T')[0],
      data.horaInicio || '08:00',
      data.horaFinEstimada || '10:00',
    );

    const simulacion = await this.simularTarifa({
      vehiculoId: data.vehiculoId,
      distanciaKm: data.distanciaKm,
      pesoCargaKg: data.pesoCargaKg,
      recargaPlanificada: data.recargaPlanificada,
      fecha: data.fecha,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const servicio = queryRunner.manager.create(ServicioEntity, {
        ...data,
        costoOperativo: simulacion.costoOperativo,
        tarifaCalculada: simulacion.tarifaBase,
        recargoAplicado: simulacion.totalRecargos,
        estado: 'Programado',
      });

      const guardado = await queryRunner.manager.save(servicio);

      const audit = queryRunner.manager.create(HistorialEstadoEntity, {
        servicioId: guardado.id,
        estadoAnterior: 'N/A',
        estadoNuevo: 'Programado',
        usuarioId: usuarioId || 'sistema',
        notas: 'Creación y planificación inicial del servicio',
      });
      await queryRunner.manager.save(audit);

      await queryRunner.commitTransaction();
      return this.findOne(guardado.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async asignarVehiculo(id: string, nuevoVehiculoId: string, usuarioId?: string) {
    const servicio = await this.findOne(id);
    if (servicio.estado === 'Completado' || servicio.estado === 'Cancelado') {
      throw new BadRequestException(`No se puede reasignar un servicio en estado ${servicio.estado}`);
    }

    await this.validarSuperposicion(
      nuevoVehiculoId,
      servicio.fecha,
      servicio.horaInicio,
      servicio.horaFinEstimada,
      servicio.id,
    );

    const vehiculo = await this.vehiculosService.findOne(nuevoVehiculoId);
    const simulacion = await this.simularTarifa({
      vehiculoId: nuevoVehiculoId,
      distanciaKm: servicio.distanciaKm,
      pesoCargaKg: servicio.pesoCargaKg,
      recargaPlanificada: servicio.recargaPlanificada,
      fecha: servicio.fecha,
    });

    servicio.vehiculoId = nuevoVehiculoId;
    servicio.costoOperativo = simulacion.costoOperativo;
    servicio.tarifaCalculada = simulacion.tarifaBase;
    servicio.recargoAplicado = simulacion.totalRecargos;

    const audit = this.historialRepo.create({
      servicioId: servicio.id,
      estadoAnterior: servicio.estado,
      estadoNuevo: servicio.estado,
      usuarioId: usuarioId || 'sistema',
      notas: `Vehículo reasignado a ${vehiculo.placa} (${vehiculo.tipo})`,
    });
    await this.historialRepo.save(audit);

    return this.servicioRepo.save(servicio);
  }

  async actualizarEstado(id: string, nuevoEstado: EstadoServicio, usuarioId?: string) {
    const servicio = await this.findOne(id);
    const estadoAnterior = servicio.estado;

    if (estadoAnterior === nuevoEstado) {
      return servicio;
    }

    if (estadoAnterior === 'Completado' || estadoAnterior === 'Cancelado') {
      throw new BadRequestException(`No se puede modificar un servicio que ya está en estado final: ${estadoAnterior}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      servicio.estado = nuevoEstado;

      if (nuevoEstado === 'Completado') {
        const vehiculo = await queryRunner.manager.findOne(VehiculoEntity, { where: { id: servicio.vehiculoId } });
        if (vehiculo) {
          vehiculo.kilometraje = Number((vehiculo.kilometraje + servicio.distanciaKm).toFixed(2));
          vehiculo.estado = 'Disponible';

          if (vehiculo.tipo === 'FurgonetaElectrica' && vehiculo.consumoKWh100Km && vehiculo.capacidadBateriaKWh) {
            const energiaConsumida = (servicio.distanciaKm / 100) * vehiculo.consumoKWh100Km;
            const porcentajeConsumido = (energiaConsumida / vehiculo.capacidadBateriaKWh) * 100;
            vehiculo.porcentajeBateria = Math.max(0, Number(((vehiculo.porcentajeBateria || 100) - porcentajeConsumido).toFixed(1)));
          }

          await queryRunner.manager.save(vehiculo);
        }
      } else if (nuevoEstado === 'En ejecucion') {
        const vehiculo = await queryRunner.manager.findOne(VehiculoEntity, { where: { id: servicio.vehiculoId } });
        if (vehiculo) {
          vehiculo.estado = 'EnServicio';
          await queryRunner.manager.save(vehiculo);
        }
      } else if (nuevoEstado === 'Cancelado') {
        const vehiculo = await queryRunner.manager.findOne(VehiculoEntity, { where: { id: servicio.vehiculoId } });
        if (vehiculo && vehiculo.estado === 'EnServicio') {
          vehiculo.estado = 'Disponible';
          await queryRunner.manager.save(vehiculo);
        }
      }

      const actualizado = await queryRunner.manager.save(servicio);

      const audit = queryRunner.manager.create(HistorialEstadoEntity, {
        servicioId: servicio.id,
        estadoAnterior,
        estadoNuevo: nuevoEstado,
        usuarioId: usuarioId || 'sistema',
        notas: `Cambio de estado de ${estadoAnterior} a ${nuevoEstado}`,
      });
      await queryRunner.manager.save(audit);

      await queryRunner.commitTransaction();
      return this.findOne(actualizado.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
