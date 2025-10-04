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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Variables globales
let conversacionId = null;
let usuarioActual = null;
let mensajesNoLeidos = 0;
let chatInicializado = false;
let unsubscribeMensajes = null;
let unsubscribeAuth = null;

// Generar ID seguro con Web Crypto API
function generarIdSeguro() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return 'guest_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Inicializar solo los event listeners básicos
document.addEventListener('DOMContentLoaded', function() {
  const chatBadge = document.getElementById('chatBadge');
  if (chatBadge) {
    chatBadge.style.display = 'none';
  }
  
  // Inicializar autenticación inmediatamente para el contador
  inicializarAuthParaContador();
  
  // Configurar el botón de toggle
  const chatToggle = document.getElementById('chatToggle');
  if (chatToggle) {
    chatToggle.addEventListener('click', inicializarChatLazy);
  }
});

// Inicializar solo la autenticación y contador, no toda la UI del chat
async function inicializarAuthParaContador() {
  const auth = getAuth();
  
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario autenticado
      usuarioActual = {
        uid: user.uid,
        email: user.email
      };
      cargarConversacionUsuario(); // Solo para el contador
    } else {
      // Usuario invitado
      let guestId = localStorage.getItem('guestChatId');
      if (!guestId) {
        guestId = generarIdSeguro();
        localStorage.setItem('guestChatId', guestId);
      }
      
      usuarioActual = {
        uid: guestId,
        email: 'invitado@valdore.com'
      };
      cargarConversacionUsuario(); // Solo para el contador
    }
  });
}

// Inicialización lazy - solo cuando el usuario hace clic
async function inicializarChatLazy() {
  // Si ya está inicializado, solo toggle
  if (chatInicializado) {
    toggleChat();
    return;
  }

  console.log('Inicializando UI del chat por primera vez...');
  chatInicializado = true;

  // Remover este listener y agregar el normal
  const chatToggle = document.getElementById('chatToggle');
  if (chatToggle) {
    chatToggle.removeEventListener('click', inicializarChatLazy);
    chatToggle.addEventListener('click', toggleChat);
  }

  // Ahora sí inicializar la UI completa del chat
  await inicializarUICompleta();
  
  // Abrir el chat inmediatamente después de inicializar
  abrirChat();
}

async function inicializarUICompleta() {
  // Configurar event listeners de UI
  const chatClose = document.getElementById('chatClose');
  const enviarMensajeBtn = document.getElementById('enviarMensajeChat');
  
  if (chatClose) {
    chatClose.addEventListener('click', cerrarChat);
  }
  
  if (enviarMensajeBtn) {
    enviarMensajeBtn.addEventListener('click', enviarMensaje);
  }
  
  const mensajeInput = document.getElementById('mensajeChat');
  if (mensajeInput) {
    mensajeInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensaje();
      }
    });
  }
  
  // Si ya tenemos una conversación, cargar los mensajes
  if (conversacionId) {
    suscribirMensajes(conversacionId);
  } else {
    mostrarMensajeBienvenida();
  }
}

function toggleChat() {
  const chatWindow = document.getElementById('chatWindow');
  if (chatWindow.classList.contains('active')) {
    cerrarChat();
  } else {
    abrirChat();
  }
}

function abrirChat() {
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.classList.add('active');
  
  marcarMensajesComoLeidos();
  
  setTimeout(() => {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, 100);
}

function cerrarChat() {
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.classList.remove('active');
}

async function cargarConversacionUsuario() {
  try {
    const q = query(
      collection(db, "conversacionesClientes"),
      where("usuarioId", "==", usuarioActual.uid),
      orderBy("fechaUltimoMensaje", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const conversacionDoc = querySnapshot.docs[0];
      conversacionId = conversacionDoc.id;
      
      // Suscribirse a mensajes inmediatamente para el contador
      suscribirMensajes(conversacionId);
    } else {
      // Si no hay conversación, mostrar bienvenida solo si la UI está inicializada
      if (chatInicializado) {
        mostrarMensajeBienvenida();
      }
      actualizarContadorMensajes(0);
    }
    
  } catch (error) {
    console.error("Error cargando conversación:", error);
    if (chatInicializado) {
      mostrarMensajeBienvenida();
    }
    actualizarContadorMensajes(0);
  }
}

function suscribirMensajes(conversacionId) {
  // Si ya existe una suscripción, cancelarla primero
  if (unsubscribeMensajes) {
    unsubscribeMensajes();
  }

  const mensajesRef = collection(db, "conversacionesClientes", conversacionId, "mensajes");
  const q = query(mensajesRef, orderBy("fecha", "asc"));
  
  // Guardar la función de desuscripción
  unsubscribeMensajes = onSnapshot(q, (snapshot) => {
    // Solo manipular el DOM si el chat está inicializado
    if (chatInicializado) {
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.innerHTML = '';
    }
    
    let contadorNoLeidos = 0;
    const chatWindow = document.getElementById('chatWindow');
    const chatAbierto = chatWindow?.classList.contains('active');
    
    snapshot.forEach((doc) => {
      const mensaje = doc.data();
      
      // Solo agregar al DOM si el chat está inicializado
      if (chatInicializado) {
        agregarMensajeAlChat(mensaje);
      }
      
      // Siempre contar mensajes no leídos, independientemente del estado del chat
      if (mensaje.remitente === 'admin' && mensaje.leido === false && !chatAbierto) {
        contadorNoLeidos++;
      }
    });
    
    mensajesNoLeidos = contadorNoLeidos;
    actualizarContadorMensajes(mensajesNoLeidos);
    
    // Solo hacer scroll si el chat está inicializado y abierto
    if (chatInicializado) {
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, (error) => {
    console.error("Error en suscripción de mensajes:", error);
  });
}

function mostrarMensajeBienvenida() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = `
    <div class="chat-welcome">
      <p>¡Hola! ¿En qué podemos ayudarte?</p>
      <p>Estamos aquí para responder tus preguntas sobre nuestros productos, pedidos o cualquier consulta que tengas.</p>
    </div>
  `;
}

function agregarMensajeAlChat(mensaje) {
  const chatMessages = document.getElementById('chatMessages');
  
  const welcomeMsg = chatMessages.querySelector('.chat-welcome');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }
  
  const mensajeElement = document.createElement('div');
  mensajeElement.className = `mensaje-chat ${mensaje.remitente === 'admin' ? 'mensaje-admin' : 'mensaje-cliente'}`;
  
  const fecha = mensaje.fecha?.toDate ? mensaje.fecha.toDate() : new Date();
  const fechaFormateada = fecha.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  mensajeElement.innerHTML = `
    <div class="mensaje-contenido">
      <p>${mensaje.contenido}</p>
      <span class="mensaje-hora">${fechaFormateada}</span>
    </div>
  `;
  
  chatMessages.appendChild(mensajeElement);
}

async function enviarMensaje() {
  const mensajeInput = document.getElementById('mensajeChat');
  const mensajeTexto = mensajeInput.value.trim();
  
  if (!mensajeTexto) return;
  
  try {
    if (!conversacionId) {
      const nuevaConversacion = {
        usuarioId: usuarioActual.uid,
        usuarioEmail: usuarioActual.email || 'Cliente invitado',
        fechaCreacion: Timestamp.now(),
        fechaUltimoMensaje: Timestamp.now(),
        estado: 'activa'
      };
      
      const conversacionRef = await addDoc(collection(db, "conversacionesClientes"), nuevaConversacion);
      conversacionId = conversacionRef.id;
      suscribirMensajes(conversacionId);
    }
    
    const nuevoMensaje = {
      contenido: mensajeTexto,
      remitente: 'cliente',
      fecha: Timestamp.now(),
      leido: true
    };
    
    await addDoc(collection(db, "conversacionesClientes", conversacionId, "mensajes"), nuevoMensaje);
    
    await updateDoc(doc(db, "conversacionesClientes", conversacionId), {
      fechaUltimoMensaje: Timestamp.now()
    });
    
    mensajeInput.value = '';
    
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    alert("Error al enviar el mensaje. Por favor, intenta nuevamente.");
  }
}

async function marcarMensajesComoLeidos() {
  if (!conversacionId) return;
  
  try {
    const mensajesRef = collection(db, "conversacionesClientes", conversacionId, "mensajes");
    const q = query(
      mensajesRef, 
      where("remitente", "==", "admin"),
      where("leido", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    
    const actualizaciones = querySnapshot.docs.map(docSnap => 
      updateDoc(doc(db, "conversacionesClientes", conversacionId, "mensajes", docSnap.id), {
        leido: true
      })
    );
    
    await Promise.all(actualizaciones);
    
    mensajesNoLeidos = 0;
    actualizarContadorMensajes(0);
    
  } catch (error) {
    console.error("Error marcando mensajes como leídos:", error);
  }
}

function actualizarContadorMensajes(cantidad) {
  const chatBadge = document.getElementById('chatBadge');
  
  if (!chatBadge) return;
  
  if (cantidad > 0) {
    chatBadge.textContent = cantidad;
    chatBadge.style.cssText = `
      position: absolute !important;
      top: -5px !important;
      right: -5px !important;
      background: #ef4444 !important;
      color: white !important;
      width: 24px !important;
      height: 24px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 0.75rem !important;
      font-weight: bold !important;
      border: 2px solid white !important;
      z-index: 9999 !important;
    `;
  } else {
    chatBadge.style.display = 'none';
  }
}

// Listener para cerrar chat al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!chatInicializado) return;
  
  const chatWindow = document.getElementById('chatWindow');
  const chatToggle = document.getElementById('chatToggle');
  
  if (chatWindow && chatToggle && 
      !chatWindow.contains(e.target) && 
      e.target !== chatToggle &&
      chatWindow.classList.contains('active')) {
    cerrarChat();
  }
});

// Limpiar suscripciones cuando la página se descarga
window.addEventListener('beforeunload', () => {
  if (unsubscribeMensajes) {
    unsubscribeMensajes();
  }
  if (unsubscribeAuth) {
    unsubscribeAuth();
  }
});

// Función para limpiar recursos manualmente (útil para SPAs)
export function limpiarChat() {
  if (unsubscribeMensajes) {
    unsubscribeMensajes();
    unsubscribeMensajes = null;
  }
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
  chatInicializado = false;
  conversacionId = null;
  usuarioActual = null;
  mensajesNoLeidos = 0;
  console.log('Chat limpiado correctamente');
}