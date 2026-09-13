// src/services/cronService.js
const cron = require('node-cron');
const GuiaModel = require('../models/guiaModel');

function iniciarCronJobs() {
  // Se ejecuta cada 30 minutos (para pruebas)
  cron.schedule('*/30 * * * *', () => {
    const guias = GuiaModel.getAll();
    let cambios = false;

    guias.forEach(g => {
      // Si la guía está en estado 'PENDIENTE' (o no tiene estado asignado), la pasamos a 'EN CAMINO'
      if (!g.estado || g.estado === 'PENDIENTE') {
        g.estado = 'EN CAMINO';
        g.fecha_despacho = new Date().toISOString();
        cambios = true;
      }
    });

    if (cambios) {
      GuiaModel.saveAll(guias); // Persiste los cambios en guias.json
      console.log('🤖 [Cron Job] Estados de envíos actualizados a "EN CAMINO".');
    }
  });
}

module.exports = { iniciarCronJobs };