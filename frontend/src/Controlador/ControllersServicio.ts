import { IServicioTransporte, EstadoServicio } from '../Entidades/ServicioTransporte';
import { ApiClient } from '../api';

export class ControllersServicio {
  Lista: IServicioTransporte[];

  constructor() {
    this.Lista = [];
  }

  async CargarServicios(query?: { estado?: string; clienteId?: string; vehiculoId?: string; page?: number; limit?: number }): Promise<IServicioTransporte[]> {
    try {
      const params = new URLSearchParams();
      if (query?.estado) params.append('estado', query.estado);
      if (query?.clienteId) params.append('clienteId', query.clienteId);
      if (query?.vehiculoId) params.append('vehiculoId', query.vehiculoId);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());

      const url = `/servicios${params.toString() ? '?' + params.toString() : ''}`;
      const data = await ApiClient.get<{ items: IServicioTransporte[]; total: number } | IServicioTransporte[]>(url);
      
      if (Array.isArray(data)) {
        this.Lista = data;
      } else if (data && data.items) {
        this.Lista = data.items;
      }
      return this.Lista;
    } catch (e) {
      console.error('Error cargando servicios:', e);
      return this.Lista;
    }
  }

  async RegistrarServicio(servicio: Partial<IServicioTransporte>): Promise<IServicioTransporte> {
    const nuevo = await ApiClient.post<IServicioTransporte>('/servicios', servicio);
    this.Lista.unshift(nuevo);
    return nuevo;
  }

  async AsignarVehiculo(id: string, vehiculoId: string): Promise<IServicioTransporte> {
    const actualizado = await ApiClient.patch<IServicioTransporte>(`/servicios/${id}/asignacion`, { vehiculoId });
    const index = this.Lista.findIndex(s => s.id === id);
    if (index !== -1) {
      this.Lista[index] = actualizado;
    }
    return actualizado;
  }

  async ActualizarEstado(id: string, nuevoEstado: EstadoServicio): Promise<IServicioTransporte> {
    const actualizado = await ApiClient.patch<IServicioTransporte>(`/servicios/${id}/estado`, { nuevoEstado });
    const index = this.Lista.findIndex(s => s.id === id);
    if (index !== -1) {
      this.Lista[index] = actualizado;
    }
    return actualizado;
  }

  async SimularTarifa(datos: {
    vehiculoId: string;
    distanciaKm: number;
    pesoCargaKg: number;
    recargaPlanificada?: boolean;
    fecha?: string;
  }): Promise<{
    costoOperativo: number;
    tarifaBase: number;
    recargoCargaAutonomia: number;
    recargoDistancia: number;
    recargoDomingo: number;
    totalTarifa: number;
    esDomingo: boolean;
    valido: boolean;
    mensaje?: string;
  }> {
    return ApiClient.post('/servicios/simular-tarifa', datos);
  }

  BuscarPorCodigo(codigo: string): IServicioTransporte | undefined {
    return this.Lista.find(s => s.codigo.trim().toLowerCase() === codigo.trim().toLowerCase());
  }

  Buscar(criterio: string): IServicioTransporte[] {
    const q = criterio.toLowerCase().trim();
    if (!q) return this.Lista;
    return this.Lista.filter(s =>
      s.codigo.toLowerCase().includes(q) ||
      s.origen.toLowerCase().includes(q) ||
      s.destino.toLowerCase().includes(q) ||
      s.estado.toLowerCase().includes(q) ||
      (s.cliente && s.cliente.nombre.toLowerCase().includes(q)) ||
      (s.vehiculo && s.vehiculo.placa.toLowerCase().includes(q))
    );
  }
}

export const ListaServicios = new ControllersServicio();
