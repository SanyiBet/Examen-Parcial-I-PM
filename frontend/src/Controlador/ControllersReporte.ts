import { ApiClient } from '../api';

export interface IDashboardRentabilidad {
  ingresosTotales: number;
  costosTotales: number;
  utilidad: number;
  margenPorcentaje: number;
  serviciosPorEstado: {
    programados: number;
    enEjecucion: number;
    completados: number;
    cancelados: number;
    total: number;
  };
  distribucionTipoVehiculo: {
    tipo: string;
    ingresos: number;
    cantidadServicios: number;
  }[];
  comparacionMensual: {
    mes: string;
    ingresos: number;
    costos: number;
    utilidad: number;
  }[];
  vehiculosDisponibles: number;
  alquileresConMora: number;
}

export class ControllersReporte {
  async ObtenerDashboard(filtros?: { anio?: number; mes?: number; tipoVehiculo?: string }): Promise<IDashboardRentabilidad> {
    const params = new URLSearchParams();
    if (filtros?.anio) params.append('anio', filtros.anio.toString());
    if (filtros?.mes) params.append('mes', filtros.mes.toString());
    if (filtros?.tipoVehiculo) params.append('tipoVehiculo', filtros.tipoVehiculo);

    return ApiClient.get<IDashboardRentabilidad>(`/reportes/rentabilidad?${params.toString()}`);
  }

  // Req-07: Las Ocho Consultas Avanzadas
  async Consulta1CostoOperativoMayorPromedio(): Promise<any[]> {
    return ApiClient.get('/reportes/consulta-1');
  }

  async Consulta2PorcentajeParticipacionVehiculos(): Promise<any[]> {
    return ApiClient.get('/reportes/consulta-2');
  }

  async Consulta3ClientesConAlMenosTresServicios(): Promise<any[]> {
    return ApiClient.get('/reportes/consulta-3');
  }

  async Consulta4VehiculosSinServicios(desde?: string, hasta?: string): Promise<any[]> {
    const q = new URLSearchParams();
    if (desde) q.append('desde', desde);
    if (hasta) q.append('hasta', hasta);
    return ApiClient.get(`/reportes/consulta-4?${q.toString()}`);
  }

  async Consulta5Top5VehiculosRentabilidad(): Promise<any[]> {
    return ApiClient.get('/reportes/consulta-5');
  }

  async Consulta6FacturacionMensualPorTipo(): Promise<any[]> {
    return ApiClient.get('/reportes/consulta-6');
  }

  async Consulta7VehiculosEficienciaInferiorPromedio(): Promise<any[]> {
    return ApiClient.get('/reportes/consulta-7');
  }

  async Consulta8ClientesFacturacionDisminuyo20(): Promise<any[]> {
    return ApiClient.get('/reportes/consulta-8');
  }
}

export const ReportesController = new ControllersReporte();
