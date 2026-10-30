import template from './ServicioForm.html?raw';
import './ServicioForm.css';
import { ListaServicios } from '../../Controlador/ControllersServicio';
import { ListaVehiculos } from '../../Controlador/ControllersVehiculo';
import { ListaClientes } from '../../Controlador/ControllersCliente';
import { IServicioTransporte } from '../../Entidades/ServicioTransporte';

export class ServicioForm {
  private onGuardadoCallback?: () => void;
  private onCancelarCallback?: () => void;

  constructor(handlers?: { onGuardado?: () => void; onCancelar?: () => void }) {
    this.onGuardadoCallback = handlers?.onGuardado;
    this.onCancelarCallback = handlers?.onCancelar;
  }

  async render(container: HTMLElement) {
    container.innerHTML = template;

    await this.cargarSelects(container);
    this.bindEvents(container);
    this.establecerFechaHoy(container);
  }

  private establecerFechaHoy(container: HTMLElement) {
    const inputFecha = container.querySelector('#s-fecha') as HTMLInputElement;
    if (inputFecha) {
      inputFecha.value = new Date().toISOString().split('T')[0];
    }
  }

  private async cargarSelects(container: HTMLElement) {
    const selectCliente = container.querySelector('#s-cliente') as HTMLSelectElement;
    const selectVehiculo = container.querySelector('#s-vehiculo') as HTMLSelectElement;

    await ListaClientes.CargarClientes();
    selectCliente.innerHTML = `<option value="">Seleccione un cliente...</option>` +
      ListaClientes.Lista.map(c => `
        <option value="${c.id}">${c.nombre} (${c.identificacion})</option>
      `).join('');

    await ListaVehiculos.CargarVehiculos();
    selectVehiculo.innerHTML = `<option value="">Seleccione un vehículo...</option>` +
      ListaVehiculos.Lista.map(v => `
        <option value="${v.id}">[${v.placa}] ${v.marca} ${v.modelo} - Cap: ${v.capacidadCargaKg}kg (${v.tipo === 'CamionCarga' ? 'Diésel' : '⚡ Eléctrico'})</option>
      `).join('');
  }

  private bindEvents(container: HTMLElement) {
    const form = container.querySelector('#servicio-form') as HTMLFormElement;
    const btnCancelar = container.querySelector('#btn-cancelar-servicio');
    const selectVehiculo = container.querySelector('#s-vehiculo') as HTMLSelectElement;
    const inputDistancia = container.querySelector('#s-distancia') as HTMLInputElement;
    const inputPeso = container.querySelector('#s-peso') as HTMLInputElement;
    const inputFecha = container.querySelector('#s-fecha') as HTMLInputElement;
    const checkRecarga = container.querySelector('#s-recarga-planificada') as HTMLInputElement;
    const btnRecalcular = container.querySelector('#btn-recalcular-tarifa');

    const inputOrigen = container.querySelector('#s-origen') as HTMLInputElement;
    const inputDestino = container.querySelector('#s-destino') as HTMLInputElement;

    btnCancelar?.addEventListener('click', () => {
      if (this.onCancelarCallback) this.onCancelarCallback();
    });

    // Auto-cálculo de distancia entre ciudades de Ecuador sugeridas
    const actualizarDistanciaSugerida = () => {
      const orig = inputOrigen?.value.trim().toLowerCase();
      const dest = inputDestino?.value.trim().toLowerCase();
      if (!orig || !dest) return;

      const distancias: Record<string, number> = {
        'quito-guayaquil': 420, 'guayaquil-quito': 420,
        'quito-cuenca': 440, 'cuenca-quito': 440,
        'quito-machala': 515, 'machala-quito': 515,
        'guayaquil-machala': 180, 'machala-guayaquil': 180,
        'guayaquil-cuenca': 195, 'cuenca-guayaquil': 195,
        'cuenca-machala': 170, 'machala-cuenca': 170,
      };

      const clave = `${orig}-${dest}`;
      if (distancias[clave]) {
        inputDistancia.value = String(distancias[clave]);
        this.simularTarifa(container);
      }
    };

    inputOrigen?.addEventListener('change', actualizarDistanciaSugerida);
    inputDestino?.addEventListener('change', actualizarDistanciaSugerida);
    inputOrigen?.addEventListener('input', actualizarDistanciaSugerida);
    inputDestino?.addEventListener('input', actualizarDistanciaSugerida);

    // Botones de presets rápidos
    container.querySelectorAll('.btn-preset-ruta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const orig = target.dataset.origen || '';
        const dest = target.dataset.destino || '';
        const dist = target.dataset.distancia || '';

        if (inputOrigen) inputOrigen.value = orig;
        if (inputDestino) inputDestino.value = dest;
        if (inputDistancia) inputDistancia.value = dist;

        this.simularTarifa(container);
      });
    });

    selectVehiculo?.addEventListener('change', () => {
      this.actualizarInfoVehiculo(container);
      this.simularTarifa(container);
    });

    inputDistancia?.addEventListener('input', () => this.simularTarifa(container));
    inputPeso?.addEventListener('input', () => this.simularTarifa(container));
    inputFecha?.addEventListener('change', () => this.simularTarifa(container));
    checkRecarga?.addEventListener('change', () => this.simularTarifa(container));
    btnRecalcular?.addEventListener('click', () => this.simularTarifa(container));

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.guardar(container);
    });
  }

  private actualizarInfoVehiculo(container: HTMLElement) {
    const selectVehiculo = container.querySelector('#s-vehiculo') as HTMLSelectElement;
    const badgeInfo = container.querySelector('#vehiculo-info-badge') as HTMLElement;
    const boxRecarga = container.querySelector('#box-recarga-planificada') as HTMLElement;

    const vehiculo = ListaVehiculos.BuscarPorId(selectVehiculo.value);
    if (!vehiculo) {
      badgeInfo.textContent = '';
      boxRecarga.style.display = 'none';
      return;
    }

    if (vehiculo.tipo === 'FurgonetaElectrica') {
      boxRecarga.style.display = 'block';
      badgeInfo.innerHTML = `⚡ <strong>Furgoneta Eléctrica:</strong> Batería: ${vehiculo.porcentajeBateria || 0}%, Autonomía teórica: ${vehiculo.autonomiaKm || 0} km.`;
    } else {
      boxRecarga.style.display = 'none';
      badgeInfo.innerHTML = `⛽ <strong>Camión de Carga:</strong> Consumo: ${vehiculo.consumoLitros100Km} L/100km, Capacidad máx: ${vehiculo.capacidadCargaKg} kg.`;
    }
  }

  private async simularTarifa(container: HTMLElement) {
    const selectVehiculo = container.querySelector('#s-vehiculo') as HTMLSelectElement;
    const inputDistancia = container.querySelector('#s-distancia') as HTMLInputElement;
    const inputPeso = container.querySelector('#s-peso') as HTMLInputElement;
    const inputFecha = container.querySelector('#s-fecha') as HTMLInputElement;
    const checkRecarga = container.querySelector('#s-recarga-planificada') as HTMLInputElement;
    const alertSim = container.querySelector('#sim-alert-message') as HTMLElement;

    const vehiculoId = selectVehiculo?.value;
    const distanciaKm = Number(inputDistancia?.value);
    const pesoCargaKg = Number(inputPeso?.value);
    const fecha = inputFecha?.value;
    const recargaPlanificada = checkRecarga?.checked || false;

    if (!vehiculoId || distanciaKm <= 0 || pesoCargaKg <= 0) {
      return;
    }

    try {
      const sim = await ListaServicios.SimularTarifa({
        vehiculoId,
        distanciaKm,
        pesoCargaKg,
        recargaPlanificada,
        fecha,
      });

      (container.querySelector('#sim-costo-operativo') as HTMLElement).textContent = `$${sim.costoOperativo.toFixed(2)}`;
      (container.querySelector('#sim-tarifa-base') as HTMLElement).textContent = `$${sim.tarifaBase.toFixed(2)}`;
      (container.querySelector('#sim-recargo-carga') as HTMLElement).textContent = `$${sim.recargoCargaAutonomia.toFixed(2)}`;
      (container.querySelector('#sim-recargo-distancia') as HTMLElement).textContent = `$${sim.recargoDistancia.toFixed(2)}`;
      (container.querySelector('#sim-recargo-domingo') as HTMLElement).textContent = `$${sim.recargoDomingo.toFixed(2)}`;
      (container.querySelector('#sim-tarifa-total') as HTMLElement).textContent = `$${sim.totalTarifa.toFixed(2)}`;

      alertSim.style.display = 'none';
      if (sim.esDomingo) {
        alertSim.style.display = 'block';
        alertSim.className = 'sim-alert alert-box alert-success';
        alertSim.textContent = 'ℹ️ Se detectó servicio en día domingo: se aplicó un recargo del 12% a la tarifa base.';
      }
    } catch (err: any) {
      alertSim.style.display = 'block';
      alertSim.className = 'sim-alert alert-box alert-danger';
      alertSim.textContent = err.message || 'Error en cálculo de factibilidad de tarifa';
    }
  }

  private async guardar(container: HTMLElement) {
    const alertBox = container.querySelector('#servicio-form-alert') as HTMLElement;
    alertBox.style.display = 'none';

    const codigo = (container.querySelector('#s-codigo') as HTMLInputElement).value.trim();
    const clienteId = (container.querySelector('#s-cliente') as HTMLSelectElement).value;
    const vehiculoId = (container.querySelector('#s-vehiculo') as HTMLSelectElement).value;
    const origen = (container.querySelector('#s-origen') as HTMLInputElement).value.trim();
    const destino = (container.querySelector('#s-destino') as HTMLInputElement).value.trim();
    const distanciaKm = Number((container.querySelector('#s-distancia') as HTMLInputElement).value);
    const pesoCargaKg = Number((container.querySelector('#s-peso') as HTMLInputElement).value);
    const fecha = (container.querySelector('#s-fecha') as HTMLInputElement).value;
    const horaInicio = (container.querySelector('#s-hora-inicio') as HTMLInputElement).value;
    const horaFinEstimada = (container.querySelector('#s-hora-fin') as HTMLInputElement).value;
    const recargaPlanificada = (container.querySelector('#s-recarga-planificada') as HTMLInputElement)?.checked || false;

    if (!codigo || !clienteId || !vehiculoId || !origen || !destino || distanciaKm <= 0 || pesoCargaKg <= 0) {
      this.mostrarAlerta(alertBox, 'Complete todos los campos obligatorios (*)', 'danger');
      return;
    }

    try {
      await ListaServicios.RegistrarServicio({
        codigo,
        clienteId,
        vehiculoId,
        origen,
        destino,
        distanciaKm,
        pesoCargaKg,
        fecha,
        horaInicio,
        horaFinEstimada,
        recargaPlanificada,
      });

      this.mostrarAlerta(alertBox, 'Servicio programado y validado exitosamente en el servidor', 'success');
      setTimeout(() => {
        if (this.onGuardadoCallback) this.onGuardadoCallback();
      }, 700);
    } catch (err: any) {
      this.mostrarAlerta(alertBox, err.message || 'Error al registrar servicio', 'danger');
    }
  }

  private mostrarAlerta(el: HTMLElement, mensaje: string, tipo: 'success' | 'danger') {
    el.style.display = 'block';
    el.className = `alert-box alert-${tipo}`;
    el.textContent = mensaje;
  }
}
