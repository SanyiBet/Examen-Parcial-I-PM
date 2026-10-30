import template from './PersonaForm.html?raw';
import './PersonaForm.css';
import { ListaPersonas } from '../../Controlador/ControllersPersona';
import { ListaClientes } from '../../Controlador/ControllersCliente';
import { Persona, Sexo, EstadoCivil } from '../../Entidades/Persona';

export class PersonaForm {
  private personaAEditar: Persona | null = null;
  private editIndex: number = -1;
  private onGuardadoCallback?: () => void;
  private onCancelarCallback?: () => void;

  constructor(handlers?: { onGuardado?: () => void; onCancelar?: () => void }) {
    this.onGuardadoCallback = handlers?.onGuardado;
    this.onCancelarCallback = handlers?.onCancelar;
  }

  setPersona(p: Persona | null, index: number = -1) {
    this.personaAEditar = p;
    this.editIndex = index;
  }

  render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
    this.cargarDatosSiEdicion(container);
  }

  private bindEvents(container: HTMLElement) {
    const form = container.querySelector('#persona-form') as HTMLFormElement;
    const btnCancelar = container.querySelector('#btn-cancelar-persona');

    btnCancelar?.addEventListener('click', () => {
      if (this.onCancelarCallback) this.onCancelarCallback();
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.guardar(container);
    });
  }

  private cargarDatosSiEdicion(container: HTMLElement) {
    if (!this.personaAEditar || this.editIndex === -1) {
      (container.querySelector('#p-fecha-nac') as HTMLInputElement).value = '1995-05-15';
      return;
    }

    const p = this.personaAEditar;
    (container.querySelector('#form-persona-title') as HTMLElement).textContent = `Modificar Persona: ${p.Nombres} ${p.Apellidos}`;
    (container.querySelector('#p-index') as HTMLInputElement).value = String(this.editIndex);
    (container.querySelector('#p-cedula') as HTMLInputElement).value = p.Cedula;
    (container.querySelector('#p-nombres') as HTMLInputElement).value = p.Nombres;
    (container.querySelector('#p-apellidos') as HTMLInputElement).value = p.Apellidos;

    const fechaStr = new Date(p.FechaNacimiento).toISOString().split('T')[0];
    (container.querySelector('#p-fecha-nac') as HTMLInputElement).value = fechaStr;

    (container.querySelector('#p-sexo') as HTMLSelectElement).value = p.Sexo;
    (container.querySelector('#p-estado-civil') as HTMLSelectElement).value = p.EstadoCivil;
    (container.querySelector('#p-direccion') as HTMLInputElement).value = p.Direccion;
  }

  private guardar(container: HTMLElement) {
    const alertBox = container.querySelector('#persona-form-alert') as HTMLElement;
    alertBox.style.display = 'none';

    const index = Number((container.querySelector('#p-index') as HTMLInputElement).value);
    const cedula = (container.querySelector('#p-cedula') as HTMLInputElement).value.trim();
    const nombres = (container.querySelector('#p-nombres') as HTMLInputElement).value.trim();
    const apellidos = (container.querySelector('#p-apellidos') as HTMLInputElement).value.trim();
    const fechaNac = new Date((container.querySelector('#p-fecha-nac') as HTMLInputElement).value);
    const sexo = (container.querySelector('#p-sexo') as HTMLSelectElement).value as Sexo;
    const estadoCivil = (container.querySelector('#p-estado-civil') as HTMLSelectElement).value as EstadoCivil;
    const direccion = (container.querySelector('#p-direccion') as HTMLInputElement).value.trim();

    if (!cedula || !nombres || !apellidos || !direccion) {
      alertBox.style.display = 'block';
      alertBox.className = 'alert-box alert-danger';
      alertBox.textContent = 'Por favor complete todos los campos obligatorios (*)';
      return;
    }

    const persona = new Persona(cedula, nombres, apellidos, fechaNac, sexo, estadoCivil, direccion);

    if (index >= 0) {
      ListaPersonas.ModificarPersona(index, persona);
    } else {
      ListaPersonas.AgregarPersona(persona);
    }

    // Sincronización automática con la tabla clientes de PostgreSQL
    const syncCliente = (container.querySelector('#p-sincronizar-cliente') as HTMLInputElement)?.checked;
    if (syncCliente) {
      ListaClientes.AgregarCliente({
        id: '',
        identificacion: cedula,
        nombre: `${nombres} ${apellidos}`,
        correo: `${nombres.toLowerCase().replace(/\s+/g, '')}@translogic.com`,
        telefono: '0991234567',
      }).catch(err => {
        console.warn('Nota: Ya registrado en PostgreSQL o aviso de unicidad:', err);
      });
    }

    console.log(persona.ImprimirPersona());
    console.table(ListaPersonas.Lista);

    alertBox.style.display = 'block';
    alertBox.className = 'alert-box alert-success';
    alertBox.textContent = syncCliente 
      ? 'Persona guardada y registrada en PostgreSQL (tabla clientes)' 
      : 'Persona guardada exitosamente';

    setTimeout(() => {
      if (this.onGuardadoCallback) this.onGuardadoCallback();
    }, 700);
  }
}
