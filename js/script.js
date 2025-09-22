//Seleccionar los elementos del DOM
const form = document.querySelector('form');
const inputs = form.querySelectorAll('input');
const panelEstado = document.getElementById('panel-estado');
const numeroInput = document.getElementById('numero');
const errorNumero = document.getElementById('error-numero');

// Seleccionar la tabla
const tablaCuerpo = document.querySelector('#estado-general tbody');

// Manejo de eventos en la tabla de guías usando delegación de eventos
tablaCuerpo.addEventListener('click', (event) => {
  const target = event.target;
  const fila = target.closest('tr');

  // Asegurarse de que el clic fue en un botón dentro de una fila con datos
  if (!fila || !fila.dataset.index || !target.classList.contains('acciones')) {
    return;
  }

  const index = parseInt(fila.dataset.index, 10);

  if (target.classList.contains('refresh-btn')) {
    abrirModalConDatos(index);
  } else if (target.classList.contains('history-btn')) {
    abrirModalHistorial(index);
  }
});

// Seleccionar el modal y elementos relacionados
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

const formBuscarGuia = document.getElementById('form-buscar-guia');
const inputBuscarGuia = document.getElementById('guia');
const resultadoBusquedaDiv = document.getElementById('resultado-busqueda');

//Crea arreglo vacio para almacenar los registros de guías
const registroGuia = [];

//Obtener la fecha actual para el input fecha
const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        fechaInput.value = hoy;
    };

// Valida que el numero de guia sea único y no esté vacío
function validarNumeroGuia() {
  const valor = numeroInput.value.trim();
  if (valor === '') {
    errorNumero.style.display = 'none';
    numeroInput.style.borderColor = '';
    return true;
  }

  // Verificar si el número ya existe en registroGuia
  const existe = registroGuia.some(registro => registro.numero === valor);

  if (existe) {
    errorNumero.style.display = 'inline';
    numeroInput.style.borderColor = 'red';
    return false;
  } else {
    errorNumero.style.display = 'none';
    numeroInput.style.borderColor = '';
    return true;
  }
}

// Validar al cambiar el valor o al perder foco
numeroInput.addEventListener('input', validarNumeroGuia);
numeroInput.addEventListener('blur', validarNumeroGuia);

// El evento submit para validar antes de agregar
form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (validarNumeroGuia()) {
    agregarElemento(registroGuia, inputs);
  } else {
    numeroInput.focus();
  }
});

// Variable para guardar el índice del registro que se está editando o viendo historial
let indiceRegistroActivo = null;

// Función para abrir el modal con datos de la fila para editar estado
function abrirModalConDatos(index) {
  indiceRegistroActivo = index;

  const registro = registroGuia[index];

  modalBody.innerHTML = `
    <p><strong>Destinatario:</strong> ${registro.destinatario}</p>
    <p><strong>Estado:</strong> 
      <select id="estado-select" class="select-modal">
        <option value="Pendiente" ${registro.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
        <option value="En Transito" ${registro.estado === 'En Transito' ? 'selected' : ''}>En Transito</option>
        <option value="Entregado" ${registro.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
      </select>
    </p>
    <p><strong>Número:</strong> ${registro.numero}</p>
    <p><strong>Origen:</strong> ${registro.origen}</p>
    <p><strong>Destino:</strong> ${registro.destino}</p>
    <p><strong>Fecha de registro:</strong> ${registro.fecha}</p>
    <button id="guardar-cambios-btn" class="botones-modal">Guardar Cambios</button>
  `;

  modal.style.display = 'block';

  const guardarBtn = document.getElementById('guardar-cambios-btn');
  guardarBtn.addEventListener('click', () => {
    guardarCambiosEstado();
  });
}

// Función para guardar los cambios del estado y actualizar historial
function guardarCambiosEstado() {
  const estadoSelect = document.getElementById('estado-select');
  const nuevoEstado = estadoSelect.value;

  if (indiceRegistroActivo !== null) {
    const registro = registroGuia[indiceRegistroActivo];

    if (registro.estado !== nuevoEstado) {
      // Actualizar estado
      registro.estado = nuevoEstado;

      // Agregar al historial con fecha y hora actual
      if (!registro.historialEstado) {
        registro.historialEstado = [];
      }
      const fechaHora = new Date().toLocaleString();
      registro.historialEstado.push({ estado: nuevoEstado, fechaHora });
    }

    mostrarRegistros();
    modal.style.display = 'none';
    indiceRegistroActivo = null;
  }
}

// Función para abrir modal con historial de estado
function abrirModalHistorial(index) {
  indiceRegistroActivo = index;
  const registro = registroGuia[index];

  let historialHTML = '<h3>Historial de Estado</h3>';

  if (registro.historialEstado && registro.historialEstado.length > 0) {
    historialHTML += '<ul>';
    registro.historialEstado.forEach((item) => {
      historialHTML += `<li><strong>${item.estado}</strong> - ${item.fechaHora}</li>`;
    });
    historialHTML += '</ul>';
  } else {
    historialHTML += '<p>No hay historial de cambios.</p>';
  }

  modalBody.innerHTML = historialHTML;
  modal.style.display = 'block';
}

// Evento para cerrar el modal al hacer clic en la X
modalClose.addEventListener('click', () => {
  modal.style.display = 'none';
  indiceRegistroActivo = null;
});

// Función mostrarRegistros para agregar los botones de actualizar y historial
function mostrarRegistros() {
  tablaCuerpo.innerHTML = '';

  actualizarPanelEstado();

  if (registroGuia.length === 0) {
    const fila = document.createElement('tr');
    fila.innerHTML = `<td class="no-data" colspan="7">No hay guías registradas.</td>`;
    tablaCuerpo.appendChild(fila);
    return;
  }

  registroGuia.forEach((registro, index) => {
    const fila = document.createElement('tr');
    fila.dataset.index = index; // Añadir índice para delegación de eventos

    fila.innerHTML = `
      <td>${registro.destinatario}</td>
      <td>${registro.estado}</td>
      <td>${registro.numero}</td>
      <td>${registro.origen}</td>
      <td>${registro.destino}</td>
      <td>${registro.fecha}</td>
      <td>
        <img src="img/refresh.png" alt="Actualizar datos" class="acciones refresh-btn" title="Da clic para actualizar el estado" style="cursor:pointer; margin-right: 10px;">
        <img src="img/history.png" alt="Historial" class="acciones history-btn" title="Da clic para ver el historial del estado" style="cursor:pointer;">
      </td>
    `;

    tablaCuerpo.appendChild(fila);

  });
}

// // Modificar la función agregarElemento para inicializar historialEstado
function agregarElemento(registroGuia, inputs) {
  const nuevoRegistro = {
    destinatario: inputs[0].value,
    estado: inputs[1].value,
    numero: inputs[2].value,
    origen: inputs[3].value,
    destino: inputs[4].value,
    fecha: inputs[5].value,
    historialEstado: []
  };

  // Agregar el estado inicial al historial con fecha y hora actual
  const fechaHora = new Date().toLocaleString();
  nuevoRegistro.historialEstado.push({ estado: nuevoRegistro.estado, fechaHora });

  registroGuia.push(nuevoRegistro);

  mostrarRegistros();

  form.reset();

  fechaInput.value = new Date().toISOString().split('T')[0];
}

function actualizarPanelEstado() {
  const totalGuias = registroGuia.length;
  const pendientes = registroGuia.filter(r => r.estado === 'Pendiente').length;
  const enTransito = registroGuia.filter(r => r.estado === 'En Transito').length;
  const entregadas = registroGuia.filter(r => r.estado === 'Entregado').length;

  const filaTotales = document.getElementById('totales-estado');
  if (filaTotales) {
    filaTotales.cells[0].textContent = totalGuias;
    filaTotales.cells[1].textContent = pendientes;
    filaTotales.cells[2].textContent = enTransito;
    filaTotales.cells[3].textContent = entregadas;
  }
}

formBuscarGuia.addEventListener('submit', (event) => {
  event.preventDefault();

  const numeroBusqueda = inputBuscarGuia.value.trim();
  if (!numeroBusqueda) {
    resultadoBusquedaDiv.innerHTML = '<p style="color:red;">Por favor, ingresa un número de guía para buscar.</p>';
    return;
  }

  // Buscar la guía en registroGuia
  const guiaEncontrada = registroGuia.find(registro => registro.numero === numeroBusqueda);

  if (!guiaEncontrada) {
    resultadoBusquedaDiv.innerHTML = `<p style="color:red;">No se encontró ninguna guía con el número ${numeroBusqueda}.</p>`;
    return;
  }

  // Obtener la última actualización del estado (del historial)
  let ultimaActualizacion = 'No disponible';
  if (guiaEncontrada.historialEstado && guiaEncontrada.historialEstado.length > 0) {
    const ultimo = guiaEncontrada.historialEstado[guiaEncontrada.historialEstado.length - 1];
    ultimaActualizacion = `${ultimo.estado} - ${ultimo.fechaHora}`;
  }

  // Mostrar los datos completos
  resultadoBusquedaDiv.innerHTML = `
    <h3>Datos de la Guía Número ${guiaEncontrada.numero}</h3>
    <p><strong>Destinatario:</strong> ${guiaEncontrada.destinatario}</p>
    <p><strong>Estado actual:</strong> ${guiaEncontrada.estado}</p>
    <p><strong>Última actualización:</strong> ${ultimaActualizacion}</p>
    <p><strong>Origen:</strong> ${guiaEncontrada.origen}</p>
    <p><strong>Destino:</strong> ${guiaEncontrada.destino}</p>
    <p><strong>Fecha de registro:</strong> ${guiaEncontrada.fecha}</p>
  `;
});