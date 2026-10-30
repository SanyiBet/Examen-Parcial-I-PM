import { IFactura } from '../Entidades/Factura';
import { ApiClient } from '../api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 182mm

    // ==========================================
    // 1. CABECERA: MEMBRETE Y DATOS DE EMPRESA
    // ==========================================
    // Logo / Monograma TRANSLOGIC
    doc.setFillColor(37, 99, 235); // Azul Primario #2563eb
    doc.roundedRect(margin, 12, 16, 16, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('TL', margin + 8, 22.5, { align: 'center' });

    // Nombre de la Empresa
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('TRANSLOGIC S.A.', margin + 20, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text('Transporte Pesado y Flota Eléctrica', margin + 20, 23);
    doc.text('RUC: 1792847592001', margin + 20, 27);
    doc.text('Matriz: Av. Amazonas y República, Quito', margin + 20, 31);
    doc.text('Tel: (02) 298-7654  |  facturas@translogic.com', margin + 20, 35);

    // ==========================================
    // 2. RECUADRO DERECHO: FACTURA ELECTRÓNICA
    // ==========================================
    const boxX = 126;
    const boxY = 12;
    const boxWidth = 70;
    const boxHeight = 28;

    doc.setFillColor(248, 250, 252); // Fondo suave
    doc.setDrawColor(203, 213, 225); // Borde
    doc.setLineWidth(0.4);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138); // Azul oscuro
    doc.text('FACTURA ELECTRÓNICA', boxX + (boxWidth / 2), boxY + 6.5, { align: 'center' });

    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`N° ${factura.codigo}`, boxX + (boxWidth / 2), boxY + 12.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha Emisión: ${factura.fecha}`, boxX + 6, boxY + 18);
    doc.text('Ambiente: PRODUCCIÓN (SIMULADO)', boxX + 6, boxY + 22);
    doc.text('Emisión: NORMAL', boxX + 6, boxY + 25.5);

    // Leyenda regulatoria de advertencia académica
    doc.setFillColor(254, 242, 242); // Fondo rojo muy suave #fef2f2
    doc.setDrawColor(254, 202, 202); // Borde rojo claro
    doc.roundedRect(margin, 43, contentWidth, 7, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28); // Rojo texto
    doc.text('*** COMPROBANTE SIMULADO - SIN VALIDEZ TRIBUTARIA ANTE EL SRI (REQ-04) ***', margin + (contentWidth / 2), 47.5, { align: 'center' });

    // ==========================================
    // 3. SECCIÓN: INFORMACIÓN DEL CLIENTE
    // ==========================================
    const clientY = 54;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, clientY, contentWidth, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('DATOS DEL RECEPTOR / CLIENTE', margin + 5, clientY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    // Columna 1
    doc.text('Razón Social:', margin + 5, clientY + 11.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(factura.cliente?.nombre || 'Consumidor Final', margin + 32, clientY + 11.5, { maxWidth: 58 });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('RUC / ID:', margin + 5, clientY + 17.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(factura.cliente?.identificacion || '9999999999999', margin + 32, clientY + 17.5, { maxWidth: 58 });

    // Columna 2
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Correo:', margin + 96, clientY + 11.5);
    doc.setTextColor(15, 23, 42);
    doc.text(factura.cliente?.correo || 'contacto@empresa.com', margin + 114, clientY + 11.5, { maxWidth: 64 });

    doc.setTextColor(71, 85, 105);
    doc.text('Teléfono:', margin + 96, clientY + 17.5);
    doc.setTextColor(15, 23, 42);
    doc.text(factura.cliente?.telefono || '0991234567', margin + 114, clientY + 17.5, { maxWidth: 64 });

    // ==========================================
    // 4. TABLA DE SERVICIOS COMPLETADOS (CON AUTOTABLE)
    // ==========================================
    const tableBody = (factura.detalles || []).map((d) => {
      const s = d.servicio;
      const cod = s?.codigo || d.servicioId?.substring(0, 8) || 'SRV-001';
      const ruta = s 
        ? `${s.origen} a ${s.destino}\n(${s.distanciaKm} km  |  ${Number(s.pesoCargaKg).toLocaleString()} kg)` 
        : 'Servicio de Carga Liquidado';
      const vehiculo = s?.vehiculo 
        ? `${s.vehiculo.placa}\n${s.vehiculo.marca} ${s.vehiculo.modelo}` 
        : 'Flota Asignada';
      const tarifa = `$${Number(d.tarifa).toFixed(2)}`;
      const recargo = `$${Number(d.recargos).toFixed(2)}`;

      return [cod, ruta, vehiculo, tarifa, recargo];
    });

    autoTable(doc, {
      startY: 83,
      head: [['CÓDIGO', 'DESCRIPCIÓN DE LA RUTA Y TRANSPORTE', 'VEHÍCULO ASIGNADO', 'TARIFA BASE', 'RECARGOS']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Slate-800
        textColor: [255, 255, 255],
        fontSize: 7.8,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85],
        cellPadding: 2.5,
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold', textColor: [37, 99, 235] },
        1: { cellWidth: 70 },
        2: { cellWidth: 36 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
      },
      styles: {
        overflow: 'linebreak',
        valign: 'middle',
      },
      margin: { left: margin, right: margin },
    });

    // ==========================================
    // 5. SECCIÓN INFERIOR: REGLAS Y TOTALES
    // ==========================================
    const afterTableY = ((doc as any).lastAutoTable?.finalY || 130) + 6;

    // Caja izquierda: Observaciones y reglas de negocio aplicadas
    const notesX = margin;
    const notesW = 90;
    const notesH = 41;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(notesX, afterTableY, notesW, notesH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('INFORMACIÓN DE REGLAS DE NEGOCIO (REQ-04):', notesX + 4, afterTableY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);

    const rules = [
      '• Recargos: +6% si trayecto >300 km | +12% si domingo.',
      `• Descuento por Volumen: ${factura.porcentajeDescuento}% al consolidado.`,
      '  (3-5 servicios: 5% desc. | 6+ servicios: 10% desc.)',
      `• Impuesto IVA: ${factura.porcentajeImpuesto}% según normativa legal SRI.`,
      '• Transacción: Registro atómico en PostgreSQL.',
      '• Forma de Pago: Transferencia Bancaria (15 días).',
    ];

    let currentRuleY = afterTableY + 11.5;
    rules.forEach((rule) => {
      doc.text(rule, notesX + 4, currentRuleY, { maxWidth: 82 });
      currentRuleY += 5;
    });

    // Caja derecha: Desglose exacto de importes usando autoTable (sin colisiones)
    autoTable(doc, {
      startY: afterTableY,
      margin: { left: 108, right: margin },
      body: [
        ['Subtotal Servicios:', { content: `$${Number(factura.subtotal).toFixed(2)}`, styles: { halign: 'right' } }],
        ['Recargos (+300km/Dom):', { content: `+$${Number(factura.recargos).toFixed(2)}`, styles: { halign: 'right' } }],
        [`Descuento Cliente (${factura.porcentajeDescuento}%):`, { content: `-$${Number(factura.descuento).toFixed(2)}`, styles: { halign: 'right', textColor: [4, 120, 87], fontStyle: 'bold' } }],
        [`Impuesto IVA (${factura.porcentajeImpuesto}%):`, { content: `+$${Number(factura.impuesto).toFixed(2)}`, styles: { halign: 'right' } }],
        [
          { content: 'TOTAL A PAGAR:', styles: { fontStyle: 'bold', fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 8.5 } },
          { content: `$${Number(factura.total).toFixed(2)} USD`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 9 } }
        ],
      ],
      theme: 'plain',
      styles: {
        fontSize: 7.8,
        cellPadding: 1.8,
        textColor: [71, 85, 105],
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 38 },
      },
    });

    // ==========================================
    // 6. PIE DE PÁGINA: AUTORIZACIÓN Y FIRMA
    // ==========================================
    const footerY = 270;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY, margin + contentWidth, footerY);

    // Clave de acceso simulada
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const claveSimulada = `30102026011792847592001200100100000${factura.codigo.replace(/\D/g, '') || '1042'}1234567819`;
    doc.text(`CLAVE DE ACCESO SIMULADA: ${claveSimulada}`, margin, footerY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Generado automáticamente por el Sistema Integrado de Flotas TRANSLOGIC S.A. - Desarrollado con NestJS & Vite', margin, footerY + 10);
    doc.text('Página 1 de 1', margin + contentWidth, footerY + 10, { align: 'right' });

    doc.save(`Factura_${factura.codigo}.pdf`);
  }
}

export const ListaFacturas = new ControllersFactura();
