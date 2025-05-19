
// Webpushr service for web push notifications
export const WEBPUSHR_API_KEY = "BPG39L-7TmmnyAZMwjZeXu6JD2EOqcgNIhkN5fBXUZ7w6-lO_6W60qjhpzvBJ8xiYYwmCfegohDafyQeBxaqcvE";
export const WEBPUSHR_SCRIPT_URL = "https://cdn.webpushr.com/app.min.js";

// Initialize Webpushr
export function initializeWebpushr() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Add Webpushr script to head if not already present
  if (!document.getElementById('webpushr-script')) {
    const webpushrScript = document.createElement('script');
    webpushrScript.id = 'webpushr-script';
    webpushrScript.src = WEBPUSHR_SCRIPT_URL;
    webpushrScript.async = true;
    
    webpushrScript.onload = () => {
      if ((window as any).webpushr) {
        (window as any).webpushr('setup', { 
          key: WEBPUSHR_API_KEY 
        });
        console.log('Webpushr initialized successfully');
      }
    };
    
    document.head.appendChild(webpushrScript);
  } else {
    // If script is already loaded but not initialized
    if ((window as any).webpushr && !(window as any).webpushr.initialized) {
      (window as any).webpushr('setup', { 
        key: WEBPUSHR_API_KEY 
      });
      console.log('Webpushr initialized successfully');
    }
  }
}

// Register service worker for Webpushr
export function registerWebpushrServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/webpushr-sw.js')
      .then(() => console.log('Webpushr SW registered successfully'))
      .catch(err => console.error('Webpushr SW registration failed:', err));
  }
}

// Check if push notifications are supported by the browser
export function isPushNotificationsSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Get the current Webpushr subscriber token
export function getWebpushrToken(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !(window as any).webpushr) {
      resolve(null);
      return;
    }

    // Check if webpushr is already initialized and has a sid
    if ((window as any).webpushr.sid) {
      console.log("Got subscriber token from sid:", (window as any).webpushr.sid);
      resolve((window as any).webpushr.sid);
      return;
    }

    // Use the correct Webpushr API call to get the subscriber token
    (window as any).webpushr('getSubscriberToken', (token: string) => {
      console.log("Got subscriber token:", token);
      resolve(token || null);
    });
  });
}

// Save the Webpushr token to Supabase
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

// Use the native Webpushr API to send a notification
export function sendNotification({
  title,
  message,
  target_url = window.location.origin,
  image_url = '',
  notification_tag = ''
}: {
  title: string;
  message: string;
  target_url?: string;
  image_url?: string;
  notification_tag?: string;
}): boolean {
  try {
    if (typeof window === 'undefined' || !(window as any).webpushr) {
      console.error("Webpushr not available");
      return false;
    }

    // Use the Webpushr JavaScript API instead of REST API
    (window as any).webpushr('localNotification', {
      title,
      message,
      target_url,
      image: image_url,
      tag: notification_tag || undefined
    });
    
    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
}
