
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
  
  // Validación del formulario de contacto
  const formularioContacto = document.getElementById('formularioContacto');
  
  if (formularioContacto) {
    formularioContacto.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validar campos
      const nombre = document.getElementById('nombreContacto').value.trim();
      const email = document.getElementById('emailContacto').value.trim();
      const asunto = document.getElementById('asuntoContacto').value;
      const mensaje = document.getElementById('mensajeContacto').value.trim();
      
      if (!nombre || !email || !asunto || !mensaje) {
        mostrarNotificacion('❌ Por favor completa todos los campos obligatorios', 'error');
        return;
      }
      
      if (!validarEmail(email)) {
        mostrarNotificacion('❌ Por favor ingresa un correo electrónico válido', 'error');
        return;
      }
      
      // Simular envío (aquí integrarías con tu backend o servicio de email)
      const btnEnviar = formularioContacto.querySelector('.btn-enviar');
      const textoOriginal = btnEnviar.textContent;
      
      btnEnviar.textContent = '⏳ Enviando...';
      btnEnviar.disabled = true;
      
      setTimeout(() => {
        mostrarNotificacion('✅ Mensaje enviado correctamente. Te contactaremos pronto!', 'success');
        formularioContacto.reset();
        btnEnviar.textContent = textoOriginal;
        btnEnviar.disabled = false;
      }, 2000);
    });
  }
  
  // Función para validar email
  function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  // Función para mostrar notificaciones
  function mostrarNotificacion(mensaje, tipo = 'success') {
    // Eliminar notificación existente si hay una
    const notifExistente = document.querySelector('.notificacion-contacto');
    if (notifExistente) {
      notifExistente.remove();
    }
    
    const notif = document.createElement('div');
    notif.className = `notificacion-contacto ${tipo}`;
    notif.innerHTML = `
      <div class="notif-content">
        <span class="notif-text">${mensaje}</span>
      </div>
    `;
    
    // Estilos para la notificación
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${tipo === 'success' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      z-index: 10000;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      animation: slideInRight 0.3s ease;
      max-width: 350px;
    `;
    
    document.body.appendChild(notif);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
      if (notif.parentNode) {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
      }
    }, 4000);
  }
});