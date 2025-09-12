// main.js - Sistema de carrito y formulario mejorado

// Variables globales
let carrito = [];
let total = 0;

// Elementos del DOM
const listaCarrito = document.getElementById('listaCarrito');
const totalCarrito = document.getElementById('totalCarrito');
const guardarPedidoBtn = document.getElementById('guardarPedido');
const vaciarCarritoBtn = document.getElementById('vaciarCarrito');

// Función para agregar al carrito
window.agregarAlCarrito = function(producto, precio) {
  console.log(`🛒 Agregando ${producto} - $${precio}`);
  
  // Verificar si el producto ya existe
  const existente = carrito.find(item => item.producto === producto);
  
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ producto, precio, cantidad: 1 });
  }
  
  actualizarCarrito();
  mostrarNotificacion(`✅ ${producto} agregado al carrito`);
};

// Función para actualizar la visualización del carrito
function actualizarCarrito() {
  listaCarrito.innerHTML = '';
  total = 0;
  
  if (carrito.length === 0) {
    listaCarrito.innerHTML = '<li style="text-align: center; color: #666; padding: 2rem;">Tu carrito está vacío</li>';
    guardarPedidoBtn.style.display = 'none';
    vaciarCarritoBtn.style.display = 'none';
  } else {
    guardarPedidoBtn.style.display = 'block';
    vaciarCarritoBtn.style.display = 'block';
    
    carrito.forEach((item, index) => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      
      const li = document.createElement('li');
      li.style.cssText = `
        background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(247,243,239,0.9));
        margin-bottom: 1rem;
        padding: 1.5rem;
        border-radius: 15px;
        border-left: 4px solid #ffd700;
        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
      `;
      
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <strong style="color: #231a11; font-size: 1.1rem;">${item.producto}</strong>
          <button onclick="eliminarDelCarrito(${index})" style="
            background: #ef4444; 
            color: white; 
            border: none; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">×</button>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button onclick="cambiarCantidad(${index}, -1)" style="
              background: #231a11; 
              color: white; 
              border: none; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            ">-</button>
            <span style="font-weight: bold; color: #231a11; min-width: 20px; text-align: center;">${item.cantidad}</span>
            <button onclick="cambiarCantidad(${index}, 1)" style="
              background: #231a11; 
              color: white; 
              border: none; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            ">+</button>
          </div>
          <span style="color: #22c55e; font-weight: bold; font-size: 1.1rem;">$${subtotal.toLocaleString()}</span>
        </div>
      `;
      
      listaCarrito.appendChild(li);
    });
  }
  
  totalCarrito.textContent = `Total: $${total.toLocaleString()}`;
}

// Función para eliminar del carrito
window.eliminarDelCarrito = function(index) {
  const producto = carrito[index].producto;
  carrito.splice(index, 1);
  actualizarCarrito();
  mostrarNotificacion(`🗑️ ${producto} eliminado del carrito`);
};

// Función para cambiar cantidad
window.cambiarCantidad = function(index, cambio) {
  carrito[index].cantidad += cambio;
  if (carrito[index].cantidad <= 0) {
    eliminarDelCarrito(index);
  } else {
    actualizarCarrito();
  }
};

// Función para vaciar carrito
if (vaciarCarritoBtn) {
  vaciarCarritoBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      carrito = [];
      actualizarCarrito();
      mostrarNotificacion('🗑️ Carrito vaciado');
    }
  });
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje) {
  const notificacion = document.createElement('div');
  notificacion.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    padding: 1rem 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    z-index: 3000;
    font-weight: bold;
    animation: slideIn 0.3s ease;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  notificacion.textContent = mensaje;
  document.body.appendChild(notificacion);
  
  setTimeout(() => {
    notificacion.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (document.body.contains(notificacion)) {
        document.body.removeChild(notificacion);
      }
    }, 300);
  }, 3000);
}

// Función para crear y mostrar el formulario de pedido
function mostrarFormularioPedido() {
  // Crear overlay
  const overlay = document.createElement('div');
  overlay.id = 'formularioOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 4000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: fadeIn 0.3s ease;
  `;

  // Crear formulario
  const formulario = document.createElement('div');
  formulario.style.cssText = `
    background: white;
    border-radius: 20px;
    padding: 3rem;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    animation: popIn 0.3s ease;
    position: relative;
  `;

  // Agregar estilos de animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes popOut {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.8); }
    }
  `;
  document.head.appendChild(style);

  formulario.innerHTML = `
    <div style="text-align: center; margin-bottom: 2rem;">
      <h2 style="color: #231a11; font-size: 2rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        📋 Confirmar Pedido
      </h2>
      <p style="color: #666; font-size: 1.1rem;">Complete sus datos para finalizar la compra</p>
    </div>

    <!-- Resumen del pedido -->
    <div style="
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
      padding: 1.5rem;
      border-radius: 15px;
      margin-bottom: 2rem;
      border: 2px solid rgba(255, 215, 0, 0.3);
    ">
      <h3 style="color: #231a11; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
        🛒 Resumen del Pedido
      </h3>
      <div id="resumenPedido" style="margin-bottom: 1rem;">
        ${carrito.map(item => `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.7); border-radius: 8px;">
            <span style="font-weight: bold; color: #231a11;">${item.producto}</span>
            <span style="color: #666;">x${item.cantidad}</span>
            <span style="color: #22c55e; font-weight: bold;">$${(item.precio * item.cantidad).toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
      <div style="
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 1rem;
        background: rgba(34, 197, 94, 0.1);
        border-radius: 10px;
        border: 2px solid rgba(34, 197, 94, 0.3);
      ">
        <strong style="color: #231a11; font-size: 1.2rem;">Total:</strong>
        <strong style="color: #22c55e; font-size: 1.3rem;">$${total.toLocaleString()}</strong>
      </div>
    </div>

    <form id="formPedido" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <label for="nombre" style="
          display: block; 
          margin-bottom: 0.5rem; 
          font-weight: bold; 
          color: #231a11;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          👤 Nombre Completo
        </label>
        <input type="text" id="nombre" name="nombre" required style="
          width: 100%;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f9f9f9;
        " onfocus="this.style.borderColor='#ffd700'; this.style.background='white';" onblur="this.style.borderColor='#e0e0e0'; this.style.background='#f9f9f9';">
      </div>

      <div>
        <label for="telefono" style="
          display: block; 
          margin-bottom: 0.5rem; 
          font-weight: bold; 
          color: #231a11;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          📱 Teléfono
        </label>
        <input type="tel" id="telefono" name="telefono" required style="
          width: 100%;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f9f9f9;
        " onfocus="this.style.borderColor='#ffd700'; this.style.background='white';" onblur="this.style.borderColor='#e0e0e0'; this.style.background='#f9f9f9';">
      </div>

      <div>
        <label for="direccion" style="
          display: block; 
          margin-bottom: 0.5rem; 
          font-weight: bold; 
          color: #231a11;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          📍 Dirección de Entrega
        </label>
        <textarea id="direccion" name="direccion" required rows="3" style="
          width: 100%;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f9f9f9;
          resize: vertical;
        " onfocus="this.style.borderColor='#ffd700'; this.style.background='white';" onblur="this.style.borderColor='#e0e0e0'; this.style.background='#f9f9f9';" placeholder="Ingrese su dirección completa..."></textarea>
      </div>

      <div>
        <label for="notas" style="
          display: block; 
          margin-bottom: 0.5rem; 
          font-weight: bold; 
          color: #231a11;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          📝 Notas Especiales (Opcional)
        </label>
        <textarea id="notas" name="notas" rows="2" style="
          width: 100%;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f9f9f9;
          resize: vertical;
        " onfocus="this.style.borderColor='#ffd700'; this.style.background='white';" onblur="this.style.borderColor='#e0e0e0'; this.style.background='#f9f9f9';" placeholder="Instrucciones especiales, referencias, etc..."></textarea>
      </div>

      <div style="display: flex; gap: 1rem; margin-top: 1rem;">
        <button type="button" id="cancelarPedido" style="
          flex: 1;
          padding: 1rem 2rem;
          border: 2px solid #ef4444;
          background: white;
          color: #ef4444;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='#ef4444'; this.style.color='white';" onmouseout="this.style.background='white'; this.style.color='#ef4444';">
          ❌ Cancelar
        </button>
        
        <button type="submit" style="
          flex: 2;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
          ✅ Confirmar Pedido
        </button>
      </div>
    </form>
  `;

  overlay.appendChild(formulario);
  document.body.appendChild(overlay);

  // Prevenir scroll del body
  document.body.style.overflow = 'hidden';

  // Función para cerrar formulario
  function cerrarFormulario() {
    overlay.style.animation = 'fadeOut 0.3s ease';
    formulario.style.animation = 'popOut 0.3s ease';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      document.body.style.overflow = 'auto';
    }, 300);
  }

  // Event listeners
  document.getElementById('cancelarPedido').addEventListener('click', cerrarFormulario);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cerrarFormulario();
    }
  });

  // Manejar envío del formulario
  document.getElementById('formPedido').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const datosCliente = {
      nombre: formData.get('nombre'),
      telefono: formData.get('telefono'),
      direccion: formData.get('direccion'),
      notas: formData.get('notas') || ''
    };

    // Cambiar botón a estado de carga
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Procesando...';
    submitBtn.disabled = true;

    try {
      await guardarPedidoFirebase(datosCliente);
      cerrarFormulario();
      mostrarNotificacion('🎉 ¡Pedido confirmado exitosamente!');
      
      // Vaciar carrito después de confirmar
      carrito = [];
      actualizarCarrito();
      
      // Cerrar carrito
      const carritoSidebar = document.getElementById('carrito');
      const carritoOverlay = document.getElementById('carritoOverlay');
      carritoSidebar.classList.remove('active');
      carritoOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
      
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      mostrarNotificacion('❌ Error al procesar el pedido. Intente nuevamente.');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Función para guardar pedido en Firebase
async function guardarPedidoFirebase(datosCliente) {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const { getFirestore, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

  const firebaseConfig = {
    apiKey: "AIzaSyAnpApxU_BOC_2f3VRJTudBcTw9JvuJgZ4",
    authDomain: "cafelaesperanza-231a4.firebaseapp.com",
    projectId: "cafelaesperanza-231a4",
    storageBucket: "cafelaesperanza-231a4.firebasestorage.app",
    messagingSenderId: "562806945575",
    appId: "1:562806945575:web:12a589dc2d66c704665b02"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const pedidoData = {
    uid: user.uid,
    email: user.email,
    pedido: carrito,
    total: total,
    datosCliente: datosCliente,
    fecha: new Date().toISOString(),
    estado: 'pendiente'
  };

  await addDoc(collection(db, "pedidos"), pedidoData);
  console.log("✅ Pedido guardado exitosamente");
}

// Event listener para el botón de confirmar pedido
if (guardarPedidoBtn) {
  guardarPedidoBtn.addEventListener('click', () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    mostrarFormularioPedido();
  });
}

// Inicializar carrito al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  actualizarCarrito();
});