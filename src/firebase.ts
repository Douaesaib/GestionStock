import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// infos
const firebaseConfig = {
  apiKey: "AIzaSyC_hf43DBphWQTV35wJSYqXfYRiWMQRH2k",
  authDomain: "gestionstock-8ff03.firebaseapp.com",
  projectId: "gestionstock-8ff03",
  storageBucket: "gestionstock-8ff03.firebasestorage.app",
  messagingSenderId: "796919771042",
  appId: "1:796919771042:web:865dcf4bc81895a7aa8cfb",
  measurementId: "G-33ZHVLH16G"
};

// 1. Démarrer l-App
const app = initializeApp(firebaseConfig);

// 2. Démarrer Base de données (Firestore)
const db = getFirestore(app);

// 3. Activer le mode HORS-LIGNE (Offline)
try {
  enableIndexedDbPersistence(db).catch((err) => {
      if (err.code == 'failed-precondition') {
          console.log('Erreur: Kter mn onglet mhloul');
      } else if (err.code == 'unimplemented') {
          console.log('Navigateur ma-fihsh support');
      }
  });
} catch (e) {
  console.log("Erreur persistence:", e);
}

export { db };