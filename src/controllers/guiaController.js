const GuiaModel = require('../models/guiaModel');
const ClienteModel = require('../models/clienteModel'); // <--- Importar modelo de clientes[cite: 4]
const PDFService = require('../services/pdfService');
const { CAPACIDAD_MAXIMA_DIARIA, TARIFA_BASE_KG, PORCENTAJE_SEGURO, RECARGO_FRAGIL_FIJO } = require('../../config/constants');
const { 
  validarNumero10, 
  validarCorreo, 
  clasificarTamano, 
  comprobarDuplicado, 
  validarCapacidadDiaria,
  parseFechaRegionalAISO,
  validarCiudadesDiferentes
} = require('../utils/validators');

class GuiaController {

  static renderIndex(req, res) {
    let guias = GuiaModel.getAll();
    const clientes = ClienteModel.getAll();
    const usuarioSesion = req.session.usuario; // <--- Usuario actual en sesión
    // Filtrar únicamente las guías activas para la tabla
    // const guiasActivas = guias.filter(g => g.estado === 'PENDIENTE' || g.estado === 'EN CAMINO');

    // 1. Lógica del Filtro de Fechas
    const { fecha_inicio, fecha_fin } = req.query;
    if (fecha_inicio && fecha_fin) {
      const inicio = new Date(`${fecha_inicio}T00:00:00`);
      const fin = new Date(`${fecha_fin}T23:59:59`);

      guias = guias.filter(g => {
        const fechaG = parseFechaRegionalAISO(g.fecha);
        return fechaG >= inicio && fechaG <= fin;
      });
    }

    // 2. Cálculos del Reporte Visual de Balance Financiero
    const totalCaja = guias.reduce((sum, g) => sum + (g.precio || 0), 0);
    const totalDeclarado = guias.reduce((sum, g) => sum + (g.valor_declarado || 0), 0);
    
    // Desglose Contable
    const fondoSeguro = totalDeclarado * 0.02; // 2% Fondo de siniestros
    const baseFlete = totalCaja - fondoSeguro;
    const iva19 = baseFlete > 0 ? (baseFlete * 0.19) / 1.19 : 0; // IVA incluido del 19%
    const utilidadBruta = baseFlete - iva19; // Utilidad limpia de operación[cite: 2]

    const estadoCupo = validarCapacidadDiaria(0, CAPACIDAD_MAXIMA_DIARIA);

    res.render('index', {
      guias,
      clientes,
      usuario: usuarioSesion,
      cargaHoy: estadoCupo.cargaActual,
      capacidadMaxima: CAPACIDAD_MAXIMA_DIARIA,
      disponibleHoy: estadoCupo.disponible,
      metrics: {
        totalCaja,
        totalDeclarado,
        fondoSeguro,
        iva19,
        utilidadBruta
      },
      filtros: { fecha_inicio: fecha_inicio || '', fecha_fin: fecha_fin || '' },
      error: req.query.error || null,
      success: req.query.success || null
    });
  }

  static renderCrear(req, res) {
    // Calculamos el peso ocupado hoy y lo disponible
    const estadoCupo = validarCapacidadDiaria(0, CAPACIDAD_MAXIMA_DIARIA);
    res.render('crear', { 
      error: null,
      cargaHoy: estadoCupo.cargaActual,
      capacidadMaxima: CAPACIDAD_MAXIMA_DIARIA,
      disponibleHoy: estadoCupo.disponible // <--- Peso disponible en kg
    });
  }

  static crearGuia(req, res) {
    const body = req.body;
    // 1. Validaciones Formato DNI (10 dígitos) y Correos
    if (!validarNumero10(body.r_dni_nit) || !validarNumero10(body.d_dni_nit)) {
      const estadoCupo = validarCapacidadDiaria(0, CAPACIDAD_MAXIMA_DIARIA);
      return res.render('crear', { 
        error: "Los DNI/NIT deben ser números exactos de 10 dígitos.",
        cargaHoy: estadoCupo.cargaActual,
        capacidadMaxima: CAPACIDAD_MAXIMA_DIARIA,
        disponibleHoy: estadoCupo.disponible // <--- Peso disponible en kg 
      });
    }

    if (!validarCorreo(body.r_correo) || !validarCorreo(body.d_correo)) {
      const estadoCupo = validarCapacidadDiaria(0, CAPACIDAD_MAXIMA_DIARIA);
      return res.render('crear', { 
        error: "Por favor, ingrese un correo electrónico válido.",
        cargaHoy: estadoCupo.cargaActual,
        capacidadMaxima: CAPACIDAD_MAXIMA_DIARIA,
        disponibleHoy: estadoCupo.disponible // <--- Peso disponible en kg
      });
    }

    // 2. Procesar Objetos de Remitente y Destinatario
    const remitente = {
      dni_nit: parseInt(body.r_dni_nit, 10),
      nombres: body.r_nombres,
      apellidos: body.r_apellidos,
      departamento: body.r_departamento,
      ciudad: body.r_ciudad,
      direccion: body.r_direccion,
      telefono: parseInt(body.r_telefono, 10),
      correo: body.r_correo
    };

    const destinatario = {
      dni_nit: parseInt(body.d_dni_nit, 10),
      nombres: body.d_nombres,
      apellidos: body.d_apellidos,
      departamento: body.d_departamento,
      ciudad: body.d_ciudad,
      direccion: body.d_direccion,
      telefono: parseInt(body.d_telefono, 10),
      correo: body.d_correo
    };

    // Validar que las ciudades no sean iguales
    if (!validarCiudadesDiferentes(remitente.ciudad, destinatario.ciudad)) {
      const estadoCupo = validarCapacidadDiaria(0, CAPACIDAD_MAXIMA_DIARIA);
      return res.render('crear', {
        error: '❌ No se permiten envíos hacia la misma ciudad de origen. El servicio es únicamente intermunicipal.',
        // ... re-enviar datos del formulario si los conservas
        remitente_ciudad: remitente.ciudad,
        destinatario_ciudad: destinatario.ciudad,
        cargaHoy: estadoCupo.cargaActual,
        capacidadMaxima: CAPACIDAD_MAXIMA_DIARIA,
        disponibleHoy: estadoCupo.disponible // <--- Peso disponible en kg
      });
    }
    
    
    // 3. Validar duplicados exactos en base de datos
    if (comprobarDuplicado(remitente.dni_nit, destinatario.dni_nit, body.contenido)) {
      const estadoCupo = validarCapacidadDiaria(0, CAPACIDAD_MAXIMA_DIARIA);
      return res.render('crear', {
        error: "Ya existe un envío registrado idéntico para este remitente y destinatario.",
        cargaHoy: estadoCupo.cargaActual,
        capacidadMaxima: CAPACIDAD_MAXIMA_DIARIA,
        disponibleHoy: estadoCupo.disponible // <--- Peso disponible en kg
      });
    }

    // 4. Cálculo de Peso Facturable (Volumétrico vs Real)
    const pesoReal = parseFloat(body.peso_real);
    let pesoFacturable = pesoReal;

    if (body.aplica_volumen === "SI") {
      const alto = parseFloat(body.alto) || 0;
      const ancho = parseFloat(body.ancho) || 0;
      const largo = parseFloat(body.largo) || 0;
      const pesoVolumetrico = (alto * ancho * largo) / 6000;
      pesoFacturable = Math.max(pesoReal, pesoVolumetrico);
    }

    // 5. Validar Capacidad Diaria Máxima (500 kg)
    const cupo = validarCapacidadDiaria(pesoFacturable, CAPACIDAD_MAXIMA_DIARIA);
    const estadoCupo = validarCapacidadDiaria(0, CAPACIDAD_MAXIMA_DIARIA);
    if (!cupo.valido) {
      return res.render('crear', { 
        error: `Capacidad diaria excedida. Carga actual hoy: ${cupo.cargaActual.toFixed(2)} kg. Intentado: ${pesoFacturable.toFixed(2)} kg. Disponible: ${cupo.disponible.toFixed(2)} kg.`,
        cargaHoy: estadoCupo.cargaActual,
        capacidadMaxima: CAPACIDAD_MAXIMA_DIARIA,
        disponibleHoy: estadoCupo.disponible // <--- Peso disponible en kg
      });
    }

    // Persistir/Actualizar información de Clientes
    ClienteModel.saveOrUpdate(remitente);
    ClienteModel.saveOrUpdate(destinatario);

    // 6. Cálculos de Tarifa Financiera
    const fragil = body.fragil === "SI";
    const valorDeclarado = body.es_minima === "SI" ? 50000 : parseFloat(body.valor_declarado);
    const valorSeguro = valorDeclarado * PORCENTAJE_SEGURO;
    const precioSugeridoPeso = pesoFacturable * TARIFA_BASE_KG;
    const recargoFragil = fragil ? RECARGO_FRAGIL_FIJO : 0;
    const precioTotal = precioSugeridoPeso + valorSeguro + recargoFragil;

    // Generación del ID único y Guardado
    const guias = GuiaModel.getAll();
    let generator_guia;
    do {
      generator_guia = `ENV-${Math.floor(10000 + Math.random() * 90000)}`;
    } while (guias.some(g => g.generator_guia === generator_guia));

    const nuevaGuia = {
      generator_guia,
      remitente,
      destinatario,
      peso: parseFloat(pesoFacturable.toFixed(2)),
      tamano: clasificarTamano(pesoFacturable),
      contenido: body.contenido,
      estado: "PENDIENTE", // <-- por defecto mientras que el node-cron lo cambia al estado EN CAMINO
      precio: precioTotal,
      fragil,
      valor_declarado: valorDeclarado,
      fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString()
    };

    GuiaModel.saveGuia(nuevaGuia);
    res.redirect(`/?success=Guía ${generator_guia} creada exitosamente.`);
  }

  static anularGuia(req, res) {
    const id = req.params.id;
    const eliminada = GuiaModel.deleteById(id);
    if (eliminada) {
      res.redirect(`/?success=Guía ${id} anulada correctamente.`);
    } else {
      res.redirect(`/?error=No se pudo encontrar la guía ${id}.`);
    }
  }

  static exportarCSV(req, res) {
    const guias = GuiaModel.getAll();
    const encabezados = [
      "ID Guia", "Fecha", "Remitente", "DNI Remitente", "Ciudad Origen",
      "Destinatario", "DNI Destinatario", "Ciudad Destino", "Contenido",
      "Peso (kg)", "Fragil", "Valor Declarado", "Total Pagado"
    ];

    const escapeCSV = (texto) => `"${String(texto || "").replace(/"/g, '""')}"`;
    const filas = guias.map(g => [
      escapeCSV(g.generator_guia),
      escapeCSV(new Date(g.fecha).toLocaleString()),
      escapeCSV(`${g.remitente.nombres} ${g.remitente.apellidos}`),
      g.remitente.dni_nit,
      escapeCSV(g.remitente.ciudad),
      escapeCSV(`${g.destinatario.nombres} ${g.destinatario.apellidos}`),
      g.destinatario.dni_nit,
      escapeCSV(g.destinatario.ciudad),
      escapeCSV(g.contenido),
      g.peso,
      g.fragil ? "SI" : "NO",
      g.valor_declarado,
      g.precio
    ].join(";"));

    const csvContent = "\uFEFF" + [encabezados.join(";"), ...filas].join("\n");
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Caja_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  }

  static marcarEntregado(req, res) {
    const id = req.params.id;
    const actualizado = GuiaModel.cambiarEstado(id, 'ENTREGADO');
    
    if (actualizado) {
      res.redirect(`/?success=La guía ${id} ha sido marcada como ENTREGADA.`);
    } else {
      res.redirect(`/?error=No se pudo actualizar la guía ${id}.`);
    }
  }

  static procesarEntregaYDescarga(req, res) {
    const idGuia = req.params.id;

    // 1. Marcar como entregado y obtener la copia completa de la guía
    const guiaCompleta = GuiaModel.getAll().find(g => g.generator_guia === idGuia);

    if (!guiaCompleta) {
      return res.redirect('/?error=Guía no encontrada');
    }

    // 2. Generar y Stream del PDF al cliente
    PDFService.generarComprobante(guiaCompleta, res);

    // 3. Depurar/Vaciar los datos pesados en el JSON después de enviar el archivo
    GuiaModel.depurarGuiaEntregada(idGuia);
  }
}

module.exports = GuiaController;