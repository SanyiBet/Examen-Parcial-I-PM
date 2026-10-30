import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturaEntity } from '../entities/factura.entity';
import { DetalleFacturaEntity } from '../entities/detalle-factura.entity';
import { ServicioEntity } from '../entities/servicio.entity';
import { ClienteEntity } from '../entities/cliente.entity';
import { FacturasService } from './facturas.service';
import { FacturasController } from './facturas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FacturaEntity, DetalleFacturaEntity, ServicioEntity, ClienteEntity])],
  controllers: [FacturasController],
  providers: [FacturasService],
  exports: [FacturasService],
})
export class FacturasModule {}
