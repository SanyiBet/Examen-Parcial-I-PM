export interface ICliente {
  id?: string;
  identificacion: string;
  nombre: string;
  correo: string;
  telefono: string;
}

export class Cliente implements ICliente {
  id?: string;
  identificacion: string;
  nombre: string;
  correo: string;
  telefono: string;

  constructor(identificacion: string, nombre: string, correo: string, telefono: string, id?: string) {
    this.identificacion = identificacion;
    this.nombre = nombre;
    this.correo = correo;
    this.telefono = telefono;
    this.id = id;
  }
}
