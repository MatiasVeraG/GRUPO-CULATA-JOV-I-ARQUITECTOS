// Configuración de Firebase
// IMPORTANTE: Deberás crear un proyecto en Firebase Console y reemplazar estos valores
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un nuevo proyecto
// 3. Ve a Configuración del proyecto > Tus aplicaciones > Agregar app web
// 4. Copia la configuración y reemplaza los valores abajo
// 5. Habilita Firestore Database en la consola de Firebase

const firebaseConfig = {
  apiKey: "AIzaSyDoO4ba92JaxBZYomZqWE3-o3_2pboE4XE",
  authDomain: "culata-jovai-39018.firebaseapp.com",
  projectId: "culata-jovai-39018",
  storageBucket: "culata-jovai-39018.firebasestorage.app",
  messagingSenderId: "568999082518",
  appId: "1:568999082518:web:dc31c18ecb69db0fde1337",
  measurementId: "G-0SPBLWV323"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore
const db = firebase.firestore();

// Inicializar Storage
const storage = firebase.storage();

// Exportar referencias
window.db = db;
window.storage = storage;
