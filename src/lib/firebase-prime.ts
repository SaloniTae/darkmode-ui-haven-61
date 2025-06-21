
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, remove, update, onValue, off } from "firebase/database";

// Firebase configuration for Prime
const firebaseConfig = {
  apiKey: "AIzaSyA02dPt8yMTSmhzyj9PIrm4UlWr1a1waD4",
  authDomain: "testing-6de54.firebaseapp.com",
  databaseURL: "https://testing-6de54-default-rtdb.firebaseio.com",
  projectId: "testing-6de54",
  storageBucket: "testing-6de54.firebasestorage.app",
  messagingSenderId: "159795986690",
  appId: "1:159795986690:web:2e4de44d725826dc01821b"
};

// Initialize Firebase for Prime
const primeApp = initializeApp(firebaseConfig, "prime");
export const primeDatabase = getDatabase(primeApp);

// Database helper functions for Prime
export const fetchPrimeData = async (path: string) => {
  const dataRef = ref(primeDatabase, path);
  const snapshot = await get(dataRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const updatePrimeData = async (path: string, data: any) => {
  const dataRef = ref(primeDatabase, path);
  await update(dataRef, data);
  return data;
};

export const setPrimeData = async (path: string, data: any) => {
  const dataRef = ref(primeDatabase, path);
  await set(dataRef, data);
  return data;
};

export const removePrimeData = async (path: string) => {
  const dataRef = ref(primeDatabase, path);
  await remove(dataRef);
  return true;
};

// Realtime listener functions for Prime
export const subscribeToPrimeData = (path: string, callback: (data: any) => void) => {
  const dataRef = ref(primeDatabase, path);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.exists() ? snapshot.val() : null;
    callback(data);
  });
  
  // Return unsubscribe function
  return () => off(dataRef);
};
