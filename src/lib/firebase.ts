// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}


// Conditional analytics initialization
let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export { app, analytics };
