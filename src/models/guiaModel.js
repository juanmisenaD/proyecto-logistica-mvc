const fs = require('fs');
const { join } = require('path');
const { PATHS } = require('../../config/constants');
const PDFDocument = require('pdfkit');

class GuiaModel {
  // Método que consulta Y AUTO-DEPURA los entregados
  static getAll() {
    if (!fs.existsSync(PATHS.GUIAS)) return [];
    
    const data = fs.readFileSync(PATHS.GUIAS, 'utf-8');
    let guias = JSON.parse(data || '[]');
    let huboCambios = false;

    // Crear carpeta /data/tickets/ si no existe
    if (!fs.existsSync(PATHS.TICKETS)) {
      fs.mkdirSync(PATHS.TICKETS, { recursive: true });
    }

    // Recorremos las guías para revisar cuáles están en "ENTREGADO" y NO depuradas
    guias = guias.map(guia => {
      if (guia.estado === 'ENTREGADO' && !guia.depurado) {
        
        // 1. Generar automáticamente el archivo PDF en /data/tickets/
        this.generarPDFEnDisco(guia);

        // 2. Retornar el objeto VACIADO (conserva solo lo esencial para el Balance)
        huboCambios = true;
        return {
          generator_guia: guia.generator_guia,
          fecha: guia.fecha,
          fecha_entrega: guia.fecha_entrega || new Date().toISOString(),
          precio: guia.precio,
          valor_declarado: guia.valor_declarado,
          estado: 'ENTREGADO',
          depurado: true,
          // Mantener estructuras ligeras para evitar TypeError
          remitente: {
            nombres: 'Registro',
            apellidos: 'Archivado',
            ciudad: 'N/A',
            dni_nit: 'Archivado'
          },
          destinatario: {
            nombres: 'Registro',
            apellidos: 'Archivado',
            ciudad: 'N/A',
            dni_nit: 'Archivado'
          },
          resumen: `Entregado - Respaldo PDF en /data/tickets/Ticket_${guia.generator_guia}.pdf`
        };
      }
      return guia;
    });

    // 3. Si se depuró al menos una guía, reescribimos guias.json automáticamente
    if (huboCambios) {
      this.saveAll(guias);
    }

    return guias;
  }

  // Método estático para guardar la lista en el JSON
  static saveAll(guias) {
    fs.writeFileSync(PATHS.GUIAS, JSON.stringify(guias, null, 2), 'utf-8');
  }

  static cambiarEstado(idGuia, nuevoEstado) {
    const guias = this.getAll();
    const index = guias.findIndex(g => g.generator_guia === idGuia);
    if (index !== -1) {
      guias[index].estado = nuevoEstado;
      if (nuevoEstado === 'ENTREGADO') {
        guias[index].fecha_entrega = new Date().toISOString();
      }
      this.saveAll(guias);
      return true;
    }
    return false;
  }

  static saveGuia(nuevaGuia) {
    const guias = this.getAll();
    guias.push(nuevaGuia);
    this.saveAll(guias);
    this.generarTicketFisico(nuevaGuia);
  }

  static deleteById(id) {
    let guias = this.getAll();
    const guia = guias.find(g => g.generator_guia.toUpperCase() === id.toUpperCase());
    if (!guia) return null;

    guias = guias.filter(g => g.generator_guia.toUpperCase() !== id.toUpperCase());
    this.saveAll(guias);

    // Eliminar Ticket Físico
    const ticketPath = join(PATHS.TICKETS, `Ticket_${guia.generator_guia}.txt`);
    if (fs.existsSync(ticketPath)) {
      try { fs.unlinkSync(ticketPath); } catch {}
    }
    return guia;
  }

  static getGuiaById(id) {
    const guias = this.getAll();
    return guias.find(g => g.generator_guia === id) || null;
  }

  // Generador auxiliar de PDF en disco
  static generarPDFEnDisco(guia) {
    try {
      const pdfPath = join(PATHS.TICKETS, `Ticket_${guia.generator_guia}.pdf`);
      
      // Evitamos sobrescribir si ya existe el PDF
      if (fs.existsSync(pdfPath)) return;

      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(fs.createWriteStream(pdfPath));

      doc.fontSize(18).text('COMPROBANTE DE ENTREGA AUTOMÁTICO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Número de Guía: ${guia.generator_guia}`);
      doc.text(`Fecha Emisión: ${guia.fecha}`);
      doc.text(`Fecha Entrega: ${guia.fecha_entrega || new Date().toLocaleString()}`);
      doc.text(`Estado: ENTREGADO`);
      doc.moveDown();

      doc.fontSize(14).text('Resumen de Carga', { underline: true });
      doc.fontSize(10).text(`Remitente: ${guia.remitente?.nombres || 'N/A'} ${guia.remitente?.apellidos || ''}`);
      doc.text(`Destinatario: ${guia.destinatario?.nombres || 'N/A'} ${guia.destinatario?.apellidos || ''}`);
      doc.text(`Contenido: ${guia.contenido || 'N/A'}`);
      doc.text(`Peso: ${guia.peso || 0} kg`);
      doc.moveDown();

      doc.fontSize(14).text(`Total Liquidado: $${Number(guia.precio || 0).toLocaleString('es-CO')}`, { align: 'right' });
      
      doc.end();
    } catch (error) {
      console.error(`Error generando PDF automático para ${guia.generator_guia}:`, error);
    }
  }

  static generarTicketFisico(guia) {
    if (!fs.existsSync(PATHS.TICKETS)) {
      fs.mkdirSync(PATHS.TICKETS, { recursive: true });
    }
    const contenido = `
      ============================================================
                      TICKET DE ENVÍO - DETALLE TOTAL
      ============================================================
      GUÍA No: ${guia.generator_guia} | FECHA: ${guia.fecha}
      TAMAÑO: ${guia.tamano} | PESO: ${guia.peso} kg
      FRÁGIL: ${guia.fragil ? "SÍ" : "NO"} | VALOR DECLARADO: $${Number(guia.valor_declarado).toLocaleString()}
      ------------------------------------------------------------
      REMITENTE:
      Nombre:      ${guia.remitente.nombres} ${guia.remitente.apellidos}
      DNI/NIT:     ${guia.remitente.dni_nit}
      Ubicación:   ${guia.remitente.direccion}, ${guia.remitente.ciudad} (${guia.remitente.departamento})
      Contacto:    ${guia.remitente.telefono} | ${guia.remitente.correo}
      ------------------------------------------------------------
      DESTINATARIO:
      Nombre:      ${guia.destinatario.nombres} ${guia.destinatario.apellidos}
      DNI/NIT:     ${guia.destinatario.dni_nit}
      Ubicación:   ${guia.destinatario.direccion}, ${guia.destinatario.ciudad} (${guia.destinatario.departamento})
      Contacto:    ${guia.destinatario.telefono} | ${guia.destinatario.correo}
      ------------------------------------------------------------
      MERCANCÍA:   ${guia.contenido}
      TOTAL PAGADO: $${Number(guia.precio).toLocaleString()}
      ============================================================
    `;
    fs.writeFileSync(join(PATHS.TICKETS, `Ticket_${guia.generator_guia}.txt`), contenido, 'utf8');
  }

  static depurarGuiaEntregada(idGuia) {
    const guias = this.getAll();
    const index = guias.findIndex(g => g.generator_guia === idGuia);

    if (index !== -1) {
      const guiaOriginal = guias[index];

      // Mantenemos solo datos ligeros para el Dashboard Financiero
      guias[index] = {
        generator_guia: guiaOriginal.generator_guia,
        fecha: guiaOriginal.fecha,
        fecha_entrega: guiaOriginal.fecha_entrega || new Date().toISOString(),
        precio: guiaOriginal.precio,
        valor_declarado: guiaOriginal.valor_declarado,
        estado: 'ENTREGADO',
        depurado: true, // Marca de auditoría
        resumen: `Entregado a: ${guiaOriginal.destinatario?.nombres || 'Cliente'}`
      };

      this.saveAll(guias); // Guarda el JSON reducido
      return guiaOriginal; // Retorna los datos completos antes de ser borrados
    }
    return null;
  }
}

module.exports = GuiaModel;