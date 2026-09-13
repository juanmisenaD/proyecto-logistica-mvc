const GuiaModel = require('../models/guiaModel');
const ClienteModel = require('../models/clienteModel');
const NationModel = require('../models/nationModel');
const { CAPACIDAD_MAXIMA_DIARIA } = require('../../config/constants');
const { validarCapacidadDiaria } = require('../utils/validators');

class ApiController {
  static getClienteByDni(req, res) {
    const cliente = ClienteModel.getByDni(req.params.dni);
    if (cliente) {
      return res.json({ success: true, cliente });
    }
    return res.status(404).json({ success: false, message: "Cliente no encontrado" });
  }

  static searchGuiaById(req, res) {
    const guia = GuiaModel.getGuiaById(req.params.id);
    if (guia) {
      return res.json({ success: true, guia });
    }
    return res.status(404).json({ success: false, message: "Guia no encontrada" });
  }

  static getDepartamentos(req, res) {
    const ubicaciones = NationModel.getUbicaciones();
    res.json(Object.keys(ubicaciones));
  }

  static getCiudades(req, res) {
    const ubicaciones = NationModel.getUbicaciones();
    const ciudades = ubicaciones[req.params.departamento] || [];
    res.json(ciudades);
  }

  static getValidCapDay(req, res) {
    // Calculamos el peso ocupado hoy y lo disponible
    const estadoCupo = validarCapacidadDiaria(0, CAPACIDAD_MAXIMA_DIARIA);
    res.json({ disponibleHoy: estadoCupo.disponible });
  }

  static getAllClientes(req, res) {
    try {
      return res.json({ success: true, message: ClienteModel.getAll() });
    } catch (error) {
      return res.status(404).json({ success: false, message: error });
    }
  }
}

module.exports = ApiController;