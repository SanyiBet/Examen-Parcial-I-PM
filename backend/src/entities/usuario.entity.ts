import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type RolUsuario = 'Administrador' | 'Operador';

@Entity('usuarios')
export class UsuarioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'Operador' })
  rol: RolUsuario;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
