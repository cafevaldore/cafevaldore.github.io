


import { auth, db } from './firebaseconfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Login
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Usuario logueado:', userCredential.user.email);
  } catch (error) {
    console.error(error);
  }
}


const errorMsg = document.getElementById('errorMsg');

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  setTimeout(() => {
    errorMsg.style.display = 'none';
  }, 5000);
}

// Alternar entre formularios
window.toggleForm = function() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  }
  errorMsg.style.display = 'none';
}

// LOGIN
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showError('Por favor completa todos los campos');
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert('¡Bienvenido de vuelta! 🎉');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error en login:', error);
    switch (error.code) {
      case 'auth/user-not-found':
        showError('Usuario no encontrado');
        break;
      case 'auth/wrong-password':
        showError('Contraseña incorrecta');
        break;
      case 'auth/invalid-email':
        showError('Correo electrónico inválido');
        break;
      default:
        showError('Error al iniciar sesión: ' + error.message);
    }
  }
});

// REGISTRO
document.getElementById('registerBtn').addEventListener('click', async () => {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!name || !email || !password) {
    showError('Por favor completa todos los campos');
    return;
  }

  if (password.length < 6) {
    showError('La contraseña debe tener al menos 6 caracteres');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    alert('¡Cuenta creada exitosamente! 🎉');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error en registro:', error);
    switch (error.code) {
      case 'auth/email-already-in-use':
        showError('Este correo ya está registrado');
        break;
      case 'auth/invalid-email':
        showError('Correo electrónico inválido');
        break;
      case 'auth/weak-password':
        showError('La contraseña es muy débil');
        break;
      default:
        showError('Error al crear cuenta: ' + error.message);
    }
  }
});

// Permitir envío con Enter
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const loginVisible = document.getElementById('loginForm').style.display !== 'none';
    if (loginVisible) {
      document.getElementById('loginBtn').click();
    } else {
      document.getElementById('registerBtn').click();
    }
  }
});
