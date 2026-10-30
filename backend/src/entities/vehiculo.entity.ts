import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ServicioEntity } from './servicio.entity';

export type TipoVehiculo = 'CamionCarga' | 'FurgonetaElectrica';
export type EstadoVehiculo = 'Disponible' | 'EnServicio' | 'Mantenimiento';

@Entity('vehiculos')
export class VehiculoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  placa: string;

  @Column()
  marca: string;

  @Column()
  modelo: string;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'float' })
  capacidadCargaKg: number;

  @Column({ type: 'float', default: 0 })
  kilometraje: number;

  @Column()
  tipo: TipoVehiculo;

  @Column({ default: 'Disponible' })
  estado: EstadoVehiculo;

  // Atributos de Camión de Carga
  @Column({ type: 'float', nullable: true })
  consumoLitros100Km?: number;

  @Column({ type: 'float', nullable: true })
  precioLitro?: number;

  @Column({ type: 'int', nullable: true })
  numeroEjes?: number;

  @Column({ type: 'float', nullable: true })
  costoMantenimientoKm?: number;

  // Atributos de Furgoneta Eléctrica
  @Column({ type: 'float', nullable: true })
  capacidadBateriaKWh?: number;

  @Column({ type: 'float', nullable: true })
  consumoKWh100Km?: number;

  @Column({ type: 'float', nullable: true })
  costoKWh?: number;

  @Column({ type: 'float', nullable: true })
  autonomiaKm?: number;

  @Column({ type: 'float', nullable: true, default: 100 })
  porcentajeBateria?: number;

  @OneToMany(() => ServicioEntity, (s) => s.vehiculo)
  servicios: ServicioEntity[];
}
