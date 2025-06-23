import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // EKLENDİ

const firebaseConfig = {
  apiKey: "AIzaSyAFlOGKJDM0Q0ssl73sJSXIDEzgjm6oWm8",
  authDomain: "leaguelines.firebaseapp.com",
  databaseURL: "https://leaguelines-default-rtdb.europe-west1.firebasedatabase.app", // DOĞRU URL!
  projectId: "leaguelines",
  storageBucket: "leaguelines.appspot.com",
  messagingSenderId: "575913274975",
  appId: "leaguelines"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app); // EKLENDİ

export { app, auth, db, database }; // EKLENDİ
