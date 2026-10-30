import { IFactura } from '../Entidades/Factura';
import { ApiClient } from '../api';
import { jsPDF } from 'jspdf';

export class ControllersFactura {
  Lista: IFactura[];

  constructor() {
    this.Lista = [];
  }

  async CargarFacturas(): Promise<IFactura[]> {
    try {
      const data = await ApiClient.get<IFactura[]>('/facturas');
      this.Lista = data;
      return this.Lista;
    } catch (e) {
      console.error('Error cargando facturas:', e);
      return this.Lista;
    }
  }

  async GenerarFactura(clienteId: string, servicioIds: string[]): Promise<IFactura> {
    const nueva = await ApiClient.post<IFactura>('/facturas', {
      clienteId,
      servicioIds
    });
    this.Lista.unshift(nueva);
    return nueva;
  }

  async ConsultarFactura(id: string): Promise<IFactura> {
    return ApiClient.get<IFactura>(`/facturas/${id}`);
  }

  Buscar(criterio: string): IFactura[] {
    const q = criterio.toLowerCase().trim();
    if (!q) return this.Lista;
    return this.Lista.filter(f =>
      f.codigo.toLowerCase().includes(q) ||
      (f.cliente && f.cliente.nombre.toLowerCase().includes(q)) ||
      (f.cliente && f.cliente.identificacion.toLowerCase().includes(q))
    );
  }

  GenerarPDFSimulado(factura: IFactura): void {
    const doc = new jsPDF();

    // Estilos claros y profesionales
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('TRANSLOGIC S.A.', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Sistema Inteligente de Gestión de Flotas y Facturación', 14, 27);
    doc.text('*** COMPROBANTE SIMULADO - SIN VALIDEZ TRIBUTARIA ANTE EL SRI ***', 14, 34);

    // Datos Factura
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Factura N°: ${factura.codigo}`, 14, 50);
    doc.text(`Fecha: ${factura.fecha}`, 14, 57);

    // Datos Cliente
    doc.text('DATOS DEL CLIENTE:', 14, 70);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Razón Social: ${factura.cliente?.nombre || 'Consumidor Final'}`, 14, 77);
    doc.text(`RUC/CI: ${factura.cliente?.identificacion || '9999999999'}`, 14, 84);
    doc.text(`Correo: ${factura.cliente?.correo || 'N/A'}`, 14, 91);
    doc.text(`Teléfono: ${factura.cliente?.telefono || 'N/A'}`, 14, 98);

    // Tabla de Servicios
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('SERVICIOS COMPLETADOS INCLUIDOS:', 14, 110);

    let y = 118;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('Código Servicio', 16, y);
    doc.text('Ruta (Origen -> Destino)', 55, y);
    doc.text('Tarifa Base ($)', 130, y);
    doc.text('Recargos ($)', 165, y);

    y += 8;
    factura.detalles?.forEach((d) => {
      const ruta = d.servicio ? `${d.servicio.origen} → ${d.servicio.destino}` : 'Servicio ejecutado';
      const cod = d.servicio ? d.servicio.codigo : (d.servicioId || 'SRV');
      doc.text(cod, 16, y);
      doc.text(ruta.substring(0, 35), 55, y);
      doc.text(`$${Number(d.tarifa).toFixed(2)}`, 130, y);
      doc.text(`$${Number(d.recargos).toFixed(2)}`, 165, y);
      y += 7;
    });

    // Desglose Financiero
    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Subtotal Servicios:`, 120, y);
    doc.text(`$${Number(factura.subtotal).toFixed(2)}`, 175, y);
    y += 6;

    doc.text(`Recargos (+300km / Domingo):`, 120, y);
    doc.text(`$${Number(factura.recargos).toFixed(2)}`, 175, y);
    y += 6;

    doc.text(`Descuento Cliente (${factura.porcentajeDescuento}%):`, 120, y);
    doc.text(`-$${Number(factura.descuento).toFixed(2)}`, 175, y);
    y += 6;

    doc.text(`Impuesto (${factura.porcentajeImpuesto}%):`, 120, y);
    doc.text(`+$${Number(factura.impuesto).toFixed(2)}`, 175, y);
    y += 8;

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL FACTURADO:`, 120, y);
    doc.text(`$${Number(factura.total).toFixed(2)}`, 175, y);

    doc.save(`Factura_${factura.codigo}.pdf`);
  }
}

export const ListaFacturas = new ControllersFactura();
