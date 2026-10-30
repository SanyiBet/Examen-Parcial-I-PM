import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ServicioEntity } from './servicio.entity';
import { FacturaEntity } from './factura.entity';

@Entity('clientes')
export class ClienteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  identificacion: string;

  @Column()
  nombre: string;

  @Column()
  correo: string;

  @Column()
  telefono: string;

  @OneToMany(() => ServicioEntity, (s) => s.cliente)
  servicios: ServicioEntity[];

  @OneToMany(() => FacturaEntity, (f) => f.cliente)
  facturas: FacturaEntity[];
}
