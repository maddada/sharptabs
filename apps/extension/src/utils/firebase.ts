import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth/web-extension";

const apiKey = import.meta.env.VITE_APP_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_APP_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_APP_FIREBASE_APP_ID;

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
};

// Initialize Firebase with graceful failure
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
    // Only initialize if we have the required config
    if (apiKey && authDomain && projectId) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
    } else {
        console.warn("[Firebase] Missing required configuration. Auth features will be disabled.");
    }
} catch (error) {
    console.warn("[Firebase] Failed to initialize Firebase Auth:", error);
    // Auth remains null, features will be disabled
}

export { auth };
