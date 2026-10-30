import { IUsuario } from '../Entidades/Usuario';
import { ApiClient } from '../api';

export class ControllersAuth {
  currentUser: IUsuario | null = null;

  constructor() {
    this.currentUser = ApiClient.getUser();
  }

  estaAutenticado(): boolean {
    return !!ApiClient.getUser();
  }

  esAdmin(): boolean {
    return this.currentUser?.rol === 'Administrador';
  }

  async IniciarSesion(email: string, passwordHash: string): Promise<IUsuario> {
    const res = await ApiClient.post<{ user: IUsuario; token: string }>('/auth/login', {
      email,
      password: passwordHash
    });
    ApiClient.setToken(res.token);
    ApiClient.setUser(res.user);
    this.currentUser = res.user;
    return res.user;
  }

  CerrarSesion(): void {
    ApiClient.removeToken();
    this.currentUser = null;
  }
}

export const AuthState = new ControllersAuth();
