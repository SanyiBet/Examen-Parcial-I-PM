import template from './VehiculoList.html?raw';
import './VehiculoList.css';
import { ListaVehiculos } from '../../Controlador/ControllersVehiculo';
import { IVehiculo } from '../../Entidades/Vehiculo';

export class VehiculoList {
  private onCrearCallback?: () => void;
  private onEditarCallback?: (vehiculo: IVehiculo) => void;

  constructor(handlers?: { onCrear?: () => void; onEditar?: (v: IVehiculo) => void }) {
    this.onCrearCallback = handlers?.onCrear;
    this.onEditarCallback = handlers?.onEditar;
  }

  async render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    await this.cargarTabla(container);
  }

  private bindEvents(container: HTMLElement) {
    const btnCrear = container.querySelector('#btn-crear-vehiculo');
    const inputSearch = container.querySelector('#vehiculo-search') as HTMLInputElement;
    const filterTipo = container.querySelector('#vehiculo-tipo-filter') as HTMLSelectElement;

    btnCrear?.addEventListener('click', () => {
      if (this.onCrearCallback) this.onCrearCallback();
    });

    inputSearch?.addEventListener('input', () => this.filtrarTabla(container));
    filterTipo?.addEventListener('change', () => this.filtrarTabla(container));

    // Modal cerrar
    const modal = container.querySelector('#modal-eficiencia') as HTMLElement;
    const btnCloseModal = container.querySelector('#modal-eficiencia-close');
    btnCloseModal?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  }

  private async cargarTabla(container: HTMLElement) {
    await ListaVehiculos.CargarVehiculos();
    this.renderFilas(container, ListaVehiculos.Lista);
  }

  private filtrarTabla(container: HTMLElement) {
    const inputSearch = container.querySelector('#vehiculo-search') as HTMLInputElement;
    const filterTipo = container.querySelector('#vehiculo-tipo-filter') as HTMLSelectElement;

    const criterio = inputSearch?.value || '';
    const tipo = filterTipo?.value || '';

    let filtrados = ListaVehiculos.Buscar(criterio);
    if (tipo) {
      filtrados = filtrados.filter(v => v.tipo === tipo);
    }

    this.renderFilas(container, filtrados);
  }

  private renderFilas(container: HTMLElement, lista: IVehiculo[]) {
    const tbody = container.querySelector('#vehiculos-table-body');
    if (!tbody) return;

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No se encontraron vehículos registrados</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map(v => {
      const isElectrico = v.tipo === 'FurgonetaElectrica';
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

    // Asociar eventos a botones
    tbody.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        const vehiculo = ListaVehiculos.BuscarPorId(id || '');
        if (vehiculo && this.onEditarCallback) {
          this.onEditarCallback(vehiculo);
        }
      });
    });

    tbody.querySelectorAll('.btn-eficiencia').forEach(btn => {
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
    modalBody.innerHTML = `<p class="text-center py-3">Calculando indicadores de eficiencia en el servidor...</p>`;

    try {
      const data = await ListaVehiculos.ObtenerEficiencia(id);
      if (modalTitle) modalTitle.textContent = `Eficiencia Operativa: ${data.placa}`;

      if (data.tipo === 'CamionCarga') {
        modalBody.innerHTML = `
          <div class="eficiencia-stat">
            <span class="eficiencia-label">Tipo de Vehículo:</span>
            <span class="eficiencia-val">Camión de Carga (Combustión)</span>
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
