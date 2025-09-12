import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnpApxU_BOC_2f3VRJTudBcTw9JvuJgZ4",
  authDomain: "cafelaesperanza-231a4.firebaseapp.com",
  projectId: "cafelaesperanza-231a4",
  storageBucket: "cafelaesperanza-231a4.firebasestorage.app",
  messagingSenderId: "562806945575",
  appId: "1:562806945575:web:12a589dc2d66c704665b02"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("✅ Inicio de sesión exitoso");
    window.location.href = "index.html";
  } catch (error) {
    alert("❌ Error: " + error.message);
  }
});

document.getElementById("registerBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("✅ Cuenta creada correctamente");
    window.location.href = "index.html";
  } catch (error) {
    alert("❌ Error: " + error.message);
  }
});
