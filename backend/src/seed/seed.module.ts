import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioEntity } from '../entities/usuario.entity';
import { VehiculoEntity } from '../entities/vehiculo.entity';
import { ClienteEntity } from '../entities/cliente.entity';
import { ServicioEntity } from '../entities/servicio.entity';
import { FacturaEntity } from '../entities/factura.entity';
import { DetalleFacturaEntity } from '../entities/detalle-factura.entity';
import { HistorialEstadoEntity } from '../entities/historial-estado.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuarioEntity,
      VehiculoEntity,
      ClienteEntity,
      ServicioEntity,
      FacturaEntity,
      DetalleFacturaEntity,
      HistorialEstadoEntity,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
