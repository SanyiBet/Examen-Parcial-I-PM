import { ICliente } from '../Entidades/Cliente';
import { ApiClient } from '../api';

export class ControllersCliente {
  Lista: ICliente[];

  constructor() {
    this.Lista = [];
  }

  async CargarClientes(): Promise<ICliente[]> {
    try {
      const data = await ApiClient.get<ICliente[]>('/clientes');
      this.Lista = data;
      return this.Lista;
    } catch (e) {
      console.error('Error cargando clientes:', e);
      return this.Lista;
    }
  }

  async AgregarCliente(cliente: ICliente): Promise<ICliente> {
    const nuevo = await ApiClient.post<ICliente>('/clientes', cliente);
    this.Lista.push(nuevo);
    return nuevo;
  }

  BuscarPorCedula(identificacion: string): ICliente | undefined {
    return this.Lista.find(c => c.identificacion.trim() === identificacion.trim());
  }

  BuscarPorId(id: string): ICliente | undefined {
    return this.Lista.find(c => c.id === id);
  }

  Buscar(criterio: string): ICliente[] {
    const q = criterio.toLowerCase().trim();
    if (!q) return this.Lista;
    return this.Lista.filter(c =>
      c.identificacion.toLowerCase().includes(q) ||
      c.nombre.toLowerCase().includes(q) ||
      c.correo.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q)
    );
  }
}

export const ListaClientes = new ControllersCliente();
