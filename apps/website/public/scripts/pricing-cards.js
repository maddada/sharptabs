// Import Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Firebase configuration from environment variables
const firebaseConfig = window.firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Auth state listener for PricingCards
firebaseOnAuthStateChanged(auth, (user) => {
    if (user) {
        localStorage.setItem("email", user.email);
        localStorage.setItem("uid", user.uid);
    } else {
        localStorage.removeItem("email");
        localStorage.removeItem("uid");
    }
});