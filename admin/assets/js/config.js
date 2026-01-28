/**
 * Configurações do Projeto DrakFeet V3
 * IMPORTANTE: Em produção, use variáveis de ambiente
 */

const AppConfig = {
  // Firebase Configuration
  // PRODUÇÃO: Use GitHub Secrets ou ambiente seguro
  firebase: {
  authDomain: "drak-feet-admin.firebaseapp.com",
  projectId: "drak-feet-admin",
  storageBucket: "drak-feet-admin.firebasestorage.app",
  messagingSenderId: "525123704162",
  appId: "1:525123704162:web:ea0a3bc86663334a79c83b",
  measurementId: "G-EFERT7RZZ5"
  },

  // Cloudinary Configuration
  cloudinary: {
   cloudName: 'dz2alj2st',
    uploadPreset: 'drakfeet_products'
  },

  // Session Configuration
  session: {
    timeout: 30 * 60 * 1000, // 30 minutos
    warningTime: 5 * 60 * 1000, // Aviso 5 min antes
    checkInterval: 60 * 1000 // Verificar a cada 1 minuto
  },

  // Security
  security: {
    encryptionKey: "a3f9c2d8e1b47c9f2e8a0c4d9b6e1a7f3d9c2b8a4e0f7d1c9b6a8e3f2c1d", // TROCAR EM PRODUÇÃO
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutos
  },

  // App Settings
  app: {
    name: "DrakFeet Admin",
    version: "3.0.0",
    environment: "production" // development | staging | production
  }
};

// Validação de configuração
function validateConfig() {
  if (AppConfig.firebase.apiKey === "AIzaSyAZ90xAptvBeRDFl52FI7-WJJD14I6YKk4") {
    console.warn("⚠️ Configure as credenciais do Firebase!");
  }
  
  if (AppConfig.security.encryptionKey.length < 32) {
    console.error("❌ Chave de criptografia muito curta!");
  }
}

validateConfig();

// Exportar
window.AppConfig = AppConfig;