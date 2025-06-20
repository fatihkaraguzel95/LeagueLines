
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// IMPORTANT: Replace this with your actual Firebase project configuration!
const firebaseConfig = {
  apiKey: "AIzaSyAFlOGKJDM0Q0ssl73sJSXIDEzgjm6oWm8",
  authDomain: "leaguelines.firebaseapp.com",
  projectId: "leaguelines",
  storageBucket: "leaguelines.appspot.com",
  messagingSenderId: "575913274975",
  appId: "leaguelines"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
