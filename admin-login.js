import { auth } from './firebaseconfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Elementos DOM
const loginForm = document.getElementById('adminLoginForm');
const emailInput = document.getElementById('adminEmail');
const passwordInput = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.getElementById('btnText');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Lista de emails autorizados como administradores
const ADMIN_EMAILS = [
  'jarolmedina41@gmail.com'
];

// Manejo del formulario
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validaciones básicas
  if (!email || !password) {
    showError('Por favor completa todos los campos');
    return;
  }

  // Verificar que el email esté en la lista de administradores
  if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
    showError('Este email no tiene permisos de administrador');
    return;
  }

  // Mostrar loading
  setLoading(true);
  hideMessages();

  try {
    // Login con Firebase Auth
    await signInWithEmailAndPassword(auth, email, password);
    
    // Firebase maneja la sesión automáticamente
    showSuccess('✅ Acceso autorizado. Redirigiendo...');
    
    // Redireccionar
    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 1500);

  } catch (error) {
    console.error('Error de autenticación:', error);
    
    let errorMsg = 'Error de autenticación';
    switch (error.code) {
      case 'auth/user-not-found':
        errorMsg = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        errorMsg = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        errorMsg = 'Email inválido';
        break;
      case 'auth/too-many-requests':
        errorMsg = 'Demasiados intentos. Intenta más tarde';
        break;
      case 'auth/network-request-failed':
        errorMsg = 'Error de conexión. Verifica tu internet';
        break;
      case 'auth/invalid-credential':
        errorMsg = 'Credenciales incorrectas';
        break;
      default:
        errorMsg = 'Error de acceso. Verifica tus credenciales';
    }
    
    showError(errorMsg);
    setLoading(false);
  }
});

// Funciones auxiliares
function setLoading(loading) {
  loginBtn.disabled = loading;
  loadingSpinner.style.display = loading ? 'inline-block' : 'none';
  btnText.textContent = loading ? 'Verificando...' : 'Iniciar Sesión';
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

function hideMessages() {
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';
}

// Toggle password
window.togglePassword = function() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  
  const toggle = document.querySelector('.password-toggle');
  toggle.textContent = type === 'password' ? '👁️' : '🙈';
};

// Limpiar mensajes al escribir
emailInput.addEventListener('input', hideMessages);
passwordInput.addEventListener('input', hideMessages);