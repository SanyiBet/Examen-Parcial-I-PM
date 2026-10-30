import template from './PersonaList.html?raw';
import './PersonaList.css';
import { ListaPersonas } from '../../Controlador/ControllersPersona';
import { Persona } from '../../Entidades/Persona';

export class PersonaList {
  private onCrearCallback?: () => void;
  private onEditarCallback?: (p: Persona, index: number) => void;

  private currentPage = 1;
  private pageSize = 5;
  private listaFiltrada: Persona[] = [];

  constructor(handlers?: { onCrear?: () => void; onEditar?: (p: Persona, index: number) => void }) {
    this.onCrearCallback = handlers?.onCrear;
    this.onEditarCallback = handlers?.onEditar;
  }

  render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    this.listaFiltrada = [...ListaPersonas.Lista];
    this.currentPage = 1;
    this.renderPaginaActual(container);
  }

  private bindEvents(container: HTMLElement) {
    const btnCrear = container.querySelector('#btn-crear-persona');
    const inputSearch = container.querySelector('#persona-search') as HTMLInputElement;

    const btnPrev = container.querySelector('#personas-btn-prev');
    const btnNext = container.querySelector('#personas-btn-next');
    const selectPageSize = container.querySelector('#personas-page-size') as HTMLSelectElement;

    btnCrear?.addEventListener('click', () => {
      if (this.onCrearCallback) this.onCrearCallback();
    });

    // Paginación eventos
    btnPrev?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderPaginaActual(container);
      }
    });

    btnNext?.addEventListener('click', () => {
      const totalPages = Math.ceil(this.listaFiltrada.length / this.pageSize) || 1;
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderPaginaActual(container);
      }
    });

    selectPageSize?.addEventListener('change', () => {
      this.pageSize = Number(selectPageSize.value) || 5;
      this.currentPage = 1;
      this.renderPaginaActual(container);
    });

    inputSearch?.addEventListener('input', () => {
      const q = inputSearch.value;
      this.listaFiltrada = ListaPersonas.Buscar(q);
      this.currentPage = 1;
      this.renderPaginaActual(container);
    });
  }

  private renderPaginaActual(container: HTMLElement) {
    const total = this.listaFiltrada.length;
    const totalPages = Math.ceil(total / this.pageSize) || 1;

    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIdx = total === 0 ? 0 : (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, total);
    const pagedItems = this.listaFiltrada.slice(startIdx, endIdx);

    // Actualizar barra de paginación
    const pageStartEl = container.querySelector('#personas-page-start');
    const pageEndEl = container.querySelector('#personas-page-end');
    const totalCountEl = container.querySelector('#personas-total-count');
    const pageCurrentEl = container.querySelector('#personas-page-current');
    const btnPrev = container.querySelector('#personas-btn-prev') as HTMLButtonElement;
    const btnNext = container.querySelector('#personas-btn-next') as HTMLButtonElement;

    if (pageStartEl) pageStartEl.textContent = String(total === 0 ? 0 : startIdx + 1);
    if (pageEndEl) pageEndEl.textContent = String(endIdx);
    if (totalCountEl) totalCountEl.textContent = String(total);
    if (pageCurrentEl) pageCurrentEl.textContent = `Pág. ${this.currentPage} de ${totalPages}`;
    if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
    if (btnNext) btnNext.disabled = this.currentPage >= totalPages;

    this.renderFilas(container, pagedItems);
  }

  private renderFilas(container: HTMLElement, lista: Persona[]) {
    const tbody = container.querySelector('#personas-table-body');
    if (!tbody) return;

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No hay personas registradas</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map((p, index) => {
      return `
        <tr>
          <td><strong style="color: #2563eb;">${p.Cedula}</strong></td>
          <td><strong>${p.Nombres} ${p.Apellidos}</strong></td>
          <td>${p.Edad()} años</td>
          <td>${p.EdadCompleta()}</td>
          <td><span class="badge badge-info">${p.Sexo}</span></td>
          <td><span class="badge badge-secondary">${p.EstadoCivil}</span></td>
          <td>${p.Direccion}</td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm btn-secondary btn-editar-persona" data-index="${index}">✏️ Editar</button>
              <button class="btn btn-sm btn-danger btn-eliminar-persona" data-index="${index}">🗑️ Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-editar-persona').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).dataset.index);
        const p = ListaPersonas.BuscarPorIndice(idx);
        if (p && this.onEditarCallback) {
          this.onEditarCallback(p, idx);
        }
      });
    });

    tbody.querySelectorAll('.btn-eliminar-persona').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).dataset.index);
        if (confirm('¿Está seguro de eliminar este registro?')) {
          ListaPersonas.EliminarPersona(idx);
          console.table(ListaPersonas.Lista);
          this.listaFiltrada = [...ListaPersonas.Lista];
          this.renderPaginaActual(container);
        }
      });
    });
  }
}
