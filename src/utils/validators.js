// src/utils/validators.js
const { getAll } = require('../models/guiaModel'); // O el path correspondiente a tu modelo de guías

/**
 * Valida que una cadena sea un número entre 1 a 10 dígitos (ej. DNI/NIT/Teléfono)
 * @param {string|number} dato
 * @returns {boolean}
 */
function validarNumero10(dato) {
  if (!dato) return false;
  return /^\d{1,10}$/.test(String(dato).trim());
}

/**
 * Valida formato estándar de correo electrónico
 * @param {string} email 
 * @returns {boolean}
 */
function validarCorreo(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

/**
 * Clasifica el tamaño de la mercancía según su peso en kg
 * @param {number} peso 
 * @returns {string}
 */
function clasificarTamano(peso) {
  const p = Number(peso);
  if (p <= 5) return "Pequeño (S)";
  if (p <= 15) return "Mediano (M)";
  return "Grande (L)";
}

/**
 * Comprueba si ya existe una guía duplicada para el mismo remitente, destinatario y contenido
 * @param {number} r_dni 
 * @param {number} d_dni 
 * @param {string} contenido 
 * @returns {boolean}
 */
function comprobarDuplicado(r_dni, d_dni, contenido) {
  const guias = getAll();
  return guias.some(g => 
    Number(g.remitente.dni_nit) === Number(r_dni) &&
    Number(g.destinatario.dni_nit) === Number(d_dni) &&
    String(g.contenido).trim().toLowerCase() === contenido.trim().toLowerCase()
  );
}

/**
 * Verifica si un ID o número de guía generado ya existe en la base de datos
 * @param {string} nuevoId 
 * @returns {boolean}
 */
function comprobarDuplicadoNumGuia(nuevoId) {
  const guias = getAll();
  return guias.some(g => g.generator_guia === nuevoId);
}

/**
 * Normaliza cualquier formato de fecha regional/ISO a un objeto Date nativo
 * @param {string|Date} fechaStr 
 * @returns {Date}
 */
function parseFechaRegionalAISO(fechaStr) {
  if (!fechaStr) return new Date();
  if (fechaStr instanceof Date) return fechaStr;

  // Si viene en formato ISO estándar (ej. 2026-08-07T21:31:35)
  if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
    return new Date(fechaStr);
  }

  // Si viene en formato regional (ej. "6/2/2026, 8:33:31 p. m.")
  const partes = String(fechaStr).split(',');
  const fechaPartes = partes[0].trim().split('/');
  
  if (fechaPartes.length === 3) {
    const dia = parseInt(fechaPartes[0], 10);
    const mes = parseInt(fechaPartes[1], 10) - 1; // Mes en JS va de 0 a 11
    const anio = parseInt(fechaPartes[2], 10);
    return new Date(anio, mes, dia);
  }

  return new Date(fechaStr);
}

/**
 * Calcula la carga en kg despachada en la jornada/día actual
 * @returns {number}
 */
function obtenerCargaDiariaActual() {
  const guias = getAll();
  const hoy = new Date();
  
  return guias.reduce((total, g) => {
    const fechaGuia = parseFechaRegionalAISO(g.fecha);
    const esMismoDia = 
      fechaGuia.getDate() === hoy.getDate() &&
      fechaGuia.getMonth() === hoy.getMonth() &&
      fechaGuia.getFullYear() === hoy.getFullYear();

    return esMismoDia ? total + (Number(g.peso) || 0) : total;
  }, 0);
}

/**
 * Valida si al sumar el peso de una nueva guía se excede la capacidad diaria permitida
 * @param {number} pesoNuevo 
 * @param {number} limiteMaximo Límite por defecto (500 kg)
 * @returns {{ valido: boolean, disponible: number, cargaActual: number }}
 */
function validarCapacidadDiaria(pesoNuevo, limiteMaximo = 500) {
  const cargaActual = obtenerCargaDiariaActual();
  const peso = Number(pesoNuevo) || 0;
  const disponible = limiteMaximo - cargaActual;

  return {
    valido: (cargaActual + peso) <= limiteMaximo,
    disponible: disponible > 0 ? disponible : 0,
    cargaActual
  };
}
/**
 * previene envíos intraurbanos (dentro de la misma ciudad), asegurando que el sistema gestione exclusivamente operaciones intermunicipales o nacionales
 * @param {string} ciudadOrigen
 * @param {string} ciudadDestino
 * @returns {boolean}
 */
function validarCiudadesDiferentes(ciudadOrigen, ciudadDestino) {
  if (!ciudadOrigen || !ciudadDestino) return false;
  return ciudadOrigen.trim().toLowerCase() !== ciudadDestino.trim().toLowerCase();
}

module.exports = {
  validarNumero10,
  validarCorreo,
  clasificarTamano,
  comprobarDuplicado,
  comprobarDuplicadoNumGuia,
  parseFechaRegionalAISO,
  obtenerCargaDiariaActual,
  validarCapacidadDiaria,
  validarCiudadesDiferentes
};