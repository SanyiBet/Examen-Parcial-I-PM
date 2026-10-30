# TRANSLOGIC S.A. - Sistema Inteligente de Gestión de Flotas, Servicios y Facturación
**Examen Práctico de Programación Móvil - Parcial I**

Solución Full-Stack completa que implementa una arquitectura cliente-servidor en tres capas:
- **Frontend Móvil Responsivo:** Desarrollado con **Vite + TypeScript + Vanilla CSS**, diseño **100% fondo claro** con tarjetas, modales y gráficos interactivos con **Chart.js** inspirados en el diseño ECO-MOVE. Desacoplamiento estricto de componentes CRUD en archivos independientes `.css`, `.html`, `.ts`, con carpeta de controladores y entidades dedicadas.
- **Backend Robusto:** Desarrollado con **NestJS (Node.js)**, API REST / JSON, documentación OpenAPI/Swagger interactiva, autenticación segura con JWT y bcrypt, y autorización por roles (`Administrador` y `Operador`).
- **Persistencia Relacional y Transaccional:** Base de datos relacional **PostgreSQL** (`translogic_db`) gestionada mediante **TypeORM** con soporte de transacciones atómicas (ACID), auditoría de cambios de estado y control de concurrencia.

---

## 1. Justificación del Modelo de Datos y Persistencia (Req-01)
Se seleccionó un **modelo relacional** implementado con TypeORM debido a la naturaleza estrictamente transaccional del negocio de transporte y facturación:
1. **Integridad Referencial Estricta:** Un servicio no puede existir sin un cliente y un vehículo válidos. La eliminación accidental de registros se previene mediante restricciones `ON DELETE RESTRICT`.
2. **Garantía ACID en Facturación y Despachos:** La facturación exige que múltiples servicios completados se liquiden simultáneamente, actualizando el estado de cada servicio a facturado y generando los detalles en una sola transacción atómica; si ocurre un fallo, se aplica un `rollback` automático garantizando que **no existan facturas parciales**.
3. **Control de Concurrencia:** Se previenen asignaciones simultáneas conflictivas y horarios superpuestos para una misma unidad vehicular mediante bloqueos y validaciones directas en base de datos.
4. **Consultas Analíticas y Agregaciones (Req-07):** El modelo relacional permite consultas complejas optimizadas (subconsultas, funciones de agregación `AVG`, `SUM`, `COUNT`, `HAVING` y Common Table Expressions `WITH`).

---

## 2. Reglas de Negocio Implementadas

### A. Vehículos, Costos y Tarifas Polimórficas (Req-02)
- **Camión de Carga (Diésel):**
  - $\text{Costo Combustible} = (\text{distancia} / 100) \times \text{consumoLitros100Km} \times \text{precioLitro}$
  - $\text{Costo Operativo} = \text{Costo Combustible} + (\text{distancia} \times \text{costoMantenimientoKm})$
  - $\text{Tarifa Base} = \text{Costo Operativo} \times 1.35$
  - Si la carga supera el 80% de la capacidad autorizada, se añade un **8% de recargo** a la tarifa base.
- **Furgoneta Eléctrica (Batería):**
  - $\text{Costo Energético} = (\text{distancia} / 100) \times \text{consumoKWh100Km} \times \text{costoKWh}$
  - $\text{Tarifa Base} = (\text{Costo Energético} + 18) \times 1.30$
  - Si la distancia supera el 80% de la autonomía, se añade un **10% de recargo** a la tarifa base.
  - $\text{Autonomía Disponible} = \frac{(\text{porcentajeBateria} / 100) \times \text{capacidadBateriaKWh}}{\text{consumoKWh100Km}} \times 100$
  - **Validación crítica:** Se rechaza el despacho de servicios eléctricos si la distancia supera la autonomía actual disponible, a menos que se registre explícitamente una **recarga planificada**. Baterías fuera del rango 0–100% y cargas que superen la capacidad autorizada son rechazadas tanto en frontend como en backend.

### B. Servicios de Transporte y Concurrencia (Req-03)
- Estados del ciclo de vida: `Programado` $\rightarrow$ `En ejecucion` $\rightarrow$ `Completado` (o `Cancelado`).
- **Control de Horarios Superpuestos:** Se impide programar o asignar un vehículo a dos servicios que se solapen en fecha y franja horaria ($[\text{inicio}_A, \text{fin}_A] \cap [\text{inicio}_B, \text{fin}_B] \neq \emptyset$).
- **Actualización de Kilometraje Exacta:** Al transicionar al estado `Completado`, el kilometraje del vehículo se incrementa atómicamente en una sola ocasión por la distancia del servicio, y en unidades eléctricas se descuenta el porcentaje de batería consumido.
- **Auditoría de Estados (`HistorialEstado`):** Cada transición registra fecha/hora exacta, estado anterior, estado nuevo, usuario responsable y observaciones.

### C. Facturación Simulada (Req-04)
- **Descuentos por Fidelidad:**
  - 3 a 5 servicios completados en el mes: **5% de descuento**.
  - 6 o más servicios completados en el mes: **10% de descuento**.
- **Recargos Específicos:**
  - Servicio con distancia mayor a 300 km: **Recargo del 6%**.
  - Servicio realizado en día domingo: **Recargo del 12%**.
- **Aritmética Exacta:** Los recargos se suman sobre la tarifa de cada servicio; se aplica el descuento al importe neto y finalmente la tasa configurable de impuesto (IVA 15%).
- **Descarga de PDF Simulado:** Generación de comprobante en formato PDF mediante la librería `jsPDF` con leyenda explícita: *“Sin validez tributaria ante el SRI”*.

---

## 3. Explicación: ¿Por qué validar solo en el frontend NO garantiza la integridad? (Req-09)
Validar exclusivamente en el cliente (frontend) representa una vulnerabilidad grave en sistemas empresariales por las siguientes razones fundamentales:
1. **El cliente es un entorno no confiable:** Cualquier usuario o atacante puede evadir las validaciones de la interfaz modificando el código JavaScript en las herramientas de desarrollo del navegador, o enviando peticiones HTTP directas mediante herramientas como Postman, cURL o scripts automatizados.
2. **Incapacidad para gestionar concurrencia (Race Conditions):** Si dos operadores intentan asignar el mismo camión al mismo horario simultáneamente, el navegador de cada operador no puede saber lo que el otro está haciendo en ese microsegundo. Solo el servidor y el motor de base de datos con aislamiento y transacciones pueden asegurar que una asignación bloquee a la otra.
3. **Garantía de Reglas Financieras y Tarifarias:** Si los precios, descuentos o recargos se calcularan únicamente en el frontend, un cliente malicioso podría manipular el JSON de la petición para reducir el subtotal o incrementar su descuento. El servidor backend de TRANSLOGIC S.A. recalcula todas las tarifas y descuentos antes de persistirlos.

---

## 4. Las Ocho Consultas Avanzadas en Base de Datos (Req-07)
Todas las consultas se ejecutan directamente en el motor de base de datos a través de sentencias SQL y funciones de TypeORM:
1. **Costo operativo superior al promedio:** Filtra servicios completados cuyo costo supera la subconsulta `(SELECT AVG(costoOperativo) FROM servicios WHERE estado = 'Completado')`.
2. **Porcentaje de participación por vehículo:** Agrupación por vehículo con cálculo porcentual sobre el total general de servicios completados.
3. **Clientes con $\ge 3$ servicios completados:** Agrupación por cliente con filtro `HAVING COUNT(s.id) >= 3` y sumatoria de facturación.
4. **Vehículos sin servicios asignados:** Selección con `NOT IN` sobre los vehículos con despachos en un rango de fechas.
5. **Top 5 vehículos con mayor rentabilidad:** Ordenamiento descendente por utilidad (`ingresos - costos`) y cálculo de margen porcentual.
6. **Facturación mensual por tipo de vehículo:** Agrupación por `strftime('%Y-%m', fecha)` y tipo de vehículo.
7. **Vehículos con eficiencia inferior al promedio de su categoría:** `JOIN` con tabla derivada que calcula la media de consumo por tipo (diésel vs eléctrico) y filtra desviaciones superiores.
8. **Clientes con disminución de facturación > 20% respecto al mes anterior:** Análisis mes a mes mediante Common Table Expressions (CTE).

---

## 5. Estructura del Proyecto

```text
Examen-Parcial-I-PM/
├── backend/                  # API REST en NestJS
│   ├── src/
│   │   ├── auth/            # JWT, RolesGuard, Passport, Login
│   │   ├── clientes/        # Módulo y controlador de Clientes
│   │   ├── vehiculos/       # Módulo, controlador y lógica polimórfica
│   │   ├── servicios/       # Módulo, planificación, simulación y estados
│   │   ├── facturas/        # Módulo y transacciones de facturación
│   │   ├── reportes/        # Dashboard de rentabilidad y las 8 consultas
│   │   ├── entities/        # Entidades TypeORM relacionales
│   │   ├── seed/            # Seeder automático de datos reproducibles
│   │   └── negocio.spec.ts  # Suite de pruebas automatizadas (Req-09)
│   ├── .env.example         # Variables de entorno de muestra
│   └── package.json
│
└── frontend/                 # Aplicación Web Móvil con Vite + TS
    ├── src/
    │   ├── Controlador/     # Controladores del cliente (ControllersPersona, ControllersVehiculo, etc.)
    │   ├── Entidades/       # Clases y modelos (Persona, Vehiculo, Servicio, Factura, etc.)
    │   ├── pagina/          # Componentes con HTML, CSS y TS separados:
    │   │   ├── auth/        # Login.{html, css, ts}
    │   │   ├── dashboard/   # Dashboard.{html, css, ts} con Chart.js
    │   │   ├── vehiculos/   # VehiculoList y VehiculoForm
    │   │   ├── servicios/   # ServicioList y ServicioForm
    │   │   ├── facturas/    # FacturaList y FacturaForm con jsPDF
    │   │   ├── reportes/    # Reportes.{html, css, ts} (8 consultas)
    │   │   └── personas/    # PersonaList y PersonaForm (demostración de Persona)
    │   ├── api.ts           # Cliente HTTP con cabeceras JWT
    │   ├── main.ts          # Enrutador y aplicación SPA
    │   └── style.css        # Sistema de diseño 100% fondo claro
    └── package.json
```

---

## 6. Credenciales de Prueba (Seed Automático)

Al arrancar el servidor backend por primera vez, se inicializan automáticamente los siguientes datos:
- **Administrador General:**
  - Correo: `admin@translogic.com`
  - Contraseña: `admin123`
  - Rol: `Administrador` (Acceso completo a todos los módulos y reportes)
- **Operador Logístico:**
  - Correo: `operador@translogic.com`
  - Contraseña: `operador123`
  - Rol: `Operador` (Gestión operativa y despachos)
- En la pantalla de inicio de sesión existen botones de **autocompletado rápido** para comodidad de la evaluación.

---

## 7. Instrucciones de Instalación y Ejecución

### Requisitos Previos
- Node.js versión 18 o superior (probado en Node v24).
- NPM.

### Paso 1: Ejecutar el Backend (NestJS)
```bash
# Abrir terminal en la carpeta backend
cd backend

# Instalar dependencias (si no se han instalado)
npm install

# Ejecutar las pruebas automatizadas (Req-09)
npm run test

# Iniciar servidor en modo desarrollo
npm run start:dev
```
- El servidor backend estará escuchando en: `http://localhost:3000`
- Documentación interactiva Swagger disponible en: `http://localhost:3000/api/docs`

### Paso 2: Ejecutar el Frontend (Vite)
```bash
# Abrir una nueva terminal en la carpeta frontend
cd frontend

# Instalar dependencias (si no se han instalado)
npm install

# Iniciar el servidor de desarrollo
npm run dev
```
- La aplicación web estará disponible en: `http://localhost:5173`

---

## 8. Comandos para Subir el Proyecto a GitHub

Para guardar todos los cambios y sincronizarlos con su repositorio de GitHub:

```bash
# 1. Asegurarse de estar en la raíz del proyecto: Examen-Parcial-I-PM
cd /d/Sanyi/8VO/PM/Examen-Parcial-I-PM

# 2. Verificar el estado de los archivos modificados y nuevos
git status

# 3. Agregar todos los archivos al área de preparación (staging)
git add .

# 4. Crear el commit con un mensaje descriptivo
git commit -m "feat: Implementacion integral de examen TRANSLOGIC SA - Backend NestJS, Frontend Vite, Dashboard y 8 consultas"

# 5. Subir los cambios a la rama principal en GitHub
git push origin main
```