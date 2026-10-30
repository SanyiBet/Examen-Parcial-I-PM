import template from './PersonaList.html?raw';
import './PersonaList.css';
import { ListaPersonas } from '../../Controlador/ControllersPersona';
import { Persona } from '../../Entidades/Persona';

export class PersonaList {
  private onCrearCallback?: () => void;
  private onEditarCallback?: (p: Persona, index: number) => void;

  constructor(handlers?: { onCrear?: () => void; onEditar?: (p: Persona, index: number) => void }) {
    this.onCrearCallback = handlers?.onCrear;
    this.onEditarCallback = handlers?.onEditar;
  }

  render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    this.renderFilas(container, ListaPersonas.Lista);
  }

  private bindEvents(container: HTMLElement) {
    const btnCrear = container.querySelector('#btn-crear-persona');
    const inputSearch = container.querySelector('#persona-search') as HTMLInputElement;

    btnCrear?.addEventListener('click', () => {
      if (this.onCrearCallback) this.onCrearCallback();
    });

    inputSearch?.addEventListener('input', () => {
      const q = inputSearch.value;
      const filtradas = ListaPersonas.Buscar(q);
      this.renderFilas(container, filtradas);
    });
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
          this.renderFilas(container, ListaPersonas.Lista);
        }
      });
    });
  }
}
