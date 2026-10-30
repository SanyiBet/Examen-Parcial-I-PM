import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { FacturaEntity } from './factura.entity';
import { ServicioEntity } from './servicio.entity';

@Entity('detalles_factura')
export class DetalleFacturaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  facturaId: string;

  @ManyToOne(() => FacturaEntity, (f) => f.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facturaId' })
  factura: FacturaEntity;

  @Column({ unique: true })
  servicioId: string;

  @ManyToOne(() => ServicioEntity, (s) => s.detallesFactura, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'servicioId' })
  servicio: ServicioEntity;

  @Column({ type: 'float' })
  tarifa: number;

  @Column({ type: 'float', default: 0 })
  recargos: number;
}
