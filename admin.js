import { db } from './firebaseconfig.js';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Variables globales
let pedidosData = [];
let mensajesData = [];
let currentTab = 'pedidos';

// Elementos del DOM
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const listaPedidos = document.getElementById('listaPedidosAdmin');
const listaMensajes = document.getElementById('listaMensajesAdmin');
const filtroEstado = document.getElementById('filtroEstado');
const filtroFecha = document.getElementById('filtroFecha');
const btnActualizar = document.getElementById('btnActualizar');
const modal = document.getElementById('modalPedido');
const modalBody = document.getElementById('modalPedidoBody');
const closeModal = document.querySelector('.close');

// Elementos de estadísticas
const totalPedidosEl = document.getElementById('totalPedidos');
const pedidosPendientesEl = document.getElementById('pedidosPendientes');
const totalMensajesEl = document.getElementById('totalMensajes');
const totalClientesEl = document.getElementById('totalClientes');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  initializeAdmin();
});

async function initializeAdmin() {
  try {
    // Mostrar loading
    showLoading();
    
    // Cargar datos iniciales
    await Promise.all([
      cargarPedidos(),
      cargarMensajes()
    ]);
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar estadísticas
    actualizarEstadisticas();
    
    // Mostrar tab activo
    mostrarTabPedidos();
    
  } catch (error) {
    console.error('Error inicializando admin:', error);
    mostrarError('Error cargando datos del panel de administración');
  }
}

function setupEventListeners() {
  // Tabs
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      if (button.hasAttribute('data-tab')) {
        e.preventDefault();
        switchTab(button.dataset.tab);
      }
    });
  });

  // Filtros
  filtroEstado.addEventListener('change', filtrarPedidos);
  filtroFecha.addEventListener('change', filtrarPedidos);
  btnActualizar.addEventListener('click', () => {
    cargarPedidos();
    cargarMensajes();
  });

  // Modal
  closeModal.addEventListener('click', cerrarModal);
  window.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Actualizar botones
  tabButtons.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  // Actualizar contenido
  tabPanes.forEach(pane => pane.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  
  // Cargar contenido específico
  if (tabName === 'pedidos') {
    mostrarTabPedidos();
  } else if (tabName === 'mensajes') {
    mostrarTabMensajes();
  }
}

// GESTIÓN DE PEDIDOS
async function cargarPedidos() {
  try {
    const q = query(collection(db, "pedidos"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    
    pedidosData = [];
    querySnapshot.forEach((documento) => {
      pedidosData.push({
        id: documento.id,
        ...documento.data()
      });
    });
    
    mostrarTabPedidos();
    
  } catch (error) {
    console.error("Error cargando pedidos:", error);
    mostrarError('Error cargando pedidos');
  }
}

function mostrarTabPedidos() {
  if (!listaPedidos) return;
  
  const pedidosFiltrados = filtrarPedidosData();
  
  if (pedidosFiltrados.length === 0) {
    listaPedidos.innerHTML = `
      <div class="empty-state">
        <div class="icon">📦</div>
        <h3>No hay pedidos</h3>
        <p>No se encontraron pedidos con los filtros seleccionados.</p>
      </div>
    `;
    return;
  }
  
  listaPedidos.innerHTML = pedidosFiltrados.map(pedido => `
    <div class="pedido-admin-item">
      <div class="pedido-header-admin">
        <div class="pedido-info">
          <h3>Pedido #${pedido.numeroPedido || pedido.id.slice(-6)}</h3>
          <p><strong>Cliente:</strong> ${pedido.datosCliente?.nombre || 'Cliente'}</p>
          <p><strong>Email:</strong> ${pedido.datosCliente?.email || 'No especificado'}</p>
          <p><strong>Teléfono:</strong> ${pedido.datosCliente?.telefono || 'No especificado'}</p>
          <p><strong>Fecha:</strong> ${formatearFecha(pedido.fecha)}</p>
          <p><strong>Total:</strong> $${formatearPrecio(pedido.total || 0)}</p>
          <span class="estado-badge estado-${pedido.estado || 'pendiente'}">${formatearEstado(pedido.estado || 'pendiente')}</span>
        </div>
        <div class="pedido-acciones">
          <button class="btn-estado btn-pendiente" onclick="cambiarEstado('${pedido.id}', 'pendiente')">
            Pendiente
          </button>
          <button class="btn-estado btn-proceso" onclick="cambiarEstado('${pedido.id}', 'en-proceso')">
            En Proceso
          </button>
          <button class="btn-estado btn-completado" onclick="cambiarEstado('${pedido.id}', 'completado')">
            Completado
          </button>
          <button class="btn-estado btn-editar" onclick="abrirModalPedido('${pedido.id}')">
            Ver Detalles
          </button>
        </div>
      </div>
      
      <div class="pedido-detalles">
        <div class="detalles-cliente">
          <h4>👤 Información del Cliente</h4>
          <p><strong>Dirección:</strong> ${pedido.datosCliente?.direccion || 'No especificada'}</p>
          <p><strong>Ciudad:</strong> ${pedido.datosCliente?.ciudad || 'No especificada'}</p>
          ${pedido.datosCliente?.notas ? `<p><strong>Notas:</strong> ${pedido.datosCliente.notas}</p>` : ''}
        </div>
        
        <div class="productos-admin-list">
          <h4>☕ Productos</h4>
          ${(pedido.productos || []).map(producto => `
            <div class="producto-admin-item">
              <span>${producto.nombre} (${producto.peso || '250g'})</span>
              <span>Cantidad: ${producto.cantidad} - ${formatearPrecio(producto.precio * producto.cantidad)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function filtrarPedidos() {
  mostrarTabPedidos();
}

function filtrarPedidosData() {
  let pedidosFiltrados = [...pedidosData];
  
  // Filtrar por estado
  const estadoFiltro = filtroEstado?.value;
  if (estadoFiltro && estadoFiltro !== 'todos') {
    pedidosFiltrados = pedidosFiltrados.filter(pedido => 
      (pedido.estado || 'pendiente') === estadoFiltro
    );
  }
  
  // Filtrar por fecha
  const fechaFiltro = filtroFecha?.value;
  if (fechaFiltro) {
    const fechaSeleccionada = new Date(fechaFiltro);
    pedidosFiltrados = pedidosFiltrados.filter(pedido => {
      if (!pedido.fecha) return false;
      
      let fechaPedido;
      if (pedido.fecha.toDate) {
        fechaPedido = pedido.fecha.toDate();
      } else {
        fechaPedido = new Date(pedido.fecha);
      }
      
      return fechaPedido.toDateString() === fechaSeleccionada.toDateString();
    });
  }
  
  return pedidosFiltrados;
}

// Función global para cambiar estado de pedido
window.cambiarEstado = async function(pedidoId, nuevoEstado) {
  try {
    await updateDoc(doc(db, "pedidos", pedidoId), {
      estado: nuevoEstado,
      fechaActualizacion: Timestamp.now()
    });
    
    // Actualizar en memoria
    const pedidoIndex = pedidosData.findIndex(p => p.id === pedidoId);
    if (pedidoIndex !== -1) {
      pedidosData[pedidoIndex].estado = nuevoEstado;
    }
    
    mostrarTabPedidos();
    actualizarEstadisticas();
    mostrarNotificacion(`Pedido actualizado a: ${formatearEstado(nuevoEstado)}`, 'success');
    
  } catch (error) {
    console.error("Error actualizando estado:", error);
    mostrarNotificacion('Error actualizando el pedido', 'error');
  }
};

// Función global para abrir modal de pedido
window.abrirModalPedido = function(pedidoId) {
  const pedido = pedidosData.find(p => p.id === pedidoId);
  if (!pedido) return;
  
  modalBody.innerHTML = `
    <div class="pedido-detalles-modal">
      <div class="detalles-generales">
        <h3>📦 Pedido #${pedido.numeroPedido || pedido.id.slice(-6)}</h3>
        <div class="info-grid">
          <p><strong>Estado:</strong> <span class="estado-badge estado-${pedido.estado || 'pendiente'}">${formatearEstado(pedido.estado || 'pendiente')}</span></p>
          <p><strong>Fecha:</strong> ${formatearFecha(pedido.fecha)}</p>
          <p><strong>Total:</strong> ${formatearPrecio(pedido.total || 0)}</p>
        </div>
      </div>
      
      <div class="detalles-cliente-modal">
        <h4>👤 Cliente</h4>
        <div class="cliente-info">
          <p><strong>Nombre:</strong> ${pedido.datosCliente?.nombre || 'No especificado'}</p>
          <p><strong>Email:</strong> ${pedido.datosCliente?.email || 'No especificado'}</p>
          <p><strong>Teléfono:</strong> ${pedido.datosCliente?.telefono || 'No especificado'}</p>
          <p><strong>Dirección:</strong> ${pedido.datosCliente?.direccion || 'No especificada'}</p>
          <p><strong>Ciudad:</strong> ${pedido.datosCliente?.ciudad || 'No especificada'}</p>
          ${pedido.datosCliente?.notas ? `<p><strong>Notas:</strong> ${pedido.datosCliente.notas}</p>` : ''}
        </div>
      </div>
      
      <div class="productos-modal">
        <h4>☕ Productos</h4>
        <div class="productos-list-modal">
          ${(pedido.productos || []).map(producto => `
            <div class="producto-modal-item">
              <div class="producto-info">
                <h5>${producto.nombre}</h5>
                <p>Peso: ${producto.peso || '250g'}</p>
                <p>Precio unitario: ${formatearPrecio(producto.precio)}</p>
              </div>
              <div class="producto-cantidad">
                <span class="cantidad">x${producto.cantidad}</span>
                <span class="subtotal">${formatearPrecio(producto.precio * producto.cantidad)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="acciones-modal">
        <h4>⚙️ Cambiar Estado</h4>
        <div class="estados-buttons">
          <button class="btn-estado btn-pendiente" onclick="cambiarEstadoYCerrar('${pedido.id}', 'pendiente')">
            Pendiente
          </button>
          <button class="btn-estado btn-proceso" onclick="cambiarEstadoYCerrar('${pedido.id}', 'en-proceso')">
            En Proceso
          </button>
          <button class="btn-estado btn-completado" onclick="cambiarEstadoYCerrar('${pedido.id}', 'completado')">
            Completado
          </button>
        </div>
      </div>
    </div>
  `;
  
  modal.style.display = 'block';
};

// Función global para cambiar estado y cerrar modal
window.cambiarEstadoYCerrar = async function(pedidoId, nuevoEstado) {
  await cambiarEstado(pedidoId, nuevoEstado);
  cerrarModal();
};

function cerrarModal() {
  modal.style.display = 'none';
}

// GESTIÓN DE MENSAJES
async function cargarMensajes() {
  try {
    const q = query(collection(db, "mensajesContacto"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    
    mensajesData = [];
    querySnapshot.forEach((documento) => {
      mensajesData.push({
        id: documento.id,
        ...documento.data()
      });
    });
    
    if (currentTab === 'mensajes') {
      mostrarTabMensajes();
    }
    
  } catch (error) {
    console.error("Error cargando mensajes:", error);
    mostrarError('Error cargando mensajes');
  }
}

function mostrarTabMensajes() {
  if (!listaMensajes) return;
  
  if (mensajesData.length === 0) {
    listaMensajes.innerHTML = `
      <div class="empty-state">
        <div class="icon">📩</div>
        <h3>No hay mensajes</h3>
        <p>No se han recibido mensajes de contacto aún.</p>
      </div>
    `;
    return;
  }
  
  listaMensajes.innerHTML = mensajesData.map(mensaje => `
    <div class="mensaje-admin-item ${mensaje.leido ? 'leido' : 'no-leido'}">
      <div class="mensaje-header">
        <div class="mensaje-info">
          <h3>${mensaje.asunto} - ${mensaje.nombre}</h3>
          <p><strong>Email:</strong> ${mensaje.email}</p>
          ${mensaje.telefono ? `<p><strong>Teléfono:</strong> ${mensaje.telefono}</p>` : ''}
          <p><strong>Fecha:</strong> ${formatearFecha(mensaje.fecha)}</p>
          ${!mensaje.leido ? '<span class="badge-nuevo">🆕 Nuevo</span>' : ''}
        </div>
        <div class="mensaje-acciones">
          ${!mensaje.leido ? `
            <button class="btn-estado btn-proceso" onclick="marcarLeido('${mensaje.id}')">
              Marcar como leído
            </button>
          ` : `
            <button class="btn-estado btn-completado" onclick="marcarNoLeido('${mensaje.id}')">
              Marcar como no leído
            </button>
          `}
        </div>
      </div>
      
      <div class="mensaje-contenido">
        <p>${mensaje.mensaje}</p>
      </div>
    </div>
  `).join('');
}

// Función global para marcar como leído
window.marcarLeido = async function(mensajeId) {
  try {
    await updateDoc(doc(db, "mensajesContacto", mensajeId), {
      leido: true,
      fechaLeido: Timestamp.now()
    });
    
    // Actualizar en memoria
    const mensajeIndex = mensajesData.findIndex(m => m.id === mensajeId);
    if (mensajeIndex !== -1) {
      mensajesData[mensajeIndex].leido = true;
    }
    
    mostrarTabMensajes();
    actualizarEstadisticas();
    mostrarNotificacion('Mensaje marcado como leído', 'success');
    
  } catch (error) {
    console.error("Error marcando como leído:", error);
    mostrarNotificacion('Error actualizando el mensaje', 'error');
  }
};

// Función global para marcar como no leído
window.marcarNoLeido = async function(mensajeId) {
  try {
    await updateDoc(doc(db, "mensajesContacto", mensajeId), {
      leido: false
    });
    
    // Actualizar en memoria
    const mensajeIndex = mensajesData.findIndex(m => m.id === mensajeId);
    if (mensajeIndex !== -1) {
      mensajesData[mensajeIndex].leido = false;
    }
    
    mostrarTabMensajes();
    actualizarEstadisticas();
    mostrarNotificacion('Mensaje marcado como no leído', 'success');
    
  } catch (error) {
    console.error("Error marcando como no leído:", error);
    mostrarNotificacion('Error actualizando el mensaje', 'error');
  }
};

// ESTADÍSTICAS
function actualizarEstadisticas() {
  // Total de pedidos
  if (totalPedidosEl) {
    totalPedidosEl.textContent = pedidosData.length;
  }
  
  // Pedidos pendientes
  if (pedidosPendientesEl) {
    const pendientes = pedidosData.filter(p => 
      !p.estado || p.estado === 'pendiente'
    ).length;
    pedidosPendientesEl.textContent = pendientes;
  }
  
  // Total mensajes
  if (totalMensajesEl) {
    totalMensajesEl.textContent = mensajesData.length;
  }
  
  // Total clientes únicos - usando UID
  if (totalClientesEl) {
    const uidsUnicos = new Set();
    
    // Agregar UIDs de pedidos
    pedidosData.forEach(pedido => {
      if (pedido.uid) {
        uidsUnicos.add(pedido.uid);
      }
    });
    
    // Agregar emails únicos de mensajes (ya que no tienen UID)
    mensajesData.forEach(mensaje => {
      if (mensaje.email) {
        uidsUnicos.add(mensaje.email); // Usamos email como identificador único para mensajes
      }
    });
    
    totalClientesEl.textContent = uidsUnicos.size;
  }
}

// UTILIDADES
function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no disponible';
  
  try {
    let fechaObj;
    if (fecha.toDate) {
      fechaObj = fecha.toDate();
    } else {
      fechaObj = new Date(fecha);
    }
    
    return fechaObj.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
}

function formatearPrecio(precio) {
  return new Intl.NumberFormat('es-CO').format(precio);
}

function formatearEstado(estado) {
  const estados = {
    'pendiente': 'Pendiente',
    'en-proceso': 'En Proceso',
    'completado': 'Completado'
  };
  return estados[estado] || 'Pendiente';
}

function showLoading() {
  if (listaPedidos) {
    listaPedidos.innerHTML = '<div class="loading">⏳ Cargando pedidos...</div>';
  }
  if (listaMensajes) {
    listaMensajes.innerHTML = '<div class="loading">⏳ Cargando mensajes...</div>';
  }
}

function mostrarError(mensaje) {
  mostrarNotificacion(mensaje, 'error');
}

function mostrarNotificacion(mensaje, tipo = 'info') {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo}`;
  notificacion.innerHTML = `
    <div class="notificacion-content">
      <span>${mensaje}</span>
      <button class="notificacion-close">&times;</button>
    </div>
  `;
  
  // Estilos inline para la notificación
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 9999;
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease;
    ${tipo === 'success' ? 'background: linear-gradient(135deg, #10B981, #059669);' : 
      tipo === 'error' ? 'background: linear-gradient(135deg, #EF4444, #DC2626);' : 
      'background: linear-gradient(135deg, #3B82F6, #2563EB);'}
  `;
  
  // Agregar al DOM
  document.body.appendChild(notificacion);
  
  // Configurar cierre automático
  const autoClose = setTimeout(() => {
    if (notificacion.parentNode) {
      notificacion.remove();
    }
  }, 5000);
  
  // Configurar cierre manual
  const closeBtn = notificacion.querySelector('.notificacion-close');
  closeBtn.addEventListener('click', () => {
    clearTimeout(autoClose);
    notificacion.remove();
  });
}

// CSS adicional para animaciones de notificación
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(300px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .notificacion-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .notificacion-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  
  .badge-nuevo {
    background: linear-gradient(135deg, #10B981, #059669);
    color: white;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  .producto-modal-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(218, 165, 32, 0.05);
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }
  
  .producto-info h5 {
    margin: 0 0 0.5rem 0;
    color: #2F1B14;
  }
  
  .producto-info p {
    margin: 0.2rem 0;
    color: #4A5568;
    font-size: 0.9rem;
  }
  
  .producto-cantidad {
    text-align: right;
  }
  
  .cantidad {
    display: block;
    font-weight: 600;
    color: #2F1B14;
  }
  
  .subtotal {
    display: block;
    font-weight: 700;
    color: #DAA520;
    font-size: 1.1rem;
  }
  
  .estados-buttons {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
  }
`;

document.head.appendChild(styleSheet);