import { Controller, Get, Post, Patch, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServiciosService } from './servicios.service';
import { ServicioEntity, EstadoServicio } from '../entities/servicio.entity';

@ApiTags('servicios')
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get()
  @ApiOperation({ summary: 'Historial paginado de servicios con filtros combinados' })
  async findAll(
    @Query('estado') estado?: EstadoServicio,
    @Query('clienteId') clienteId?: string,
    @Query('vehiculoId') vehiculoId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.serviciosService.findAll({ estado, clienteId, vehiculoId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle de un servicio' })
  async findOne(@Param('id') id: string) {
    return this.serviciosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo servicio' })
  async create(@Body() body: Partial<ServicioEntity>, @Request() req: any) {
    const usuarioId = req.user?.id || 'operador-demo';
    return this.serviciosService.create(body, usuarioId);
  }

  @Post('simular-tarifa')
  @ApiOperation({ summary: 'Simular tarifa y validar factibilidad antes de persistir' })
  async simularTarifa(
    @Body()
    body: {
      vehiculoId: string;
      distanciaKm: number;
      pesoCargaKg: number;
      recargaPlanificada?: boolean;
      fecha?: string;
    },
  ) {
    return this.serviciosService.simularTarifa(body);
  }

  @Patch(':id/asignacion')
  @ApiOperation({ summary: 'Asignar o reasignar vehículo a un servicio' })
  async asignarVehiculo(
    @Param('id') id: string,
    @Body('vehiculoId') vehiculoId: string,
    @Request() req: any,
  ) {
    const usuarioId = req.user?.id || 'operador-demo';
    return this.serviciosService.asignarVehiculo(id, vehiculoId, usuarioId);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar estado del servicio (Programado, En ejecucion, Completado, Cancelado)' })
  async actualizarEstado(
    @Param('id') id: string,
    @Body('nuevoEstado') nuevoEstado: EstadoServicio,
    @Request() req: any,
  ) {
    const usuarioId = req.user?.id || 'operador-demo';
    return this.serviciosService.actualizarEstado(id, nuevoEstado, usuarioId);
  }
}
