import template from './FacturaList.html?raw';
import './FacturaList.css';
import { ListaFacturas } from '../../Controlador/ControllersFactura';
import { IFactura } from '../../Entidades/Factura';

export class FacturaList {
  private onCrearCallback?: () => void;
  private facturaSeleccionada: IFactura | null = null;

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

    btnCrear?.addEventListener('click', () => {
      if (this.onCrearCallback) this.onCrearCallback();
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
    this.renderFilas(container, ListaFacturas.Lista);
  }

  private filtrarTabla(container: HTMLElement) {
    const inputSearch = container.querySelector('#factura-search') as HTMLInputElement;
    const criterio = inputSearch?.value || '';
    const filtradas = ListaFacturas.Buscar(criterio);
    this.renderFilas(container, filtradas);
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
