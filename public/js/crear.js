async function cargarDepartamentos(prefix) {
  const res = await fetch('/api/departamentos');
  const deptos = await res.json();
  const select = document.getElementById(`${prefix}_departamento`);
  select.innerHTML = '<option value="">Seleccione...</option>';
  deptos.forEach(d => select.innerHTML += `<option value="${d}">${d}</option>`);
}

async function cargarCiudades(prefix, ciudadSeleccionada = null) {
  const depto = document.getElementById(`${prefix}_departamento`).value;
  const select = document.getElementById(`${prefix}_ciudad`);
  if (!depto) return select.innerHTML = '';
  
  const res = await fetch(`/api/ciudades/${depto}`);
  const ciudades = await res.json();
  select.innerHTML = '';
  ciudades.forEach(c => {
    const selected = (c === ciudadSeleccionada) ? 'selected' : '';
    select.innerHTML += `<option value="${c}" ${selected}>${c}</option>`;
  });
}

async function toRandomIndex() {
  const response = await fetch('/api/clientes');
  const data = await response.json();
  if (data.success) {
    const arrClientes = data.message;
    const toRandomIndexR = Math.floor(Math.random() * (arrClientes.length - 0) + 0);
    const toRandomIndexD = Math.floor(Math.random() * (arrClientes.length - 0) + 0);
    const elegidoClienteR = arrClientes[toRandomIndexR];
    const elegidoClienteD = arrClientes[toRandomIndexD];
    // console.table(elegidoClienteR);
    // console.table(elegidoClienteD);
  } else {
    // console.error(data.message);
  }
}

async function autocompletar(prefix) {
  const dni = document.getElementById(`${prefix}_dni_nit`).value;
  if (!dni) return alert("Ingrese un DNI");
  
  const res = await fetch(`/api/cliente/${dni}`);
  const data = await res.json();
  
  if (data.success) {
    const c = data.cliente;
    document.getElementById(`${prefix}_nombres`).value = c.nombres;
    document.getElementById(`${prefix}_apellidos`).value = c.apellidos;
    document.getElementById(`${prefix}_direccion`).value = c.direccion;
    document.getElementById(`${prefix}_telefono`).value = c.telefono;
    document.getElementById(`${prefix}_correo`).value = c.correo;
    
    document.getElementById(`${prefix}_departamento`).value = c.departamento;
    await cargarCiudades(prefix, c.ciudad);
  } else {
    alert("Cliente no registrado en el sistema. Ingrese los datos manualmente.");
  }
}

async function getCapacidad() {
  const res = await fetch('/api/guiaCapacidad');
  const data = await res.json();
  const { disponibleHoy } = data;
  const inputPeso = document.getElementById('peso_real');
  const btnGuardar = document.getElementById('btnGuardarGuia');
  const alertaPeso = document.getElementById('alertaCapacidadExcedida');
  if (inputPeso && btnGuardar && alertaPeso) {
  inputPeso.addEventListener('input', (e) => {
    const pesoIngresado = parseFloat(e.target.value) || 0;
    if (typeof disponibleHoy !== "undefined" && pesoIngresado > disponibleHoy) {
      alertaPeso.classList.remove('d-none');
      alertaPeso.textContent = `⚠️ El peso (${pesoIngresado} kg) supera la capacidad disponible de hoy (${disponibleHoy.toFixed(2)} kg).`;
      if (btnGuardar) btnGuardar.disabled = true;
    } else {
      alertaPeso.classList.add('d-none');
      if (btnGuardar) btnGuardar.disabled = false;
    }
  });
}
}

function toggleValorDeclarado() {
  const esMinima = document.getElementById('es_minima').value;
  document.getElementById('div_valor_declarado').style.display = (esMinima === 'NO') ? 'block' : 'none';
}

function toggleDimensiones() {
  const aplica = document.getElementById('aplica_volumen').value;
  document.getElementById('div_dimensiones').style.display = (aplica === 'SI') ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  getCapacidad();
  cargarDepartamentos('r');
  cargarDepartamentos('d');
  toRandomIndex();
  // 1. Identificar el formulario de creación
  const formularioGuia = document.querySelector('form');
  const alertaMismaCiudad = document.getElementById('alertaMismaCiudad');

  if (!formularioGuia) return;

  // 2. Interceptar el evento de envío (Submit / POST)
  formularioGuia.addEventListener('submit', (e) => {
    // Obtener los selects de ciudad de origen y destino
    const selectOrigen = document.getElementById('r_ciudad') || document.querySelector('[name="r_ciudad"]');
    const selectDestino = document.getElementById('d_ciudad') || document.querySelector('[name="d_ciudad"]');

    if (!selectOrigen || !selectDestino) return;

    const origen = selectOrigen.value ? selectOrigen.value.trim().toLowerCase() : '';
    const destino = selectDestino.value ? selectDestino.value.trim().toLowerCase() : '';

    // 3. Validar condición: si son la misma ciudad, CANCELAMOS EL POST
    if (origen !== '' && destino !== '' && origen === destino) {
      e.preventDefault(); // 🛑 Detiene el envío del formulario POST en seco

      if (alertaMismaCiudad) {
        alertaMismaCiudad.textContent = '❌ Envío cancelado: La ciudad de destino no puede ser igual a la de origen (Operación únicamente intermunicipal).';
        alertaMismaCiudad.classList.remove('d-none');
        alertaMismaCiudad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        alert('❌ La ciudad de origen y destino no pueden ser iguales.');
      }
    }
  });
});