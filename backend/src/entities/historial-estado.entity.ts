import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ServicioEntity } from './servicio.entity';

@Entity('historial_estados')
export class HistorialEstadoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  servicioId: string;

  @ManyToOne(() => ServicioEntity, (s) => s.historial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'servicioId' })
  servicio: ServicioEntity;

  @Column()
  estadoAnterior: string;

  @Column()
  estadoNuevo: string;

  @CreateDateColumn()
  fecha: Date;

  @Column({ nullable: true })
  usuarioId: string;

  @Column({ nullable: true })
  notas: string;
}
