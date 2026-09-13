# 📦 Sistema de Gestión Logística & Envíos (MVC)

Aplicación web empresarial desarrollada en **Node.js, Express y EJS** bajo la arquitectura **MVC (Modelo-Vista-Controlador)**. Diseñada para la automatización operativa, control financiero y optimización de memoria en el despacho de mercancías a nivel nacional.

---

## 🚀 Características Principales

* **Control de Acceso Basado en Roles (RBAC):** Autenticación de usuarios con vistas y acciones restringidas según el rol (**ADMIN**, **OPERADOR**, **MENSAJERO**).
* **Dashboard Financiero y Balance Visual:** Cálculo dinámico en tiempo real de Ingresos Totales, Fondo de Seguros (2%), Reserva de IVA (19%) y Utilidad Bruta con filtro por rango de fechas.
* **Control Operativo de Capacidad Diaria:** Indicador visual en pantalla y validación en tiempo real del cupo disponible sobre el límite operacional de 500 kg.
* **Auto-Depuración y Archivado PDF (Optimización I/O):**
  * Generación automática de comprobantes de entrega en PDF (`PDFKit`) almacenados en `/data/tickets/`.
  * Limpieza en caliente del archivo `guias.json` al detectar guías **"ENTREGADO"**, reduciendo el consumo de memoria en hasta un 90% mientras preserva el balance financiero.
* **Filtro de Tabla Interactivo:** Selector `<select>` integrado directamente en el encabezado de la tabla para alternar entre guías `PENDIENTE`, `EN CAMINO`, `ENTREGADO` o `TODOS` sin recargar la página.
* **Validación de Envíos Intermunicipales:** Regla de negocio en cliente y servidor que impide el registro de envíos con la misma ciudad de origen y destino (`e.preventDefault()` en submit).
* **Automatización con Cron Jobs:** Servicio en segundo plano con `node-cron` para transiciones automáticas a estado **"EN CAMINO"**.

---

## 🛠️ Tecnologías Utilizadas

* **Backend:** Node.js, Express.js.
* **Frontend:** EJS (Embedded JavaScript), Bootstrap v5.1.3, JavaScript Vanilla (`async/await`, DOM).
* **Persistencia:** Archivos JSON estructurados (`guias.json`, `clientes.json`, `nation.json`).
* **Librerías Clave:** `pdfkit` (generación de tickets), `node-cron` (tareas programadas), `express-session` (control de sesiones).

---

## 📂 Estructura del Proyecto

```text
proyecto-logistica-mvc/
├── config/
│   ├── constants.js            # Tarifas base, % de seguro y límites (500 kg)
│   └── users.js                # Usuarios y credenciales por rol (ADMIN, OPERADOR, MENSAJERO)
├── data/
│   ├── clientes.json           # Persistencia de la base de datos de clientes
│   ├── guias.json              # Persistencia del historial de guías y envíos
│   ├── nation.json             # Catálogo geográfico de departamentos y ciudades
│   └── tickets/                # Comprobantes PDF generados automáticamente
├── public/                     # Archivos estáticos servidos públicamente
│   ├── css/
│   │   ├── bootstrap.min.css   # Bootstrap v5.1.3 CSS
│   │   └── style.css           # Estilos personalizados (Selector de estado, tarjetas, badges)
│   └── js/
│       ├── bootstrap.bundle.min.js # Bootstrap v5.1.3 JS
│       ├── crear.js            # Validación intermunicipal (Submit Intercept) y capacidad diaria
│       └── main.js             # Filtro dinámico de tabla por estado y modal de ticket async/await
├── src/
│   ├── controllers/
│   │   ├── apiController.js    # Endpoints REST (/api/guias/:id) para AJAX/fetch
│   │   ├── authController.js   # Gestión de login/logout y destrucción de sesión
│   │   └── guiaController.js   # Dashboard, balance financiero y métricas de capacidad
│   ├── middlewares/
│   │   └── authMiddleware.js   # Control de accesos y protección RBAC
│   ├── models/
│   │   ├── clienteModel.js     # I/O sobre clientes.json
│   │   ├── guiaModel.js        # I/O sobre guias.json, auto-depuración a PDF y lectura segura
│   │   └── nationModel.js      # Lectura de la división política
│   ├── routes/
│   │   └── logisticaRoutes.js  # Rutas web protegidas y públicas
│   ├── services/
│   │   ├── cronService.js      # Tareas programadas en segundo plano (node-cron)
│   │   └── pdfService.js       # Servicio de maquetación y streaming de tickets PDF
│   ├── utils/
│   │   └── validators.js       # Validaciones (DNI <= 10 dígitos, regla intermunicipal, cupo 500 kg)
│   └── views/
│       ├── index.ejs           # Dashboard principal (Balance, Filtro Estado <select>, Modales)
│       ├── crear.ejs           # Formulario de registro con aviso de capacidad y alerta intermunicipal
│       └── login.ejs           # Pantalla de acceso por credenciales
├── app.js                      # Servidor principal (Express, Sesiones, Cron Jobs)
└── package.json                # Dependencias del proyecto