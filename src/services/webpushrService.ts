
// Webpushr service for web push notifications
export const WEBPUSHR_API_KEY = "BPG39L-7TmmnyAZMwjZeXu6JD2EOqcgNIhkN5fBXUZ7w6-lO_6W60qjhpzvBJ8xiYYwmCfegohDafyQeBxaqcvE";
export const WEBPUSHR_SCRIPT_URL = "https://cdn.webpushr.com/app.min.js";

// Track initialization status
let isInitialized = false;
let webpushrLoaded = false;
let initializationPromise: Promise<boolean> | null = null;

// Initialize Webpushr with proper promise handling
export function initializeWebpushr(): Promise<boolean> {
  // Only run in browser environment
  if (typeof window === 'undefined') return Promise.resolve(false);
  
  // Return existing promise if already initializing
  if (initializationPromise) return initializationPromise;
  
  // Return immediately if already initialized
  if (isInitialized && (window as any).webpushr && webpushrLoaded) {
    console.log('Webpushr already initialized and loaded');
    return Promise.resolve(true);
  }
  
  // Create initialization promise
  initializationPromise = new Promise<boolean>((resolve) => {
    // Check if script already exists
    if (document.getElementById('webpushr-script')) {
      // Script exists, check if API is loaded
      if ((window as any).webpushr) {
        console.log('Webpushr script already exists and API is available');
        setupWebpushr(resolve);
      } else {
        console.log('Webpushr script exists but API not loaded yet, waiting...');
        // Wait for script to load
        const checkInterval = setInterval(() => {
          if ((window as any).webpushr) {
            clearInterval(checkInterval);
            setupWebpushr(resolve);
          }
        }, 100);
        
        // Set timeout to prevent infinite waiting
        setTimeout(() => {
          clearInterval(checkInterval);
          console.error('Timed out waiting for Webpushr API');
          initializationPromise = null;
          resolve(false);
        }, 10000);
      }
      return;
    }
    
    // Add Webpushr script to head
    const webpushrScript = document.createElement('script');
    webpushrScript.id = 'webpushr-script';
    webpushrScript.src = WEBPUSHR_SCRIPT_URL;
    webpushrScript.async = true;
    
    // Setup onload handler
    webpushrScript.onload = () => {
      console.log('Webpushr script loaded');
      // Wait for the API to become available
      const checkInterval = setInterval(() => {
        if ((window as any).webpushr) {
          clearInterval(checkInterval);
          setupWebpushr(resolve);
        }
      }, 100);
      
      // Set timeout to prevent infinite waiting
      setTimeout(() => {
        clearInterval(checkInterval);
        console.error('Timed out waiting for Webpushr API after script load');
        initializationPromise = null;
        resolve(false);
      }, 10000);
    };
    
    // Handle errors
    webpushrScript.onerror = () => {
      console.error('Failed to load Webpushr script');
      initializationPromise = null;
      resolve(false);
    };
    
    document.head.appendChild(webpushrScript);
  });
  
  return initializationPromise;
}

// Helper function to setup Webpushr
function setupWebpushr(resolve: (success: boolean) => void): void {
  try {
    if ((window as any).webpushr && !(window as any).webpushr.initialized) {
      console.log('Setting up Webpushr with API key');
      (window as any).webpushr('setup', { 
        key: WEBPUSHR_API_KEY 
      });
      
      // Add a small delay to ensure setup completes
      setTimeout(() => {
        console.log('Webpushr initialization complete');
        isInitialized = true;
        webpushrLoaded = true;
        resolve(true);
      }, 500);
    } else if ((window as any).webpushr) {
      console.log('Webpushr already setup');
      isInitialized = true;
      webpushrLoaded = true;
      resolve(true);
    } else {
      console.error('Webpushr API not available for setup');
      resolve(false);
    }
  } catch (error) {
    console.error('Error during Webpushr setup:', error);
    resolve(false);
  }
}

// Register service worker for Webpushr
export function registerWebpushrServiceWorker(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/webpushr-sw.js')
        .then((registration) => {
          console.log('Webpushr SW registered successfully:', registration.scope);
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
        console.error("Webpushr not available for getToken");
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
          if (token) {
            console.log("Got subscriber token:", token);
            resolve(token);
          } else {
            console.log("No subscriber token available, user may not be subscribed yet");
            resolve(null);
          }
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

// Use the native Webpushr API to send a notification with proper error handling
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
        console.error("Webpushr not available for sending notification");
        resolve(false);
        return;
      }

      console.log("Preparing to send notification:", { title, message });
      
      // Ensure webpushr.localNotification is a function
      if (typeof (window as any).webpushr !== 'function') {
        console.error("webpushr is not a function");
        resolve(false);
        return;
      }

      // Use a try-catch block specifically around the API call
      try {
        // Use the Webpushr JavaScript API for sending notification
        console.log("Calling webpushr localNotification");
        (window as any).webpushr('localNotification', {
          title,
          message,
          target_url,
          image: image_url || undefined,
          tag: notification_tag || undefined
        });
        
        console.log("Notification sent successfully");
        resolve(true);
      } catch (callError) {
        console.error("Error calling webpushr localNotification:", callError);
        resolve(false);
      }
    } catch (error) {
      console.error("Error in sendNotification:", error);
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
  return Notification.permission === 'granted';
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
