// main.js - Archivo universal para todas las páginas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, collection, getDocs, query, where, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
  getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { auth, db } from './firebaseconfig.js';

// ===== ESTADO GLOBAL DEL CARRITO =====
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let total = 0;

// ===== FUNCIONES DEL CARRITO (disponibles globalmente) =====
window.agregarAlCarrito = function(producto, precio) {
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
  mostrarNotificacion(`🗑️ Producto eliminado`);
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
  localStorage.setItem('carrito', JSON.stringify(carrito));
  console.log('💾 Carrito guardado:', carrito);
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
  notif.textContent = mensaje;
  document.body.appendChild(notif);
  
  setTimeout(() => {
    if (notif.parentNode) {
      notif.remove();
    }
  }, 3000);
}

function mostrarCarritoVacio() {
  const listaCarrito = document.getElementById('listaCarrito');
  const totalCarrito = document.getElementById('totalCarrito');
  const guardarPedidoBtn = document.getElementById('guardarPedido');
  const vaciarCarritoBtn = document.getElementById('vaciarCarrito');
  
  if (listaCarrito) {
    listaCarrito.innerHTML = '<li class="vacio">Tu carrito está vacío</li>';
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
    li.className = 'item-carrito';
    li.innerHTML = `
      <span class="nombre">${item.producto}</span>
      <div class="controles-cantidad">
        <button onclick="window.cambiarCantidad(${index}, -1)">-</button>
        <span class="cantidad">x${item.cantidad}</span>
        <button onclick="window.cambiarCantidad(${index}, 1)">+</button>
      </div>
      <span class="precio">$${subtotal.toLocaleString()}</span>
      <button onclick="window.eliminarDelCarrito(${index})" class="eliminar-item">×</button>
    `;
    listaCarrito.appendChild(li);
  });

  totalCarrito.textContent = `Total: $${total.toLocaleString()}`;
  
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
    console.log("📥 Cargando pedidos para usuario:", uid);
    
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
      <h3>📦 No tienes pedidos aún</h3>
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
        <span class="producto-nombre">${producto.producto}</span>
        <span class="producto-cantidad">x${producto.cantidad}</span>
      </div>
    `).join('');

    return `
      <div class="pedido-card">
        <div class="pedido-header">
          <div class="pedido-id">
            📋 Pedido ${pedido.id.substring(0, 8)}
          </div>
          <div class="pedido-fecha">
            📅 ${fechaFormateada}
          </div>
        </div>
        
        <div class="pedido-total">
          💰 Total: $${parseInt(pedido.total).toLocaleString()}
        </div>
        
        <div class="productos-list">
          <h4>☕ Productos:</h4>
          ${productosHTML}
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
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';

  const formulario = document.createElement('div');
  formulario.className = 'form-container';

  formulario.innerHTML = `
    <h2>📋 Confirmar Pedido</h2>
    <form id="formPedido">
      <!-- Campos del formulario -->
      <button type="submit">✅ Confirmar Pedido</button>
    </form>
  `;

  overlay.appendChild(formulario);
  document.body.appendChild(overlay);

  // Manejar envío del formulario
  formulario.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Lógica para guardar pedido en Firebase
    await guardarPedidoFirebase();
    overlay.remove();
    carrito = [];
    guardarCarrito();
    actualizarCarrito();
    mostrarNotificacion('🎉 Pedido confirmado exitosamente');
  });
};

async function guardarPedidoFirebase() {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const pedidoData = {
    uid: user.uid,
    email: user.email,
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
  const userWelcome = document.getElementById("userWelcome");
  const userName = document.getElementById("userName");
  const loginMessage = document.getElementById("loginMessage");
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
      if (confirm('¿Vaciar carrito?')) {
        carrito = [];
        guardarCarrito();
        actualizarCarrito();
        mostrarNotificacion('🗑️ Carrito vaciado');
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

  // Botones añadir al carrito
  if (addToCartButtons.length > 0) {
    addToCartButtons.forEach(button => {
      const producto = button.dataset.producto;
      const precio = parseInt(button.dataset.precio);
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
  const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Usuario autenticado
      if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
      if (userWelcome) userWelcome.style.display = "block";

      const logoutText = "🚪 Cerrar Sesión";
      if (authBtn) authBtn.textContent = logoutText;
      if (authMobileBtn) authMobileBtn.textContent = logoutText;

      const logoutFunction = async () => {
        try {
          await signOut(auth);
          alert("👋 Sesión cerrada correctamente");
        } catch (error) {
          console.error(error);
        }
      };

      if (authBtn) authBtn.onclick = logoutFunction;
      if (authMobileBtn) authMobileBtn.onclick = logoutFunction;

      if (loginMessage) loginMessage.style.display = "none";
      
      // Cargar pedidos si estamos en la página de pedidos
      await cargarPedidos(user.uid);
    } else {
      // Usuario no autenticado
      if (userWelcome) userWelcome.style.display = "none";

      const loginText = "🔑 Iniciar Sesión";
      if (authBtn) authBtn.textContent = loginText;
      if (authMobileBtn) authMobileBtn.textContent = loginText;

      const loginFunction = () => {
        window.location.href = "auth.html";
      };

      if (authBtn) authBtn.onclick = loginFunction;
      if (authMobileBtn) authMobileBtn.onclick = loginFunction;

      if (loginMessage) loginMessage.style.display = "block";
    }
  });
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 Inicializando aplicación...');
  configurarInterfaz();
  configurarAutenticacion();
  actualizarCarrito();
  console.log('🛒 Carrito inicial:', carrito);
});