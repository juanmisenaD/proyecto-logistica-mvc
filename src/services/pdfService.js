// src/services/pdfService.js
const PDFDocument = require('pdfkit');

class PDFService {
  static generarComprobante(guia, res) {
    const doc = new PDFDocument({ margin: 50 });

    // Configurar encabezados HTTP para la descarga automática
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ticket_${guia.generator_guia}.pdf`);

    doc.pipe(res); // Canalizar el PDF directamente hacia la descarga del navegador

    // Encabezado
    doc.fontSize(20).text('COMPROBANTE DE ENTREGA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Guía #: ${guia.generator_guia}`);
    doc.text(`Fecha Entrega: ${guia.fecha_entrega || new Date().toISOString()}`);
    doc.text(`Estado: ENTREGADO`);
    doc.moveDown();

    // Datos del Envío
    doc.fontSize(14).text('Detalles del Envío', { underline: true });
    doc.fontSize(10).text(`Remitente: ${guia.remitente?.nombres || 'N/A'} ${guia.remitente?.apellidos || ''}`);
    doc.text(`Destinatario: ${guia.destinatario?.nombres || 'N/A'} ${guia.destinatario?.apellidos || ''}`);
    doc.text(`Contenido: ${guia.contenido || 'N/A'}`);
    doc.text(`Peso Registrado: ${guia.peso || 0} kg`);
    doc.moveDown();

    // Total
    doc.fontSize(14).text(`Total Pagado: $${Number(guia.precio || 0).toLocaleString('es-CO')}`, { align: 'right' });

    doc.end(); // Finalizar el documento
  }
}

module.exports = PDFService;