import './style.css';
import { AuthState } from './Controlador/ControllersAuth';
import { LoginPage } from './pagina/auth/Login';
import { DashboardPage } from './pagina/dashboard/Dashboard';
import { VehiculoList } from './pagina/vehiculos/VehiculoList';
import { VehiculoForm } from './pagina/vehiculos/VehiculoForm';
import { ServicioList } from './pagina/servicios/ServicioList';
import { ServicioForm } from './pagina/servicios/ServicioForm';
import { FacturaList } from './pagina/facturas/FacturaList';
import { FacturaForm } from './pagina/facturas/FacturaForm';
import { ReportesPage } from './pagina/reportes/Reportes';
import { PersonaList } from './pagina/personas/PersonaList';
import { PersonaForm } from './pagina/personas/PersonaForm';
import { ClienteList } from './pagina/clientes/ClienteList';
import { IVehiculo } from './Entidades/Vehiculo';
import { Persona } from './Entidades/Persona';

type VistaApp =
  | 'dashboard'
  | 'vehiculos-list'
  | 'vehiculos-form'
  | 'servicios-list'
  | 'servicios-form'
  | 'facturas-list'
  | 'facturas-form'
  | 'reportes'
  | 'clientes-list'
  | 'personas-list'
  | 'personas-form'
  | 'login';

class App {
  private currentView: VistaApp = 'dashboard';
  private rootElement: HTMLElement;

  // Instancias de componentes
  private loginPage: LoginPage;
  private dashboardPage: DashboardPage;
  private vehiculoListPage: VehiculoList;
  private vehiculoFormPage: VehiculoForm;
  private servicioListPage: ServicioList;
  private servicioFormPage: ServicioForm;
  private facturaListPage: FacturaList;
  private facturaFormPage: FacturaForm;
  private reportesPage: ReportesPage;
  private clienteListPage: ClienteList;
  private personaListPage: PersonaList;
  private personaFormPage: PersonaForm;

  constructor() {
    this.rootElement = document.getElementById('app') as HTMLElement;

    // Inicializar componentes con sus callbacks de navegación
    this.loginPage = new LoginPage({
      onLoginSuccess: () => {
        this.currentView = 'dashboard';
        this.render();
      },
    });

    this.dashboardPage = new DashboardPage();

    this.vehiculoListPage = new VehiculoList({
      onCrear: () => {
        this.vehiculoFormPage.setVehiculo(null);
        this.currentView = 'vehiculos-form';
        this.render();
      },
      onEditar: (vehiculo: IVehiculo) => {
        this.vehiculoFormPage.setVehiculo(vehiculo);
        this.currentView = 'vehiculos-form';
        this.render();
      },
    });

    this.vehiculoFormPage = new VehiculoForm({
      onGuardado: () => {
        this.currentView = 'vehiculos-list';
        this.render();
      },
      onCancelar: () => {
        this.currentView = 'vehiculos-list';
        this.render();
      },
    });

    this.servicioListPage = new ServicioList({
      onCrear: () => {
        this.currentView = 'servicios-form';
        this.render();
      },
    });

    this.servicioFormPage = new ServicioForm({
      onGuardado: () => {
        this.currentView = 'servicios-list';
        this.render();
      },
      onCancelar: () => {
        this.currentView = 'servicios-list';
        this.render();
      },
    });

    this.facturaListPage = new FacturaList({
      onCrear: () => {
        this.currentView = 'facturas-form';
        this.render();
      },
    });

    this.facturaFormPage = new FacturaForm({
      onGuardado: () => {
        this.currentView = 'facturas-list';
        this.render();
      },
      onCancelar: () => {
        this.currentView = 'facturas-list';
        this.render();
      },
    });

    this.reportesPage = new ReportesPage();

    this.personaListPage = new PersonaList({
      onCrear: () => {
        this.personaFormPage.setPersona(null, -1);
        this.currentView = 'personas-form';
        this.render();
      },
      onEditar: (p: Persona, index: number) => {
        this.personaFormPage.setPersona(p, index);
        this.currentView = 'personas-form';
        this.render();
      },
    });

    this.personaFormPage = new PersonaForm({
      onGuardado: () => {
        this.currentView = 'personas-list';
        this.render();
      },
      onCancelar: () => {
        this.currentView = 'personas-list';
        this.render();
      },
    });

    this.clienteListPage = new ClienteList();
  }

  public init() {
    if (!AuthState.estaAutenticado()) {
      this.currentView = 'login';
    } else {
      this.currentView = 'dashboard';
    }
    this.render();
  }

  private render() {
    if (!AuthState.estaAutenticado() || this.currentView === 'login') {
      this.rootElement.innerHTML = `<div id="login-container"></div>`;
      const loginCont = document.getElementById('login-container') as HTMLElement;
      this.loginPage.render(loginCont);
      return;
    }

    const user = AuthState.currentUser;
    const esAdmin = AuthState.esAdmin();

    this.rootElement.innerHTML = `
      <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="brand-header">
            <div class="brand-logo-icon">TL</div>
            <div>
              <div class="brand-title">TRANSLOGIC S.A.</div>
              <div class="brand-subtitle">Gestión de Flotas</div>
            </div>
          </div>

          <nav class="nav-menu">
            <button class="nav-item ${this.currentView === 'dashboard' ? 'active' : ''}" data-nav="dashboard">
              <span class="nav-icon">📊</span> Dashboard
            </button>
            <button class="nav-item ${this.currentView.startsWith('vehiculos') ? 'active' : ''}" data-nav="vehiculos-list">
              <span class="nav-icon">🚚</span> Flota de Vehículos
            </button>
            <button class="nav-item ${this.currentView.startsWith('servicios') ? 'active' : ''}" data-nav="servicios-list">
              <span class="nav-icon">📦</span> Servicios y Rutas
            </button>
            <button class="nav-item ${this.currentView.startsWith('facturas') ? 'active' : ''}" data-nav="facturas-list">
              <span class="nav-icon">🧾</span> Facturación Simulada
            </button>
            <button class="nav-item ${this.currentView === 'reportes' ? 'active' : ''}" data-nav="reportes">
              <span class="nav-icon">📈</span> Consultas Avanzadas (8)
            </button>
            <button class="nav-item ${this.currentView === 'clientes-list' ? 'active' : ''}" data-nav="clientes-list">
              <span class="nav-icon">🏢</span> Clientes / Socios
            </button>
            <button class="nav-item ${this.currentView.startsWith('personas') ? 'active' : ''}" data-nav="personas-list">
              <span class="nav-icon">👥</span> Personal / Conductores
            </button>
          </nav>

          <div class="sidebar-user">
            <div class="user-info">
              <div class="user-avatar">${(user?.nombre || 'U').substring(0, 2).toUpperCase()}</div>
              <div>
                <div class="user-text-name">${user?.nombre || 'Usuario'}</div>
                <div class="user-text-role">
                  <span class="badge ${esAdmin ? 'badge-info' : 'badge-secondary'}" style="font-size: 10px; padding: 2px 6px;">
                    ${user?.rol || 'Operador'}
                  </span>
                </div>
              </div>
            </div>
            <button id="btn-logout" class="btn btn-sm btn-outline" title="Cerrar Sesión">
              🚪
            </button>
          </div>
        </aside>

        <!-- Contenedor Principal -->
        <main class="main-wrapper">
          <header class="topbar">
            <div class="topbar-title" id="page-header-title">
              ${this.obtenerTituloVista()}
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="badge badge-success" style="font-size: 11px;">● Conectado a NestJS REST API</span>
            </div>
          </header>

          <section class="page-content" id="subview-container">
            <!-- La subvista se renderiza aquí -->
          </section>
        </main>
      </div>
    `;

    this.bindGlobalEvents();
    this.renderSubView();
  }

  private obtenerTituloVista(): string {
    switch (this.currentView) {
      case 'dashboard':
        return 'Panel de Control y Analítica de Flota';
      case 'vehiculos-list':
      case 'vehiculos-form':
        return 'Módulo de Flota de Vehículos';
      case 'servicios-list':
      case 'servicios-form':
        return 'Módulo de Servicios de Transporte';
      case 'facturas-list':
      case 'facturas-form':
        return 'Módulo de Facturación Simulada';
      case 'reportes':
        return 'Consultas Avanzadas y Reportes Operativos';
      case 'clientes-list':
        return 'Gestión de Clientes y Socios Comerciales (PostgreSQL)';
      case 'personas-list':
      case 'personas-form':
        return 'Controlador de Personal y Conductores';
      default:
        return 'TRANSLOGIC S.A.';
    }
  }

  private bindGlobalEvents() {
    const navButtons = document.querySelectorAll('[data-nav]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dest = (e.currentTarget as HTMLElement).dataset.nav as VistaApp;
        if (dest) {
          this.currentView = dest;
          this.render();
        }
      });
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      AuthState.CerrarSesion();
      this.currentView = 'login';
      this.render();
    });
  }

  private async renderSubView() {
    const container = document.getElementById('subview-container');
    if (!container) return;

    switch (this.currentView) {
      case 'dashboard':
        await this.dashboardPage.render(container);
        break;
      case 'vehiculos-list':
        await this.vehiculoListPage.render(container);
        break;
      case 'vehiculos-form':
        this.vehiculoFormPage.render(container);
        break;
      case 'servicios-list':
        await this.servicioListPage.render(container);
        break;
      case 'servicios-form':
        await this.servicioFormPage.render(container);
        break;
      case 'facturas-list':
        await this.facturaListPage.render(container);
        break;
      case 'facturas-form':
        await this.facturaFormPage.render(container);
        break;
      case 'reportes':
        await this.reportesPage.render(container);
        break;
      case 'clientes-list':
        await this.clienteListPage.render(container);
        break;
      case 'personas-list':
        this.personaListPage.render(container);
        break;
      case 'personas-form':
        this.personaFormPage.render(container);
        break;
    }
  }
}

const app = new App();
app.init();
