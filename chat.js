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

// Inicializar el chat
document.addEventListener('DOMContentLoaded', function() {
  inicializarChat();
});

async function inicializarChat() {
  // Verificar autenticación
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      usuarioActual = user;
      cargarConversacionUsuario();
    } else {
      // Usuario no autenticado, usar identificador local
      usuarioActual = {
        uid: localStorage.getItem('chatUserId') || generarIdUsuario(),
        email: 'invitado@valdore.com'
      };
      localStorage.setItem('chatUserId', usuarioActual.uid);
      cargarConversacionUsuario();
    }
  });

  // Configurar event listeners
  const chatToggle = document.getElementById('chatToggle');
  const chatClose = document.getElementById('chatClose');
  const enviarMensajeBtn = document.getElementById('enviarMensajeChat');
  
  if (chatToggle) {
    chatToggle.addEventListener('click', toggleChat);
  }
  
  if (chatClose) {
    chatClose.addEventListener('click', cerrarChat);
  }
  
  if (enviarMensajeBtn) {
    enviarMensajeBtn.addEventListener('click', enviarMensaje);
  }
  
  // Enviar mensaje con Enter
  const mensajeInput = document.getElementById('mensajeChat');
  if (mensajeInput) {
    mensajeInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensaje();
      }
    });
  }
}

// Alternar visibilidad del chat
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
  
  // Scroll al final de los mensajes
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

// Cargar conversación del usuario
async function cargarConversacionUsuario() {
  try {
    // Buscar conversación existente
    const q = query(
      collection(db, "conversacionesClientes"),
      where("usuarioId", "==", usuarioActual.uid),
      orderBy("fechaUltimoMensaje", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Conversación existente encontrada
      const conversacionDoc = querySnapshot.docs[0];
      conversacionId = conversacionDoc.id;
      suscribirMensajes(conversacionId);
    } else {
      // No hay conversación existente, mostrar mensaje de bienvenida
      mostrarMensajeBienvenida();
    }
    
  } catch (error) {
    console.error("Error cargando conversación:", error);
    mostrarMensajeBienvenida();
  }
}

// Suscribirse a mensajes en tiempo real
function suscribirMensajes(conversacionId) {
  const mensajesRef = collection(db, "conversacionesClientes", conversacionId, "mensajes");
  const q = query(mensajesRef, orderBy("fecha", "asc"));
  
  onSnapshot(q, (snapshot) => {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    snapshot.forEach((doc) => {
      const mensaje = doc.data();
      agregarMensajeAlChat(mensaje);
    });
    
    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Actualizar contador de mensajes no leídos
    actualizarContadorMensajes();
  });
}

// Mostrar mensaje de bienvenida
function mostrarMensajeBienvenida() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = `
    <div class="chat-welcome">
      <p>¡Hola! ¿En qué podemos ayudarte?</p>
      <p>Estamos aquí para responder tus preguntas sobre nuestros productos, pedidos o cualquier consulta que tengas.</p>
    </div>
  `;
}

// Agregar mensaje al chat
function agregarMensajeAlChat(mensaje) {
  const chatMessages = document.getElementById('chatMessages');
  
  // Limpiar mensaje de bienvenida si existe
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

// Enviar mensaje
async function enviarMensaje() {
  const mensajeInput = document.getElementById('mensajeChat');
  const mensajeTexto = mensajeInput.value.trim();
  
  if (!mensajeTexto) return;
  
  try {
    // Si no hay conversación, crear una nueva
    if (!conversacionId) {
      const nuevaConversacion = {
        usuarioId: usuarioActual.uid,
        usuarioEmail: usuarioActual.email || 'Cliente no autenticado',
        fechaCreacion: Timestamp.now(),
        fechaUltimoMensaje: Timestamp.now(),
        estado: 'activa'
      };
      
      const conversacionRef = await addDoc(collection(db, "conversacionesClientes"), nuevaConversacion);
      conversacionId = conversacionRef.id;
      
      // Suscribirse a los mensajes de la nueva conversación
      suscribirMensajes(conversacionId);
    }
    
    // Crear mensaje
    const nuevoMensaje = {
      contenido: mensajeTexto,
      remitente: 'cliente',
      fecha: Timestamp.now(),
      leido: false
    };
    
    // Agregar mensaje a la conversación
    await addDoc(collection(db, "conversacionesClientes", conversacionId, "mensajes"), nuevoMensaje);
    
    // Actualizar fecha del último mensaje
    await updateDoc(doc(db, "conversacionesClientes", conversacionId), {
      fechaUltimoMensaje: Timestamp.now()
    });
    
    // Limpiar input
    mensajeInput.value = '';
    
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    alert("Error al enviar el mensaje. Por favor, intenta nuevamente.");
  }
}

// Actualizar contador de mensajes no leídos
function actualizarContadorMensajes() {
  const chatBadge = document.getElementById('chatBadge');
  if (!chatBadge) return;
  
  // Esta función se implementaría para contar mensajes no leídos
  // Por ahora, ocultamos el badge
  chatBadge.style.display = 'none';
}

// Generar ID único para usuarios no autenticados
function generarIdUsuario() {
  return 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Cerrar chat al hacer clic fuera
document.addEventListener('click', (e) => {
  const chatWindow = document.getElementById('chatWindow');
  const chatToggle = document.getElementById('chatToggle');
  
  if (chatWindow && chatToggle && 
      !chatWindow.contains(e.target) && 
      e.target !== chatToggle &&
      chatWindow.classList.contains('active')) {
    cerrarChat();
  }
});