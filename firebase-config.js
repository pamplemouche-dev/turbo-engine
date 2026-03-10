import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDI8n1-ui_Y-9QPivzSb7dsDigMwH1uUbk",
  authDomain: "turbo-engine.firebaseapp.com",
  projectId: "turbo-engine",
  storageBucket: "turbo-engine.firebasestorage.app",
  messagingSenderId: "612613967272",
  appId: "1:612613967272:web:66ab03dcab150dac65219d",
  measurementId: "G-V328H978EJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
