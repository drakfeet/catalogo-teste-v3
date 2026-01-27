/**
 * Configuração do Firebase
 * IMPORTANTE: Substitua pelas suas credenciais do Firebase
 */

const firebaseConfig = {
   apiKey: "AIzaSyAZ90xAptvBeRDFl52FI7-WJJD14I6YKk4",
  authDomain: "drak-feet-admin.firebaseapp.com",
  projectId: "drak-feet-admin",
  storageBucket: "drak-feet-admin.firebasestorage.app",
  messagingSenderId: "525123704162",
  appId: "1:525123704162:web:ea0a3bc86663334a79c83b",
  measurementId: "G-EFERT7RZZ5"
};

// Inicializar Firebase
let app;
let auth;
let db;

try {
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  console.info('✅ Firebase inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error.message);
}

// Exportar instâncias (usando window para compatibilidade)
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;