const firebaseConfig = {
  apiKey: "AIzaSyAG3Ol3VvK21To_31q75C6XxmoFIDLhkQY",
  authDomain: "kadi-a1d99.firebaseapp.com",
  databaseURL: "https://kadi-a1d99-default-rtdb.firebaseio.com",
  projectId: "kadi-a1d99",
  storageBucket: "kadi-a1d99.firebasestorage.app",
  messagingSenderId: "1073311326790",
  appId: "1:1073311326790:web:26692c92794a389757a047",
  measurementId: "G-3QGPPYBHV7"
};

        // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  window.auth = firebase.auth();