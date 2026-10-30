import template from './VehiculoList.html?raw';
import './VehiculoList.css';
import { ListaVehiculos } from '../../Controlador/ControllersVehiculo';
import { IVehiculo } from '../../Entidades/Vehiculo';

export class VehiculoList {
  private onCrearCallback?: () => void;
  private onEditarCallback?: (vehiculo: IVehiculo) => void;
  private currentView: 'cards' | 'table' = 'cards';

  private currentPage = 1;
  private pageSize = 6;
  private listaFiltrada: IVehiculo[] = [];

  constructor(handlers?: { onCrear?: () => void; onEditar?: (v: IVehiculo) => void }) {
    this.onCrearCallback = handlers?.onCrear;
    this.onEditarCallback = handlers?.onEditar;
  }

  async render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    await this.cargarVehiculos(container);
  }

  private bindEvents(container: HTMLElement) {
    const btnCrear = container.querySelector('#btn-crear-vehiculo');
    const inputSearch = container.querySelector('#vehiculo-search') as HTMLInputElement;
    const filterTipo = container.querySelector('#vehiculo-tipo-filter') as HTMLSelectElement;
    const filterEstado = container.querySelector('#vehiculo-estado-filter') as HTMLSelectElement;

    const btnViewCards = container.querySelector('#btn-view-cards');
    const btnViewTable = container.querySelector('#btn-view-table');

    const btnPrev = container.querySelector('#vehiculos-btn-prev');
    const btnNext = container.querySelector('#vehiculos-btn-next');
    const selectPageSize = container.querySelector('#vehiculos-page-size') as HTMLSelectElement;

    btnCrear?.addEventListener('click', () => {
      if (this.onCrearCallback) this.onCrearCallback();
    });

    // Toggle de vistas
    btnViewCards?.addEventListener('click', () => {
      this.currentView = 'cards';
      btnViewCards.classList.add('active');
      btnViewTable?.classList.remove('active');
      (container.querySelector('#vehiculos-cards-view') as HTMLElement).style.display = 'grid';
      (container.querySelector('#vehiculos-table-view') as HTMLElement).style.display = 'none';
    });

    btnViewTable?.addEventListener('click', () => {
      this.currentView = 'table';
      btnViewTable.classList.add('active');
      btnViewCards?.classList.remove('active');
      (container.querySelector('#vehiculos-cards-view') as HTMLElement).style.display = 'none';
      (container.querySelector('#vehiculos-table-view') as HTMLElement).style.display = 'block';
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
      this.pageSize = Number(selectPageSize.value) || 6;
      this.currentPage = 1;
      this.renderPaginaActual(container);
    });

    inputSearch?.addEventListener('input', () => this.filtrar(container));
    filterTipo?.addEventListener('change', () => this.filtrar(container));
    filterEstado?.addEventListener('change', () => this.filtrar(container));

    // Modal cerrar
    const modal = container.querySelector('#modal-eficiencia') as HTMLElement;
    const btnCloseModal = container.querySelector('#modal-eficiencia-close');
    btnCloseModal?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  }

  private async cargarVehiculos(container: HTMLElement) {
    await ListaVehiculos.CargarVehiculos();
    this.actualizarMetricas(container, ListaVehiculos.Lista);
    this.listaFiltrada = [...ListaVehiculos.Lista];
    this.currentPage = 1;
    this.renderPaginaActual(container);
  }

  private actualizarMetricas(container: HTMLElement, lista: IVehiculo[]) {
    const totalEl = container.querySelector('#stat-total-vehiculos');
    const electricosEl = container.querySelector('#stat-electricos');
    const dieselEl = container.querySelector('#stat-diesel');
    const disponiblesEl = container.querySelector('#stat-disponibles');

    const total = lista.length;
    const electricos = lista.filter(v => v.tipo === 'FurgonetaElectrica').length;
    const diesel = lista.filter(v => v.tipo === 'CamionCarga').length;
    const disponibles = lista.filter(v => v.estado === 'Disponible').length;

    if (totalEl) totalEl.textContent = String(total);
    if (electricosEl) electricosEl.textContent = String(electricos);
    if (dieselEl) dieselEl.textContent = String(diesel);
    if (disponiblesEl) disponiblesEl.textContent = String(disponibles);
  }

  private filtrar(container: HTMLElement) {
    const inputSearch = container.querySelector('#vehiculo-search') as HTMLInputElement;
    const filterTipo = container.querySelector('#vehiculo-tipo-filter') as HTMLSelectElement;
    const filterEstado = container.querySelector('#vehiculo-estado-filter') as HTMLSelectElement;

    const criterio = (inputSearch?.value || '').trim();
    const tipo = filterTipo?.value || '';
    const estado = filterEstado?.value || '';

    let filtrados = ListaVehiculos.Buscar(criterio);
    if (tipo) {
      filtrados = filtrados.filter(v => v.tipo === tipo);
    }
    if (estado) {
      filtrados = filtrados.filter(v => v.estado === estado);
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
    const pageStartEl = container.querySelector('#vehiculos-page-start');
    const pageEndEl = container.querySelector('#vehiculos-page-end');
    const totalCountEl = container.querySelector('#vehiculos-total-count');
    const pageCurrentEl = container.querySelector('#vehiculos-page-current');
    const btnPrev = container.querySelector('#vehiculos-btn-prev') as HTMLButtonElement;
    const btnNext = container.querySelector('#vehiculos-btn-next') as HTMLButtonElement;

    if (pageStartEl) pageStartEl.textContent = String(total === 0 ? 0 : startIdx + 1);
    if (pageEndEl) pageEndEl.textContent = String(endIdx);
    if (totalCountEl) totalCountEl.textContent = String(total);
    if (pageCurrentEl) pageCurrentEl.textContent = `Pág. ${this.currentPage} de ${totalPages}`;
    if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
    if (btnNext) btnNext.disabled = this.currentPage >= totalPages;

    this.renderCards(container, pagedItems);
    this.renderTabla(container, pagedItems);
    this.bindActionButtons(container);
  }

  private renderCards(container: HTMLElement, lista: IVehiculo[]) {
    const cardsContainer = container.querySelector('#vehiculos-cards-view');
    if (!cardsContainer) return;

    if (lista.length === 0) {
      cardsContainer.innerHTML = `
        <div class="empty-state text-center py-5" style="grid-column: 1 / -1; background: #ffffff; border-radius: 14px; border: 1px dashed #cbd5e1; padding: 40px;">
          <span style="font-size: 36px;">🚚</span>
          <h4 class="mt-2 text-slate-800" style="font-weight: 700;">No se encontraron vehículos</h4>
          <p class="text-muted" style="font-size: 13px;">Intenta cambiar los filtros de búsqueda o registra una nueva unidad.</p>
        </div>
      `;
      return;
    }

    cardsContainer.innerHTML = lista.map(v => {
      const isElectrico = v.tipo === 'FurgonetaElectrica';
      const defaultImg = isElectrico
        ? 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80';
      const imgSrc = v.imagenUrl || defaultImg;

      const badgeEstado = v.estado === 'Disponible'
        ? `<span class="badge badge-success">🟢 Disponible</span>`
        : v.estado === 'EnServicio'
        ? `<span class="badge badge-warning">🟡 En Servicio</span>`
        : `<span class="badge badge-danger">🔴 Mantenimiento</span>`;

      const badgePropulsion = isElectrico
        ? `<span class="glass-badge badge-electric">⚡ 100% Eléctrica</span>`
        : `<span class="glass-badge badge-combustion">⛽ Diésel Euro 5</span>`;

      let telemetriaHtml = '';
      if (isElectrico) {
        const pct = v.porcentajeBateria !== undefined ? v.porcentajeBateria : 100;
        const fillClass = pct > 50 ? 'fill-high' : pct > 20 ? 'fill-mid' : 'fill-low';
        const autonomiaRestante = Math.round((pct / 100) * (v.autonomiaKm || 280));

        telemetriaHtml = `
          <div class="telemetria-container">
            <div class="telemetria-row">
              <span class="telemetria-label">Batería (${v.capacidadBateriaKWh || 68} kWh):</span>
              <span class="telemetria-val">${pct}%</span>
            </div>
            <div class="battery-bar-container">
              <div class="battery-bar-fill ${fillClass}" style="width: ${pct}%;"></div>
            </div>
            <div class="telemetria-row mt-2" style="margin-bottom: 0;">
              <span class="telemetria-label">Autonomía est.:</span>
              <span class="telemetria-val text-primary" style="color: #2563eb;">${autonomiaRestante} km / ${v.autonomiaKm || 280} km</span>
            </div>
          </div>
        `;
      } else {
        telemetriaHtml = `
          <div class="telemetria-container">
            <div class="telemetria-row">
              <span class="telemetria-label">Consumo de combustible:</span>
              <span class="telemetria-val">${v.consumoLitros100Km || 32} L / 100 km</span>
            </div>
            <div class="telemetria-row" style="margin-bottom: 0;">
              <span class="telemetria-label">Costo estimado:</span>
              <span class="telemetria-val" style="color: #047857;">$${(((v.consumoLitros100Km || 32) * (v.precioLitro || 1.15)) / 100).toFixed(2)} USD/km</span>
            </div>
          </div>
        `;
      }

      return `
        <div class="vehiculo-card" data-id="${v.id}">
          <div class="vehiculo-card-media">
            <img src="${imgSrc}" alt="${v.marca} ${v.modelo}" loading="lazy" onerror="this.onerror=null; this.src='${defaultImg}';">
            <div class="card-badge-top-left">${badgeEstado}</div>
            <div class="card-badge-top-right">${badgePropulsion}</div>
          </div>

          <div class="vehiculo-card-content">
            <div class="card-header-info">
              <div>
                <h3 class="card-vehiculo-title">${v.marca} ${v.modelo}</h3>
                <p class="card-vehiculo-sub">Año ${v.anio} &bull; ${isElectrico ? 'Vehículo Ecológico' : 'Transporte Pesado'}</p>
              </div>
              <span class="placa-badge">${v.placa}</span>
            </div>

            ${telemetriaHtml}

            <div class="specs-row">
              <div class="spec-item">
                <span class="spec-item-label">Capacidad de Carga</span>
                <span class="spec-item-val">${v.capacidadCargaKg.toLocaleString()} kg</span>
              </div>
              <div class="spec-item">
                <span class="spec-item-label">Odómetro</span>
                <span class="spec-item-val">${v.kilometraje.toLocaleString()} km</span>
              </div>
            </div>
          </div>

          <div class="vehiculo-card-footer">
            <button class="btn btn-sm btn-outline btn-eficiencia" data-id="${v.id}">
              📊 Eficiencia
            </button>
            <button class="btn btn-sm btn-secondary btn-editar" data-id="${v.id}">
              ✏️ Editar
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  private renderTabla(container: HTMLElement, lista: IVehiculo[]) {
    const tbody = container.querySelector('#vehiculos-table-body');
    if (!tbody) return;

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No se encontraron vehículos registrados</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map(v => {
      const isElectrico = v.tipo === 'FurgonetaElectrica';
      const defaultImg = isElectrico
        ? 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=200&q=80';
      const imgSrc = v.imagenUrl || defaultImg;

      const badgeTipo = isElectrico 
        ? `<span class="badge badge-info">⚡ Eléctrica</span>` 
        : `<span class="badge badge-secondary">⛽ Diésel</span>`;

      const metric = isElectrico
        ? `Batería: <strong>${v.porcentajeBateria || 0}%</strong> (${v.autonomiaKm || 0} km)`
        : `Consumo: <strong>${v.consumoLitros100Km || 0} L/100km</strong>`;

      const badgeEstado = v.estado === 'Disponible'
        ? `<span class="badge badge-success">Disponible</span>`
        : v.estado === 'EnServicio'
        ? `<span class="badge badge-warning">En Servicio</span>`
        : `<span class="badge badge-danger">Mantenimiento</span>`;

      return `
        <tr>
          <td>
            <img src="${imgSrc}" class="table-thumb" alt="${v.placa}" onerror="this.onerror=null; this.src='${defaultImg}';">
          </td>
          <td><strong style="color: #2563eb; letter-spacing: 0.5px;">${v.placa}</strong></td>
          <td>${badgeTipo}</td>
          <td>${v.marca} ${v.modelo} (${v.anio})</td>
          <td>${v.capacidadCargaKg.toLocaleString()} kg</td>
          <td>${v.kilometraje.toLocaleString()} km</td>
          <td>${metric}</td>
          <td>${badgeEstado}</td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm btn-outline btn-eficiencia" data-id="${v.id}">📊 Eficiencia</button>
              <button class="btn btn-sm btn-secondary btn-editar" data-id="${v.id}">✏️ Editar</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  private bindActionButtons(container: HTMLElement) {
    container.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        const vehiculo = ListaVehiculos.BuscarPorId(id || '');
        if (vehiculo && this.onEditarCallback) {
          this.onEditarCallback(vehiculo);
        }
      });
    });

    container.querySelectorAll('.btn-eficiencia').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        if (id) {
          await this.mostrarModalEficiencia(container, id);
        }
      });
    });
  }

  private async mostrarModalEficiencia(container: HTMLElement, id: string) {
    const modal = container.querySelector('#modal-eficiencia') as HTMLElement;
    const modalBody = container.querySelector('#modal-eficiencia-body');
    const modalTitle = container.querySelector('#modal-eficiencia-title');

    if (!modal || !modalBody) return;

    modal.style.display = 'flex';
    modalBody.innerHTML = `<p class="text-center py-3">Calculando indicadores de telemetría y eficiencia...</p>`;

    try {
      const data = await ListaVehiculos.ObtenerEficiencia(id);
      if (modalTitle) modalTitle.textContent = `Eficiencia Operativa: ${data.placa}`;

      if (data.tipo === 'CamionCarga') {
        modalBody.innerHTML = `
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Tipo de Vehículo:</span>
            <span class="eficiencia-val">Camión de Carga (Combustión Diésel)</span>
          </div>
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Consumo Promedio:</span>
            <span class="eficiencia-val">${data.consumoLitros100Km} L / 100 Km</span>
          </div>
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Costo Operativo Estimado por Km:</span>
            <span class="eficiencia-val text-primary">$${data.costoPorKm} USD/km</span>
          </div>
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Diagnóstico de Rendimiento:</span>
            <span class="badge badge-success">${data.evaluacion}</span>
          </div>
        `;
      } else {
        modalBody.innerHTML = `
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Tipo de Vehículo:</span>
            <span class="eficiencia-val">Furgoneta Eléctrica Cero Emisiones</span>
          </div>
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Carga Actual de Batería:</span>
            <span class="eficiencia-val">${data.porcentajeBateria}% (${data.capacidadBateriaKWh} kWh capacidad)</span>
          </div>
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Autonomía Disponible Inmediata:</span>
            <span class="eficiencia-val text-primary">${data.autonomiaActualKm} km</span>
          </div>
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Autonomía Teórica Máxima:</span>
            <span class="eficiencia-val">${data.autonomiaMaximaKm} km</span>
          </div>
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Costo Energético por Km:</span>
            <span class="eficiencia-val text-primary">$${data.costoPorKm} USD/km</span>
          </div>
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Diagnóstico de Batería:</span>
            <span class="badge ${data.porcentajeBateria > 20 ? 'badge-success' : 'badge-danger'}">${data.evaluacion}</span>
          </div>
        `;
      }
    } catch (e) {
      modalBody.innerHTML = `<p class="text-danger text-center">Error al consultar eficiencia del vehículo</p>`;
    }
  }
}
