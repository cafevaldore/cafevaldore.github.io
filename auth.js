import { auth, db } from './firebaseconfig.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  successMsg.style.display = 'none';
  setTimeout(() => {
    errorMsg.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  successMsg.textContent = message;
  successMsg.style.display = 'block';
  errorMsg.style.display = 'none';
  setTimeout(() => {
    successMsg.style.display = 'none';
  }, 5000);
}

// Alternar entre formularios
window.toggleForm = function(formType) {
  // Remover clase active de todos los formularios
  const forms = document.querySelectorAll('.auth-form');
  forms.forEach(form => form.classList.remove('active'));
  
  // Agregar clase active al formulario seleccionado
  const targetForm = document.getElementById(formType + 'Form');
  if (targetForm) {
    targetForm.classList.add('active');
  }
  
  // Ocultar mensajes
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';
};

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
    showSuccess('¡Bienvenido de vuelta! 🎉');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  } catch (error) {
  console.error('Error en login:', error);
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': // ← AGREGAR ESTO
      showError('Credenciales incorrectas');
      break;
    case 'auth/invalid-email':
      showError('Correo electrónico inválido');
      break;
    case 'auth/too-many-requests':
      showError('Demasiados intentos. Intenta más tarde');
      break;
    default:
      showError('Error al iniciar sesión');
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
    
    showSuccess('¡Cuenta creada exitosamente! 🎉');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
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

// ENVÍO DE CORREO PARA RESTABLECER CONTRASEÑA
document.getElementById('sendResetBtn').addEventListener('click', async () => {
  const email = document.getElementById('forgotEmail').value.trim();

  if (!email) {
    showError('Por favor ingresa tu correo electrónico');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showSuccess('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
    setTimeout(() => {
      toggleForm('login');
    }, 3000);
  } catch (error) {
    console.error('Error al enviar correo:', error);
    switch (error.code) {
      case 'auth/user-not-found':
        showError('No existe una cuenta con este correo electrónico');
        break;
      case 'auth/invalid-email':
        showError('Correo electrónico inválido');
        break;
      default:
        showError('Error al enviar correo: ' + error.message);
    }
  }
});

// CAMBIO DE CONTRASEÑA (para usuarios ya autenticados)
document.getElementById('changePassBtn').addEventListener('click', async () => {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showError('Por favor completa todos los campos');
    return;
  }

  if (newPassword.length < 6) {
    showError('La nueva contraseña debe tener al menos 6 caracteres');
    return;
  }

  if (newPassword !== confirmPassword) {
    showError('Las contraseñas nuevas no coinciden');
    return;
  }

  const user = auth.currentUser;
  
  if (!user) {
    showError('Debes iniciar sesión para cambiar tu contraseña');
    toggleForm('login');
    return;
  }

  try {
    // Reautenticar al usuario
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Actualizar la contraseña
    await updatePassword(user, newPassword);
    
    showSuccess('¡Contraseña actualizada correctamente!');
    
    // Limpiar campos
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    setTimeout(() => {
      toggleForm('login');
    }, 2000);
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    switch (error.code) {
      case 'auth/wrong-password':
        showError('La contraseña actual es incorrecta');
        break;
      case 'auth/requires-recent-login':
        showError('Por seguridad, debes iniciar sesión nuevamente para cambiar tu contraseña');
        break;
      default:
        showError('Error al cambiar contraseña: ' + error.message);
    }
  }
});

// Permitir envío con Enter
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    if (document.getElementById('loginForm').classList.contains('active')) {
      document.getElementById('loginBtn').click();
    } else if (document.getElementById('registerForm').classList.contains('active')) {
      document.getElementById('registerBtn').click();
    } else if (document.getElementById('forgotForm').classList.contains('active')) {
      document.getElementById('sendResetBtn').click();
    } else if (document.getElementById('changePassForm').classList.contains('active')) {
      document.getElementById('changePassBtn').click();
    }
  }
});

// Verificar si el usuario está autenticado y mostrar el formulario adecuado
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.endsWith('auth.html')) {
    // Si el usuario está autenticado y está en la página de auth, mostrar el formulario de cambio de contraseña
    toggleForm('change');
  }
});