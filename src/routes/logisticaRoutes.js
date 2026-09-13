const express = require('express');
const router = express.Router();
const GuiaController = require('../controllers/guiaController');
const ApiController = require('../controllers/apiController');
const AuthController = require('../controllers/authController');
const { verificarAutenticado, permitirRoles } = require('../middlewares/authMiddleware');

// Rutas Públicas de Sesión
router.get('/login', AuthController.renderLogin);
router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);

// Rutas Vistas Principales
// Rutas Protegidas por Autenticación y Rol
router.get('/', verificarAutenticado, GuiaController.renderIndex);
router.get('/crear', verificarAutenticado, permitirRoles('ADMIN', 'OPERADOR'), GuiaController.renderCrear);
router.post('/crear', verificarAutenticado, permitirRoles('ADMIN', 'OPERADOR'), GuiaController.crearGuia);
// Únicamente los usuarios con rol 'ADMIN' pueden ejecutar el endpoint de anulación
router.get('/anular/:id', verificarAutenticado, permitirRoles('ADMIN'), GuiaController.anularGuia);
router.get('/exportar-csv', verificarAutenticado, permitirRoles('ADMIN'), GuiaController.exportarCSV);
// Permitir a Mensajeros y Admins cambiar el estado a ENTREGADO
router.get('/entregar/:id', verificarAutenticado, permitirRoles('ADMIN', 'MENSAJERO'), GuiaController.marcarEntregado);

// Endpoints REST / API
router.get('/api/guias/:id', ApiController.searchGuiaById);
router.get('/api/clientes', ApiController.getAllClientes);
router.get('/api/cliente/:dni', ApiController.getClienteByDni);
router.get('/api/departamentos', ApiController.getDepartamentos);
router.get('/api/ciudades/:departamento', ApiController.getCiudades);
router.get('/api/guiaCapacidad', ApiController.getValidCapDay);

module.exports = router;