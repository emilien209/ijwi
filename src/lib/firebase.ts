// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAN95KDrL7_VbM6DA5jnanYYHXZLLDi6NQ",
  authDomain: "tora-b66a1.firebaseapp.com",
  projectId: "tora-b66a1",
  storageBucket: "tora-b66a1.appspot.com",
  messagingSenderId: "474621598483",
  appId: "1:474621598483:web:864347e5d5e570d179d8e6",
  measurementId: "G-GX4G4LNMVG"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
