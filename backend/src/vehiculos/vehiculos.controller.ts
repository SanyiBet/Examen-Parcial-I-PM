import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { VehiculoEntity, TipoVehiculo } from '../entities/vehiculo.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('vehiculos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los vehículos' })
  async findAll(@Query('tipo') tipo?: TipoVehiculo, @Query('placa') placa?: string) {
    return this.vehiculosService.findAll(tipo, placa);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por ID' })
  async findOne(@Param('id') id: string) {
    return this.vehiculosService.findOne(id);
  }

  @Get(':id/eficiencia')
  @ApiOperation({ summary: 'Evaluar eficiencia operativa y energética del vehículo' })
  async evaluarEficiencia(@Param('id') id: string) {
    return this.vehiculosService.evaluarEficiencia(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo vehículo' })
  async create(@Body() body: Partial<VehiculoEntity>) {
    return this.vehiculosService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modificar un vehículo existente' })
  async update(@Param('id') id: string, @Body() body: Partial<VehiculoEntity>) {
    return this.vehiculosService.update(id, body);
  }
}
