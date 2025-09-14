// auth-guard.js - Protección para páginas de administrador mejorado

// Verificar autenticación de administrador
function verificarAccesoAdmin() {
  const isAdmin = localStorage.getItem('isAdmin');
  const adminEmail = localStorage.getItem('adminEmail');
  
  // Lista de emails autorizados (debe coincidir con login)
  const ADMIN_EMAILS = [
    'jarolmedina41@gmail.com',
    'administrador@cafevaldore.com',
    'tu-email@gmail.com', // Reemplaza con tu email
  ];
  
  // Si no está logueado o no tiene email autorizado
  if (!isAdmin || isAdmin !== 'true' || !adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
    // Limpiar datos inválidos
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminUID');
    
    // Mostrar notificación y redireccionar
    showAuthNotification('Sesión expirada. Redirigiendo al login...', 'warning');
    setTimeout(() => {
      window.location.href = 'admin-login.html';
    }, 2000);
    return false;
  }
  
  return true;
}

// Función mejorada para cerrar sesión (sin confirmación)
function cerrarSesionAdmin() {
  // Mostrar notificación de proceso
  showAuthNotification('Cerrando sesión...', 'info');
  
  // Limpiar localStorage después de un breve delay
  setTimeout(() => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminUID');
    
    // Mostrar notificación de éxito
    showAuthNotification('Sesión cerrada exitosamente. ¡Hasta pronto!', 'success');
    
    // Redireccionar después de mostrar la notificación
    setTimeout(() => {
      window.location.href = 'admin-login.html';
    }, 2000);
  }, 500);
}

// Configurar botones de logout
function configurarLogout() {
  // Buscar botones de logout
  const logoutButtons = document.querySelectorAll('#authBtn, #authMobileBtn, .auth-btn');
  
  logoutButtons.forEach(button => {
    if (button) {
      button.textContent = '🚪 Cerrar Sesión';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarSesionAdmin();
      });
    }
  });
}

// Mostrar información del admin logueado
function mostrarInfoAdmin() {
  const adminEmail = localStorage.getItem('adminEmail');
  
  if (adminEmail) {
    // Buscar elementos para mostrar info del admin
    const adminInfoElements = document.querySelectorAll('.admin-info, .user-welcome');
    
    adminInfoElements.forEach(element => {
      if (element) {
        element.innerHTML = `
          <span style="color: #DAA520; font-weight: 600;">
            👤 Administrador: ${adminEmail}
          </span>
        `;
        element.style.display = 'block';
      }
    });
    
    // Actualizar título de la página si existe
    const pageTitle = document.querySelector('.admin-header h1, .presentacion h2');
    if (pageTitle && pageTitle.textContent.includes('Bienvenido')) {
      pageTitle.innerHTML = `
        Bienvenido, Administrador
        <br><small style="font-size: 0.6em; color: #4A5568;">${adminEmail}</small>
      `;
    }
  }
}

// Verificar periódicamente la sesión
function verificarSesionPeriodicamente() {
  setInterval(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin || isAdmin !== 'true') {
      showAuthNotification('Sesión perdida. Redirigiendo...', 'warning');
      setTimeout(() => {
        window.location.href = 'admin-login.html';
      }, 2000);
    }
  }, 60000); // Verificar cada 60 segundos
}

// Función para mostrar notificaciones elegantes de autenticación
function showAuthNotification(mensaje, tipo = 'info') {
  // Remover notificaciones anteriores
  const existingNotifications = document.querySelectorAll('.auth-notification');
  existingNotifications.forEach(notif => notif.remove());
  
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `auth-notification ${tipo}`;
  
  // Obtener icono según el tipo
  const icons = {
    'success': '✅',
    'error': '❌', 
    'warning': '⚠️',
    'info': 'ℹ️'
  };
  
  notification.innerHTML = `
    <div class="auth-notification-content">
      <div class="auth-notification-icon">${icons[tipo] || 'ℹ️'}</div>
      <div class="auth-notification-message">${mensaje}</div>
      <button class="auth-notification-close">&times;</button>
    </div>
    <div class="auth-notification-progress"></div>
  `;
  
  // Estilos inline para la notificación
  const colors = {
    'success': {
      bg: 'linear-gradient(135deg, #10B981, #059669)',
      shadow: 'rgba(16, 185, 129, 0.3)'
    },
    'error': {
      bg: 'linear-gradient(135deg, #EF4444, #DC2626)',
      shadow: 'rgba(239, 68, 68, 0.3)'
    },
    'warning': {
      bg: 'linear-gradient(135deg, #F59E0B, #D97706)',
      shadow: 'rgba(245, 158, 11, 0.3)'
    },
    'info': {
      bg: 'linear-gradient(135deg, #3B82F6, #2563EB)',
      shadow: 'rgba(59, 130, 246, 0.3)'
    }
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 30px;
    right: 30px;
    background: ${colors[tipo].bg};
    color: white;
    padding: 0;
    border-radius: 12px;
    box-shadow: 0 8px 32px ${colors[tipo].shadow};
    z-index: 10000;
    min-width: 350px;
    max-width: 500px;
    overflow: hidden;
    animation: slideInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  // Agregar al DOM
  document.body.appendChild(notification);
  
  // Configurar la barra de progreso
  const progressBar = notification.querySelector('.auth-notification-progress');
  let duration = tipo === 'info' ? 3000 : 4000;
  
  progressBar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.3);
    width: 100%;
    animation: shrinkProgress ${duration}ms linear;
  `;
  
  // Configurar cierre automático
  const autoClose = setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.4s ease-in-out';
      setTimeout(() => notification.remove(), 400);
    }
  }, duration);
  
  // Configurar cierre manual
  const closeBtn = notification.querySelector('.auth-notification-close');
  closeBtn.addEventListener('click', () => {
    clearTimeout(autoClose);
    notification.style.animation = 'slideOutRight 0.4s ease-in-out';
    setTimeout(() => notification.remove(), 400);
  });
}

// Inicializar protección cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
  // Solo verificar en páginas de admin
  const isAdminPage = window.location.pathname.includes('admin') &&
                      !window.location.pathname.includes('admin-login');
  
  if (isAdminPage) {
    // Verificar acceso
    if (verificarAccesoAdmin()) {
      // Configurar logout
      configurarLogout();
      
      // Mostrar info del admin
      mostrarInfoAdmin();
      
      // Iniciar verificación periódica
      verificarSesionPeriodicamente();
      
      // Mostrar notificación de bienvenida
      const adminEmail = localStorage.getItem('adminEmail');
      showAuthNotification(`Bienvenido de vuelta, ${adminEmail}`, 'success');
      
      console.log('✅ Acceso de administrador verificado');
    }
  }
});

// CSS para las notificaciones de autenticación
const authNotificationStyles = document.createElement('style');
authNotificationStyles.textContent = `
  @keyframes slideInBounce {
    0% {
      opacity: 0;
      transform: translateX(400px) scale(0.8);
    }
    50% {
      opacity: 0.8;
      transform: translateX(-20px) scale(1.05);
    }
    100% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
  
  @keyframes slideOutRight {
    0% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateX(400px) scale(0.8);
    }
  }
  
  @keyframes shrinkProgress {
    0% {
      width: 100%;
    }
    100% {
      width: 0%;
    }
  }
  
  .auth-notification-content {
    display: flex;
    align-items: center;
    padding: 20px;
    gap: 15px;
  }
  
  .auth-notification-icon {
    font-size: 24px;
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }
  
  .auth-notification-message {
    flex: 1;
    font-weight: 500;
    font-size: 16px;
    line-height: 1.4;
  }
  
  .auth-notification-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  
  .auth-notification-close:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
  
  /* Mejorar los botones de autenticación */
  .auth-btn {
    background: linear-gradient(135deg, #DC2626, #B91C1C);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
    text-decoration: none;
  }
  
  .auth-btn:hover {
    background: linear-gradient(135deg, #B91C1C, #991B1B);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  }
  
  .auth-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  }
  
  /* Responsive */
  @media (max-width: 480px) {
    .auth-notification {
      right: 15px !important;
      left: 15px !important;
      min-width: auto !important;
      max-width: none !important;
    }
    
    .auth-notification-content {
      padding: 15px !important;
    }
    
    .auth-notification-message {
      font-size: 14px !important;
    }
  }
`;

document.head.appendChild(authNotificationStyles);

// Exportar funciones si se usa como módulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    verificarAccesoAdmin,
    cerrarSesionAdmin,
    configurarLogout,
    mostrarInfoAdmin,
    showAuthNotification
  };
}