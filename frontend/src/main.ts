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
            <button class="nav-item ${this.currentView.startsWith('facturas') ? 'active' : ''}" data-nav="facturas-list" style="display: flex; align-items: center;">
              <span class="nav-icon">🧾</span> Facturación
              ${!esAdmin ? '<span class="badge" style="font-size: 9px; padding: 1px 5px; background: #e2e8f0; color: #475569; margin-left: auto;">Consulta</span>' : ''}
            </button>
            <button class="nav-item ${this.currentView === 'reportes' ? 'active' : ''}" data-nav="reportes" style="display: flex; align-items: center;">
              <span class="nav-icon">${esAdmin ? '📈' : '🔒'}</span> Consultas Avanzadas (8)
              ${!esAdmin ? '<span class="badge" style="font-size: 9px; padding: 1px 5px; background: #fee2e2; color: #b91c1c; margin-left: auto;">Admin</span>' : ''}
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
                    ${esAdmin ? '👑 Administrador' : '👷 Operador'}
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

    const esAdmin = AuthState.esAdmin();

    switch (this.currentView) {
      case 'dashboard':
        await this.dashboardPage.render(container);
        break;
      case 'vehiculos-list':
        await this.vehiculoListPage.render(container);
        break;
      case 'vehiculos-form':
        if (!esAdmin) {
          container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <div style="font-size: 48px; margin-bottom: 12px;">🛡️</div>
              <h3 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Configuración de Flota Restringida</h3>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 16px;">
                La incorporación y edición de vehículos en la flota está reservada al rol de <strong>Administrador</strong> (REQ-01 / REQ-06).
              </p>
              <div style="background: #f8fafc; border-radius: 8px; padding: 10px; font-size: 12px; color: #475569;">
                Como Operador tienes autorización para consultar disponibilidad y telemetría en la lista de vehículos.
              </div>
            </div>
          `;
        } else {
          this.vehiculoFormPage.render(container);
        }
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
        if (!esAdmin) {
          container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <div style="font-size: 48px; margin-bottom: 12px;">🧾</div>
              <h3 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Emisión de Facturas Restringida</h3>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 16px;">
                La liquidación y emisión atómica de facturas (REQ-04) está reservada exclusivamente para el rol contable de <strong>Administrador</strong>.
              </p>
              <div style="background: #f8fafc; border-radius: 8px; padding: 10px; font-size: 12px; color: #475569;">
                Como Operador puedes consultar y descargar en PDF los comprobantes ya emitidos.
              </div>
            </div>
          `;
        } else {
          await this.facturaFormPage.render(container);
        }
        break;
      case 'reportes':
        if (!esAdmin) {
          container.innerHTML = `
            <div style="padding: 50px 20px; text-align: center; max-width: 650px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <div style="font-size: 52px; margin-bottom: 12px;">🔒</div>
              <h3 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Módulo Restringido para Operador</h3>
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
                Las <strong>Consultas Avanzadas y Reportes Gerenciales (REQ-05 / REQ-06)</strong> incluyen métricas financieras de rentabilidad consolidada, márgenes por vehículo y auditoría contable. Este módulo está reservado exclusivamente para el perfil directivo de <strong>Administrador</strong>.
              </p>
              <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 14px 20px; font-size: 13px; color: #334155; display: inline-block;">
                Tu perfil actual: <span class="badge badge-secondary" style="font-weight: 700; font-size: 11px;">👷 Operador Logístico</span><br>
                <span style="font-size: 12px; color: #64748b;">(Tus permisos autorizados: Registro y planificación de servicios, despacho en ruta y monitoreo de flota).</span>
              </div>
            </div>
          `;
        } else {
          await this.reportesPage.render(container);
        }
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
