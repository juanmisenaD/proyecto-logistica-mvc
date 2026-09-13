const express = require('express');
const morgan = require('morgan');
const { iniciarCronJobs } = require('./src/services/cronService');
const session = require('express-session');
const { join } = require('path');
const routes = require('./src/routes/logisticaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Vistas (EJS)
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'src/views'));

app.use(morgan('dev'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Middleware de Sesión
app.use(session({
  secret: 'clave_secreta_logistica_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Carga de Rutas del Sistema
app.use('/', routes);

// Inicializar Tareas Programadas
iniciarCronJobs();

// Inicio del Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});