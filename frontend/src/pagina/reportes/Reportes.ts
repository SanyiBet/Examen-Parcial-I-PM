import template from './Reportes.html?raw';
import './Reportes.css';
import { ReportesController } from '../../Controlador/ControllersReporte';

export class ReportesPage {
  private consultaActiva: number = 1;

  async render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    await this.cargarConsulta(container, 1);
  }

  private bindEvents(container: HTMLElement) {
    const tabs = container.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', async (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        const btn = e.currentTarget as HTMLElement;
        btn.classList.add('active');

        const num = Number(btn.dataset.tab) || 1;
        this.consultaActiva = num;
        await this.cargarConsulta(container, num);
      });
    });

    container.querySelector('#c4-btn-filtrar')?.addEventListener('click', async () => {
      await this.cargarConsulta(container, 4);
    });
  }

  private async cargarConsulta(container: HTMLElement, num: number) {
    const titleEl = container.querySelector('#consulta-title') as HTMLElement;
    const descEl = container.querySelector('#consulta-desc') as HTMLElement;
    const thead = container.querySelector('#reportes-thead') as HTMLElement;
    const tbody = container.querySelector('#reportes-tbody') as HTMLElement;
    const boxFiltroC4 = container.querySelector('#box-filtro-c4') as HTMLElement;

    boxFiltroC4.style.display = num === 4 ? 'flex' : 'none';
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4">Ejecutando agregación en base de datos...</td></tr>`;

    try {
      switch (num) {
        case 1: {
          titleEl.textContent = '21. Servicios cuyo costo operativo supera el promedio de servicios completados';
          descEl.textContent = 'Filtra servicios con costo operativo superior al promedio histórico global calculado con subconsulta SQL.';
          const data = await ReportesController.Consulta1CostoOperativoMayorPromedio();
          
          thead.innerHTML = `
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th>Ruta</th>
              <th>Distancia</th>
              <th>Fecha</th>
              <th>Costo Operativo</th>
            </tr>
          `;
          if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-muted">No hay servicios que superen el promedio actualmente</td></tr>`;
          } else {
            tbody.innerHTML = data.map((d: any) => `
              <tr>
                <td><strong>${d.codigo}</strong></td>
                <td>${d.clienteNombre}</td>
                <td>${d.vehiculoPlaca} (${d.vehiculoTipo === 'CamionCarga' ? 'Diésel' : 'Eléctrica'})</td>
                <td>${d.origen} → ${d.destino}</td>
                <td>${d.distanciaKm} km</td>
                <td>${d.fecha}</td>
                <td><strong class="text-danger">$${Number(d.costoOperativo).toFixed(2)}</strong></td>
              </tr>
            `).join('');
          }
          break;
        }

        case 2: {
          titleEl.textContent = '22. Porcentaje de participación de cada vehículo en servicios completados';
          descEl.textContent = 'Calcula la participación porcentual de despachos completados de cada unidad sobre el total general.';
          const data = await ReportesController.Consulta2PorcentajeParticipacionVehiculos();

          thead.innerHTML = `
            <tr>
              <th>Placa</th>
              <th>Tipo</th>
              <th>Marca y Modelo</th>
              <th>Servicios Completados</th>
              <th>% de Participación</th>
            </tr>
          `;
          tbody.innerHTML = data.map((d: any) => `
            <tr>
              <td><strong>${d.placa}</strong></td>
              <td>${d.tipo === 'CamionCarga' ? 'Diésel' : 'Eléctrico'}</td>
              <td>${d.marca} ${d.modelo}</td>
              <td><strong>${d.serviciosCompletados}</strong></td>
              <td>
                <span class="badge ${Number(d.porcentajeParticipacion) > 20 ? 'badge-success' : 'badge-info'}">
                  ${d.porcentajeParticipacion}%
                </span>
              </td>
            </tr>
          `).join('');
          break;
        }

        case 3: {
          titleEl.textContent = '23. Clientes con al menos tres servicios completados en un período';
          descEl.textContent = 'Agrupa por cliente y aplica cláusula HAVING COUNT >= 3 para identificar cuentas frecuentes y fidelizadas.';
          const data = await ReportesController.Consulta3ClientesConAlMenosTresServicios();

          thead.innerHTML = `
            <tr>
              <th>RUC / Cédula</th>
              <th>Razón Social</th>
              <th>Correo</th>
              <th>Servicios Completados</th>
              <th>Facturación Acumulada</th>
            </tr>
          `;
          if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Ningún cliente supera los 3 servicios aún</td></tr>`;
          } else {
            tbody.innerHTML = data.map((d: any) => `
              <tr>
                <td><strong>${d.identificacion}</strong></td>
                <td>${d.nombre}</td>
                <td>${d.correo}</td>
                <td><span class="badge badge-success">${d.totalServiciosCompletados} servicios</span></td>
                <td><strong class="text-primary">$${Number(d.gastoTotal).toFixed(2)}</strong></td>
              </tr>
            `).join('');
          }
          break;
        }

        case 4: {
          titleEl.textContent = '24. Vehículos sin servicios asignados durante un rango de fechas';
          descEl.textContent = 'Detecta unidades inactivas u ociosas que no tienen despachos programados ni activos en el período.';
          const desde = (container.querySelector('#c4-desde') as HTMLInputElement)?.value;
          const hasta = (container.querySelector('#c4-hasta') as HTMLInputElement)?.value;
          const data = await ReportesController.Consulta4VehiculosSinServicios(desde, hasta);

          thead.innerHTML = `
            <tr>
              <th>Placa</th>
              <th>Marca / Modelo</th>
              <th>Tipo</th>
              <th>Estado Actual</th>
              <th>Kilometraje</th>
            </tr>
          `;
          if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Todos los vehículos tienen servicios asignados en el rango</td></tr>`;
          } else {
            tbody.innerHTML = data.map((d: any) => `
              <tr>
                <td><strong>${d.placa}</strong></td>
                <td>${d.marca} ${d.modelo}</td>
                <td>${d.tipo === 'CamionCarga' ? 'Diésel' : 'Eléctrica'}</td>
                <td><span class="badge badge-warning">${d.estado}</span></td>
                <td>${Number(d.kilometraje).toLocaleString()} km</td>
              </tr>
            `).join('');
          }
          break;
        }

        case 5: {
          titleEl.textContent = '25. Cinco vehículos con mayor rentabilidad por ingresos, costos y margen';
          descEl.textContent = 'Top 5 de unidades con mayor utilidad neta generada, ordenadas de mayor a menor beneficio financiero.';
          const data = await ReportesController.Consulta5Top5VehiculosRentabilidad();

          thead.innerHTML = `
            <tr>
              <th>Ranking</th>
              <th>Placa</th>
              <th>Marca y Modelo</th>
              <th>Ingresos</th>
              <th>Costos</th>
              <th>Utilidad Neta</th>
              <th>Margen (%)</th>
            </tr>
          `;
          tbody.innerHTML = data.map((d: any, idx: number) => `
            <tr>
              <td><strong>#${idx + 1}</strong></td>
              <td><strong class="text-primary">${d.placa}</strong></td>
              <td>${d.marca} ${d.modelo}</td>
              <td>$${Number(d.ingresos).toFixed(2)}</td>
              <td>$${Number(d.costos).toFixed(2)}</td>
              <td><strong class="text-success">$${Number(d.utilidad).toFixed(2)}</strong></td>
              <td><span class="badge badge-success">${d.margenPorcentaje}%</span></td>
            </tr>
          `).join('');
          break;
        }

        case 6: {
          titleEl.textContent = '26. Facturación mensual agrupada por tipo de vehículo y mes';
          descEl.textContent = 'Muestra el volumen de ingresos y despachos segmentado por Camión de Carga vs Furgoneta Eléctrica.';
          const data = await ReportesController.Consulta6FacturacionMensualPorTipo();

          thead.innerHTML = `
            <tr>
              <th>Mes</th>
              <th>Tipo de Vehículo</th>
              <th>Servicios Completados</th>
              <th>Total Facturado</th>
            </tr>
          `;
          tbody.innerHTML = data.map((d: any) => `
            <tr>
              <td><strong>${d.mes}</strong></td>
              <td>${d.tipoVehiculo === 'CamionCarga' ? '🚛 Camión de Carga (Diésel)' : '⚡ Furgoneta Eléctrica'}</td>
              <td>${d.cantidadServicios}</td>
              <td><strong class="text-primary">$${Number(d.totalFacturado).toFixed(2)}</strong></td>
            </tr>
          `).join('');
          break;
        }

        case 7: {
          titleEl.textContent = '27. Vehículos con eficiencia inferior al promedio de su categoría';
          descEl.textContent = 'Compara el consumo de cada camión o furgoneta contra la media aritmética calculada para su tipo.';
          const data = await ReportesController.Consulta7VehiculosEficienciaInferiorPromedio();

          thead.innerHTML = `
            <tr>
              <th>Placa</th>
              <th>Tipo</th>
              <th>Marca y Modelo</th>
              <th>Consumo Registrado</th>
              <th>Promedio de su Categoría</th>
              <th>Desviación</th>
            </tr>
          `;
          if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">Ningún vehículo presenta consumo anormal</td></tr>`;
          } else {
            tbody.innerHTML = data.map((d: any) => {
              const unidad = d.tipo === 'CamionCarga' ? 'L/100km' : 'kWh/100km';
              const diff = (Number(d.consumoRegistrado) - Number(d.consumoPromedioCategoria)).toFixed(2);
              return `
                <tr>
                  <td><strong>${d.placa}</strong></td>
                  <td>${d.tipo === 'CamionCarga' ? 'Camión' : 'Eléctrica'}</td>
                  <td>${d.marca} ${d.modelo}</td>
                  <td><strong class="text-danger">${d.consumoRegistrado} ${unidad}</strong></td>
                  <td>${Number(d.consumoPromedioCategoria).toFixed(2)} ${unidad}</td>
                  <td><span class="badge badge-danger">+${diff} ${unidad}</span></td>
                </tr>
              `;
            }).join('');
          }
          break;
        }

        case 8: {
          titleEl.textContent = '28. Clientes cuya facturación disminuyó más del 20% respecto al mes anterior';
          descEl.textContent = 'Análisis mes a mes por cliente mediante consulta analítica con CTE (Common Table Expression).';
          const data = await ReportesController.Consulta8ClientesFacturacionDisminuyo20();

          thead.innerHTML = `
            <tr>
              <th>Cliente</th>
              <th>Mes Actual</th>
              <th>Facturación Actual</th>
              <th>Mes Anterior</th>
              <th>Facturación Anterior</th>
              <th>% Caída</th>
            </tr>
          `;
          if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No se detectan caídas superiores al 20% en facturación de clientes</td></tr>`;
          } else {
            tbody.innerHTML = data.map((d: any) => `
              <tr>
                <td><strong>${d.clienteNombre}</strong></td>
                <td>${d.mesActual}</td>
                <td>$${Number(d.facturacionActual).toFixed(2)}</td>
                <td>${d.mesAnterior}</td>
                <td>$${Number(d.facturacionAnterior).toFixed(2)}</td>
                <td><span class="badge badge-danger">-${d.porcentajeDisminucion}%</span></td>
              </tr>
            `).join('');
          }
          break;
        }
      }
    } catch (err: any) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-danger text-center py-3">Error al ejecutar consulta: ${err.message}</td></tr>`;
    }
  }
}
