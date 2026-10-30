import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ClienteEntity } from './cliente.entity';
import { VehiculoEntity } from './vehiculo.entity';
import { HistorialEstadoEntity } from './historial-estado.entity';
import { DetalleFacturaEntity } from './detalle-factura.entity';

export type EstadoServicio = 'Programado' | 'En ejecucion' | 'Completado' | 'Cancelado';

@Entity('servicios')
export class ServicioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column()
  clienteId: string;

  @ManyToOne(() => ClienteEntity, (c) => c.servicios, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clienteId' })
  cliente: ClienteEntity;

  @Column()
  vehiculoId: string;

  @ManyToOne(() => VehiculoEntity, (v) => v.servicios, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: VehiculoEntity;

  @Column()
  origen: string;

  @Column()
  destino: string;

  @Column({ type: 'float' })
  distanciaKm: number;

  @Column({ type: 'float' })
  pesoCargaKg: number;

  @Column()
  fecha: string;

  @Column()
  horaInicio: string;

  @Column()
  horaFinEstimada: string;

  @Column({ default: 'Programado' })
  estado: EstadoServicio;

  @Column({ default: false })
  recargaPlanificada: boolean;

  @Column({ type: 'float', default: 0 })
  costoOperativo: number;

  @Column({ type: 'float', default: 0 })
  tarifaCalculada: number;

  @Column({ type: 'float', default: 0 })
  recargoAplicado: number;

  @Column({ default: false })
  facturado: boolean;

  @OneToMany(() => HistorialEstadoEntity, (h) => h.servicio)
  historial: HistorialEstadoEntity[];

  @OneToMany(() => DetalleFacturaEntity, (d) => d.servicio)
  detallesFactura: DetalleFacturaEntity[];
}
