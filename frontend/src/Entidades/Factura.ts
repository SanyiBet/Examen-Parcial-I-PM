import { ICliente } from './Cliente';
import { IServicioTransporte } from './ServicioTransporte';

export interface IDetalleFactura {
  id?: string;
  facturaId?: string;
  servicioId: string;
  tarifa: number;
  recargos: number;
  servicio?: IServicioTransporte;
}

export interface IFactura {
  id?: string;
  codigo: string;
  clienteId: string;
  fecha: string;
  subtotal: number;
  recargos: number;
  descuento: number;
  porcentajeDescuento: number;
  impuesto: number;
  porcentajeImpuesto: number;
  total: number;
  cliente?: ICliente;
  detalles: IDetalleFactura[];
}

export class Factura implements IFactura {
  id?: string;
  codigo: string;
  clienteId: string;
  fecha: string;
  subtotal: number;
  recargos: number;
  descuento: number;
  porcentajeDescuento: number;
  impuesto: number;
  porcentajeImpuesto: number;
  total: number;
  cliente?: ICliente;
  detalles: IDetalleFactura[];

  constructor(data: Partial<IFactura>) {
    this.id = data.id;
    this.codigo = data.codigo || '';
    this.clienteId = data.clienteId || '';
    this.fecha = data.fecha || new Date().toISOString().split('T')[0];
    this.subtotal = data.subtotal || 0;
    this.recargos = data.recargos || 0;
    this.descuento = data.descuento || 0;
    this.porcentajeDescuento = data.porcentajeDescuento || 0;
    this.impuesto = data.impuesto || 0;
    this.porcentajeImpuesto = data.porcentajeImpuesto || 15;
    this.total = data.total || 0;
    this.cliente = data.cliente;
    this.detalles = data.detalles || [];
  }
}
