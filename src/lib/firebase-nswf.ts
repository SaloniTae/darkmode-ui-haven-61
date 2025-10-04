
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, remove, update, onValue, off } from "firebase/database";

// Firebase configuration for NSWF
const firebaseConfig = {
  apiKey: "AIzaSyA02dPt8yMTSmhzyj9PIrm4UlWr1a1waD4",
  authDomain: "testing-6de54.firebaseapp.com",
  databaseURL: "https://testing-6de54-default-rtdb.firebaseio.com",
  projectId: "testing-6de54",
  storageBucket: "testing-6de54.firebasestorage.app",
  messagingSenderId: "159795986690",
  appId: "1:159795986690:web:2e4de44d725826dc01821b"
};

// Initialize Firebase for NSWF
const nswfApp = initializeApp(firebaseConfig, "nswf");
export const nswfDatabase = getDatabase(nswfApp);

// Database helper functions for NSWF
export const fetchNswfData = async (path: string) => {
  const dataRef = ref(nswfDatabase, path);
  const snapshot = await get(dataRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const updateNswfData = async (path: string, data: any) => {
  const dataRef = ref(nswfDatabase, path);
  await update(dataRef, data);
  return data;
};

export const setNswfData = async (path: string, data: any) => {
  const dataRef = ref(nswfDatabase, path);
  await set(dataRef, data);
  return data;
};

export const removeNswfData = async (path: string) => {
  const dataRef = ref(nswfDatabase, path);
  await remove(dataRef);
  return true;
};

// Realtime listener functions for NSWF
export const subscribeToNswfData = (path: string, callback: (data: any) => void) => {
  const dataRef = ref(nswfDatabase, path);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.exists() ? snapshot.val() : null;
    callback(data);
  });
  
  // Return unsubscribe function
  return () => off(dataRef);
};
