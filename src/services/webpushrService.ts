
// Webpushr service for web push notifications
export const WEBPUSHR_API_KEY = "8d278ba866f65131a3a1f7ddfdd40de5";
export const WEBPUSHR_AUTH_TOKEN = "109107";
export const WEBPUSHR_SCRIPT_URL = "https://cdn.webpushr.com/sw-server.min.js";

// Function to load the Webpushr script
export function loadWebpushrScript() {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector('script[src="' + WEBPUSHR_SCRIPT_URL + '"]')) {
      console.log("Webpushr script already loaded");
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = WEBPUSHR_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      console.log("Webpushr script loaded");
      resolve();
    };
    script.onerror = (error) => {
      console.error("Error loading Webpushr script:", error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

// Initialize Webpushr with configuration
export function initializeWebpushr() {
  // Add the Webpushr configuration
  if (typeof window !== 'undefined') {
    (window as any).webpushr = (window as any).webpushr || [];
    (window as any).webpushr.push(['init', {
      key: WEBPUSHR_API_KEY,
    }]);
    
    loadWebpushrScript();
  }
}

// Check if push notifications are supported
export function isPushNotificationsSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Send a notification using the Webpushr API
export async function sendNotification({
  title,
  message,
  target_url = window.location.origin,
  expiry = Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  image_url = '',
  notification_tag = ''
}: {
  title: string;
  message: string;
  target_url?: string;
  expiry?: number;
  image_url?: string;
  notification_tag?: string;
}) {
  try {
    const response = await fetch('https://api.webpushr.com/v1/notification/send/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'webpushrKey': WEBPUSHR_API_KEY,
        'webpushrAuthToken': WEBPUSHR_AUTH_TOKEN
      },
      body: JSON.stringify({
        title,
        message,
        target_url,
        expiry,
        image_url,
        auto_hide: 1,
        notification_tag
      })
    });

    const data = await response.json();
    console.log("Webpushr API response:", data);
    return data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}

// Get the current Webpushr subscriber token
export function getWebpushrToken(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !(window as any).webpushr) {
      resolve(null);
      return;
    }

    // Check if webpushr is already initialized
    if ((window as any).webpushr.sid) {
      resolve((window as any).webpushr.sid);
      return;
    }

    // If not initialized yet, wait for the token
    (window as any).webpushr.push(['getSubscriberToken', (token: string) => {
      console.log("Got subscriber token:", token);
      resolve(token || null);
    }]);
  });
}

// Create a hook for using Webpushr token
export async function saveWebpushrToken(userId: string, token: string) {
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    // Get device info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase
      .from('notification_tokens')
      .upsert({
        user_id: userId,
        token,
        device_info: deviceInfo,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    console.log("Token saved to Supabase:", token);
    return true;
  } catch (error) {
    console.error("Error saving token to Supabase:", error);
    return false;
  }
}
