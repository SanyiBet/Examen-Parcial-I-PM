import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehiculoEntity, TipoVehiculo } from '../entities/vehiculo.entity';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(VehiculoEntity)
    private readonly vehiculoRepo: Repository<VehiculoEntity>,
  ) {}

  async findAll(tipo?: TipoVehiculo, placa?: string) {
    const query = this.vehiculoRepo.createQueryBuilder('v');
    if (tipo) {
      query.andWhere('v.tipo = :tipo', { tipo });
    }
    if (placa) {
      query.andWhere('LOWER(v.placa) LIKE LOWER(:placa)', { placa: `%${placa}%` });
    }
    return query.orderBy('v.placa', 'ASC').getMany();
  }

  async findOne(id: string) {
    const vehiculo = await this.vehiculoRepo.findOne({ where: { id } });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }
    return vehiculo;
  }

  async findByPlaca(placa: string) {
    return this.vehiculoRepo.findOne({ where: { placa } });
  }

  async create(data: Partial<VehiculoEntity>) {
    if (!data.placa || !data.marca || !data.modelo || !data.capacidadCargaKg || !data.tipo) {
      throw new BadRequestException('Faltan campos obligatorios para el vehículo');
    }

    const existe = await this.findByPlaca(data.placa);
    if (existe) {
      throw new BadRequestException(`Ya existe un vehículo con placa ${data.placa}`);
    }

    if (data.tipo === 'FurgonetaElectrica') {
      if (data.porcentajeBateria !== undefined && (data.porcentajeBateria < 0 || data.porcentajeBateria > 100)) {
        throw new BadRequestException('El porcentaje de batería debe estar estrictamente entre 0% y 100%');
      }
      if (!data.capacidadBateriaKWh || data.capacidadBateriaKWh <= 0) {
        throw new BadRequestException('La capacidad de batería debe ser mayor a 0');
      }
      if (!data.consumoKWh100Km || data.consumoKWh100Km <= 0) {
        throw new BadRequestException('El consumo de energía por 100km debe ser mayor a 0');
      }
      // Autonomía teórica
      data.autonomiaKm = Number(((data.capacidadBateriaKWh / data.consumoKWh100Km) * 100).toFixed(2));
    } else if (data.tipo === 'CamionCarga') {
      if (!data.consumoLitros100Km || data.consumoLitros100Km <= 0) {
        throw new BadRequestException('El consumo de litros por 100km debe ser mayor a 0');
      }
      if (!data.precioLitro || data.precioLitro <= 0) {
        throw new BadRequestException('El precio por litro de combustible debe ser mayor a 0');
      }
    }

    const nuevo = this.vehiculoRepo.create(data);
    return this.vehiculoRepo.save(nuevo);
  }

  async update(id: string, data: Partial<VehiculoEntity>) {
    const vehiculo = await this.findOne(id);

    if (data.placa && data.placa !== vehiculo.placa) {
      const existe = await this.findByPlaca(data.placa);
      if (existe) {
        throw new BadRequestException(`Ya existe un vehículo con placa ${data.placa}`);
      }
    }

    if (data.porcentajeBateria !== undefined && (data.porcentajeBateria < 0 || data.porcentajeBateria > 100)) {
      throw new BadRequestException('El porcentaje de batería debe estar estrictamente entre 0% y 100%');
    }

    Object.assign(vehiculo, data);
    if (vehiculo.tipo === 'FurgonetaElectrica' && vehiculo.capacidadBateriaKWh && vehiculo.consumoKWh100Km) {
      vehiculo.autonomiaKm = Number(((vehiculo.capacidadBateriaKWh / vehiculo.consumoKWh100Km) * 100).toFixed(2));
    }

    return this.vehiculoRepo.save(vehiculo);
  }

  async evaluarEficiencia(id: string) {
    const vehiculo = await this.findOne(id);

    if (vehiculo.tipo === 'CamionCarga') {
      const consumoLitros100Km = vehiculo.consumoLitros100Km || 0;
      const precioLitro = vehiculo.precioLitro || 0;
      const costoMantenimientoKm = vehiculo.costoMantenimientoKm || 0;
      const costoPorKm = ((consumoLitros100Km / 100) * precioLitro) + costoMantenimientoKm;
      
      return {
        tipo: vehiculo.tipo,
        placa: vehiculo.placa,
        consumoLitros100Km,
        costoPorKm: Number(costoPorKm.toFixed(4)),
        evaluacion: costoPorKm < 0.6 ? 'Excelente' : costoPorKm < 1.0 ? 'Aceptable' : 'Alto Consumo',
      };
    } else {
      const capacidadKWh = vehiculo.capacidadBateriaKWh || 0;
      const consumoKWh = vehiculo.consumoKWh100Km || 0;
      const porcentaje = vehiculo.porcentajeBateria || 0;
      const costoKWh = vehiculo.costoKWh || 0;
      
      const energiaActualKWh = (porcentaje / 100) * capacidadKWh;
      const autonomiaActualKm = consumoKWh > 0 ? (energiaActualKWh / consumoKWh) * 100 : 0;
      const costoPorKm = (consumoKWh / 100) * costoKWh;

      return {
        tipo: vehiculo.tipo,
        placa: vehiculo.placa,
        capacidadBateriaKWh: capacidadKWh,
        porcentajeBateria: porcentaje,
        autonomiaActualKm: Number(autonomiaActualKm.toFixed(2)),
        autonomiaMaximaKm: vehiculo.autonomiaKm,
        costoPorKm: Number(costoPorKm.toFixed(4)),
        evaluacion: autonomiaActualKm > 150 ? 'Óptima' : autonomiaActualKm > 50 ? 'Moderada' : 'Requiere Carga Urgente',
      };
    }
  }

  // Req-02: Cálculo polimórfico de tarifa
  calcularTarifa(vehiculo: VehiculoEntity, distanciaKm: number, pesoCargaKg: number, recargaPlanificada = false) {
    if (distanciaKm <= 0) {
      throw new BadRequestException('La distancia debe ser un valor estrictamente positivo');
    }
    if (pesoCargaKg <= 0) {
      throw new BadRequestException('El peso de la carga debe ser un valor estrictamente positivo');
    }
    if (pesoCargaKg > vehiculo.capacidadCargaKg) {
      throw new BadRequestException(`Carga rechazada: el peso (${pesoCargaKg} kg) excede la capacidad autorizada del vehículo (${vehiculo.capacidadCargaKg} kg)`);
    }

    if (vehiculo.tipo === 'CamionCarga') {
      const consumo = vehiculo.consumoLitros100Km || 0;
      const precioLitro = vehiculo.precioLitro || 0;
      const costoMant = vehiculo.costoMantenimientoKm || 0;

      const costoCombustible = (distanciaKm / 100) * consumo * precioLitro;
      const costoOperativo = costoCombustible + (distanciaKm * costoMant);
      const tarifaBase = costoOperativo * 1.35;

      let recargoCargaAutonomia = 0;
      // Si la carga supera el 80% de la capacidad, añadir 8% a la tarifa base
      if (pesoCargaKg > vehiculo.capacidadCargaKg * 0.8) {
        recargoCargaAutonomia = tarifaBase * 0.08;
      }

      return {
        tipo: vehiculo.tipo,
        costoOperativo: Number(costoOperativo.toFixed(2)),
        tarifaBase: Number(tarifaBase.toFixed(2)),
        recargoCargaAutonomia: Number(recargoCargaAutonomia.toFixed(2)),
        totalTarifa: Number((tarifaBase + recargoCargaAutonomia).toFixed(2)),
      };
    } else {
      // Furgoneta eléctrica
      const capacidad = vehiculo.capacidadBateriaKWh || 0;
      const consumo = vehiculo.consumoKWh100Km || 0;
      const costoKWh = vehiculo.costoKWh || 0;
      const porcentaje = vehiculo.porcentajeBateria !== undefined ? vehiculo.porcentajeBateria : 100;
      const autonomiaTotal = vehiculo.autonomiaKm || (consumo > 0 ? (capacidad / consumo) * 100 : 0);

      // Autonomía disponible según porcentaje actual
      const autonomiaDisponible = consumo > 0 ? (((porcentaje / 100) * capacidad) / consumo) * 100 : 0;

      // Impedir inicio de servicios eléctricos sin energía suficiente, salvo recarga planificada registrada
      if (distanciaKm > autonomiaDisponible && !recargaPlanificada) {
        throw new BadRequestException(
          `Energía insuficiente: La distancia requerida (${distanciaKm} km) supera la autonomía actual disponible (${autonomiaDisponible.toFixed(1)} km con ${porcentaje}% de batería). Debe registrar una recarga planificada.`,
        );
      }

      const costoEnergetico = (distanciaKm / 100) * consumo * costoKWh;
      const tarifaBase = (costoEnergetico + 18) * 1.30;

      let recargoCargaAutonomia = 0;
      // Si la distancia supera el 80% de la autonomía, añadir 10% a la tarifa base
      if (distanciaKm > autonomiaTotal * 0.8) {
        recargoCargaAutonomia = tarifaBase * 0.10;
      }

      return {
        tipo: vehiculo.tipo,
        costoOperativo: Number(costoEnergetico.toFixed(2)),
        tarifaBase: Number(tarifaBase.toFixed(2)),
        recargoCargaAutonomia: Number(recargoCargaAutonomia.toFixed(2)),
        totalTarifa: Number((tarifaBase + recargoCargaAutonomia).toFixed(2)),
      };
    }
  }
}
