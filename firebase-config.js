// Configuración de Firebase
// IMPORTANTE: Deberás crear un proyecto en Firebase Console y reemplazar estos valores
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un nuevo proyecto
// 3. Ve a Configuración del proyecto > Tus aplicaciones > Agregar app web
// 4. Copia la configuración y reemplaza los valores abajo
// 5. Habilita Firestore Database en la consola de Firebase

const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore
const db = firebase.firestore();

// Exportar referencias
window.db = db;
