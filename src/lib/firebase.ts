
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, remove, update, onValue, off } from "firebase/database";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA02dPt8yMTSmhzyj9PIrm4UlWr1a1waD4",
  authDomain: "testing-6de54.firebaseapp.com",
  databaseURL: "https://testing-6de54-default-rtdb.firebaseio.com",
  projectId: "testing-6de54",
  storageBucket: "testing-6de54.firebasestorage.app",
  messagingSenderId: "159795986690",
  appId: "1:159795986690:web:2e4de44d725826dc01821b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Database helper functions
export const fetchData = async (path: string) => {
  const dataRef = ref(database, path);
  const snapshot = await get(dataRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const updateData = async (path: string, data: any) => {
  const dataRef = ref(database, path);
  await update(dataRef, data);
  return data;
};

export const setData = async (path: string, data: any) => {
  const dataRef = ref(database, path);
  await set(dataRef, data);
  return data;
};

export const removeData = async (path: string) => {
  const dataRef = ref(database, path);
  await remove(dataRef);
  return true;
};

// Realtime listener functions
export const subscribeToData = (path: string, callback: (data: any) => void) => {
  const dataRef = ref(database, path);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.exists() ? snapshot.val() : null;
    callback(data);
  });
  
  // Return unsubscribe function
  return () => off(dataRef);
};
