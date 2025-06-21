
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, remove, update, onValue, off } from "firebase/database";

// Firebase configuration for Netflix
const firebaseConfig = {
  apiKey: "AIzaSyA02dPt8yMTSmhzyj9PIrm4UlWr1a1waD4",
  authDomain: "testing-6de54.firebaseapp.com",
  databaseURL: "https://testing-6de54-default-rtdb.firebaseio.com",
  projectId: "testing-6de54",
  storageBucket: "testing-6de54.firebasestorage.app",
  messagingSenderId: "159795986690",
  appId: "1:159795986690:web:2e4de44d725826dc01821b"
};

// Initialize Firebase for Netflix
const netflixApp = initializeApp(firebaseConfig, "netflix");
export const netflixDatabase = getDatabase(netflixApp);

// Database helper functions for Netflix
export const fetchNetflixData = async (path: string) => {
  const dataRef = ref(netflixDatabase, path);
  const snapshot = await get(dataRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const updateNetflixData = async (path: string, data: any) => {
  const dataRef = ref(netflixDatabase, path);
  await update(dataRef, data);
  return data;
};

export const setNetflixData = async (path: string, data: any) => {
  const dataRef = ref(netflixDatabase, path);
  await set(dataRef, data);
  return data;
};

export const removeNetflixData = async (path: string) => {
  const dataRef = ref(netflixDatabase, path);
  await remove(dataRef);
  return true;
};

// Realtime listener functions for Netflix
export const subscribeToNetflixData = (path: string, callback: (data: any) => void) => {
  const dataRef = ref(netflixDatabase, path);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.exists() ? snapshot.val() : null;
    callback(data);
  });
  
  // Return unsubscribe function
  return () => off(dataRef);
};
