// main.js - Archivo universal OPTIMIZADO para todas las páginas
import { 
  getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
  getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { auth, db } from './firebaseconfig.js';

// ===== ESTADO GLOBAL =====
let carrito = [];
let total = 0;
let usuarioAutenticado = false;
let currentUserId = null;
let authListenerActive = false;
let unsubscribeAuth = null;

// Detectar qué funcionalidades necesita la página actual
const paginaActual = {
  tieneCarrito: !!document.getElementById('listaCarrito'),
  tieneFormularioContacto: !!document.getElementById('formularioContacto'),
  tienePedidos: !!document.getElementById('pedidosContainer'),
  tieneFAQ: document.querySelectorAll('.faq-item').length > 0,
  tieneProductos: document.querySelectorAll('.add-to-cart-btn').length > 0
};

console.log('📄 Página detectada:', paginaActual);

// ===== FUNCIONES DEL CARRITO (disponibles globalmente) =====
window.agregarAlCarrito = function(producto, precio) {
  if (!usuarioAutenticado) {
    mostrarLoginMessage();
    return;
  }

  const existente = carrito.find(item => item.producto === producto);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ producto, precio, cantidad: 1 });
  }
  guardarCarrito();
  actualizarCarrito();
  mostrarNotificacion(`${producto} agregado al carrito`);
};

window.eliminarDelCarrito = function(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  actualizarCarrito();
  mostrarNotificacion('Producto eliminado del carrito');
};

window.cambiarCantidad = function(index, cambio) {
  carrito[index].cantidad += cambio;
  if (carrito[index].cantidad <= 0) {
    eliminarDelCarrito(index);
  } else {
    guardarCarrito();
    actualizarCarrito();
  }
};

function guardarCarrito() {
  if (currentUserId) {
    localStorage.setItem(`carrito_${currentUserId}`, JSON.stringify(carrito));
  }
}

function cargarCarrito() {
  if (currentUserId) {
    const carritoGuardado = localStorage.getItem(`carrito_${currentUserId}`);
    carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];
  } else {
    carrito = [];
  }
  actualizarCarrito();
}

// ===== FUNCIONES DE INTERFAZ =====
function mostrarNotificacion(mensaje) {
  const notifExistente = document.querySelector('.notificacion');
  if (notifExistente) notifExistente.remove();
  
  const notif = document.createElement('div');
  notif.className = 'notificacion';
  notif.innerHTML = `<div class="notif-content"><span class="notif-text">${mensaje}</span></div>`;
  document.body.appendChild(notif);
  
  setTimeout(() => {
    if (notif.parentNode) {
      notif.style.animation = 'slideOutBounce 0.4s ease-in';
      setTimeout(() => notif.remove(), 400);
    }
  }, 4000);
}

function mostrarLoginMessage() {
  const loginMessage = document.getElementById("loginMessage");
  if (!loginMessage) return;
  
  loginMessage.style.display = "flex";
  
  const hideMessage = (e) => {
    if (e.target === loginMessage) {
      loginMessage.style.display = "none";
      document.removeEventListener('click', hideMessage);
    }
  };
  
  setTimeout(() => document.addEventListener('click', hideMessage), 100);
}

function mostrarLoginChat() {
  const loginchat = document.getElementById("loginChat");
  if (!loginchat) return;
  
  loginchat.style.display = "flex";
  
  const hideMessage = (e) => {
    if (e.target === loginchat) {
      loginchat.style.display = "none";
      document.removeEventListener('click', hideMessage);
    }
  };
  
  setTimeout(() => document.addEventListener('click', hideMessage), 100);
}

function mostrarCarritoVacio() {
  const listaCarrito = document.getElementById('listaCarrito');
  const totalCarrito = document.getElementById('totalCarrito');
  const guardarPedidoBtn = document.getElementById('guardarPedido');
  const vaciarCarritoBtn = document.getElementById('vaciarCarrito');
  
  if (listaCarrito) {
    listaCarrito.innerHTML = `
      <li class="carrito-vacio">
        <div class="empty-cart-icon">🛒</div>
        <p>Tu carrito está vacío</p>
        <small>Agrega algunos de nuestros deliciosos cafés</small>
      </li>
    `;
  }
  if (totalCarrito) totalCarrito.textContent = 'Total: $0';
  if (guardarPedidoBtn) guardarPedidoBtn.style.display = 'none';
  if (vaciarCarritoBtn) vaciarCarritoBtn.style.display = 'none';
}

function actualizarCarrito() {
  const listaCarrito = document.getElementById('listaCarrito');
  const totalCarrito = document.getElementById('totalCarrito');
  const guardarPedidoBtn = document.getElementById('guardarPedido');
  const vaciarCarritoBtn = document.getElementById('vaciarCarrito');
  const cartCounts = document.querySelectorAll('.cart-count');
  
  if (!listaCarrito || !totalCarrito) return;
  
  listaCarrito.innerHTML = '';
  total = 0;

  if (carrito.length === 0) {
    mostrarCarritoVacio();
    return;
  }

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const li = document.createElement('li');
    li.className = 'carrito-item';
    li.innerHTML = `
      <div class="carrito-item-info">
        <h4 class="carrito-item-nombre">${item.producto}</h4>
        <div class="carrito-item-precio">$${item.precio.toLocaleString()} c/u</div>
      </div>
      <div class="carrito-item-controles">
        <div class="controles-cantidad">
          <button onclick="window.cambiarCantidad(${index}, -1)" class="btn-cantidad">-</button>
          <span class="cantidad">×${item.cantidad}</span>
          <button onclick="window.cambiarCantidad(${index}, 1)" class="btn-cantidad">+</button>
        </div>
        <div class="carrito-item-subtotal">$${subtotal.toLocaleString()}</div>
        <button onclick="window.eliminarDelCarrito(${index})" class="btn-eliminar" title="Eliminar producto">×</button>
      </div>
    `;
    listaCarrito.appendChild(li);
  });

  totalCarrito.innerHTML = `
    <div class="total-info">
      <span class="total-label">Total:</span>
      <span class="total-amount">${total.toLocaleString()}</span>
    </div>
  `;
  
  if (guardarPedidoBtn) guardarPedidoBtn.style.display = 'block';
  if (vaciarCarritoBtn) vaciarCarritoBtn.style.display = 'block';
  
  if (cartCounts) {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCounts.forEach(count => count.textContent = totalItems);
  }
}

// ===== FORMULARIO DE PEDIDO =====
window.mostrarFormularioPedido = function() {
  if (!usuarioAutenticado) {
    mostrarNotificacion('Debes iniciar sesión para realizar un pedido');
    mostrarLoginMessage();
    return;
  }

  if (carrito.length === 0) {
    mostrarNotificacion("El carrito está vacío");
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';

  const resumenProductos = carrito.map(item => `
    <div class="resumen-item">
      <span>${item.producto} ×${item.cantidad}</span>
      <span>${(item.precio * item.cantidad).toLocaleString()}</span>
    </div>
  `).join('');

  const formulario = document.createElement('div');
  formulario.className = 'form-container';

  formulario.innerHTML = `
    <h2>Confirmar Pedido</h2>
    
    <div class="resumen-pedido">
      <h3>Resumen de tu pedido:</h3>
      ${resumenProductos}
      <div class="resumen-total">
        <strong>Total: ${total.toLocaleString()}</strong>
      </div>
    </div>

    <form id="formPedido">
      <h3>Información de entrega:</h3>
      
      <input type="text" id="nombreCliente" placeholder="Nombre completo *" required>
      <input type="tel" id="telefonoCliente" placeholder="Teléfono *" required>
      <input type="text" id="direccionCliente" placeholder="Dirección completa *" required>
      <input type="text" id="ciudadCliente" placeholder="Ciudad *" required>
      <textarea id="notas" placeholder="Observaciones adicionales (opcional)" rows="3"></textarea>
      
      <div class="form-buttons">
        <button type="button" id="cancelarPedido">Cancelar</button>
        <button type="submit">Confirmar Pedido</button>
      </div>
    </form>
  `;

  overlay.appendChild(formulario);
  document.body.appendChild(overlay);

  formulario.querySelector('#cancelarPedido').addEventListener('click', () => overlay.remove());

  formulario.querySelector('#formPedido').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Procesando...';
    submitBtn.disabled = true;
    
    try {
      await guardarPedidoFirebase();
      overlay.remove();
      carrito = [];
      guardarCarrito();
      actualizarCarrito();
      mostrarNotificacion('Pedido confirmado exitosamente');
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      mostrarNotificacion('Error al procesar el pedido. Inténtalo de nuevo.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
};

async function guardarPedidoFirebase() {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const nombre = document.getElementById('nombreCliente').value.trim();
  const telefono = document.getElementById('telefonoCliente').value.trim();
  const direccion = document.getElementById('direccionCliente').value.trim();
  const ciudad = document.getElementById('ciudadCliente').value.trim();
  const notas = document.getElementById('notas').value.trim();

  if (!nombre || !telefono || !direccion || !ciudad) {
    throw new Error('Por favor completa todos los campos obligatorios');
  }

  const pedidoData = {
    uid: user.uid,
    datosCliente: {
      nombre,
      telefono,
      direccion,
      ciudad,
      email: user.email,
      notas: notas
    },
    pedido: carrito,
    total: total,
    fecha: new Date().toISOString(),
    estado: 'pendiente'
  };

  await addDoc(collection(db, "pedidos"), pedidoData);
  console.log("Pedido guardado exitosamente");
}

// ===== CONFIGURACIÓN DE INTERFAZ =====
function configurarInterfaz() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const carritoBtn = document.getElementById('carritoBtn');
  const carritoMobileBtn = document.getElementById('carritoMobileBtn');
  const carritoOverlay = document.getElementById('carritoOverlay');
  const carritoSidebar = document.getElementById('carrito');
  const cerrarCarrito = document.getElementById('cerrarCarrito');
  const authBtn = document.getElementById('authBtn');
  const authMobileBtn = document.getElementById('authMobileBtn');
  const vaciarCarritoBtn = document.getElementById('vaciarCarrito');
  const guardarPedidoBtn = document.getElementById('guardarPedido');

  // Menú hamburguesa
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });
  }

  // Carrito (solo si existe en la página)
  if (paginaActual.tieneCarrito) {
    function toggleCarrito() {
      if (carritoSidebar && carritoOverlay) {
        carritoSidebar.classList.toggle('active');
        carritoOverlay.classList.toggle('active');
        document.body.style.overflow = carritoSidebar.classList.contains('active') ? 'hidden' : 'auto';
      }
    }

    if (carritoBtn) carritoBtn.addEventListener('click', toggleCarrito);
    if (carritoMobileBtn) {
      carritoMobileBtn.addEventListener('click', () => {
        toggleCarrito();
        if (hamburger) hamburger.classList.remove('active');
        if (mobileMenu) mobileMenu.classList.remove('active');
      });
    }

    if (cerrarCarrito) {
      cerrarCarrito.addEventListener('click', () => {
        if (carritoSidebar) carritoSidebar.classList.remove('active');
        if (carritoOverlay) carritoOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
      });
    }

    if (carritoOverlay) {
      carritoOverlay.addEventListener('click', () => {
        if (carritoSidebar) carritoSidebar.classList.remove('active');
        if (carritoOverlay) carritoOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
      });
    }

    if (vaciarCarritoBtn) {
      vaciarCarritoBtn.addEventListener('click', () => {
        if (carrito.length === 0) {
          mostrarNotificacion('El carrito ya está vacío');
          return;
        }
        
        if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
          carrito = [];
          guardarCarrito();
          actualizarCarrito();
          mostrarNotificacion('Carrito vaciado exitosamente');
        }
      });
    }

    if (guardarPedidoBtn) {
      guardarPedidoBtn.addEventListener('click', window.mostrarFormularioPedido);
    }
  }

  // FAQ (solo si existe)
  if (paginaActual.tieneFAQ) {
    configurarFAQ();
  }

  // Formulario de contacto (solo si existe)
  if (paginaActual.tieneFormularioContacto) {
    configurarFormularioContacto();
  }

  // Botones de añadir al carrito (solo si existen productos)
  if (paginaActual.tieneProductos) {
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
    addToCartButtons.forEach(button => {
      const producto = button.dataset.producto;
      const precio = parseInt(button.dataset.precio);
      
      button.onclick = () => window.agregarAlCarrito(producto, precio);
    });
  }

  // Sincronizar botones de auth
  function syncAuthButtons() {
    if (authBtn && authMobileBtn) {
      authMobileBtn.textContent = authBtn.textContent;
      authMobileBtn.onclick = authBtn.onclick;
    }
  }

  setInterval(syncAuthButtons, 100);
}

// ===== AUTENTICACIÓN LAZY =====
function configurarAutenticacion() {
  const authBtn = document.getElementById('authBtn');
  const authMobileBtn = document.getElementById('authMobileBtn');
  const userWelcome = document.getElementById("userWelcome");
  const userName = document.getElementById("userName");
  const loginMessage = document.getElementById("loginMessage");

  // Solo iniciar listener si la página realmente necesita autenticación
  const necesitaAuth = paginaActual.tieneCarrito || paginaActual.tienePedidos || paginaActual.tieneProductos;

  if (!necesitaAuth) {
    console.log('⏭️ Página no requiere autenticación - omitiendo listener');
    // Solo configurar botones básicos de login
    if (authBtn) authBtn.onclick = () => window.location.href = "auth.html";
    if (authMobileBtn) authMobileBtn.onclick = () => window.location.href = "auth.html";
    return;
  }

  console.log('🔐 Inicializando autenticación...');
  authListenerActive = true;

  unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      usuarioAutenticado = true;
      currentUserId = user.uid;
      
      if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
      if (userWelcome) userWelcome.style.display = "block";

      const logoutText = "Cerrar Sesión";
      if (authBtn) authBtn.textContent = logoutText;
      if (authMobileBtn) authMobileBtn.textContent = logoutText;

      const logoutFunction = async () => {
        try {
          await signOut(auth);
          carrito = [];
          currentUserId = null;
          mostrarNotificacion("Sesión cerrada correctamente");
        } catch (error) {
          console.error(error);
          mostrarNotificacion("Error al cerrar sesión");
        }
      };

      if (authBtn) authBtn.onclick = logoutFunction;
      if (authMobileBtn) authMobileBtn.onclick = logoutFunction;

      if (loginMessage) loginMessage.style.display = "none";
      
      // Solo cargar carrito si la página lo necesita
      if (paginaActual.tieneCarrito) {
        cargarCarrito();
      }
      
      // Solo cargar pedidos si estamos en esa página
      if (paginaActual.tienePedidos) {
        const cargarPedidosModule = await import('./cargarPedidos.js');
        await cargarPedidosModule.cargarPedidos(user.uid);
      }
    } else {
      usuarioAutenticado = false;
      currentUserId = null;
      carrito = [];
      
      if (userWelcome) userWelcome.style.display = "none";

      const loginText = "Iniciar Sesión";
      if (authBtn) authBtn.textContent = loginText;
      if (authMobileBtn) authMobileBtn.textContent = loginText;

      const loginFunction = () => window.location.href = "auth.html";

      if (authBtn) authBtn.onclick = loginFunction;
      if (authMobileBtn) authMobileBtn.onclick = loginFunction;

      if (paginaActual.tieneCarrito) {
        actualizarCarrito();
      }
    }
  });
}

// ===== FAQ =====
function configurarFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const pregunta = item.querySelector('.faq-pregunta');
    
    if (pregunta) {
      pregunta.addEventListener('click', () => {
        faqItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
          }
        });
        item.classList.toggle('active');
      });
    }
  });
}

// ===== FORMULARIO CONTACTO =====
function configurarFormularioContacto() {
  const formularioContacto = document.getElementById('formularioContacto');
  
  if (!formularioContacto) return;

  formularioContacto.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btnEnviar = formularioContacto.querySelector('.btn-enviar');
    const textoOriginal = btnEnviar.textContent;
    
    btnEnviar.textContent = 'Enviando...';
    btnEnviar.disabled = true;
    
    try {
      await addDoc(collection(db, "mensajesContacto"), {
        nombre: document.getElementById('nombreContacto').value.trim(),
        email: document.getElementById('emailContacto').value.trim(),
        telefono: document.getElementById('telefonoContacto').value.trim(),
        asunto: document.getElementById('asuntoContacto').value,
        mensaje: document.getElementById('mensajeContacto').value.trim(),
        fecha: serverTimestamp(),
        leido: false
      });
      
      mostrarNotificacion('Mensaje enviado correctamente. Te contactaremos pronto');
      formularioContacto.reset();
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
      mostrarNotificacion('Error al enviar el mensaje. Intenta nuevamente.');
    } finally {
      btnEnviar.textContent = textoOriginal;
      btnEnviar.disabled = false;
    }
  });
}

// ===== CHAT VERIFICACIÓN =====
function configurarChatVerificacion() {
  const enviarmensajechat = document.getElementById('enviarMensajeChat');
  
  if (enviarmensajechat) {
    enviarmensajechat.addEventListener("click", function() {
      if (!usuarioAutenticado) {
        mostrarLoginChat();
        return;
      }
    });
  }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando aplicación optimizada...');
  console.log('Funcionalidades detectadas:', paginaActual);
  
  configurarInterfaz();
  configurarAutenticacion();
  configurarChatVerificacion();
  
  console.log('Carrito inicial:', carrito);
});

// ===== LIMPIEZA =====
window.addEventListener('beforeunload', () => {
  if (unsubscribeAuth) {
    unsubscribeAuth();
  }
});

// Exportar función de limpieza para SPAs
export function limpiarMain() {
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
  authListenerActive = false;
  console.log('Main limpiado correctamente');
}