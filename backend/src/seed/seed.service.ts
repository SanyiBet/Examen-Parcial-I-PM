import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsuarioEntity } from '../entities/usuario.entity';
import { VehiculoEntity } from '../entities/vehiculo.entity';
import { ClienteEntity } from '../entities/cliente.entity';
import { ServicioEntity } from '../entities/servicio.entity';
import { FacturaEntity } from '../entities/factura.entity';
import { DetalleFacturaEntity } from '../entities/detalle-factura.entity';
import { HistorialEstadoEntity } from '../entities/historial-estado.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepo: Repository<UsuarioEntity>,
    @InjectRepository(VehiculoEntity)
    private readonly vehiculoRepo: Repository<VehiculoEntity>,
    @InjectRepository(ClienteEntity)
    private readonly clienteRepo: Repository<ClienteEntity>,
    @InjectRepository(ServicioEntity)
    private readonly servicioRepo: Repository<ServicioEntity>,
    @InjectRepository(FacturaEntity)
    private readonly facturaRepo: Repository<FacturaEntity>,
    @InjectRepository(DetalleFacturaEntity)
    private readonly detalleRepo: Repository<DetalleFacturaEntity>,
    @InjectRepository(HistorialEstadoEntity)
    private readonly historialRepo: Repository<HistorialEstadoEntity>,
  ) {}

  async onApplicationBootstrap() {
    const totalUsers = await this.usuarioRepo.count();
    if (totalUsers === 0) {
      this.logger.log('Iniciando carga de datos de prueba reproducibles (Seed)...');
      await this.runSeed();
      this.logger.log('Seed completado con éxito.');
    }
  }

  async runSeed() {
    // 1. Usuarios
    const passHash = await bcrypt.hash('admin123', 10);
    const passOpHash = await bcrypt.hash('operador123', 10);

    const admin = await this.usuarioRepo.save({
      nombre: 'Administrador General',
      email: 'admin@translogic.com',
      passwordHash: passHash,
      rol: 'Administrador',
      activo: true,
    });

    const operador = await this.usuarioRepo.save({
      nombre: 'Operador Logístico',
      email: 'operador@translogic.com',
      passwordHash: passOpHash,
      rol: 'Operador',
      activo: true,
    });

    // 2. Vehículos
    const v1 = await this.vehiculoRepo.save({
      placa: 'PBX-1024',
      marca: 'Volvo',
      modelo: 'FH 540',
      anio: 2023,
      capacidadCargaKg: 28000,
      kilometraje: 45200,
      tipo: 'CamionCarga',
      estado: 'Disponible',
      consumoLitros100Km: 32.5,
      precioLitro: 1.15,
      numeroEjes: 3,
      costoMantenimientoKm: 0.18,
    });

    const v2 = await this.vehiculoRepo.save({
      placa: 'GSX-8841',
      marca: 'Mercedes-Benz',
      modelo: 'Actros 2645',
      anio: 2022,
      capacidadCargaKg: 26000,
      kilometraje: 78400,
      tipo: 'CamionCarga',
      estado: 'Disponible',
      consumoLitros100Km: 34.0,
      precioLitro: 1.15,
      numeroEjes: 3,
      costoMantenimientoKm: 0.22,
    });

    const v3 = await this.vehiculoRepo.save({
      placa: 'TBA-4512',
      marca: 'Hino',
      modelo: '500 Series',
      anio: 2021,
      capacidadCargaKg: 12000,
      kilometraje: 112000,
      tipo: 'CamionCarga',
      estado: 'Disponible',
      consumoLitros100Km: 24.0,
      precioLitro: 1.15,
      numeroEjes: 2,
      costoMantenimientoKm: 0.14,
    });

    const v4 = await this.vehiculoRepo.save({
      placa: 'PCX-9010',
      marca: 'Ford',
      modelo: 'E-Transit Custom',
      anio: 2024,
      capacidadCargaKg: 1500,
      kilometraje: 12400,
      tipo: 'FurgonetaElectrica',
      estado: 'Disponible',
      capacidadBateriaKWh: 68.0,
      consumoKWh100Km: 21.0,
      costoKWh: 0.12,
      autonomiaKm: 323.8,
      porcentajeBateria: 95,
    });

    const v5 = await this.vehiculoRepo.save({
      placa: 'GBA-3321',
      marca: 'Renault',
      modelo: 'Kangoo E-Tech',
      anio: 2023,
      capacidadCargaKg: 800,
      kilometraje: 18900,
      tipo: 'FurgonetaElectrica',
      estado: 'Disponible',
      capacidadBateriaKWh: 45.0,
      consumoKWh100Km: 16.5,
      costoKWh: 0.12,
      autonomiaKm: 272.7,
      porcentajeBateria: 85,
    });

    const v6 = await this.vehiculoRepo.save({
      placa: 'ABA-7711',
      marca: 'BYD',
      modelo: 'T3 Electric Van',
      anio: 2024,
      capacidadCargaKg: 950,
      kilometraje: 8300,
      tipo: 'FurgonetaElectrica',
      estado: 'Disponible',
      capacidadBateriaKWh: 50.3,
      consumoKWh100Km: 18.0,
      costoKWh: 0.12,
      autonomiaKm: 279.4,
      porcentajeBateria: 90,
    });

    // 3. Clientes
    const c1 = await this.clienteRepo.save({
      identificacion: '1790016919001',
      nombre: 'Corporación La Favorita C.A.',
      correo: 'logistica@favorita.ec',
      telefono: '022998800',
    });

    const c2 = await this.clienteRepo.save({
      identificacion: '1790022412001',
      nombre: 'Pronaca S.A.',
      correo: 'despachos@pronaca.com.ec',
      telefono: '023947000',
    });

    const c3 = await this.clienteRepo.save({
      identificacion: '0990004199001',
      nombre: 'Cervecería Nacional CN S.A.',
      correo: 'distribucion@cerveceria.com.ec',
      telefono: '042590000',
    });

    const c4 = await this.clienteRepo.save({
      identificacion: '1790008541001',
      nombre: 'Nestlé Ecuador S.A.',
      correo: 'operaciones@nestle.com.ec',
      telefono: '022987100',
    });

    // 4. Servicios Completados y Activos
    const s1 = await this.servicioRepo.save({
      codigo: 'SRV-2026-001',
      clienteId: c1.id,
      vehiculoId: v1.id,
      origen: 'Quito Terminal Sur',
      destino: 'Guayaquil Puerto Marítimo',
      distanciaKm: 420,
      pesoCargaKg: 24000, // > 80% capacidad (28000 * 0.8 = 22400) -> recargo 8%
      fecha: '2026-10-12',
      horaInicio: '06:00',
      horaFinEstimada: '14:00',
      estado: 'Completado',
      recargaPlanificada: false,
      costoOperativo: 232.47,
      tarifaCalculada: 313.83,
      recargoAplicado: 43.94, // 8% por peso + 6% por >300km
      facturado: true,
    });

    const s2 = await this.servicioRepo.save({
      codigo: 'SRV-2026-002',
      clienteId: c1.id,
      vehiculoId: v4.id,
      origen: 'Quito Centro',
      destino: 'Machala Centro',
      distanciaKm: 180,
      pesoCargaKg: 900,
      fecha: '2026-10-15',
      horaInicio: '08:00',
      horaFinEstimada: '12:00',
      estado: 'Completado',
      recargaPlanificada: true,
      costoOperativo: 4.54,
      tarifaCalculada: 29.30,
      recargoAplicado: 0,
      facturado: true,
    });

    const s3 = await this.servicioRepo.save({
      codigo: 'SRV-2026-003',
      clienteId: c1.id,
      vehiculoId: v2.id,
      origen: 'Guayaquil Parque Industrial',
      destino: 'Cuenca Parque Industrial',
      distanciaKm: 210,
      pesoCargaKg: 18000,
      fecha: '2026-10-18', // Domingo! Recargo domingo 12%
      horaInicio: '07:00',
      horaFinEstimada: '13:00',
      estado: 'Completado',
      recargaPlanificada: false,
      costoOperativo: 128.16,
      tarifaCalculada: 173.02,
      recargoAplicado: 20.76, // 12% domingo
      facturado: true,
    });

    const s4 = await this.servicioRepo.save({
      codigo: 'SRV-2026-004',
      clienteId: c2.id,
      vehiculoId: v3.id,
      origen: 'Santo Domingo',
      destino: 'Quito Panamericana',
      distanciaKm: 140,
      pesoCargaKg: 9500,
      fecha: '2026-10-20',
      horaInicio: '09:00',
      horaFinEstimada: '12:30',
      estado: 'Completado',
      recargaPlanificada: false,
      costoOperativo: 58.24,
      tarifaCalculada: 78.62,
      recargoAplicado: 0,
      facturado: false,
    });

    const s5 = await this.servicioRepo.save({
      codigo: 'SRV-2026-005',
      clienteId: c3.id,
      vehiculoId: v5.id,
      origen: 'Guayaquil Norte',
      destino: 'Duran Almacenes',
      distanciaKm: 35,
      pesoCargaKg: 500,
      fecha: '2026-10-22',
      horaInicio: '10:00',
      horaFinEstimada: '11:30',
      estado: 'Completado',
      recargaPlanificada: false,
      costoOperativo: 0.69,
      tarifaCalculada: 24.30,
      recargoAplicado: 0,
      facturado: false,
    });

    const s6 = await this.servicioRepo.save({
      codigo: 'SRV-2026-006',
      clienteId: c2.id,
      vehiculoId: v1.id,
      origen: 'Manta Puerto',
      destino: 'Quito Almacenes',
      distanciaKm: 390,
      pesoCargaKg: 20000,
      fecha: '2026-10-29',
      horaInicio: '07:00',
      horaFinEstimada: '16:00',
      estado: 'En ejecucion',
      recargaPlanificada: false,
      costoOperativo: 215.86,
      tarifaCalculada: 291.41,
      recargoAplicado: 17.48, // 6% > 300km
      facturado: false,
    });

    const s7 = await this.servicioRepo.save({
      codigo: 'SRV-2026-007',
      clienteId: c4.id,
      vehiculoId: v6.id,
      origen: 'Quito Cumbayá',
      destino: 'Tumbaco Bodega',
      distanciaKm: 25,
      pesoCargaKg: 400,
      fecha: '2026-10-31',
      horaInicio: '14:00',
      horaFinEstimada: '15:30',
      estado: 'Programado',
      recargaPlanificada: false,
      costoOperativo: 0.54,
      tarifaCalculada: 24.10,
      recargoAplicado: 0,
      facturado: false,
    });

    // 5. Auditorías de estado
    await this.historialRepo.save([
      { servicioId: s1.id, estadoAnterior: 'Programado', estadoNuevo: 'En ejecucion', usuarioId: operador.id, notas: 'Ruta iniciada a tiempo' },
      { servicioId: s1.id, estadoAnterior: 'En ejecucion', estadoNuevo: 'Completado', usuarioId: operador.id, notas: 'Carga entregada en Puerto Guayaquil' },
      { servicioId: s2.id, estadoAnterior: 'Programado', estadoNuevo: 'Completado', usuarioId: operador.id, notas: 'Entregado con recarga exitosa en ruta' },
      { servicioId: s3.id, estadoAnterior: 'Programado', estadoNuevo: 'Completado', usuarioId: operador.id, notas: 'Servicio en domingo finalizado sin novedad' },
    ]);

    // 6. Factura inicial para c1 con s1, s2, s3 (3 servicios completados -> 5% de descuento)
    const subtotal = Number((s1.tarifaCalculada + s2.tarifaCalculada + s3.tarifaCalculada).toFixed(2));
    const recargos = Number((s1.recargoAplicado + s2.recargoAplicado + s3.recargoAplicado).toFixed(2));
    const base = subtotal + recargos;
    const descuento = Number(((base * 0.05)).toFixed(2));
    const baseImp = base - descuento;
    const impuesto = Number(((baseImp * 0.15)).toFixed(2));
    const total = Number((baseImp + impuesto).toFixed(2));

    const f1 = await this.facturaRepo.save({
      codigo: 'FAC-2026-00001',
      clienteId: c1.id,
      fecha: '2026-10-25',
      subtotal,
      recargos,
      descuento,
      porcentajeDescuento: 5,
      impuesto,
      porcentajeImpuesto: 15,
      total,
    });

    await this.detalleRepo.save([
      { facturaId: f1.id, servicioId: s1.id, tarifa: s1.tarifaCalculada, recargos: s1.recargoAplicado },
      { facturaId: f1.id, servicioId: s2.id, tarifa: s2.tarifaCalculada, recargos: s2.recargoAplicado },
      { facturaId: f1.id, servicioId: s3.id, tarifa: s3.tarifaCalculada, recargos: s3.recargoAplicado },
    ]);
  }
}
