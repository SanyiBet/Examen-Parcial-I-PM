import { Persona } from '../Entidades/Persona';

export class ControllersPersona {
  Lista: Persona[];

  constructor() {
    this.Lista = [];
  }

  AgregarPersona(persona: Persona): void {
    this.Lista.push(persona);
  }

  ModificarPersona(index: number, persona: Persona): void {
    this.Lista[index] = persona;
  }

  EliminarPersona(index: number): void {
    this.Lista.splice(index, 1);
  }

  BuscarPorCedula(cedula: string): Persona | undefined {
    return this.Lista.find(p => p.Cedula.trim() === cedula.trim());
  }

  BuscarPorIndice(index: number): Persona | undefined {
    return this.Lista[index];
  }

  Buscar(criterio: string): Persona[] {
    const q = criterio.toLowerCase().trim();
    if (!q) return this.Lista;
    return this.Lista.filter(p =>
      p.Cedula.toLowerCase().includes(q) ||
      p.Nombres.toLowerCase().includes(q) ||
      p.Apellidos.toLowerCase().includes(q) ||
      p.Direccion.toLowerCase().includes(q) ||
      p.EstadoCivil.toLowerCase().includes(q) ||
      p.Sexo.toLowerCase().includes(q)
    );
  }
}

export const ListaPersonas = new ControllersPersona();

ListaPersonas.AgregarPersona(new Persona('0912345678', 'Carlos', 'Mendoza', new Date('1988-04-12'), 'Masculino', 'Casado', "Buenavista"));
ListaPersonas.AgregarPersona(new Persona('0923456789', 'Ana', 'Suarez', new Date('1992-09-25'), 'Femenino', 'Soltero', "Pasaje"));
ListaPersonas.AgregarPersona(new Persona('0934567890', 'Luis', 'Torres', new Date('1979-01-18'), 'Masculino', 'Union hechos', "Machala"));

console.table(ListaPersonas);
