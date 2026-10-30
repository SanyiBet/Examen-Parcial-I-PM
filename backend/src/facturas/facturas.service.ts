import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { FacturaEntity } from '../entities/factura.entity';
import { DetalleFacturaEntity } from '../entities/detalle-factura.entity';
import { ServicioEntity } from '../entities/servicio.entity';
import { ClienteEntity } from '../entities/cliente.entity';

@Injectable()
export class FacturasService {
  constructor(
    @InjectRepository(FacturaEntity)
    private readonly facturaRepo: Repository<FacturaEntity>,
    @InjectRepository(ServicioEntity)
    private readonly servicioRepo: Repository<ServicioEntity>,
    @InjectRepository(ClienteEntity)
    private readonly clienteRepo: Repository<ClienteEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(page?: number, limit?: number) {
    if (page && limit) {
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const [items, total] = await this.facturaRepo.findAndCount({
        relations: { cliente: true, detalles: { servicio: true } },
        order: { createdAt: 'DESC' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });
      return { items, total, page: pageNum, limit: limitNum };
    }

    return this.facturaRepo.find({
      relations: { cliente: true, detalles: { servicio: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const f = await this.facturaRepo.findOne({
      where: { id },
      relations: { cliente: true, detalles: { servicio: { vehiculo: true } } },
    });
    if (!f) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }
    return f;
  }

  // Req-04: Facturación simulada con transacción atómica
  async generarFactura(dto: { clienteId: string; servicioIds: string[]; porcentajeImpuesto?: number }) {
    if (!dto.clienteId) {
      throw new BadRequestException('El ID del cliente es obligatorio');
    }
    if (!dto.servicioIds || dto.servicioIds.length === 0) {
      throw new BadRequestException('Debe incluir al menos un servicio para facturar');
    }

    const cliente = await this.clienteRepo.findOne({ where: { id: dto.clienteId } });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const servicios = await this.servicioRepo.find({
      where: { id: In(dto.servicioIds) },
    });

    if (servicios.length !== dto.servicioIds.length) {
      throw new BadRequestException('Uno o más servicios especificados no existen');
    }

    // Validar que todos los servicios pertenezcan al cliente
    for (const s of servicios) {
      if (s.clienteId !== dto.clienteId) {
        throw new BadRequestException(`El servicio ${s.codigo} no pertenece al cliente seleccionado`);
      }
      // Facturar exclusivamente servicios completados
      if (s.estado !== 'Completado') {
        throw new BadRequestException(`El servicio ${s.codigo} no puede facturarse porque su estado es ${s.estado}. Solo se facturan servicios Completados.`);
      }
      // Cada servicio solo puede aparecer en una factura
      if (s.facturado) {
        throw new ConflictException(`El servicio ${s.codigo} ya ha sido facturado previamente`);
      }
    }

    // Contar total de servicios completados del cliente en el mes para el descuento
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);
    const fechaMesStr = primerDiaMes.toISOString().split('T')[0].substring(0, 7); // 'YYYY-MM'

    const serviciosDelMes = await this.servicioRepo.createQueryBuilder('s')
      .where('s.clienteId = :clienteId', { clienteId: dto.clienteId })
      .andWhere('s.estado = :estado', { estado: 'Completado' })
      .andWhere('s.fecha LIKE :mes', { mes: `${fechaMesStr}%` })
      .getCount();

    // Regla académica de descuento
    let porcentajeDescuento = 0;
    if (serviciosDelMes >= 6) {
      porcentajeDescuento = 10;
    } else if (serviciosDelMes >= 3) {
      porcentajeDescuento = 5;
    }

    // Calcular montos por servicio
    let subtotal = 0;
    let recargosTotales = 0;
    const detallesData: { servicioId: string; tarifa: number; recargos: number }[] = [];

    for (const s of servicios) {
      const tarifaBase = Number(s.tarifaCalculada.toFixed(2));
      
      // Recargos
      let recargoDistancia = 0;
      if (s.distanciaKm > 300) {
        recargoDistancia = Number((tarifaBase * 0.06).toFixed(2));
      }

      let recargoDomingo = 0;
      const parts = s.fecha.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (d.getDay() === 0) {
        recargoDomingo = Number((tarifaBase * 0.12).toFixed(2));
      }

      const recargoCargaAutonomia = Number((s.recargoAplicado || 0).toFixed(2));
      const recargoTotalServicio = Number((recargoCargaAutonomia + recargoDistancia + recargoDomingo).toFixed(2));

      subtotal += tarifaBase;
      recargosTotales += recargoTotalServicio;

      detallesData.push({
        servicioId: s.id,
        tarifa: tarifaBase,
        recargos: recargoTotalServicio,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    recargosTotales = Number(recargosTotales.toFixed(2));

    // Regla: Los recargos se suman sobre la tarifa de cada servicio; se aplica un único descuento por cliente al importe después de recargos y luego el impuesto
    const baseParaDescuento = Number((subtotal + recargosTotales).toFixed(2));
    const descuento = Number(((baseParaDescuento * porcentajeDescuento) / 100).toFixed(2));
    const baseImponible = Number((baseParaDescuento - descuento).toFixed(2));

    const tasaImpuesto = dto.porcentajeImpuesto !== undefined ? dto.porcentajeImpuesto : 15;
    const impuesto = Number(((baseImponible * tasaImpuesto) / 100).toFixed(2));
    const total = Number((baseImponible + impuesto).toFixed(2));

    // Generar código único de factura
    const conteoFacturas = await this.facturaRepo.count();
    const codigoFactura = `FAC-${new Date().getFullYear()}-${String(conteoFacturas + 1).padStart(5, '0')}`;

    // Operación atómica con transacción: ante error no debe existir factura parcial
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuevaFactura = queryRunner.manager.create(FacturaEntity, {
        codigo: codigoFactura,
        clienteId: dto.clienteId,
        fecha: new Date().toISOString().split('T')[0],
        subtotal,
        recargos: recargosTotales,
        descuento,
        porcentajeDescuento,
        impuesto,
        porcentajeImpuesto: tasaImpuesto,
        total,
      });

      const guardada = await queryRunner.manager.save(FacturaEntity, nuevaFactura);

      for (const d of detallesData) {
        const det = queryRunner.manager.create(DetalleFacturaEntity, {
          facturaId: guardada.id,
          servicioId: d.servicioId,
          tarifa: d.tarifa,
          recargos: d.recargos,
        });
        await queryRunner.manager.save(DetalleFacturaEntity, det);

        // Marcar servicio como facturado
        await queryRunner.manager.update(ServicioEntity, { id: d.servicioId }, { facturado: true });
      }

      await queryRunner.commitTransaction();
      return this.findOne(guardada.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
