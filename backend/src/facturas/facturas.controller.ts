import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FacturasService } from './facturas.service';

@ApiTags('facturas')
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las facturas' })
  async findAll() {
    return this.facturasService.findAll();
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
