export type RolUsuario = 'Administrador' | 'Operador';

export interface IUsuario {
  id?: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  token?: string;
}

export class Usuario implements IUsuario {
  id?: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  token?: string;

  constructor(data: Partial<IUsuario>) {
    this.id = data.id;
    this.nombre = data.nombre || '';
    this.email = data.email || '';
    this.rol = data.rol || 'Operador';
    this.activo = data.activo !== undefined ? data.activo : true;
    this.token = data.token;
  }
}
