// // firebaseConfig.js
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
// import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// // Configuración de Firebase
// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID
// };

// // Inicialización de Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

// export { app, auth, db };



// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAnpApxU_BOC_2f3VRJTudBcTw9JvuJgZ4",
  authDomain: "cafelaesperanza-231a4.firebaseapp.com",
  projectId: "cafelaesperanza-231a4",
  storageBucket: "cafelaesperanza-231a4.firebasestorage.app",
  messagingSenderId: "562806945575",
  appId: "1:562806945575:web:12a589dc2d66c704665b02"
};

// Inicialización global
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
