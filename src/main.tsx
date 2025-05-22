
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import App from './App.tsx'
import './index.css'

// Ensure Supabase auth persistence by configuring it here
import { supabase } from "@/integrations/supabase/client";

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
