import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FacturasService } from './facturas.service';

@ApiTags('facturas')
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar facturas con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (opcional)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad por página (opcional)' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.facturasService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalle de una factura por ID' })
  async findOne(@Param('id') id: string) {
    return this.facturasService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Generar factura atómica para servicios completados' })
  async generarFactura(
    @Body()
    body: {
      clienteId: string;
      servicioIds: string[];
      porcentajeImpuesto?: number;
    },
  ) {
    return this.facturasService.generarFactura(body);
  }
}
