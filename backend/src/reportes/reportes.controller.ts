import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';

@ApiTags('reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('rentabilidad')
  @ApiOperation({ summary: 'Indicadores generales y métricas para el Dashboard de Rentabilidad' })
  async getDashboardRentabilidad(
    @Query('anio') anio?: number,
    @Query('mes') mes?: number,
    @Query('tipoVehiculo') tipoVehiculo?: string,
  ) {
    return this.reportesService.getDashboardRentabilidad({ anio, mes, tipoVehiculo });
  }

  @Get('operaciones')
  @ApiOperation({ summary: 'Consultas estadísticas operativas' })
  async getOperaciones() {
    return this.reportesService.getConsulta2PorcentajeParticipacion();
  }

  // Req-07: Endpoints de las 8 consultas avanzadas
  @Get('consulta-1')
  @ApiOperation({ summary: '21. Servicios cuyo costo operativo supera el promedio de servicios completados' })
  async getConsulta1() {
    return this.reportesService.getConsulta1CostoOperativoMayorPromedio();
  }

  @Get('consulta-2')
  @ApiOperation({ summary: '22. Porcentaje de participación de cada vehículo en servicios completados' })
  async getConsulta2() {
    return this.reportesService.getConsulta2PorcentajeParticipacion();
  }

  @Get('consulta-3')
  @ApiOperation({ summary: '23. Clientes con al menos tres servicios completados en un período' })
  async getConsulta3() {
    return this.reportesService.getConsulta3ClientesFrecuentes();
  }

  @Get('consulta-4')
  @ApiOperation({ summary: '24. Vehículos sin servicios asignados durante un rango de fechas' })
  async getConsulta4(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.reportesService.getConsulta4VehiculosSinServicios(desde, hasta);
  }

  @Get('consulta-5')
  @ApiOperation({ summary: '25. Cinco vehículos con mayor rentabilidad por ingresos, costos y margen' })
  async getConsulta5() {
    return this.reportesService.getConsulta5Top5VehiculosRentabilidad();
  }

  @Get('consulta-6')
  @ApiOperation({ summary: '26. Facturación mensual agrupada por tipo de vehículo y mes' })
  async getConsulta6() {
    return this.reportesService.getConsulta6FacturacionMensualPorTipo();
  }

  @Get('consulta-7')
  @ApiOperation({ summary: '27. Vehículos con eficiencia inferior al promedio de su categoría' })
  async getConsulta7() {
    return this.reportesService.getConsulta7VehiculosEficienciaInferiorPromedio();
  }

  @Get('consulta-8')
  @ApiOperation({ summary: '28. Clientes cuya facturación disminuyó más del 20% respecto al mes anterior' })
  async getConsulta8() {
    return this.reportesService.getConsulta8ClientesDisminucion20();
  }
}
