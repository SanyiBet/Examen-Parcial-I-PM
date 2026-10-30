import template from './Dashboard.html?raw';
import './Dashboard.css';
import { ReportesController, IDashboardRentabilidad } from '../../Controlador/ControllersReporte';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class DashboardPage {
  private barChart: Chart | null = null;
  private donutChart: Chart | null = null;

  async render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    await this.cargarDatos(container);
  }

  private bindEvents(container: HTMLElement) {
    const btnRefresh = container.querySelector('#btn-refresh-dash');
    const selectTipo = container.querySelector('#dash-filtro-tipo') as HTMLSelectElement;
    const selectMes = container.querySelector('#dash-filtro-mes') as HTMLSelectElement;

    btnRefresh?.addEventListener('click', () => this.cargarDatos(container));
    selectTipo?.addEventListener('change', () => this.cargarDatos(container));
    selectMes?.addEventListener('change', () => this.cargarDatos(container));
  }

  private async cargarDatos(container: HTMLElement) {
    const selectTipo = container.querySelector('#dash-filtro-tipo') as HTMLSelectElement;
    const selectMes = container.querySelector('#dash-filtro-mes') as HTMLSelectElement;

    const tipoVehiculo = selectTipo?.value || undefined;
    const mes = selectMes?.value ? Number(selectMes.value) : undefined;

    try {
      const data: IDashboardRentabilidad = await ReportesController.ObtenerDashboard({
        tipoVehiculo,
        mes,
        anio: 2026,
      });

      this.actualizarTarjetas(container, data);
      this.actualizarGraficoBarras(container, data);
      this.actualizarGraficoDonut(container, data);
      this.actualizarTablaMensual(container, data);
    } catch (e) {
      console.error('Error al cargar datos del dashboard:', e);
    }
  }

  private actualizarTarjetas(container: HTMLElement, data: IDashboardRentabilidad) {
    const elIngresos = container.querySelector('#stat-ingresos');
    const elServicios = container.querySelector('#stat-servicios');
    const elDisponibles = container.querySelector('#stat-disponibles');
    const elActivos = container.querySelector('#stat-activos');

    const elCostos = container.querySelector('#kpi-costos');
    const elUtilidad = container.querySelector('#kpi-utilidad');
    const elMargen = container.querySelector('#kpi-margen');

    if (elIngresos) elIngresos.textContent = `$${data.ingresosTotales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elServicios) elServicios.textContent = data.serviciosPorEstado.completados.toString();
    if (elDisponibles) elDisponibles.textContent = data.vehiculosDisponibles.toString();
    if (elActivos) elActivos.textContent = data.serviciosPorEstado.enEjecucion.toString();

    if (elCostos) elCostos.textContent = `$${data.costosTotales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elUtilidad) elUtilidad.textContent = `$${data.utilidad.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elMargen) elMargen.textContent = `${data.margenPorcentaje}%`;
  }

  private actualizarGraficoBarras(container: HTMLElement, data: IDashboardRentabilidad) {
    const canvas = container.querySelector('#chart-bar-ingresos') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.barChart) {
      this.barChart.destroy();
    }

    const labels = data.distribucionTipoVehiculo.map(d =>
      d.tipo === 'CamionCarga' ? 'Camión de Carga' : 'Furgoneta Eléctrica'
    );
    const valores = data.distribucionTipoVehiculo.map(d => d.ingresos);

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['Sin datos'],
        datasets: [
          {
            label: 'Ingresos ($)',
            data: valores.length ? valores : [0],
            backgroundColor: '#4ba0fc', // Color celeste suave idéntico a la imagen referencial
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 54,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` $${Number(context.raw).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 12 } },
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: (val) => `$${val}`,
            },
          },
        },
      },
    });
  }

  private actualizarGraficoDonut(container: HTMLElement, data: IDashboardRentabilidad) {
    const canvas = container.querySelector('#chart-donut-servicios') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.donutChart) {
      this.donutChart.destroy();
    }

    const est = data.serviciosPorEstado;
    const finalizados = est.completados;
    const activos = est.enEjecucion;
    const retraso = est.cancelados || est.programados;

    this.donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Finalizados', 'Activos', 'Pendientes / Cancelados'],
        datasets: [
          {
            data: [finalizados, activos, retraso],
            backgroundColor: ['#4ba0fc', '#52c480', '#f48256'], // Paleta de la imagen del usuario
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#475569',
              font: { family: 'Plus Jakarta Sans', size: 12, weight: 500 },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
            },
          },
        },
      },
    });
  }

  private actualizarTablaMensual(container: HTMLElement, data: IDashboardRentabilidad) {
    const tbody = container.querySelector('#tabla-mensual-body');
    if (!tbody) return;

    if (!data.comparacionMensual || data.comparacionMensual.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No existen registros mensuales para el filtro seleccionado</td></tr>`;
      return;
    }

    tbody.innerHTML = data.comparacionMensual.map(m => {
      const margen = m.ingresos > 0 ? ((m.utilidad / m.ingresos) * 100).toFixed(1) : '0.0';
      return `
        <tr>
          <td><strong>${m.mes}</strong></td>
          <td>$${m.ingresos.toFixed(2)}</td>
          <td>$${m.costos.toFixed(2)}</td>
          <td class="${m.utilidad >= 0 ? 'text-primary' : 'text-danger'}"><strong>$${m.utilidad.toFixed(2)}</strong></td>
          <td><span class="badge ${Number(margen) > 20 ? 'badge-success' : 'badge-info'}">${margen}%</span></td>
        </tr>
      `;
    }).join('');
  }
}
