import { IVehiculo } from './Vehiculo';
import { ICliente } from './Cliente';

export type EstadoServicio = 'Programado' | 'En ejecucion' | 'Completado' | 'Cancelado';

export interface IServicioTransporte {
  id?: string;
  codigo: string;
  clienteId: string;
  vehiculoId: string;
  origen: string;
  destino: string;
  distanciaKm: number;
  pesoCargaKg: number;
  fecha: string;
  horaInicio: string;
  horaFinEstimada: string;
  estado: EstadoServicio;
  recargaPlanificada: boolean;
  costoOperativo: number;
  tarifaCalculada: number;
  recargoAplicado?: number;
  facturado?: boolean;
  cliente?: ICliente;
  vehiculo?: IVehiculo;
}

export class ServicioTransporte implements IServicioTransporte {
  id?: string;
  codigo: string;
  clienteId: string;
  vehiculoId: string;
  origen: string;
  destino: string;
  distanciaKm: number;
  pesoCargaKg: number;
  fecha: string;
  horaInicio: string;
  horaFinEstimada: string;
  estado: EstadoServicio;
  recargaPlanificada: boolean;
  costoOperativo: number;
  tarifaCalculada: number;
  recargoAplicado?: number;
  facturado?: boolean;
  cliente?: ICliente;
  vehiculo?: IVehiculo;

  constructor(data: Partial<IServicioTransporte>) {
    this.id = data.id;
    this.codigo = data.codigo || '';
    this.clienteId = data.clienteId || '';
    this.vehiculoId = data.vehiculoId || '';
    this.origen = data.origen || '';
    this.destino = data.destino || '';
    this.distanciaKm = data.distanciaKm || 0;
    this.pesoCargaKg = data.pesoCargaKg || 0;
    this.fecha = data.fecha || new Date().toISOString().split('T')[0];
    this.horaInicio = data.horaInicio || '08:00';
    this.horaFinEstimada = data.horaFinEstimada || '10:00';
    this.estado = data.estado || 'Programado';
    this.recargaPlanificada = !!data.recargaPlanificada;
    this.costoOperativo = data.costoOperativo || 0;
    this.tarifaCalculada = data.tarifaCalculada || 0;
    this.recargoAplicado = data.recargoAplicado || 0;
    this.facturado = !!data.facturado;
    this.cliente = data.cliente;
    this.vehiculo = data.vehiculo;
  }
}
