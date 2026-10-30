import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsuarioEntity } from './entities/usuario.entity';
import { ClienteEntity } from './entities/cliente.entity';
import { VehiculoEntity } from './entities/vehiculo.entity';
import { ServicioEntity } from './entities/servicio.entity';
import { FacturaEntity } from './entities/factura.entity';
import { DetalleFacturaEntity } from './entities/detalle-factura.entity';
import { HistorialEstadoEntity } from './entities/historial-estado.entity';
import { AuthModule } from './auth/auth.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ClientesModule } from './clientes/clientes.module';
import { ServiciosModule } from './servicios/servicios.module';
import { FacturasModule } from './facturas/facturas.module';
import { ReportesModule } from './reportes/reportes.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<number>('DB_PORT', 5432)),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'root'),
        database: config.get<string>('DB_NAME', 'translogic_db'),
        entities: [
          UsuarioEntity,
          ClienteEntity,
          VehiculoEntity,
          ServicioEntity,
          FacturaEntity,
          DetalleFacturaEntity,
          HistorialEstadoEntity,
        ],
        synchronize: true, // Automigración de esquema en PostgreSQL
      }),
    }),
    AuthModule,
    VehiculosModule,
    ClientesModule,
    ServiciosModule,
    FacturasModule,
    ReportesModule,
    SeedModule,
  ],
})
export class AppModule {}
