import template from './FacturaForm.html?raw';
import './FacturaForm.css';
import { ListaFacturas } from '../../Controlador/ControllersFactura';
import { ListaClientes } from '../../Controlador/ControllersCliente';
import { ListaServicios } from '../../Controlador/ControllersServicio';
import { IServicioTransporte } from '../../Entidades/ServicioTransporte';

export class FacturaForm {
  private onGuardadoCallback?: () => void;
  private onCancelarCallback?: () => void;
  private serviciosCompletadosCliente: IServicioTransporte[] = [];

  constructor(handlers?: { onGuardado?: () => void; onCancelar?: () => void }) {
    this.onGuardadoCallback = handlers?.onGuardado;
    this.onCancelarCallback = handlers?.onCancelar;
  }

  async render(container: HTMLElement) {
    container.innerHTML = template;

    await this.cargarClientes(container);
    this.bindEvents(container);
  }

  private async cargarClientes(container: HTMLElement) {
    const selectCliente = container.querySelector('#f-cliente') as HTMLSelectElement;
    await ListaClientes.CargarClientes();

    selectCliente.innerHTML = `<option value="">Seleccione un cliente...</option>` +
      ListaClientes.Lista.map(c => `
        <option value="${c.id}">${c.nombre} (${c.identificacion})</option>
      `).join('');
  }

  private bindEvents(container: HTMLElement) {
    const form = container.querySelector('#factura-form') as HTMLFormElement;
    const btnCancelar = container.querySelector('#btn-cancelar-factura');
    const selectCliente = container.querySelector('#f-cliente') as HTMLSelectElement;
    const inputImpuesto = container.querySelector('#f-impuesto') as HTMLInputElement;

    btnCancelar?.addEventListener('click', () => {
      if (this.onCancelarCallback) this.onCancelarCallback();
    });

    selectCliente?.addEventListener('change', async () => {
      await this.cargarServiciosCliente(container, selectCliente.value);
      this.recalcularTotales(container);
    });

    inputImpuesto?.addEventListener('input', () => {
      this.recalcularTotales(container);
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.guardarFactura(container);
    });
  }

  private async cargarServiciosCliente(container: HTMLElement, clienteId: string) {
    const servContainer = container.querySelector('#f-servicios-container') as HTMLElement;
    const badgeConteo = container.querySelector('#f-conteo-servicios-mes') as HTMLElement;
    const btnGenerar = container.querySelector('#btn-generar-factura') as HTMLButtonElement;

    if (!clienteId) {
      servContainer.innerHTML = `<p class="text-muted text-center py-3">Seleccione un cliente para consultar sus servicios completados.</p>`;
      badgeConteo.textContent = '0 servicios en el mes';
      btnGenerar.disabled = true;
      return;
    }

    servContainer.innerHTML = `<p class="text-center py-3">Buscando servicios completados...</p>`;

    await ListaServicios.CargarServicios({ clienteId });
    // Filtrar completados y no facturados
    this.serviciosCompletadosCliente = ListaServicios.Lista.filter(
      s => s.clienteId === clienteId && s.estado === 'Completado' && !s.facturado
    );

    // Contar total de completados en el mes para el descuento
    const totalCompletadosMes = ListaServicios.Lista.filter(
      s => s.clienteId === clienteId && s.estado === 'Completado'
    ).length;

    badgeConteo.textContent = `${totalCompletadosMes} servicios completados este mes`;

    if (this.serviciosCompletadosCliente.length === 0) {
      servContainer.innerHTML = `
        <div class="alert-box alert-secondary text-center py-3">
          El cliente seleccionado no tiene servicios completados pendientes de facturación.
        </div>
      `;
      btnGenerar.disabled = true;
      return;
    }

    btnGenerar.disabled = false;
    servContainer.innerHTML = this.serviciosCompletadosCliente.map(s => {
      const tarifaTotal = (Number(s.tarifaCalculada) + Number(s.recargoAplicado || 0)).toFixed(2);
      return `
        <div class="service-check-item">
          <input type="checkbox" class="chk-servicio" value="${s.id}" checked>
          <div class="service-check-info">
            <div><strong>${s.codigo}</strong>: ${s.origen} → ${s.destino} (${s.distanciaKm} km)</div>
            <div style="font-size: 11.5px; color: #64748b;">Fecha: ${s.fecha} | Vehículo: ${s.vehiculo?.placa || 'N/A'}</div>
          </div>
          <div>
            <strong style="color: #2563eb;">$${tarifaTotal}</strong>
          </div>
        </div>
      `;
    }).join('');

    // Re-bind change events on checkboxes
    servContainer.querySelectorAll('.chk-servicio').forEach(chk => {
      chk.addEventListener('change', () => this.recalcularTotales(container));
    });
  }

  private recalcularTotales(container: HTMLElement) {
    const chks = container.querySelectorAll('.chk-servicio:checked') as NodeListOf<HTMLInputElement>;
    const selectCliente = container.querySelector('#f-cliente') as HTMLSelectElement;
    const inputImpuesto = container.querySelector('#f-impuesto') as HTMLInputElement;

    const clienteId = selectCliente?.value;
    const tasaImpuesto = Number(inputImpuesto?.value) || 15;

    let subtotal = 0;
    let recargos = 0;

    chks.forEach(chk => {
      const s = this.serviciosCompletadosCliente.find(x => x.id === chk.value);
      if (s) {
        subtotal += Number(s.tarifaCalculada);
        recargos += Number(s.recargoAplicado || 0);
      }
    });

    // Descuento según reglas de negocio
    const totalCompletadosMes = ListaServicios.Lista.filter(
      s => s.clienteId === clienteId && s.estado === 'Completado'
    ).length;

    let porcentajeDescuento = 0;
    if (totalCompletadosMes >= 6) {
      porcentajeDescuento = 10;
    } else if (totalCompletadosMes >= 3) {
      porcentajeDescuento = 5;
    }

    const baseParaDescuento = subtotal + recargos;
    const descuento = (baseParaDescuento * porcentajeDescuento) / 100;
    const baseImponible = baseParaDescuento - descuento;
    const impuesto = (baseImponible * tasaImpuesto) / 100;
    const total = baseImponible + impuesto;

    (container.querySelector('#f-calc-subtotal') as HTMLElement).textContent = `$${subtotal.toFixed(2)}`;
    (container.querySelector('#f-calc-recargos') as HTMLElement).textContent = `+$${recargos.toFixed(2)}`;
    (container.querySelector('#f-label-descuento') as HTMLElement).textContent = `Descuento Cliente (${porcentajeDescuento}%):`;
    (container.querySelector('#f-calc-descuento') as HTMLElement).textContent = `-$${descuento.toFixed(2)}`;
    (container.querySelector('#f-calc-impuesto') as HTMLElement).textContent = `+$${impuesto.toFixed(2)}`;
    (container.querySelector('#f-calc-total') as HTMLElement).textContent = `$${total.toFixed(2)}`;
  }

  private async guardarFactura(container: HTMLElement) {
    const alertBox = container.querySelector('#factura-form-alert') as HTMLElement;
    alertBox.style.display = 'none';

    const selectCliente = container.querySelector('#f-cliente') as HTMLSelectElement;
    const clienteId = selectCliente.value;
    const chks = container.querySelectorAll('.chk-servicio:checked') as NodeListOf<HTMLInputElement>;
    const servicioIds = Array.from(chks).map(c => c.value);

    if (!clienteId || servicioIds.length === 0) {
      this.mostrarAlerta(alertBox, 'Debe seleccionar al menos un servicio completado para facturar', 'danger');
      return;
    }

    try {
      const factura = await ListaFacturas.GenerarFactura(clienteId, servicioIds);
      this.mostrarAlerta(alertBox, `Factura ${factura.codigo} emitida exitosamente con transacción atómica`, 'success');

      // Descargar comprobante PDF simulado de inmediato
      setTimeout(() => {
        ListaFacturas.GenerarPDFSimulado(factura);
        if (this.onGuardadoCallback) this.onGuardadoCallback();
      }, 900);
    } catch (err: any) {
      this.mostrarAlerta(alertBox, err.message || 'Error al emitir factura', 'danger');
    }
  }

  private mostrarAlerta(el: HTMLElement, mensaje: string, tipo: 'success' | 'danger') {
    el.style.display = 'block';
    el.className = `alert-box alert-${tipo}`;
    el.textContent = mensaje;
  }
}
