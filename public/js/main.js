async function verTicket(generator_guia) {
  try {
    // 1. Obtener los datos de la guía asíncronamente desde el servidor
    const respuesta = await fetch(`/api/guias/${generator_guia}`);
    
    if (!respuesta.ok) {
      throw new Error(`Error en el servidor: ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    const { guia } = datos;
    if (!guia) {
      alert("No se pudo cargar la información de la guía seleccionada.");
      return;
    }

    // 2. Renderizar la información en el Modal
    document.getElementById('ticketNumGuia').textContent = guia.generator_guia;
    document.getElementById('ticketFecha').textContent = new Date(guia.fecha).toLocaleString('es-CO');
    document.getElementById('ticketTamano').textContent = guia.tamano || 'Estándar';
    document.getElementById('ticketFragil').textContent = guia.fragil ? '⚠️ Frágil' : 'Normal';
    document.getElementById('ticketPeso').textContent = `${guia.peso} kg`;
    document.getElementById('ticketValorDeclarado').textContent = `$${Number(guia.valor_declarado).toLocaleString('es-CO')}`;

    // Remitente
    document.getElementById('ticketRemitenteNombre').textContent = `${guia.remitente.nombres} ${guia.remitente.apellidos}`;
    document.getElementById('ticketRemitenteDni').textContent = guia.remitente.dni_nit;
    document.getElementById('ticketRemitenteUbicacion').textContent = `${guia.remitente.direccion}, ${guia.remitente.ciudad} (${guia.remitente.departamento})`;
    document.getElementById('ticketRemitenteContacto').textContent = `Tel: ${guia.remitente.telefono} | Correo: ${guia.remitente.correo}`;

    // Destinatario
    document.getElementById('ticketDestinatarioNombre').textContent = `${guia.destinatario.nombres} ${guia.destinatario.apellidos}`;
    document.getElementById('ticketDestinatarioDni').textContent = guia.destinatario.dni_nit;
    document.getElementById('ticketDestinatarioUbicacion').textContent = `${guia.destinatario.direccion}, ${guia.destinatario.ciudad} (${guia.destinatario.departamento})`;
    document.getElementById('ticketDestinatarioContacto').textContent = `Tel: ${guia.destinatario.telefono} | Correo: ${guia.destinatario.correo}`;

    // Mercancía y Total
    document.getElementById('ticketContenido').textContent = guia.contenido;
    document.getElementById('ticketTotal').textContent = `$${Number(guia.precio).toLocaleString('es-CO')}`;

    // 3. Abrir el modal con Bootstrap 5
    const modalElement = document.getElementById('modalTicket');
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.show();

  } catch (error) {
    console.error("Error al consultar el ticket:", error);
    alert("Ocurrió un error al obtener la guía desde el servidor.");
  }
}

function filtrarPorEstado(estadoSeleccionado) {
  const filas = document.querySelectorAll('.fila-guia');

  filas.forEach(fila => {
    const estadoFila = fila.getAttribute('data-estado');

    if (estadoSeleccionado === 'TODOS' || estadoFila === estadoSeleccionado) {
      fila.style.display = ''; // Muestra la fila
    } else {
      fila.style.display = 'none'; // Oculta la fila
    }
  });
}