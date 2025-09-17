// main.js - Archivo universal para todas las páginas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
  getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


import { auth, db } from './firebaseconfig.js';

// ===== ESTADO GLOBAL DEL CARRITO =====
let carrito = [];
let total = 0;
let usuarioAutenticado = false;
let currentUserId = null;
const formularioContacto = document.getElementById('formularioContacto');
const enviarmensajechat = document.getElementById('enviarMensajeChat'); //Para solucionar, debo verificar que esté registrado para dejarlo enviar mensaje

//Verificar si se ha iniciado sesión antes de enviar mensaje en el chat
    // Agregamos el evento "click"
    enviarmensajechat.addEventListener("click", function() {
      // Aquí puedes poner la condición o el mensaje que quieras
       if (!usuarioAutenticado) {
    mostrarLoginChat();
    return;
  }
    });


// ===== FUNCIONES DEL CARRITO (disponibles globalmente) =====
window.agregarAlCarrito = function(producto, precio) {
  // Verificar si el usuario está autenticado antes de agregar
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
  mostrarNotificacion(`✅ ${producto} agregado al carrito`);
};

window.eliminarDelCarrito = function(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  actualizarCarrito();
  mostrarNotificacion(`🗑️ Producto eliminado del carrito`);
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
    // Guardar carrito asociado al usuario actual
    localStorage.setItem(`carrito_${currentUserId}`, JSON.stringify(carrito));
    console.log('💾 Carrito guardado para usuario:', currentUserId, carrito);
  }
}

function cargarCarrito() {
  if (currentUserId) {
    const carritoGuardado = localStorage.getItem(`carrito_${currentUserId}`);
    carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];
    console.log('📦 Carrito cargado para usuario:', currentUserId, carrito);
  } else {
    carrito = [];
  }
  actualizarCarrito();
}

// ===== FUNCIONES DE LA INTERFAZ =====
function mostrarNotificacion(mensaje) {
  // Eliminar notificación existente si hay una
  const notifExistente = document.querySelector('.notificacion');
  if (notifExistente) {
    notifExistente.remove();
  }
  
  const notif = document.createElement('div');
  notif.className = 'notificacion';
  notif.innerHTML = `
    <div class="notif-content">
      <span class="notif-text">${mensaje}</span>
    </div>
  `;
  document.body.appendChild(notif);
  
  // Auto-remover después de 4 segundos
  setTimeout(() => {
    if (notif.parentNode) {
      notif.style.animation = 'slideOutBounce 0.4s ease-in';
      setTimeout(() => notif.remove(), 400);
    }
  }, 4000);
}

function mostrarLoginMessage() {
  const loginMessage = document.getElementById("loginMessage");
  if (loginMessage) {
    loginMessage.style.display = "flex";
    
    // Auto-ocultar después de 5 segundos si se hace click fuera
    const hideMessage = (e) => {
      if (e.target === loginMessage) {
        loginMessage.style.display = "none";
        document.removeEventListener('click', hideMessage);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', hideMessage);
    }, 100);
  }
}

function mostrarLoginChat() {
  const loginchat = document.getElementById("loginChat");
  if (loginchat) {
    loginchat.style.display = "flex";
    
    // Auto-ocultar después de 5 segundos si se hace click fuera
    const hideMessage = (e) => {
      if (e.target === loginchat) {
        loginchat.style.display = "none";
        document.removeEventListener('click', hideMessage);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', hideMessage);
    }, 100);
  }
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
        <small>¡Agrega algunos de nuestros deliciosos cafés!</small>
      </li>
    `;
  }
  if (totalCarrito) {
    totalCarrito.textContent = 'Total: $0';
  }
  if (guardarPedidoBtn) {
    guardarPedidoBtn.style.display = 'none';
  }
  if (vaciarCarritoBtn) {
    vaciarCarritoBtn.style.display = 'none';
  }
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

  // Mostrar productos en el carrito
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
  
  // Actualizar contadores
  if (cartCounts) {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCounts.forEach(count => {
      count.textContent = totalItems;
    });
  }
}

// ===== FUNCIONES DE LA PÁGINA DE PEDIDOS =====
async function cargarPedidos(uid) {
  const pedidosContainer = document.getElementById("pedidosContainer");
  if (!pedidosContainer) return; // Solo ejecutar en página de pedidos
  
  try {
    console.log("🔥 Cargando pedidos para usuario:", uid);
    
    const q = query(collection(db, "pedidos"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      mostrarSinPedidos();
      return;
    }

    const pedidos = [];
    querySnapshot.forEach((doc) => {
      const pedidoData = doc.data();
      pedidos.push({
        id: doc.id,
        ...pedidoData
      });
    });

    // Ordenar por fecha (más recientes primero)
    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    mostrarPedidos(pedidos);

  } catch (error) {
    console.error("❌ Error cargando pedidos:", error);
    pedidosContainer.innerHTML = `
      <div class="no-pedidos">
        <h3>⚠️ Error al cargar pedidos</h3>
        <p>Hubo un problema al cargar tus pedidos. Por favor, intenta recargar la página.</p>
        <button onclick="location.reload()" class="btn-primary">
          🔄 Recargar página
        </button>
      </div>
    `;
  }
}

function mostrarSinPedidos() {
  const pedidosContainer = document.getElementById("pedidosContainer");
  if (!pedidosContainer) return;
  
  pedidosContainer.innerHTML = `
    <div class="no-pedidos">
      <div class="no-pedidos-icon">📦</div>
      <h3>No tienes pedidos aún</h3>
      <p>¡Aún no has realizado ningún pedido! Ve a nuestra tienda y prueba nuestros deliciosos cafés especiales.</p>
      <a href="index.html" class="btn-primary">
        ☕ Ver productos
      </a>
    </div>
  `;
}

function mostrarPedidos(pedidos) {
  const pedidosContainer = document.getElementById("pedidosContainer");
  if (!pedidosContainer) return;
  
  const pedidosHTML = pedidos.map(pedido => {
    const fecha = new Date(pedido.fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const productosHTML = pedido.pedido.map(producto => `
      <div class="producto-item">
        <span class="producto-nombre">☕ ${producto.producto}</span>
        <span class="producto-cantidad">×${producto.cantidad}</span>
      </div>
    `).join('');

    return `
      <div class="pedido-card">
        <div class="pedido-header">
          <div class="pedido-id">
            📋 Pedido #${pedido.id.substring(0, 8)}
          </div>
          <div class="pedido-fecha">
            📅 ${fechaFormateada}
          </div>
        </div>
        
        <div class="pedido-total">
          💰 Total: ${parseInt(pedido.total).toLocaleString()}
        </div>
        
        <div class="productos-list">
          <h4>📦 Productos:</h4>
          <div class="productos-items">
            ${productosHTML}
          </div>
        </div>
        
        <div class="pedido-status">
          <span class="status-badge status-${pedido.estado || 'pendiente'}">
            ${pedido.estado === 'completado' ? '✅ Completado' : 
              pedido.estado === 'en-proceso' ? '⏳ En proceso' : 
              '🟡 Pendiente'}
          </span>
        </div>
      </div>
    `;
  }).join('');

  pedidosContainer.innerHTML = `
    <div class="pedidos-grid">
      ${pedidosHTML}
    </div>
  `;

  console.log(`✅ Mostrando ${pedidos.length} pedidos`);
}

// ===== FUNCIONALIDAD DE FORMULARIO DE PEDIDO =====
window.mostrarFormularioPedido = function() {
  if (!usuarioAutenticado) {
    mostrarNotificacion('❌ Debes iniciar sesión para realizar un pedido');
    mostrarLoginMessage();
    return;
  }

  if (carrito.length === 0) {
    mostrarNotificacion("🛒 El carrito está vacío");
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';

  const resumenProductos = carrito.map(item => `
    <div class="resumen-item">
      <span>☕ ${item.producto} ×${item.cantidad}</span>
      <span>${(item.precio * item.cantidad).toLocaleString()}</span>
    </div>
  `).join('');

  const formulario = document.createElement('div');
  formulario.className = 'form-container';

  formulario.innerHTML = `
    <h2>📋 Confirmar Pedido</h2>
    
    <div class="resumen-pedido">
      <h3>📦 Resumen de tu pedido:</h3>
      ${resumenProductos}
      <div class="resumen-total">
        <strong>Total: ${total.toLocaleString()}</strong>
      </div>
    </div>

    <form id="formPedido">
      <h3>📍 Información de entrega:</h3>
      
      <input type="text" id="nombreCliente" placeholder="Nombre completo *" required>
      <input type="tel" id="telefonoCliente" placeholder="Teléfono *" required>
      <input type="text" id="direccionCliente" placeholder="Dirección completa *" required>
      <input type="text" id="ciudadCliente" placeholder="Ciudad *" required>
      <textarea id="notas" placeholder="Observaciones adicionales (opcional)" rows="3"></textarea>
      
      <div class="form-buttons">
        <button type="button" id="cancelarPedido">❌ Cancelar</button>
        <button type="submit">✅ Confirmar Pedido</button>
      </div>
    </form>
  `;

  overlay.appendChild(formulario);
  document.body.appendChild(overlay);

  // Manejar cancelación
  formulario.querySelector('#cancelarPedido').addEventListener('click', () => {
    overlay.remove();
  });

  // Manejar envío del formulario
  formulario.querySelector('#formPedido').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Procesando...';
    submitBtn.disabled = true;
    
    try {
      await guardarPedidoFirebase();
      overlay.remove();
      carrito = [];
      guardarCarrito();
      actualizarCarrito();
      mostrarNotificacion('🎉 ¡Pedido confirmado exitosamente!');
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      mostrarNotificacion('❌ Error al procesar el pedido. Inténtalo de nuevo.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // Cerrar con click fuera del formulario
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
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

// Debería ser esto:
const pedidoData = {
  uid: user.uid,
  datosCliente: {
    nombre,
    telefono,
    direccion,
    ciudad,
    email: user.email, // Mover el email aquí
    notas: notas // Cambiar de observaciones a notas
  },
  pedido: carrito,
  total: total,
  fecha: new Date().toISOString(),
  estado: 'pendiente'
};

  await addDoc(collection(db, "pedidos"), pedidoData);
  console.log("✅ Pedido guardado exitosamente");
}

// ===== CONFIGURACIÓN DE INTERFAZ =====
function configurarInterfaz() {
  // Elementos del DOM
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
  const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");

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

  // Carrito
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

  // Vaciar carrito
  if (vaciarCarritoBtn) {
    vaciarCarritoBtn.addEventListener('click', () => {
      if (carrito.length === 0) {
        mostrarNotificacion('🛒 El carrito ya está vacío');
        return;
      }
      
      if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        carrito = [];
        guardarCarrito();
        actualizarCarrito();
        mostrarNotificacion('🗑️ Carrito vaciado exitosamente');
      }
    });
  }

  // Guardar pedido
  if (guardarPedidoBtn) {
    guardarPedidoBtn.addEventListener('click', window.mostrarFormularioPedido);
  }

  // Botones de autenticación
  function syncAuthButtons() {
    if (authBtn && authMobileBtn) {
      authMobileBtn.textContent = authBtn.textContent;
      authMobileBtn.onclick = authBtn.onclick;
    }
  }

  setInterval(syncAuthButtons, 100);

  // Botones añadir al carrito - NO verificar autenticación aquí
  if (addToCartButtons.length > 0) {
    addToCartButtons.forEach(button => {
      const producto = button.dataset.producto;
      const precio = parseInt(button.dataset.precio);
      
      // No deshabilitar botones basado en autenticación
      button.onclick = () => window.agregarAlCarrito(producto, precio);
    });
  }
}

// ===== AUTENTICACIÓN =====
function configurarAutenticacion() {
  const authBtn = document.getElementById('authBtn');
  const authMobileBtn = document.getElementById('authMobileBtn');
  const userWelcome = document.getElementById("userWelcome");
  const userName = document.getElementById("userName");
  const loginMessage = document.getElementById("loginMessage");

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Usuario autenticado
      usuarioAutenticado = true;
      currentUserId = user.uid; // Guardar ID del usuario actual
      
      if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
      if (userWelcome) userWelcome.style.display = "block";

      const logoutText = "🚪 Cerrar Sesión";
      if (authBtn) authBtn.textContent = logoutText;
      if (authMobileBtn) authMobileBtn.textContent = logoutText;

      const logoutFunction = async () => {
        try {
          await signOut(auth);
          // Limpiar carrito al cerrar sesión
          carrito = [];
          currentUserId = null;
          mostrarNotificacion("👋 Sesión cerrada correctamente");
        } catch (error) {
          console.error(error);
          mostrarNotificacion("❌ Error al cerrar sesión");
        }
      };

      if (authBtn) authBtn.onclick = logoutFunction;
      if (authMobileBtn) authMobileBtn.onclick = logoutFunction;

      if (loginMessage) loginMessage.style.display = "none";
      
      // Cargar carrito del usuario actual
      cargarCarrito();
      
      // Cargar pedidos si estamos en la página de pedidos
      await cargarPedidos(user.uid);
    } else {
      // Usuario no autenticado
      usuarioAutenticado = false;
      currentUserId = null;
      carrito = []; // Limpiar carrito
      
      if (userWelcome) userWelcome.style.display = "none";

      const loginText = "🔑 Iniciar Sesión";
      if (authBtn) authBtn.textContent = loginText;
      if (authMobileBtn) authMobileBtn.textContent = loginText;

      const loginFunction = () => {
        window.location.href = "auth.html";
      };

      if (authBtn) authBtn.onclick = loginFunction;
      if (authMobileBtn) authMobileBtn.onclick = loginFunction;

      // Mostrar carrito vacío
      actualizarCarrito();
    }
  });
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 Inicializando aplicación...');
  configurarInterfaz();
  configurarAutenticacion();
  console.log('🛒 Carrito inicial:', carrito);
});






// Funcionalidad para la página de contacto
document.addEventListener('DOMContentLoaded', function() {
  // Funcionalidad para las preguntas frecuentes
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const pregunta = item.querySelector('.faq-pregunta');
    
    pregunta.addEventListener('click', () => {
      // Cerrar otros items abiertos
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
        }
      });
      
      // Alternar el item actual
      item.classList.toggle('active');
    });
  });
  });
  

//   // Validación del formulario de contacto
//   const formularioContacto = document.getElementById('formularioContacto');
  
//   if (formularioContacto) {
//     formularioContacto.addEventListener('submit', function(e) {
//       e.preventDefault();
      
//       // Validar campos
//       const nombre = document.getElementById('nombreContacto').value.trim();
//       const email = document.getElementById('emailContacto').value.trim();
//       const asunto = document.getElementById('asuntoContacto').value;
//       const mensaje = document.getElementById('mensajeContacto').value.trim();
      
//       if (!nombre || !email || !asunto || !mensaje) {
//         mostrarNotificacion('❌ Por favor completa todos los campos obligatorios', 'error');
//         return;
//       }
      
//       if (!validarEmail(email)) {
//         mostrarNotificacion('❌ Por favor ingresa un correo electrónico válido', 'error');
//         return;
//       }
      
//       // Simular envío (aquí integrarías con tu backend o servicio de email)
//       const btnEnviar = formularioContacto.querySelector('.btn-enviar');
//       const textoOriginal = btnEnviar.textContent;
      
//       btnEnviar.textContent = '⏳ Enviando...';
//       btnEnviar.disabled = true;
      
//       setTimeout(() => {
//         mostrarNotificacion('✅ Mensaje enviado correctamente. Te contactaremos pronto!', 'success');
//         formularioContacto.reset();
//         btnEnviar.textContent = textoOriginal;
//         btnEnviar.disabled = false;
//       }, 2000);
//     });
//   }
  
//   // Función para validar email
//   function validarEmail(email) {
//     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return regex.test(email);
//   }
  
//   // Función para mostrar notificaciones
//   function mostrarNotificacion(mensaje, tipo = 'success') {
//     // Eliminar notificación existente si hay una
//     const notifExistente = document.querySelector('.notificacion-contacto');
//     if (notifExistente) {
//       notifExistente.remove();
//     }
    
//     const notif = document.createElement('div');
//     notif.className = `notificacion-contacto ${tipo}`;
//     notif.innerHTML = `
//       <div class="notif-content">
//         <span class="notif-text">${mensaje}</span>
//       </div>
//     `;
    
//     // Estilos para la notificación
//     notif.style.cssText = `
//       position: fixed;
//       top: 20px;
//       right: 20px;
//       background: ${tipo === 'success' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
//       color: white;
//       padding: 1rem 1.5rem;
//       border-radius: 10px;
//       z-index: 10000;
//       box-shadow: 0 5px 15px rgba(0,0,0,0.2);
//       animation: slideInRight 0.3s ease;
//       max-width: 350px;
//     `;
    
//     document.body.appendChild(notif);
    
//     // Auto-remover después de 4 segundos
//     setTimeout(() => {
//       if (notif.parentNode) {
//         notif.style.animation = 'slideOutRight 0.3s ease';
//         setTimeout(() => notif.remove(), 300);
//       }
//     }, 4000);
//   }




//Para contactos

// Modificar la función de envío
if (formularioContacto) {
  formularioContacto.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validación (igual que antes)
    
    const btnEnviar = formularioContacto.querySelector('.btn-enviar');
    const textoOriginal = btnEnviar.textContent;
    
    btnEnviar.textContent = '⏳ Enviando...';
    btnEnviar.disabled = true;
    
    try {
      // Guardar en Firebase
      await addDoc(collection(db, "mensajesContacto"), {
        nombre: document.getElementById('nombreContacto').value.trim(),
        email: document.getElementById('emailContacto').value.trim(),
        telefono: document.getElementById('telefonoContacto').value.trim(),
        asunto: document.getElementById('asuntoContacto').value,
        mensaje: document.getElementById('mensajeContacto').value.trim(),
        fecha: serverTimestamp(),
        leido: false
      });
      
      mostrarNotificacion('✅ Mensaje enviado correctamente. Te contactaremos pronto!', 'success');
      formularioContacto.reset();
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
      mostrarNotificacion('❌ Error al enviar el mensaje. Intenta nuevamente.', 'error');
    } finally {
      btnEnviar.textContent = textoOriginal;
      btnEnviar.disabled = false;
    }
  });
}