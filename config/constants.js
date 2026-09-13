const { join } = require('path');

module.exports = {
  CAPACIDAD_MAXIMA_DIARIA: 500, // kg por día[cite: 1]
  TARIFA_BASE_KG: 5000,         // Precio por kilo[cite: 1]
  PORCENTAJE_SEGURO: 0.02,      // 2% valor declarado[cite: 1]
  RECARGO_FRAGIL_FIJO: 8000,    // Recargo mercancía frágil[cite: 1]
  
  PATHS: {
    CLIENTES: join(__dirname, '../data/clientes.json'),
    GUIAS: join(__dirname, '../data/guias.json'),
    NATION: join(__dirname, '../data/nation.json'),
    TICKETS: join(__dirname, '../data/tickets')
  }
};