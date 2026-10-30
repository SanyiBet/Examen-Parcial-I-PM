import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { ClienteEntity } from './cliente.entity';
import { DetalleFacturaEntity } from './detalle-factura.entity';

@Entity('facturas')
export class FacturaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column()
  clienteId: string;

  @ManyToOne(() => ClienteEntity, (c) => c.facturas, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clienteId' })
  cliente: ClienteEntity;

  @Column()
  fecha: string;

  @Column({ type: 'float' })
  subtotal: number;

  @Column({ type: 'float', default: 0 })
  recargos: number;

  @Column({ type: 'float', default: 0 })
  descuento: number;

  @Column({ type: 'float', default: 0 })
  porcentajeDescuento: number;

  @Column({ type: 'float', default: 0 })
  impuesto: number;

  @Column({ type: 'float', default: 15 })
  porcentajeImpuesto: number;

  @Column({ type: 'float' })
  total: number;

  @OneToMany(() => DetalleFacturaEntity, (d) => d.factura, { cascade: true, eager: true })
  detalles: DetalleFacturaEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
