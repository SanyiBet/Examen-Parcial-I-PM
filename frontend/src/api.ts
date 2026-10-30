const API_URL = 'http://localhost:3000';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('translogic_token');
  }

  static setToken(token: string) {
    localStorage.setItem('translogic_token', token);
  }

  static removeToken() {
    localStorage.removeItem('translogic_token');
    localStorage.removeItem('translogic_user');
  }

  static getUser(): any | null {
    const raw = localStorage.getItem('translogic_user');
    return raw ? JSON.parse(raw) : null;
  }

  static setUser(user: any) {
    localStorage.setItem('translogic_user', JSON.stringify(user));
  }

  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || 'Error en la petición GET');
    }
    return response.json();
  }

  static async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || 'Error en la petición POST');
    }
    return response.json();
  }

  static async patch<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || 'Error en la petición PATCH');
    }
    return response.json();
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(err.message || 'Error en la petición DELETE');
    }
    return response.json();
  }
}
