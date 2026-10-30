import template from './ServicioList.html?raw';
import './ServicioList.css';
import { ListaServicios } from '../../Controlador/ControllersServicio';
import { ListaVehiculos } from '../../Controlador/ControllersVehiculo';
import { IServicioTransporte, EstadoServicio } from '../../Entidades/ServicioTransporte';

export class ServicioList {
  private onCrearCallback?: () => void;
  private currentPage = 1;
  private pageSize = 10;
  private listaFiltrada: IServicioTransporte[] = [];

  constructor(handlers?: { onCrear?: () => void }) {
    this.onCrearCallback = handlers?.onCrear;
  }

  async render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    await this.cargarTabla(container);
  }

  private bindEvents(container: HTMLElement) {
    const btnCrear = container.querySelector('#btn-crear-servicio');
    const inputSearch = container.querySelector('#servicio-search') as HTMLInputElement;
    const filterEstado = container.querySelector('#servicio-estado-filter') as HTMLSelectElement;

    const btnPrev = container.querySelector('#servicios-btn-prev');
    const btnNext = container.querySelector('#servicios-btn-next');
    const selectPageSize = container.querySelector('#servicios-page-size') as HTMLSelectElement;

    btnCrear?.addEventListener('click', () => {
      if (this.onCrearCallback) this.onCrearCallback();
    });

    // Paginación eventos
    btnPrev?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderPaginaActual(container);
      }
    });

    btnNext?.addEventListener('click', () => {
      const totalPages = Math.ceil(this.listaFiltrada.length / this.pageSize) || 1;
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderPaginaActual(container);
      }
    });

    selectPageSize?.addEventListener('change', () => {
      this.pageSize = Number(selectPageSize.value) || 10;
      this.currentPage = 1;
      this.renderPaginaActual(container);
    });

    inputSearch?.addEventListener('input', () => this.filtrarTabla(container));
    filterEstado?.addEventListener('change', () => this.filtrarTabla(container));

    // Modales cerrar
    const modalReasignar = container.querySelector('#modal-reasignar') as HTMLElement;
    container.querySelector('#modal-reasignar-close')?.addEventListener('click', () => {
      if (modalReasignar) modalReasignar.style.display = 'none';
    });

    const modalHistorial = container.querySelector('#modal-historial') as HTMLElement;
    container.querySelector('#modal-historial-close')?.addEventListener('click', () => {
      if (modalHistorial) modalHistorial.style.display = 'none';
    });

    // Confirmar reasignación
    container.querySelector('#btn-confirmar-reasignacion')?.addEventListener('click', async () => {
      await this.ejecutarReasignacion(container);
    });
  }

  private async cargarTabla(container: HTMLElement) {
    await ListaServicios.CargarServicios();
    this.listaFiltrada = [...ListaServicios.Lista];
    this.currentPage = 1;
    this.renderPaginaActual(container);
  }

  private filtrarTabla(container: HTMLElement) {
    const inputSearch = container.querySelector('#servicio-search') as HTMLInputElement;
    const filterEstado = container.querySelector('#servicio-estado-filter') as HTMLSelectElement;

    const criterio = inputSearch?.value || '';
    const estado = filterEstado?.value || '';

    let filtrados = ListaServicios.Buscar(criterio);
    if (estado) {
      filtrados = filtrados.filter(s => s.estado === estado);
    }

    this.listaFiltrada = filtrados;
    this.currentPage = 1;
    this.renderPaginaActual(container);
  }

  private renderPaginaActual(container: HTMLElement) {
    const total = this.listaFiltrada.length;
    const totalPages = Math.ceil(total / this.pageSize) || 1;

    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIdx = total === 0 ? 0 : (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, total);
    const pagedItems = this.listaFiltrada.slice(startIdx, endIdx);

    // Actualizar barra de paginación
    const pageStartEl = container.querySelector('#servicios-page-start');
    const pageEndEl = container.querySelector('#servicios-page-end');
    const totalCountEl = container.querySelector('#servicios-total-count');
    const pageCurrentEl = container.querySelector('#servicios-page-current');
    const btnPrev = container.querySelector('#servicios-btn-prev') as HTMLButtonElement;
    const btnNext = container.querySelector('#servicios-btn-next') as HTMLButtonElement;

    if (pageStartEl) pageStartEl.textContent = String(total === 0 ? 0 : startIdx + 1);
    if (pageEndEl) pageEndEl.textContent = String(endIdx);
    if (totalCountEl) totalCountEl.textContent = String(total);
    if (pageCurrentEl) pageCurrentEl.textContent = `Pág. ${this.currentPage} de ${totalPages}`;
    if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
    if (btnNext) btnNext.disabled = this.currentPage >= totalPages;

    this.renderFilas(container, pagedItems);
  }

  private renderFilas(container: HTMLElement, lista: IServicioTransporte[]) {
    const tbody = container.querySelector('#servicios-table-body');
    if (!tbody) return;

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No se encontraron servicios registrados</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map(s => {
      const tarifaTotal = (Number(s.tarifaCalculada || 0) + Number(s.recargoAplicado || 0)).toFixed(2);
      
      let badgeEstado = '';
      if (s.estado === 'Programado') badgeEstado = `<span class="badge badge-info">Programado</span>`;
      else if (s.estado === 'En ejecucion') badgeEstado = `<span class="badge badge-warning">En ejecución</span>`;
      else if (s.estado === 'Completado') badgeEstado = `<span class="badge badge-success">Completado</span>`;
      else badgeEstado = `<span class="badge badge-danger">Cancelado</span>`;

      // Acciones contextuales según estado
      let accionesEstado = '';
      if (s.estado === 'Programado') {
        accionesEstado = `
          <button class="btn btn-sm btn-outline btn-cambiar-estado" data-id="${s.id}" data-estado="En ejecucion">▶ Iniciar</button>
          <button class="btn btn-sm btn-outline btn-reasignar" data-id="${s.id}">🔄 Vehículo</button>
          <button class="btn btn-sm btn-danger btn-cambiar-estado" data-id="${s.id}" data-estado="Cancelado">✖ Cancelar</button>
        `;
      } else if (s.estado === 'En ejecucion') {
        accionesEstado = `
          <button class="btn btn-sm btn-primary btn-cambiar-estado" data-id="${s.id}" data-estado="Completado">✓ Finalizar (Completar)</button>
          <button class="btn btn-sm btn-danger btn-cambiar-estado" data-id="${s.id}" data-estado="Cancelado">✖ Cancelar</button>
        `;
      } else {
        accionesEstado = `<span class="text-muted" style="font-size: 12px;">Finalizado</span>`;
      }

      return `
        <tr>
          <td>
            <strong>${s.codigo}</strong>
            <div style="font-size: 11px; color: #64748b;">${s.fecha} (${s.horaInicio} - ${s.horaFinEstimada})</div>
          </td>
          <td>${s.cliente?.nombre || 'Consumidor'}</td>
          <td>
            <div>${s.origen} → ${s.destino}</div>
            <div style="font-size: 11.5px; color: #64748b;">Costo Op: $${s.costoOperativo.toFixed(2)}</div>
          </td>
          <td>
            <strong>${s.vehiculo?.placa || 'N/A'}</strong>
            <div style="font-size: 11px; color: #64748b;">${s.vehiculo?.tipo === 'FurgonetaElectrica' ? '⚡ Eléctrica' : '⛽ Diésel'}</div>
          </td>
          <td>${s.distanciaKm} km / ${s.pesoCargaKg.toLocaleString()} kg</td>
          <td><strong style="color: #2563eb;">$${tarifaTotal}</strong></td>
          <td>${badgeEstado}</td>
          <td>
            <div class="actions-cell">
              ${accionesEstado}
              <button class="btn btn-sm btn-secondary btn-ver-historial" data-id="${s.id}">📜 Trazabilidad</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Eventos de botones
    tbody.querySelectorAll('.btn-cambiar-estado').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        const estado = (e.currentTarget as HTMLElement).dataset.estado as EstadoServicio;
        if (id && estado) {
          if (confirm(`¿Confirma cambiar el estado del servicio a "${estado}"?`)) {
            try {
              await ListaServicios.ActualizarEstado(id, estado);
              await this.cargarTabla(container);
            } catch (err: any) {
              alert(err.message || 'Error al actualizar estado');
            }
          }
        }
      });
    });

    tbody.querySelectorAll('.btn-reasignar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        if (id) {
          await this.abrirModalReasignacion(container, id);
        }
      });
    });

    tbody.querySelectorAll('.btn-ver-historial').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        if (id) {
          await this.mostrarHistorialAuditoria(container, id);
        }
      });
    });
  }

  private async abrirModalReasignacion(container: HTMLElement, servicioId: string) {
    const modal = container.querySelector('#modal-reasignar') as HTMLElement;
    const selectVehiculo = container.querySelector('#reasignar-vehiculo-select') as HTMLSelectElement;
    const hiddenId = container.querySelector('#reasignar-servicio-id') as HTMLInputElement;
    const alertBox = container.querySelector('#modal-reasignar-alert') as HTMLElement;

    alertBox.style.display = 'none';
    hiddenId.value = servicioId;

    await ListaVehiculos.CargarVehiculos();
    selectVehiculo.innerHTML = ListaVehiculos.Lista.map(v => `
      <option value="${v.id}">[${v.placa}] ${v.marca} ${v.modelo} (${v.tipo === 'CamionCarga' ? 'Diésel' : 'Eléctrica'}) - Estado: ${v.estado}</option>
    `).join('');

    modal.style.display = 'flex';
  }

  private async ejecutarReasignacion(container: HTMLElement) {
    const modal = container.querySelector('#modal-reasignar') as HTMLElement;
    const hiddenId = container.querySelector('#reasignar-servicio-id') as HTMLInputElement;
    const selectVehiculo = container.querySelector('#reasignar-vehiculo-select') as HTMLSelectElement;
    const alertBox = container.querySelector('#modal-reasignar-alert') as HTMLElement;

    const servicioId = hiddenId.value;
    const vehiculoId = selectVehiculo.value;

    try {
      await ListaServicios.AsignarVehiculo(servicioId, vehiculoId);
      modal.style.display = 'none';
      await this.cargarTabla(container);
    } catch (err: any) {
      alertBox.style.display = 'block';
      alertBox.className = 'alert-box alert-danger';
      alertBox.textContent = err.message || 'Conflicto al asignar vehículo';
    }
  }

  private async mostrarHistorialAuditoria(container: HTMLElement, servicioId: string) {
    const modal = container.querySelector('#modal-historial') as HTMLElement;
    const content = container.querySelector('#modal-historial-content') as HTMLElement;
    const title = container.querySelector('#modal-historial-title') as HTMLElement;

    modal.style.display = 'flex';
    content.innerHTML = `<p class="text-center py-3">Consultando historial en el servidor...</p>`;

    try {
      const s = await ListaServicios.ObtenerServicioPorId(servicioId);
      title.textContent = `Auditoría de Estados: ${s?.codigo || 'Servicio'}`;

      // Detalle del historial
      const historial = ((s as any)?.historial || []) as any[];
      historial.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      if (historial.length === 0) {
        content.innerHTML = `
          <div style="text-align: center; padding: 25px 15px; color: #64748b;">
            <div style="font-size: 28px; margin-bottom: 8px;">⏳</div>
            <p style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">
              Este servicio se encuentra en estado inicial: <span class="badge badge-info">${s?.estado || 'Programado'}</span>
            </p>
            <p style="font-size: 12px; max-width: 420px; margin: 0 auto; line-height: 1.5;">
              Aún no ha tenido transiciones adicionales. Para generar auditoría en vivo, presiona los botones de acción como 
              <strong>"Iniciar Ruta"</strong> o <strong>"Finalizar Entrega"</strong>. El sistema registrará de forma inmutable 
              el estado anterior, nuevo estado, hora exacta y responsable en PostgreSQL (REQ-02 / REQ-06).
            </p>
          </div>
        `;
        return;
      }

      content.innerHTML = `
        <div class="timeline">
          ${historial.map((h: any) => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-time">📅 ${new Date(h.fecha).toLocaleString()}</div>
              <div class="timeline-text">
                Transición: <span class="badge badge-secondary">${h.estadoAnterior}</span> ➔ <span class="badge badge-info">${h.estadoNuevo}</span>
              </div>
              <div class="timeline-notes">👤 <strong>Responsable:</strong> ${h.usuarioId || 'Operador'} | 📝 <strong>Notas:</strong> ${h.notas || 'Sin observaciones'}</div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      content.innerHTML = `<p class="text-danger text-center">Error al consultar auditoría en el servidor.</p>`;
    }
  }
}
