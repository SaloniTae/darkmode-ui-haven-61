
// Webpushr service for web push notifications
export const WEBPUSHR_API_KEY = "BPG39L-7TmmnyAZMwjZeXu6JD2EOqcgNIhkN5fBXUZ7w6-lO_6W60qjhpzvBJ8xiYYwmCfegohDafyQeBxaqcvE";
export const WEBPUSHR_SCRIPT_URL = "https://cdn.webpushr.com/app.min.js";

// Track initialization status
let isInitialized = false;
let initializationPromise: Promise<boolean> | null = null;

// Initialize Webpushr with proper promise handling
export function initializeWebpushr(): Promise<boolean> {
  // Only run in browser environment
  if (typeof window === 'undefined') return Promise.resolve(false);
  
  // Return existing promise if already initializing
  if (initializationPromise) return initializationPromise;
  
  // Return immediately if already initialized
  if (isInitialized && (window as any).webpushr) {
    console.log('Webpushr already initialized');
    return Promise.resolve(true);
  }
  
  // Create initialization promise
  initializationPromise = new Promise<boolean>((resolve) => {
    // Add Webpushr script to head if not already present
    if (!document.getElementById('webpushr-script')) {
      const webpushrScript = document.createElement('script');
      webpushrScript.id = 'webpushr-script';
      webpushrScript.src = WEBPUSHR_SCRIPT_URL;
      webpushrScript.async = true;
      
      // Setup onload handler
      webpushrScript.onload = () => {
        // Wait a moment for the script to fully initialize
        setTimeout(() => {
          if ((window as any).webpushr) {
            (window as any).webpushr('setup', { 
              key: WEBPUSHR_API_KEY 
            });
            console.log('Webpushr initialized successfully');
            isInitialized = true;
            resolve(true);
          } else {
            console.error('Webpushr loaded but API not available');
            resolve(false);
          }
        }, 500);
      };
      
      // Handle errors
      webpushrScript.onerror = () => {
        console.error('Failed to load Webpushr script');
        initializationPromise = null;
        resolve(false);
      };
      
      document.head.appendChild(webpushrScript);
    } else {
      // If script is already loaded but not initialized
      if ((window as any).webpushr) {
        if (!(window as any).webpushr.initialized) {
          (window as any).webpushr('setup', { 
            key: WEBPUSHR_API_KEY 
          });
          console.log('Webpushr initialized successfully');
        }
        isInitialized = true;
        resolve(true);
      } else {
        console.error('Webpushr script exists but API not available');
        resolve(false);
      }
    }
  });
  
  return initializationPromise;
}

// Register service worker for Webpushr
export function registerWebpushrServiceWorker(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/webpushr-sw.js')
        .then(() => {
          console.log('Webpushr SW registered successfully');
          resolve(true);
        })
        .catch(err => {
          console.error('Webpushr SW registration failed:', err);
          resolve(false);
        });
    } else {
      console.warn('Service workers not supported');
      resolve(false);
    }
  });
}

// Check if push notifications are supported by the browser
export function isPushNotificationsSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Wait until Webpushr is available and then get token
export function getWebpushrToken(): Promise<string | null> {
  return new Promise(async (resolve) => {
    // First ensure Webpushr is initialized
    const initialized = await initializeWebpushr();
    if (!initialized) {
      console.error("Failed to initialize Webpushr");
      resolve(null);
      return;
    }
    
    // Give some time for the Webpushr SDK to fully initialize
    setTimeout(() => {
      if (typeof window === 'undefined' || !(window as any).webpushr) {
        console.error("Webpushr not available");
        resolve(null);
        return;
      }

      // Check if webpushr is already initialized and has a sid
      if ((window as any).webpushr.sid) {
        console.log("Got subscriber token from sid:", (window as any).webpushr.sid);
        resolve((window as any).webpushr.sid);
        return;
      }

      try {
        // Use the correct Webpushr API call to get the subscriber token
        (window as any).webpushr('getSubscriberToken', (token: string) => {
          console.log("Got subscriber token:", token);
          resolve(token || null);
        });
      } catch (e) {
        console.error("Error getting Webpushr token:", e);
        resolve(null);
      }
    }, 1000); // Wait 1 second to ensure Webpushr is fully initialized
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
}): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      // First ensure Webpushr is initialized
      const initialized = await initializeWebpushr();
      if (!initialized) {
        console.error("Failed to initialize Webpushr");
        resolve(false);
        return;
      }
      
      if (typeof window === 'undefined' || !(window as any).webpushr) {
        console.error("Webpushr not available");
        resolve(false);
        return;
      }

      console.log("Sending notification:", { title, message });
      
      // Use the Webpushr JavaScript API instead of REST API
      (window as any).webpushr('localNotification', {
        title,
        message,
        target_url,
        image: image_url,
        tag: notification_tag || undefined
      });
      
      console.log("Notification sent successfully");
      resolve(true);
    } catch (error) {
      console.error("Error sending notification:", error);
      resolve(false);
    }
  });
}

// Check if notifications are currently enabled for this browser
export async function areNotificationsEnabled(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  // Check permission status
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Request notification permission directly
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}
