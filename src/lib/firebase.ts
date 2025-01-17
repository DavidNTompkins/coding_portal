// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyCWNxfExNhlXQPuVUJ6_xxVWd_ZEhXedw4",
    authDomain: "time-coding-portal.firebaseapp.com",
    databaseURL: "https://time-coding-portal-default-rtdb.firebaseio.com",
    projectId: "time-coding-portal",
    storageBucket: "time-coding-portal.firebasestorage.app",
    messagingSenderId: "705779942947",
    appId: "1:705779942947:web:448ce83d236d4568109396"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);

// Enable emulator in development
if (process.env.NODE_ENV === 'development') {
  // Optional: Connect to Firebase emulators
  // connectDatabaseEmulator(database, 'localhost', 9000);
}

export { auth, database };