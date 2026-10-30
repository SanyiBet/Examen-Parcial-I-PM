import template from './FacturaList.html?raw';
import './FacturaList.css';
import { ListaFacturas } from '../../Controlador/ControllersFactura';
import { AuthState } from '../../Controlador/ControllersAuth';
import { IFactura } from '../../Entidades/Factura';

export class FacturaList {
  private onCrearCallback?: () => void;
  private facturaSeleccionada: IFactura | null = null;

  private currentPage = 1;
  private pageSize = 10;
  private listaFiltrada: IFactura[] = [];

  constructor(handlers?: { onCrear?: () => void }) {
    this.onCrearCallback = handlers?.onCrear;
  }

  async render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    await this.cargarTabla(container);
  }

  private bindEvents(container: HTMLElement) {
    const btnCrear = container.querySelector('#btn-crear-factura');
    const inputSearch = container.querySelector('#factura-search') as HTMLInputElement;

    const esAdmin = AuthState.esAdmin();
    if (!esAdmin && btnCrear) {
      (btnCrear as HTMLElement).style.display = 'none';
      const titleBar = container.querySelector('.page-title-bar');
      if (titleBar && !titleBar.querySelector('.role-scope-badge')) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-secondary role-scope-badge';
        badge.style.padding = '6px 12px';
        badge.style.fontSize = '12px';
        badge.textContent = '🔒 Modo Consulta (Emisión de facturas reservada para Administrador)';
        titleBar.appendChild(badge);
      }
    }

    const btnPrev = container.querySelector('#facturas-btn-prev');
    const btnNext = container.querySelector('#facturas-btn-next');
    const selectPageSize = container.querySelector('#facturas-page-size') as HTMLSelectElement;

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

    // Modal
    const modal = container.querySelector('#modal-detalle-factura') as HTMLElement;
    container.querySelector('#modal-factura-close')?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });

    container.querySelector('#btn-descargar-pdf-modal')?.addEventListener('click', () => {
      if (this.facturaSeleccionada) {
        ListaFacturas.GenerarPDFSimulado(this.facturaSeleccionada);
      }
    });
  }

  private async cargarTabla(container: HTMLElement) {
    await ListaFacturas.CargarFacturas();
    this.listaFiltrada = [...ListaFacturas.Lista];
    this.currentPage = 1;
    this.renderPaginaActual(container);
  }

  private filtrarTabla(container: HTMLElement) {
    const inputSearch = container.querySelector('#factura-search') as HTMLInputElement;
    const criterio = inputSearch?.value || '';
    this.listaFiltrada = ListaFacturas.Buscar(criterio);
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
    const pageStartEl = container.querySelector('#facturas-page-start');
    const pageEndEl = container.querySelector('#facturas-page-end');
    const totalCountEl = container.querySelector('#facturas-total-count');
    const pageCurrentEl = container.querySelector('#facturas-page-current');
    const btnPrev = container.querySelector('#facturas-btn-prev') as HTMLButtonElement;
    const btnNext = container.querySelector('#facturas-btn-next') as HTMLButtonElement;

    if (pageStartEl) pageStartEl.textContent = String(total === 0 ? 0 : startIdx + 1);
    if (pageEndEl) pageEndEl.textContent = String(endIdx);
    if (totalCountEl) totalCountEl.textContent = String(total);
    if (pageCurrentEl) pageCurrentEl.textContent = `Pág. ${this.currentPage} de ${totalPages}`;
    if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
    if (btnNext) btnNext.disabled = this.currentPage >= totalPages;

    this.renderFilas(container, pagedItems);
  }

  private renderFilas(container: HTMLElement, lista: IFactura[]) {
    const tbody = container.querySelector('#facturas-table-body');
    if (!tbody) return;

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No se han emitido facturas aún</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map(f => {
      return `
        <tr>
          <td><strong style="color: #2563eb;">${f.codigo}</strong></td>
          <td>
            <strong>${f.cliente?.nombre || 'Consumidor Final'}</strong>
            <div style="font-size: 11px; color: #64748b;">${f.cliente?.identificacion || 'N/A'}</div>
          </td>
          <td>${f.fecha}</td>
          <td>$${f.subtotal.toFixed(2)}</td>
          <td>$${f.recargos.toFixed(2)}</td>
          <td>
            <span class="badge ${f.descuento > 0 ? 'badge-success' : 'badge-secondary'}">
              -$${f.descuento.toFixed(2)} (${f.porcentajeDescuento}%)
            </span>
          </td>
          <td>$${f.impuesto.toFixed(2)}</td>
          <td><strong style="color: #0f172a; font-size: 14.5px;">$${f.total.toFixed(2)}</strong></td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm btn-outline btn-ver-factura" data-id="${f.id}">👁️ Ver Desglose</button>
              <button class="btn btn-sm btn-secondary btn-pdf-factura" data-id="${f.id}">📄 PDF</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-ver-factura').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        const fac = ListaFacturas.Lista.find(x => x.id === id);
        if (fac) {
          this.mostrarModalDetalle(container, fac);
        }
      });
    });

    tbody.querySelectorAll('.btn-pdf-factura').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        const fac = ListaFacturas.Lista.find(x => x.id === id);
        if (fac) {
          ListaFacturas.GenerarPDFSimulado(fac);
        }
      });
    });
  }

  private mostrarModalDetalle(container: HTMLElement, f: IFactura) {
    this.facturaSeleccionada = f;
    const modal = container.querySelector('#modal-detalle-factura') as HTMLElement;
    const body = container.querySelector('#modal-factura-body') as HTMLElement;
    const title = container.querySelector('#modal-factura-title') as HTMLElement;

    title.textContent = `Comprobante: ${f.codigo}`;

    body.innerHTML = `
      <div class="factura-info-header">
        <div><strong>Cliente:</strong> ${f.cliente?.nombre || 'Consumidor Final'}</div>
        <div><strong>Identificación / RUC:</strong> ${f.cliente?.identificacion || '9999999999'}</div>
        <div><strong>Fecha de Emisión:</strong> ${f.fecha}</div>
        <div style="font-size: 11px; color: #dc2626; margin-top: 4px;">* Comprobante simulado sin validez tributaria ante el SRI</div>
      </div>

      <h4 style="font-size: 13.5px; font-weight: 700; margin-bottom: 8px;">Servicios Completados en esta Factura:</h4>
      <div class="table-responsive">
        <table class="table-custom" style="font-size: 12.5px;">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Tarifa Base</th>
              <th>Recargos</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${(f.detalles || []).map(d => `
              <tr>
                <td>${d.servicio?.codigo || 'SRV'} (${d.servicio?.origen} → ${d.servicio?.destino})</td>
                <td>$${Number(d.tarifa).toFixed(2)}</td>
                <td>$${Number(d.recargos).toFixed(2)}</td>
                <td>$${(Number(d.tarifa) + Number(d.recargos)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="factura-totales-box">
        <div class="factura-total-row">
          <span>Subtotal Servicios:</span>
          <strong>$${f.subtotal.toFixed(2)}</strong>
        </div>
        <div class="factura-total-row">
          <span>Recargos (+300km / Domingo):</span>
          <strong>+$${f.recargos.toFixed(2)}</strong>
        </div>
        <div class="factura-total-row text-success">
          <span>Descuento Aplicado (${f.porcentajeDescuento}%):</span>
          <strong>-$${f.descuento.toFixed(2)}</strong>
        </div>
        <div class="factura-total-row">
          <span>IVA (${f.porcentajeImpuesto}%):</span>
          <strong>+$${f.impuesto.toFixed(2)}</strong>
        </div>
        <div class="factura-total-row factura-gran-total">
          <span>TOTAL A PAGAR:</span>
          <strong class="text-primary">$${f.total.toFixed(2)}</strong>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }
}
