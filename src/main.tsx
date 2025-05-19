
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import App from './App.tsx'
import './index.css'

// Ensure Supabase auth persistence by configuring it here
import { supabase } from "@/integrations/supabase/client";

// Register Webpushr service worker
import { registerWebpushrServiceWorker, initializeWebpushr } from '@/services/webpushrService';

// Initialize Webpushr and register service worker asynchronously
const setupWebpushr = async () => {
  try {
    // First register service worker
    await registerWebpushrServiceWorker();
    
    // Then initialize Webpushr (with a slight delay to ensure SW is registered)
    setTimeout(async () => {
      const success = await initializeWebpushr();
      if (success) {
        console.log("Webpushr fully initialized");
      } else {
        console.warn("Webpushr initialization may have issues");
      }
    }, 500);
  } catch (err) {
    console.error("Error setting up Webpushr:", err);
  }
};

// Start the Webpushr setup process
setupWebpushr();

// Log current auth status to help debug session issues
supabase.auth.getSession().then(({ data }) => {
  console.log("Initial auth check:", data.session ? "Session found" : "No session found");
});

// Create root once
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = createRoot(rootElement);

// Render app with all providers
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
