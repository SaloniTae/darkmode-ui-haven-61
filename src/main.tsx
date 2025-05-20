
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
    console.log("Starting Webpushr setup process...");
    
    // First register service worker
    const swRegistered = await registerWebpushrServiceWorker();
    console.log("Service worker registration result:", swRegistered);
    
    // Then initialize Webpushr (with a delay to ensure SW is registered)
    setTimeout(async () => {
      try {
        const success = await initializeWebpushr();
        if (success) {
          console.log("Webpushr fully initialized");
        } else {
          console.warn("Webpushr initialization may have issues");
        }
      } catch (err) {
        console.error("Error during Webpushr initialization:", err);
      }
    }, 1000);
  } catch (err) {
    console.error("Error in setupWebpushr:", err);
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
