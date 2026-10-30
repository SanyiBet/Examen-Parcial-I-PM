import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicioEntity } from '../entities/servicio.entity';
import { VehiculoEntity } from '../entities/vehiculo.entity';
import { ClienteEntity } from '../entities/cliente.entity';
import { HistorialEstadoEntity } from '../entities/historial-estado.entity';
import { ServiciosService } from './servicios.service';
import { ServiciosController } from './servicios.controller';
import { VehiculosModule } from '../vehiculos/vehiculos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServicioEntity, VehiculoEntity, ClienteEntity, HistorialEstadoEntity]),
    VehiculosModule,
  ],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [ServiciosService],
})
export class ServiciosModule {}
