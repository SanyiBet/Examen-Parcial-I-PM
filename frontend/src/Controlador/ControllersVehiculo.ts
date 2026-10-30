import { IVehiculo, CamionCarga, FurgonetaElectrica } from '../Entidades/Vehiculo';
import { ApiClient } from '../api';

export class ControllersVehiculo {
  Lista: IVehiculo[];

  constructor() {
    this.Lista = [];
  }

  async CargarVehiculos(): Promise<IVehiculo[]> {
    try {
      const data = await ApiClient.get<IVehiculo[]>('/vehiculos');
      this.Lista = data;
      return this.Lista;
    } catch (e) {
      console.error('Error cargando vehículos:', e);
      return this.Lista;
    }
  }

  async AgregarVehiculo(vehiculo: IVehiculo): Promise<IVehiculo> {
    const nuevo = await ApiClient.post<IVehiculo>('/vehiculos', vehiculo);
    this.Lista.unshift(nuevo);
    return nuevo;
  }

  async ModificarVehiculo(id: string, vehiculo: Partial<IVehiculo>): Promise<IVehiculo> {
    const modificado = await ApiClient.patch<IVehiculo>(`/vehiculos/${id}`, vehiculo);
    const index = this.Lista.findIndex(v => v.id === id);
    if (index !== -1) {
      this.Lista[index] = modificado;
    }
    return modificado;
  }

  BuscarPorPlaca(placa: string): IVehiculo | undefined {
    return this.Lista.find(v => v.placa.trim().toLowerCase() === placa.trim().toLowerCase());
  }

  BuscarPorId(id: string): IVehiculo | undefined {
    return this.Lista.find(v => v.id === id);
  }

  Buscar(criterio: string): IVehiculo[] {
    const q = criterio.toLowerCase().trim();
    if (!q) return this.Lista;
    return this.Lista.filter(v =>
      v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.tipo.toLowerCase().includes(q) ||
      v.estado.toLowerCase().includes(q)
    );
  }

  async ObtenerEficiencia(id: string): Promise<any> {
    return ApiClient.get(`/vehiculos/${id}/eficiencia`);
  }

  InstanciarEntidad(v: IVehiculo) {
    if (v.tipo === 'CamionCarga') {
      return new CamionCarga(v);
    } else {
      return new FurgonetaElectrica(v);
    }
  }
}

export const ListaVehiculos = new ControllersVehiculo();
