import template from './VehiculoForm.html?raw';
import './VehiculoForm.css';
import { ListaVehiculos } from '../../Controlador/ControllersVehiculo';
import { IVehiculo, TipoVehiculo } from '../../Entidades/Vehiculo';

export class VehiculoForm {
  private vehiculoAEditar: IVehiculo | null = null;
  private onGuardadoCallback?: () => void;
  private onCancelarCallback?: () => void;

  constructor(handlers?: { onGuardado?: () => void; onCancelar?: () => void }) {
    this.onGuardadoCallback = handlers?.onGuardado;
    this.onCancelarCallback = handlers?.onCancelar;
  }

  setVehiculo(v: IVehiculo | null) {
    this.vehiculoAEditar = v;
  }

  render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    this.cargarDatosSiEdicion(container);
  }

  private bindEvents(container: HTMLElement) {
    const selectTipo = container.querySelector('#v-tipo') as HTMLSelectElement;
    const form = container.querySelector('#vehiculo-form') as HTMLFormElement;
    const btnCancelar = container.querySelector('#btn-cancelar-vehiculo');
    const inputImagen = container.querySelector('#v-imagen-url') as HTMLInputElement;

    selectTipo?.addEventListener('change', () => {
      this.toggleCamposTipo(container, selectTipo.value as TipoVehiculo);
    });

    btnCancelar?.addEventListener('click', () => {
      if (this.onCancelarCallback) this.onCancelarCallback();
    });

    // Vista previa en vivo del link de imagen
    inputImagen?.addEventListener('input', () => {
      this.actualizarPreviewImagen(container, inputImagen.value.trim());
    });

    // Botones de presets de imágenes sugeridas
    container.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = (e.currentTarget as HTMLElement).dataset.url || '';
        if (inputImagen) {
          inputImagen.value = url;
          this.actualizarPreviewImagen(container, url);
        }
      });
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.guardar(container);
    });
  }

  private actualizarPreviewImagen(container: HTMLElement, url: string) {
    const img = container.querySelector('#v-preview-img') as HTMLImageElement;
    const placeholder = container.querySelector('#v-preview-placeholder') as HTMLElement;

    if (!img || !placeholder) return;

    if (url) {
      img.src = url;
      img.onload = () => {
        img.style.display = 'block';
        placeholder.style.display = 'none';
      };
      img.onerror = () => {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
      };
    } else {
      img.src = '';
      img.style.display = 'none';
      placeholder.style.display = 'flex';
    }
  }

  private toggleCamposTipo(container: HTMLElement, tipo: TipoVehiculo) {
    const secCamion = container.querySelector('#seccion-camion') as HTMLElement;
    const secElectrica = container.querySelector('#seccion-electrica') as HTMLElement;

    if (tipo === 'CamionCarga') {
      secCamion.style.display = 'block';
      secElectrica.style.display = 'none';
    } else {
      secCamion.style.display = 'none';
      secElectrica.style.display = 'block';
    }
  }

  private cargarDatosSiEdicion(container: HTMLElement) {
    if (!this.vehiculoAEditar) {
      this.toggleCamposTipo(container, 'CamionCarga');
      return;
    }

    const v = this.vehiculoAEditar;
    const title = container.querySelector('#form-vehiculo-title');
    if (title) title.textContent = `Modificar Vehículo: ${v.placa}`;

    (container.querySelector('#v-id') as HTMLInputElement).value = v.id || '';
    (container.querySelector('#v-tipo') as HTMLSelectElement).value = v.tipo;
    (container.querySelector('#v-tipo') as HTMLSelectElement).disabled = true; // No cambiar tipo al editar
    (container.querySelector('#v-placa') as HTMLInputElement).value = v.placa;
    (container.querySelector('#v-marca') as HTMLInputElement).value = v.marca;
    (container.querySelector('#v-modelo') as HTMLInputElement).value = v.modelo;
    (container.querySelector('#v-anio') as HTMLInputElement).value = String(v.anio);
    (container.querySelector('#v-capacidad') as HTMLInputElement).value = String(v.capacidadCargaKg);
    (container.querySelector('#v-kilometraje') as HTMLInputElement).value = String(v.kilometraje);

    const inputImagen = container.querySelector('#v-imagen-url') as HTMLInputElement;
    if (inputImagen && v.imagenUrl) {
      inputImagen.value = v.imagenUrl;
      this.actualizarPreviewImagen(container, v.imagenUrl);
    }

    if (v.tipo === 'CamionCarga') {
      (container.querySelector('#v-consumo-litros') as HTMLInputElement).value = String(v.consumoLitros100Km || '');
      (container.querySelector('#v-precio-litro') as HTMLInputElement).value = String(v.precioLitro || '');
      (container.querySelector('#v-costo-mantenimiento') as HTMLInputElement).value = String(v.costoMantenimientoKm || '');
    } else {
      (container.querySelector('#v-capacidad-bateria') as HTMLInputElement).value = String(v.capacidadBateriaKWh || '');
      (container.querySelector('#v-consumo-kwh') as HTMLInputElement).value = String(v.consumoKWh100Km || '');
      (container.querySelector('#v-porcentaje-bateria') as HTMLInputElement).value = String(v.porcentajeBateria !== undefined ? v.porcentajeBateria : 100);
      (container.querySelector('#v-costo-kwh') as HTMLInputElement).value = String(v.costoKWh || 0.12);
    }

    this.toggleCamposTipo(container, v.tipo);
  }

  private async guardar(container: HTMLElement) {
    const alertBox = container.querySelector('#vehiculo-form-alert') as HTMLElement;
    alertBox.style.display = 'none';

    const id = (container.querySelector('#v-id') as HTMLInputElement).value;
    const tipo = (container.querySelector('#v-tipo') as HTMLSelectElement).value as TipoVehiculo;
    const placa = (container.querySelector('#v-placa') as HTMLInputElement).value.trim();
    const marca = (container.querySelector('#v-marca') as HTMLInputElement).value.trim();
    const modelo = (container.querySelector('#v-modelo') as HTMLInputElement).value.trim();
    const anio = Number((container.querySelector('#v-anio') as HTMLInputElement).value);
    const capacidadCargaKg = Number((container.querySelector('#v-capacidad') as HTMLInputElement).value);
    const kilometraje = Number((container.querySelector('#v-kilometraje') as HTMLInputElement).value);
    const imagenUrl = (container.querySelector('#v-imagen-url') as HTMLInputElement).value.trim();

    if (!placa || !marca || !modelo || !capacidadCargaKg) {
      this.mostrarAlerta(alertBox, 'Complete todos los campos obligatorios (*)', 'danger');
      return;
    }

    const payload: Partial<IVehiculo> = {
      tipo,
      placa,
      marca,
      modelo,
      anio,
      capacidadCargaKg,
      kilometraje,
      estado: this.vehiculoAEditar?.estado || 'Disponible',
      imagenUrl: imagenUrl || undefined,
    };

    if (tipo === 'CamionCarga') {
      payload.consumoLitros100Km = Number((container.querySelector('#v-consumo-litros') as HTMLInputElement).value);
      payload.precioLitro = Number((container.querySelector('#v-precio-litro') as HTMLInputElement).value);
      payload.costoMantenimientoKm = Number((container.querySelector('#v-costo-mantenimiento') as HTMLInputElement).value);

      if (payload.consumoLitros100Km <= 0 || payload.precioLitro <= 0) {
        this.mostrarAlerta(alertBox, 'El consumo y precio de combustible deben ser mayores a cero', 'danger');
        return;
      }
    } else {
      payload.capacidadBateriaKWh = Number((container.querySelector('#v-capacidad-bateria') as HTMLInputElement).value);
      payload.consumoKWh100Km = Number((container.querySelector('#v-consumo-kwh') as HTMLInputElement).value);
      payload.porcentajeBateria = Number((container.querySelector('#v-porcentaje-bateria') as HTMLInputElement).value);
      payload.costoKWh = Number((container.querySelector('#v-costo-kwh') as HTMLInputElement).value);

      if (payload.porcentajeBateria < 0 || payload.porcentajeBateria > 100) {
        this.mostrarAlerta(alertBox, 'El porcentaje de batería debe estar estrictamente entre 0% y 100%', 'danger');
        return;
      }
    }

    try {
      if (id) {
        await ListaVehiculos.ModificarVehiculo(id, payload);
      } else {
        await ListaVehiculos.AgregarVehiculo(payload as IVehiculo);
      }

      this.mostrarAlerta(alertBox, 'Vehículo guardado exitosamente', 'success');
      setTimeout(() => {
        if (this.onGuardadoCallback) this.onGuardadoCallback();
      }, 700);
    } catch (err: any) {
      this.mostrarAlerta(alertBox, err.message || 'Error al persistir vehículo en el servidor', 'danger');
    }
  }

  private mostrarAlerta(el: HTMLElement, mensaje: string, tipo: 'success' | 'danger') {
    el.style.display = 'block';
    el.className = `alert-box alert-${tipo}`;
    el.textContent = mensaje;
  }
}
