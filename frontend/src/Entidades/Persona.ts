export type Sexo = 'Masculino' | 'Femenino' | 'Binario';
export type EstadoCivil = 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo' | 'Union hechos';

export class Persona {
  Cedula: string;
  Nombres: string;
  Apellidos: string;
  FechaNacimiento: Date;
  Sexo: Sexo;
  EstadoCivil: EstadoCivil;
  Direccion: string;

  constructor(ced: string, nom: string, ape: string, fn: Date, sex: Sexo, est: EstadoCivil, dir: string) {
    this.Cedula = ced;
    this.Nombres = nom;
    this.Apellidos = ape;
    this.FechaNacimiento = fn;
    this.Sexo = sex;
    this.EstadoCivil = est;
    this.Direccion = dir;
  }

  Edad(): number {
    const fechaActual = new Date();
    const fechaNacimiento = new Date(this.FechaNacimiento);
    let edad = fechaActual.getFullYear() - fechaNacimiento.getFullYear();
    const m = fechaActual.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && fechaActual.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad < 0 ? 0 : edad;
  }

  EdadCompleta(): string {
    const fechaActual = new Date();
    const fechaNacimiento = new Date(this.FechaNacimiento);
    let edad = fechaActual.getFullYear() - fechaNacimiento.getFullYear();
    let meses = fechaActual.getMonth() - fechaNacimiento.getMonth();
    if (meses < 0) {
      edad--;
      meses += 12;
    }
    if (fechaActual.getDate() < fechaNacimiento.getDate()) {
      meses--;
      if (meses < 0) {
        edad--;
        meses += 12;
      }
    }
    return `Edad: ${edad} años, ${meses} meses`;
  }

  ImprimirPersona(): string {
    return `Persona: ${this.Nombres} ${this.Apellidos}, Edad: ${this.Edad()}, Sexo: ${this.Sexo}, Estado Civil: ${this.EstadoCivil}`;
  }
}
