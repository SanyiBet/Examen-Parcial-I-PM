import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportesService {
  constructor(private readonly dataSource: DataSource) {}

  // Req-08: Dashboard de Rentabilidad
  async getDashboardRentabilidad(filtros?: { anio?: number; mes?: number; tipoVehiculo?: string }) {
    let whereClause = "s.estado = 'Completado'";
    const params: any[] = [];
    let paramIndex = 1;

    if (filtros?.tipoVehiculo) {
      whereClause += ` AND v.tipo = $${paramIndex++}`;
      params.push(filtros.tipoVehiculo);
    }
    if (filtros?.anio) {
      whereClause += ` AND SUBSTRING(s.fecha, 1, 4) = $${paramIndex++}`;
      params.push(String(filtros.anio));
    }
    if (filtros?.mes) {
      const mesStr = String(filtros.mes).padStart(2, '0');
      whereClause += ` AND SUBSTRING(s.fecha, 6, 2) = $${paramIndex++}`;
      params.push(mesStr);
    }

    // Totales financieros de servicios completados
    const financialRaw = await this.dataSource.query(`
      SELECT 
        COALESCE(SUM(s."tarifaCalculada" + s."recargoAplicado"), 0) AS "ingresosTotales",
        COALESCE(SUM(s."costoOperativo"), 0) AS "costosTotales"
      FROM servicios s
      JOIN vehiculos v ON v.id = s."vehiculoId"
      WHERE ${whereClause}
    `, params);

    const ingresosTotales = Number(Number(financialRaw[0]?.ingresosTotales || 0).toFixed(2));
    const costosTotales = Number(Number(financialRaw[0]?.costosTotales || 0).toFixed(2));
    const utilidad = Number((ingresosTotales - costosTotales).toFixed(2));
    const margenPorcentaje = ingresosTotales > 0 ? Number(((utilidad / ingresosTotales) * 100).toFixed(2)) : 0;

    // Conteo por estado de servicio
    const estadosRaw = await this.dataSource.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM servicios
      GROUP BY estado
    `);

    const serviciosPorEstado = {
      programados: 0,
      enEjecucion: 0,
      completados: 0,
      cancelados: 0,
      total: 0,
    };

    estadosRaw.forEach((row: any) => {
      const cant = Number(row.cantidad);
      serviciosPorEstado.total += cant;
      if (row.estado === 'Programado') serviciosPorEstado.programados = cant;
      else if (row.estado === 'En ejecucion') serviciosPorEstado.enEjecucion = cant;
      else if (row.estado === 'Completado') serviciosPorEstado.completados = cant;
      else if (row.estado === 'Cancelado') serviciosPorEstado.cancelados = cant;
    });

    // Distribución por tipo de vehículo
    const distribucionTipoVehiculo = await this.dataSource.query(`
      SELECT 
        v.tipo,
        COALESCE(SUM(s."tarifaCalculada" + s."recargoAplicado"), 0) as ingresos,
        COUNT(s.id) as "cantidadServicios"
      FROM vehiculos v
      LEFT JOIN servicios s ON s."vehiculoId" = v.id AND s.estado = 'Completado'
      GROUP BY v.tipo
    `);

    // Comparación mensual
    const comparacionMensual = await this.dataSource.query(`
      SELECT 
        SUBSTRING(s.fecha, 1, 7) as mes,
        COALESCE(SUM(s."tarifaCalculada" + s."recargoAplicado"), 0) as ingresos,
        COALESCE(SUM(s."costoOperativo"), 0) as costos,
        COALESCE(SUM(s."tarifaCalculada" + s."recargoAplicado") - SUM(s."costoOperativo"), 0) as utilidad
      FROM servicios s
      WHERE s.estado = 'Completado'
      GROUP BY SUBSTRING(s.fecha, 1, 7)
      ORDER BY mes ASC
      LIMIT 12
    `);

    // Vehículos disponibles
    const vehiculosDispRaw = await this.dataSource.query(`
      SELECT COUNT(*) as disponibles FROM vehiculos WHERE estado = 'Disponible'
    `);
    const vehiculosDisponibles = Number(vehiculosDispRaw[0]?.disponibles || 0);

    return {
      ingresosTotales,
      costosTotales,
      utilidad,
      margenPorcentaje,
      serviciosPorEstado,
      distribucionTipoVehiculo: distribucionTipoVehiculo.map((d: any) => ({
        tipo: d.tipo,
        ingresos: Number(Number(d.ingresos).toFixed(2)),
        cantidadServicios: Number(d.cantidadServicios),
      })),
      comparacionMensual: comparacionMensual.map((m: any) => ({
        mes: m.mes,
        ingresos: Number(Number(m.ingresos).toFixed(2)),
        costos: Number(Number(m.costos).toFixed(2)),
        utilidad: Number(Number(m.utilidad).toFixed(2)),
      })),
      vehiculosDisponibles,
      alquileresConMora: serviciosPorEstado.enEjecucion,
    };
  }

  // Req-07: Las Ocho Consultas Avanzadas en PostgreSQL

  // 21. Servicios cuyo costo operativo supera el promedio de servicios completados
  async getConsulta1CostoOperativoMayorPromedio() {
    return this.dataSource.query(`
      SELECT 
        s.id, s.codigo, s.origen, s.destino, s."distanciaKm", s."costoOperativo", s.fecha,
        c.nombre AS "clienteNombre",
        v.placa AS "vehiculoPlaca", v.tipo AS "vehiculoTipo"
      FROM servicios s
      JOIN clientes c ON c.id = s."clienteId"
      JOIN vehiculos v ON v.id = s."vehiculoId"
      WHERE s.estado = 'Completado'
        AND s."costoOperativo" > (
          SELECT AVG("costoOperativo") 
          FROM servicios 
          WHERE estado = 'Completado'
        )
      ORDER BY s."costoOperativo" DESC
    `);
  }

  // 22. Porcentaje de participación de cada vehículo en servicios completados
  async getConsulta2PorcentajeParticipacion() {
    return this.dataSource.query(`
      SELECT 
        v.id, v.placa, v.marca, v.modelo, v.tipo,
        COUNT(s.id) AS "serviciosCompletados",
        ROUND(
          CAST((COUNT(s.id) * 100.0) / NULLIF((SELECT COUNT(*) FROM servicios WHERE estado = 'Completado'), 0) AS numeric),
          2
        ) AS "porcentajeParticipacion"
      FROM vehiculos v
      LEFT JOIN servicios s ON s."vehiculoId" = v.id AND s.estado = 'Completado'
      GROUP BY v.id, v.placa, v.marca, v.modelo, v.tipo
      ORDER BY "serviciosCompletados" DESC
    `);
  }

  // 23. Clientes con al menos tres servicios completados en un período
  async getConsulta3ClientesFrecuentes() {
    return this.dataSource.query(`
      SELECT 
        c.id, c.identificacion, c.nombre, c.correo,
        COUNT(s.id) AS "totalServiciosCompletados",
        ROUND(CAST(SUM(s."tarifaCalculada" + s."recargoAplicado") AS numeric), 2) AS "gastoTotal"
      FROM clientes c
      JOIN servicios s ON s."clienteId" = c.id
      WHERE s.estado = 'Completado'
      GROUP BY c.id, c.identificacion, c.nombre, c.correo
      HAVING COUNT(s.id) >= 3
      ORDER BY "totalServiciosCompletados" DESC
    `);
  }

  // 24. Vehículos sin servicios asignados durante un rango de fechas
  async getConsulta4VehiculosSinServicios(desde?: string, hasta?: string) {
    const fDesde = desde || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const fHasta = hasta || new Date().toISOString().split('T')[0];

    return this.dataSource.query(`
      SELECT v.id, v.placa, v.marca, v.modelo, v.tipo, v.estado, v.kilometraje
      FROM vehiculos v
      WHERE v.id NOT IN (
        SELECT DISTINCT "vehiculoId"
        FROM servicios
        WHERE fecha BETWEEN $1 AND $2
          AND estado != 'Cancelado'
      )
      ORDER BY v.placa ASC
    `, [fDesde, fHasta]);
  }

  // 25. Cinco vehículos con mayor rentabilidad por ingresos, costos y margen
  async getConsulta5Top5VehiculosRentabilidad() {
    return this.dataSource.query(`
      SELECT 
        v.id, v.placa, v.marca, v.modelo, v.tipo,
        ROUND(CAST(SUM(s."tarifaCalculada" + s."recargoAplicado") AS numeric), 2) AS ingresos,
        ROUND(CAST(SUM(s."costoOperativo") AS numeric), 2) AS costos,
        ROUND(CAST(SUM(s."tarifaCalculada" + s."recargoAplicado") - SUM(s."costoOperativo") AS numeric), 2) AS utilidad,
        ROUND(
          CAST(((SUM(s."tarifaCalculada" + s."recargoAplicado") - SUM(s."costoOperativo")) * 100.0) / 
          NULLIF(SUM(s."tarifaCalculada" + s."recargoAplicado"), 0) AS numeric), 2
        ) AS "margenPorcentaje"
      FROM vehiculos v
      JOIN servicios s ON s."vehiculoId" = v.id
      WHERE s.estado = 'Completado'
      GROUP BY v.id, v.placa, v.marca, v.modelo, v.tipo
      ORDER BY utilidad DESC
      LIMIT 5
    `);
  }

  // 26. Facturación mensual agrupada por tipo de vehículo y mes
  async getConsulta6FacturacionMensualPorTipo() {
    return this.dataSource.query(`
      SELECT 
        SUBSTRING(s.fecha, 1, 7) AS mes,
        v.tipo AS "tipoVehiculo",
        COUNT(s.id) AS "cantidadServicios",
        ROUND(CAST(SUM(s."tarifaCalculada" + s."recargoAplicado") AS numeric), 2) AS "totalFacturado"
      FROM servicios s
      JOIN vehiculos v ON v.id = s."vehiculoId"
      WHERE s.estado = 'Completado'
      GROUP BY SUBSTRING(s.fecha, 1, 7), v.tipo
      ORDER BY mes DESC, "tipoVehiculo" ASC
    `);
  }

  // 27. Vehículos con eficiencia inferior al promedio de su categoría
  async getConsulta7VehiculosEficienciaInferiorPromedio() {
    return this.dataSource.query(`
      SELECT v.id, v.placa, v.marca, v.modelo, v.tipo,
             v."consumoLitros100Km", v."consumoKWh100Km",
             CASE 
               WHEN v.tipo = 'CamionCarga' THEN v."consumoLitros100Km" 
               ELSE v."consumoKWh100Km" 
             END AS "consumoRegistrado",
             ROUND(CAST(cat_avg."consumoPromedioCategoria" AS numeric), 2) AS "consumoPromedioCategoria"
      FROM vehiculos v
      JOIN (
        SELECT tipo, 
               AVG(CASE WHEN tipo = 'CamionCarga' THEN "consumoLitros100Km" ELSE "consumoKWh100Km" END) AS "consumoPromedioCategoria"
        FROM vehiculos
        GROUP BY tipo
      ) cat_avg ON cat_avg.tipo = v.tipo
      WHERE (
        (v.tipo = 'CamionCarga' AND v."consumoLitros100Km" > cat_avg."consumoPromedioCategoria")
        OR
        (v.tipo = 'FurgonetaElectrica' AND v."consumoKWh100Km" > cat_avg."consumoPromedioCategoria")
      )
      ORDER BY v.tipo, "consumoRegistrado" DESC
    `);
  }

  // 28. Clientes cuya facturación disminuyó más del 20% respecto al mes anterior
  async getConsulta8ClientesDisminucion20() {
    return this.dataSource.query(`
      WITH "FacturacionClienteMensual" AS (
        SELECT 
          c.id AS "clienteId",
          c.nombre AS "clienteNombre",
          SUBSTRING(f.fecha, 1, 7) AS mes,
          SUM(f.total) AS "totalMes"
        FROM clientes c
        JOIN facturas f ON f."clienteId" = c.id
        GROUP BY c.id, c.nombre, SUBSTRING(f.fecha, 1, 7)
      ),
      "Comparacion" AS (
        SELECT 
          curr."clienteId",
          curr."clienteNombre",
          curr.mes AS "mesActual",
          curr."totalMes" AS "facturacionActual",
          prev.mes AS "mesAnterior",
          prev."totalMes" AS "facturacionAnterior",
          ROUND(CAST(((prev."totalMes" - curr."totalMes") * 100.0) / NULLIF(prev."totalMes", 0) AS numeric), 2) AS "porcentajeDisminucion"
        FROM "FacturacionClienteMensual" curr
        JOIN "FacturacionClienteMensual" prev 
          ON prev."clienteId" = curr."clienteId" 
          AND prev.mes < curr.mes
        WHERE ((prev."totalMes" - curr."totalMes") * 100.0) / NULLIF(prev."totalMes", 0) > 20
      )
      SELECT * FROM "Comparacion"
      ORDER BY "porcentajeDisminucion" DESC
    `);
  }
}
