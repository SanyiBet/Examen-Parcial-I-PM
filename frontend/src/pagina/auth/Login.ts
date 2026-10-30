import template from './Login.html?raw';
import './Login.css';
import { AuthState } from '../../Controlador/ControllersAuth';

export class LoginPage {
  private onLoginSuccessCallback?: () => void;

  constructor(handlers?: { onLoginSuccess?: () => void }) {
    this.onLoginSuccessCallback = handlers?.onLoginSuccess;
  }

  render(container: HTMLElement) {
    container.innerHTML = template;

    this.bindEvents(container);
  }

  private bindEvents(container: HTMLElement) {
    const form = container.querySelector('#login-form') as HTMLFormElement;
    const inputEmail = container.querySelector('#login-email') as HTMLInputElement;
    const inputPass = container.querySelector('#login-password') as HTMLInputElement;
    const alertBox = container.querySelector('#login-alert') as HTMLElement;
    const btnAdmin = container.querySelector('#btn-quick-admin');
    const btnOperador = container.querySelector('#btn-quick-operador');

    btnAdmin?.addEventListener('click', () => {
      inputEmail.value = 'admin@translogic.com';
      inputPass.value = 'admin123';
    });

    btnOperador?.addEventListener('click', () => {
      inputEmail.value = 'operador@translogic.com';
      inputPass.value = 'operador123';
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.style.display = 'none';

      try {
        await AuthState.IniciarSesion(inputEmail.value.trim(), inputPass.value);
        if (this.onLoginSuccessCallback) {
          this.onLoginSuccessCallback();
        }
      } catch (err: any) {
        alertBox.style.display = 'block';
        alertBox.textContent = err.message || 'Error de autenticación: verifique sus credenciales';
      }
    });
  }
}
