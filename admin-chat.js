import { db } from './firebaseconfig.js';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  Timestamp,
  onSnapshot,
  updateDoc,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Variables globales para el chat
let conversacionesData = [];
let conversacionActiva = null;
let unsubscribeConversaciones = null;
let unsubscribeMensajes = null;

// Elementos del DOM
const conversacionesLista = document.getElementById('conversacionesLista');
const buscarConversacion = document.getElementById('buscarConversacion');
const filtroConversacionesEstado = document.getElementById('filtroConversacionesEstado');
const actualizarConversaciones = document.getElementById('actualizarConversaciones');
const chatMessages = document.getElementById('chatMessages');
const clienteNombre = document.getElementById('clienteNombre');
const clienteEmail = document.getElementById('clienteEmail');
const chatStatus = document.getElementById('chatStatus');
const mensajeAdmin = document.getElementById('mensajeAdmin');
const enviarMensajeAdmin = document.getElementById('enviarMensajeAdmin');
const chatInputContainer = document.getElementById('chatInputContainer');

// Inicializar el sistema de chat cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  // Esperar a que se cargue el admin.js y se configuren los tabs
  setTimeout(() => {
    inicializarChatAdmin();
  }, 100);
});

function inicializarChatAdmin() {
  console.log('Inicializando chat admin...');
  
  // Configurar event listeners
  if (buscarConversacion) {
    buscarConversacion.addEventListener('input', filtrarConversaciones);
  }
  
  if (filtroConversacionesEstado) {
    filtroConversacionesEstado.addEventListener('change', filtrarConversaciones);
  }
  
  if (actualizarConversaciones) {
    actualizarConversaciones.addEventListener('click', cargarConversaciones);
  }
  
  if (enviarMensajeAdmin) {
    enviarMensajeAdmin.addEventListener('click', enviarMensajeComoAdmin);
  }
  
  if (mensajeAdmin) {
    mensajeAdmin.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensajeComoAdmin();
      }
    });
  }
  
  // Escuchar cuando se cambie al tab de chat
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    if (button.dataset.tab === 'chat') {
      button.addEventListener('click', () => {
        setTimeout(() => {
          cargarConversaciones();
        }, 100);
      });
    }
  });
  
  // Cargar conversaciones inicialmente si el tab de chat está activo
  const tabChat = document.getElementById('tab-chat');
  if (tabChat && tabChat.classList.contains('active')) {
    cargarConversaciones();
  }
}

// Cargar todas las conversaciones de clientes
async function cargarConversaciones() {
  try {
    // Cancelar suscripción anterior si existe
    if (unsubscribeConversaciones) {
      unsubscribeConversaciones();
    }
    
    mostrarCargandoConversaciones();
    
    // Consultar conversaciones ordenadas por fecha del último mensaje
    const q = query(
      collection(db, "conversacionesClientes"), 
      orderBy("fechaUltimoMensaje", "desc")
    );
    
    // Escuchar cambios en tiempo real
    unsubscribeConversaciones = onSnapshot(q, (snapshot) => {
      conversacionesData = [];
      
      snapshot.forEach((documento) => {
        const data = documento.data();
        conversacionesData.push({
          id: documento.id,
          usuarioId: data.usuarioId,
          usuarioEmail: data.usuarioEmail || 'Cliente sin email',
          fechaCreacion: data.fechaCreacion,
          fechaUltimoMensaje: data.fechaUltimoMensaje,
          estado: data.estado || 'activa',
          mensajesSinLeer: 0 // Se calculará después
        });
      });
      
      // Calcular mensajes sin leer para cada conversación
      calcularMensajesSinLeer();
      
      mostrarConversaciones();
    }, (error) => {
      console.error("Error cargando conversaciones:", error);
      mostrarErrorConversaciones();
    });
    
  } catch (error) {
    console.error("Error inicializando conversaciones:", error);
    mostrarErrorConversaciones();
  }
}

// Calcular mensajes sin leer para cada conversación
async function calcularMensajesSinLeer() {
  for (let conversacion of conversacionesData) {
    try {
      const mensajesRef = collection(db, "conversacionesClientes", conversacion.id, "mensajes");
      const q = query(
        mensajesRef, 
        where("remitente", "==", "cliente"),
        where("leido", "==", false)
      );
      
      const snapshot = await getDocs(q);
      conversacion.mensajesSinLeer = snapshot.size;
    } catch (error) {
      console.error("Error contando mensajes sin leer:", error);
      conversacion.mensajesSinLeer = 0;
    }
  }
}

// Mostrar conversaciones en la lista
function mostrarConversaciones() {
  if (!conversacionesLista) return;
  
  const conversacionesFiltradas = filtrarConversacionesData();
  
  if (conversacionesFiltradas.length === 0) {
    conversacionesLista.innerHTML = `
      <div class="empty-conversaciones">
        <p>💬 No hay conversaciones</p>
        <small>Las conversaciones aparecerán cuando los clientes envíen mensajes</small>
      </div>
    `;
    return;
  }
  
  conversacionesLista.innerHTML = conversacionesFiltradas.map(conversacion => {
    const fechaFormateada = formatearFechaRelativa(conversacion.fechaUltimoMensaje);
    const esActiva = conversacionActiva?.id === conversacion.id;
    const tieneMensajesSinLeer = conversacion.mensajesSinLeer > 0;
    
    return `
      <div class="conversacion-item ${esActiva ? 'activa' : ''} ${tieneMensajesSinLeer ? 'sin-leer' : ''}"
           onclick="seleccionarConversacion('${conversacion.id}')">
        <div class="conversacion-avatar">
          <span>👤</span>
        </div>
        <div class="conversacion-info">
          <div class="conversacion-header">
            <h4>${conversacion.usuarioEmail}</h4>
            <span class="conversacion-tiempo">${fechaFormateada}</span>
          </div>
          <div class="conversacion-preview">
            <span>ID: ${conversacion.usuarioId.substring(0, 8)}...</span>
            ${tieneMensajesSinLeer ? `<span class="mensajes-sin-leer">${conversacion.mensajesSinLeer}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Filtrar conversaciones
function filtrarConversaciones() {
  mostrarConversaciones();
}

function filtrarConversacionesData() {
  let conversacionesFiltradas = [...conversacionesData];
  
  // Filtrar por búsqueda
  const busqueda = buscarConversacion?.value.toLowerCase();
  if (busqueda) {
    conversacionesFiltradas = conversacionesFiltradas.filter(c => 
      c.usuarioEmail.toLowerCase().includes(busqueda) || 
      c.usuarioId.toLowerCase().includes(busqueda)
    );
  }
  
  // Filtrar por estado
  const filtro = filtroConversacionesEstado?.value;
  if (filtro === 'sin-responder') {
    conversacionesFiltradas = conversacionesFiltradas.filter(c => c.mensajesSinLeer > 0);
  } else if (filtro === 'activas') {
    conversacionesFiltradas = conversacionesFiltradas.filter(c => c.estado === 'activa');
  }
  
  return conversacionesFiltradas;
}

// Seleccionar una conversación
window.seleccionarConversacion = function(conversacionId) {
  const conversacion = conversacionesData.find(c => c.id === conversacionId);
  if (!conversacion) return;
  
  conversacionActiva = conversacion;
  
  // Actualizar header del chat
  if (clienteNombre) clienteNombre.textContent = conversacion.usuarioEmail;
  if (clienteEmail) clienteEmail.textContent = `ID: ${conversacion.usuarioId}`;
  if (chatStatus) {
    chatStatus.innerHTML = `<span class="status-indicator online"></span> En línea`;
  }
  
  // Mostrar área de input
  if (chatInputContainer) chatInputContainer.style.display = 'block';
  
  // Cargar mensajes de la conversación
  cargarMensajesConversacion(conversacionId);
  
  // Actualizar la lista para resaltar la conversación activa
  mostrarConversaciones();
  
  // Marcar mensajes como leídos
  marcarMensajesComoLeidos(conversacionId);
};

// Cargar mensajes de una conversación específica
function cargarMensajesConversacion(conversacionId) {
  // Cancelar suscripción anterior si existe
  if (unsubscribeMensajes) {
    unsubscribeMensajes();
  }
  
  const mensajesRef = collection(db, "conversacionesClientes", conversacionId, "mensajes");
  const q = query(mensajesRef, orderBy("fecha", "asc"));
  
  unsubscribeMensajes = onSnapshot(q, (snapshot) => {
    if (!chatMessages) return;
    
    chatMessages.innerHTML = '';
    
    if (snapshot.empty) {
      chatMessages.innerHTML = `
        <div class="chat-welcome">
          <p>💬 Conversación iniciada</p>
          <p>Puedes comenzar a chatear con este cliente.</p>
        </div>
      `;
      return;
    }
    
    snapshot.forEach((doc) => {
      const mensaje = doc.data();
      agregarMensajeAlChat(mensaje);
    });
    
    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// Agregar mensaje al chat
// function agregarMensajeAlChat(mensaje) {
//   if (!chatMessages) return;
  
//   // Limpiar mensaje de bienvenida si existe
//   const welcomeMsg = chatMessages.querySelector('.chat-welcome');
//   if (welcomeMsg) {
//     welcomeMsg.remove();
//   }
  
//   const mensajeElement = document.createElement('div');
//   mensajeElement.className = `mensaje-chat-admin ${mensaje.remitente === 'admin' ? 'mensaje-admin' : 'mensaje-cliente'}`;
  
//   const fecha = mensaje.fecha?.toDate ? mensaje.fecha.toDate() : new Date();
//   const fechaFormateada = fecha.toLocaleTimeString('es-CO', { 
//     hour: '2-digit', 
//     minute: '2-digit' 
//   });
  
//   const esAdmin = mensaje.remitente === 'admin';
  
//   mensajeElement.innerHTML = `
//     <div class="mensaje-contenido-admin">
//       <div class="mensaje-avatar">
//         ${esAdmin ? '👨‍💼' : '👤'}
//       </div>
//       <div class="mensaje-texto">
//         <div class="mensaje-header-admin">
//           <span class="remitente">${esAdmin ? 'Tú (Admin)' : 'Cliente'}</span>
//           <span class="mensaje-hora">${fechaFormateada}</span>
//         </div>
//         <p>${mensaje.contenido}</p>
//       </div>
//     </div>
//   `;
  
//   chatMessages.appendChild(mensajeElement);
// }
// Agregar mensaje al chat
function agregarMensajeAlChat(mensaje) {
  if (!chatMessages) return;
  
  // Limpiar mensaje de bienvenida si existe
  const welcomeMsg = chatMessages.querySelector('.chat-welcome');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }
  
  const mensajeElement = document.createElement('div');
  const esAdmin = mensaje.remitente === 'admin';
  
  // Añadir clase mensaje-largo si el contenido es extenso
  const esMensajeLargo = mensaje.contenido.length > 200;
  mensajeElement.className = `mensaje-chat-admin ${esAdmin ? 'mensaje-admin' : 'mensaje-cliente'} ${esMensajeLargo ? 'mensaje-largo' : ''}`;
  
  const fecha = mensaje.fecha?.toDate ? mensaje.fecha.toDate() : new Date();
  const fechaFormateada = fecha.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  mensajeElement.innerHTML = `
    <div class="mensaje-contenido-admin">
      <div class="mensaje-avatar">
        ${esAdmin ? '👨‍💼' : '👤'}
      </div>
      <div class="mensaje-texto">
        <div class="mensaje-header-admin">
          <span class="remitente">${esAdmin ? 'Tú (Admin)' : 'Cliente'}</span>
          <span class="mensaje-hora">${fechaFormateada}</span>
        </div>
        <p>${mensaje.contenido}</p>
      </div>
    </div>
  `;
  
  chatMessages.appendChild(mensajeElement);
}

// Enviar mensaje como administrador
async function enviarMensajeComoAdmin() {
  if (!conversacionActiva || !mensajeAdmin) return;
  
  const mensajeTexto = mensajeAdmin.value.trim();
  if (!mensajeTexto) return;
  
  try {
    // Crear mensaje
const nuevoMensaje = {
  contenido: mensajeTexto,
  remitente: 'admin',
  fecha: Timestamp.now(),
  leido: false // ✅ Los mensajes del admin empiezan como NO LEÍDOS
};
    
    // Agregar mensaje a la conversación
    await addDoc(collection(db, "conversacionesClientes", conversacionActiva.id, "mensajes"), nuevoMensaje);
    
    // Actualizar fecha del último mensaje
    await updateDoc(doc(db, "conversacionesClientes", conversacionActiva.id), {
      fechaUltimoMensaje: Timestamp.now()
    });
    
    // Limpiar input
    mensajeAdmin.value = '';
    
    // Redimensionar textarea
    mensajeAdmin.style.height = 'auto';
    
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    mostrarNotificacionChat("Error al enviar el mensaje. Intenta nuevamente.", 'error');
  }
}

// Marcar mensajes del cliente como leídos
async function marcarMensajesComoLeidos(conversacionId) {
  try {
    const mensajesRef = collection(db, "conversacionesClientes", conversacionId, "mensajes");
    const q = query(
      mensajesRef, 
      where("remitente", "==", "cliente"),
      where("leido", "==", false)
    );
    
    const snapshot = await getDocs(q);
    
    const actualizaciones = [];
    snapshot.forEach((documento) => {
      actualizaciones.push(
        updateDoc(doc(db, "conversacionesClientes", conversacionId, "mensajes", documento.id), {
          leido: true
        })
      );
    });
    
    await Promise.all(actualizaciones);
    
    // Actualizar contador local
    const conversacion = conversacionesData.find(c => c.id === conversacionId);
    if (conversacion) {
      conversacion.mensajesSinLeer = 0;
    }
    
  } catch (error) {
    console.error("Error marcando mensajes como leídos:", error);
  }
}

// Utilidades
function formatearFechaRelativa(fecha) {
  if (!fecha) return 'Hace tiempo';
  
  try {
    let fechaObj;
    if (fecha.toDate) {
      fechaObj = fecha.toDate();
    } else {
      fechaObj = new Date(fecha);
    }
    
    const ahora = new Date();
    const diferencia = ahora - fechaObj;
    
    // Menos de 1 minuto
    if (diferencia < 60000) {
      return 'Ahora';
    }
    
    // Menos de 1 hora
    if (diferencia < 3600000) {
      const minutos = Math.floor(diferencia / 60000);
      return `Hace ${minutos}m`;
    }
    
    // Menos de 24 horas
    if (diferencia < 86400000) {
      const horas = Math.floor(diferencia / 3600000);
      return `Hace ${horas}h`;
    }
    
    // Más de 24 horas
    const dias = Math.floor(diferencia / 86400000);
    if (dias === 1) {
      return 'Ayer';
    } else if (dias < 7) {
      return `Hace ${dias} días`;
    } else {
      return fechaObj.toLocaleDateString('es-CO', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
    
  } catch (error) {
    return 'Fecha inválida';
  }
}

function mostrarCargandoConversaciones() {
  if (conversacionesLista) {
    conversacionesLista.innerHTML = `
      <div class="loading-conversaciones">
        <p>⏳ Cargando conversaciones...</p>
      </div>
    `;
  }
}

function mostrarErrorConversaciones() {
  if (conversacionesLista) {
    conversacionesLista.innerHTML = `
      <div class="error-conversaciones">
        <p>❌ Error cargando conversaciones</p>
        <button onclick="cargarConversaciones()" class="btn-reintentar">🔄 Reintentar</button>
      </div>
    `;
  }
}

function mostrarNotificacionChat(mensaje, tipo = 'info') {
  // Usar el mismo sistema de notificaciones del admin.js
  if (window.mostrarNotificacion) {
    window.mostrarNotificacion(mensaje, tipo);
  } else {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
  }
}

// Limpiar suscripciones cuando se cambie de página
window.addEventListener('beforeunload', () => {
  if (unsubscribeConversaciones) {
    unsubscribeConversaciones();
  }
  if (unsubscribeMensajes) {
    unsubscribeMensajes();
  }
});

// Auto-resize del textarea
document.addEventListener('DOMContentLoaded', function() {
  const textarea = document.getElementById('mensajeAdmin');
  if (textarea) {
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }
});