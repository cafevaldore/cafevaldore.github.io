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

// Generar ID seguro con Web Crypto API
function generarIdSeguro() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return 'guest_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Inicializar el chat
document.addEventListener('DOMContentLoaded', function() {
  const chatBadge = document.getElementById('chatBadge');
  if (chatBadge) {
    chatBadge.style.display = 'none';
  }
  
  inicializarChat();
});

async function inicializarChat() {
  const auth = getAuth();
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario autenticado - usar datos de Firebase
      usuarioActual = {
        uid: user.uid,
        email: user.email
      };
      cargarConversacionUsuario();
    } else {
      // Usuario invitado - generar ID seguro
      let guestId = localStorage.getItem('guestChatId');
      if (!guestId) {
        guestId = generarIdSeguro();
        localStorage.setItem('guestChatId', guestId);
      }
      
      usuarioActual = {
        uid: guestId,
        email: 'invitado@valdore.com'
      };
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
      suscribirMensajes(conversacionId);
    } else {
      mostrarMensajeBienvenida();
      actualizarContadorMensajes(0);
    }
    
  } catch (error) {
    console.error("Error cargando conversación:", error);
    mostrarMensajeBienvenida();
    actualizarContadorMensajes(0);
  }
}

function suscribirMensajes(conversacionId) {
  const mensajesRef = collection(db, "conversacionesClientes", conversacionId, "mensajes");
  const q = query(mensajesRef, orderBy("fecha", "asc"));
  
  onSnapshot(q, (snapshot) => {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    let contadorNoLeidos = 0;
    const chatWindow = document.getElementById('chatWindow');
    const chatAbierto = chatWindow?.classList.contains('active');
    
    snapshot.forEach((doc) => {
      const mensaje = doc.data();
      agregarMensajeAlChat(mensaje);
      
      if (mensaje.remitente === 'admin' && mensaje.leido === false && !chatAbierto) {
        contadorNoLeidos++;
      }
    });
    
    mensajesNoLeidos = contadorNoLeidos;
    actualizarContadorMensajes(mensajesNoLeidos);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
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