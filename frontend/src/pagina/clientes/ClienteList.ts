import template from './ClienteList.html?raw';
import { ListaClientes } from '../../Controlador/ControllersCliente';
import { ICliente } from '../../Entidades/Cliente';

export class ClienteList {
  private container: HTMLElement | null = null;
  private clientesOriginales: ICliente[] = [];
  private clientesFiltrados: ICliente[] = [];

  // Paginación
  private paginaActual: number = 1;
  private itemsPorPagina: number = 5;

  async render(container: HTMLElement) {
    this.container = container;
    this.container.innerHTML = template;

    this.bindEvents();
    await this.cargarClientes();
  }

  private bindEvents() {
    if (!this.container) return;

    // Búsqueda
    const searchInput = this.container.querySelector('#cliente-search') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const criterio = (e.target as HTMLInputElement).value;
      this.filtrar(criterio);
    });

    // Paginación
    const selectPageSize = this.container.querySelector('#clientes-page-size') as HTMLSelectElement;
    selectPageSize?.addEventListener('change', (e) => {
      this.itemsPorPagina = Number((e.target as HTMLSelectElement).value);
      this.paginaActual = 1;
      this.actualizarTabla();
    });

    const btnPrev = this.container.querySelector('#clientes-btn-prev') as HTMLButtonElement;
    btnPrev?.addEventListener('click', () => {
      if (this.paginaActual > 1) {
        this.paginaActual--;
        this.actualizarTabla();
      }
    });

    const btnNext = this.container.querySelector('#clientes-btn-next') as HTMLButtonElement;
    btnNext?.addEventListener('click', () => {
      const totalPaginas = Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina) || 1;
      if (this.paginaActual < totalPaginas) {
        this.paginaActual++;
        this.actualizarTabla();
      }
    });

    // Modal Crear Cliente
    const modal = this.container.querySelector('#modal-nuevo-cliente') as HTMLElement;
    const btnCrear = this.container.querySelector('#btn-crear-cliente') as HTMLButtonElement;
    const btnCerrar = this.container.querySelector('#btn-cerrar-modal-cliente') as HTMLButtonElement;
    const btnCancelar = this.container.querySelector('#btn-cancelar-modal-cliente') as HTMLButtonElement;
    const form = this.container.querySelector('#form-nuevo-cliente') as HTMLFormElement;

    btnCrear?.addEventListener('click', () => {
      form.reset();
      const alertBox = this.container?.querySelector('#alert-cliente-modal') as HTMLElement;
      if (alertBox) alertBox.style.display = 'none';
      if (modal) modal.style.display = 'flex';
    });

    const cerrarModal = () => {
      if (modal) modal.style.display = 'none';
    };

    btnCerrar?.addEventListener('click', cerrarModal);
    btnCancelar?.addEventListener('click', cerrarModal);

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.guardarNuevoCliente();
    });
  }

  private async cargarClientes() {
    try {
      this.clientesOriginales = await ListaClientes.CargarClientes();
      this.clientesFiltrados = [...this.clientesOriginales];
      this.paginaActual = 1;
      this.actualizarTabla();
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  }

  private filtrar(criterio: string) {
    if (!criterio.trim()) {
      this.clientesFiltrados = [...this.clientesOriginales];
    } else {
      const q = criterio.toLowerCase().trim();
      this.clientesFiltrados = this.clientesOriginales.filter(c =>
        c.identificacion.toLowerCase().includes(q) ||
        c.nombre.toLowerCase().includes(q) ||
        (c.correo && c.correo.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.toLowerCase().includes(q))
      );
    }
    this.paginaActual = 1;
    this.actualizarTabla();
  }

  private actualizarTabla() {
    if (!this.container) return;

    const tbody = this.container.querySelector('#clientes-table-body');
    if (!tbody) return;

    const total = this.clientesFiltrados.length;
    const totalPaginas = Math.ceil(total / this.itemsPorPagina) || 1;

    if (this.paginaActual > totalPaginas) this.paginaActual = totalPaginas;

    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = Math.min(inicio + this.itemsPorPagina, total);
    const clientesPagina = this.clientesFiltrados.slice(inicio, fin);

    if (total === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 25px; color: #64748b;">
            No se encontraron clientes registrados en PostgreSQL.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = clientesPagina.map(c => `
        <tr>
          <td style="font-family: monospace; font-weight: 600; color: #1e293b;">
            ${c.identificacion}
          </td>
          <td style="font-weight: 600; color: #2563eb;">
            ${c.nombre}
          </td>
          <td style="color: #475569;">
            ${c.correo || 'N/A'}
          </td>
          <td style="color: #475569;">
            ${c.telefono || 'N/A'}
          </td>
          <td>
            <span class="badge badge-info" style="font-size: 11px;">
              ● Habilitado
            </span>
          </td>
          <td>
            <span class="badge badge-success" style="font-size: 11px;">
              PostgreSQL (clientes)
            </span>
          </td>
        </tr>
      `).join('');
    }

    // Actualizar Controles de Paginación
    const elStart = this.container.querySelector('#clientes-page-start');
    const elEnd = this.container.querySelector('#clientes-page-end');
    const elTotal = this.container.querySelector('#clientes-total-count');
    const elCurrent = this.container.querySelector('#clientes-page-current');
    const btnPrev = this.container.querySelector('#clientes-btn-prev') as HTMLButtonElement;
    const btnNext = this.container.querySelector('#clientes-btn-next') as HTMLButtonElement;

    if (elStart) elStart.textContent = total > 0 ? String(inicio + 1) : '0';
    if (elEnd) elEnd.textContent = String(fin);
    if (elTotal) elTotal.textContent = String(total);
    if (elCurrent) elCurrent.textContent = `Pág. ${this.paginaActual} de ${totalPaginas}`;

    if (btnPrev) btnPrev.disabled = this.paginaActual <= 1;
    if (btnNext) btnNext.disabled = this.paginaActual >= totalPaginas;
  }

  private async guardarNuevoCliente() {
    if (!this.container) return;

    const alertBox = this.container.querySelector('#alert-cliente-modal') as HTMLElement;
    const identificacion = (this.container.querySelector('#cl-identificacion') as HTMLInputElement).value.trim();
    const nombre = (this.container.querySelector('#cl-nombre') as HTMLInputElement).value.trim();
    const correo = (this.container.querySelector('#cl-correo') as HTMLInputElement).value.trim();
    const telefono = (this.container.querySelector('#cl-telefono') as HTMLInputElement).value.trim();

    if (!identificacion || !nombre || !correo || !telefono) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.textContent = 'Por favor completa todos los campos requeridos (*).';
      }
      return;
    }

    try {
      await ListaClientes.AgregarCliente({
        id: '',
        identificacion,
        nombre,
        correo,
        telefono,
      });

      // Cerrar modal
      const modal = this.container.querySelector('#modal-nuevo-cliente') as HTMLElement;
      if (modal) modal.style.display = 'none';

      // Recargar lista desde backend
      await this.cargarClientes();
    } catch (err: any) {
      console.error('Error guardando cliente:', err);
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.textContent = err.message || 'Error al guardar cliente en PostgreSQL (verifica que la identificación no esté duplicada).';
      }
    }
  }
}
