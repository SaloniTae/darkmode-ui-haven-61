
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getWebpushrToken,
  saveWebpushrToken,
  isPushNotificationsSupported,
  sendNotification,
  initializeWebpushr,
  requestNotificationPermission,
  areNotificationsEnabled
} from "@/services/webpushrService";

export const useNotifications = (userId?: string) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize and check support
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        
        // Check if notifications are supported
        const supported = isPushNotificationsSupported();
        if (isMounted) setIsSupported(supported);
        
        if (supported) {
          // Check if notifications are enabled
          const enabled = await areNotificationsEnabled();
          if (isMounted) setIsEnabled(enabled);
          
          if (enabled) {
            console.log("Notifications are enabled, initializing Webpushr");
            // Initialize Webpushr first
            await initializeWebpushr();
            
            // Add a delay to ensure Webpushr is fully initialized
            setTimeout(async () => {
              if (!isMounted) return;
              
              try {
                const subscriberToken = await getWebpushrToken();
                console.log("Token retrieved in useNotifications:", subscriberToken);
                
                if (isMounted) {
                  setToken(subscriberToken);
                  
                  // Save token to Supabase if we have userId and token
                  if (subscriberToken && userId) {
                    await saveWebpushrToken(userId, subscriberToken);
                  }
                }
              } catch (error) {
                console.error("Error getting token:", error);
              } finally {
                if (isMounted) setIsLoading(false);
              }
            }, 2000); // Increased delay to ensure proper initialization
          } else {
            if (isMounted) setIsLoading(false);
          }
        } else {
          if (isMounted) setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
        if (isMounted) setIsLoading(false);
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, [userId]);
  
  // Request permission and enable notifications
  const enableNotifications = useCallback(async () => {
    try {
      if (!isSupported) return false;
      
      console.log("Requesting notification permission");
      // Request notification permission
      const granted = await requestNotificationPermission();
      setIsEnabled(granted);
      
      if (granted) {
        console.log("Permission granted, initializing Webpushr");
        // Ensure Webpushr is initialized
        await initializeWebpushr();
        
        // Add a delay to ensure Webpushr is fully initialized
        return new Promise<boolean>((resolve) => {
          setTimeout(async () => {
            try {
              const subscriberToken = await getWebpushrToken();
              console.log("Token retrieved after enabling:", subscriberToken);
              setToken(subscriberToken);
              
              // Save token to Supabase if we have userId and token
              if (subscriberToken && userId) {
                await saveWebpushrToken(userId, subscriberToken);
              }
              
              resolve(!!subscriberToken);
            } catch (error) {
              console.error("Error enabling notifications:", error);
              resolve(false);
            }
          }, 2000); // Increased delay for more reliable initialization
        });
      }
      
      return false;
    } catch (error) {
      console.error("Error enabling notifications:", error);
      return false;
    }
  }, [isSupported, userId]);
  
  // Send a notification using the updated method
  const sendPushNotification = useCallback(async (
    title: string,
    message: string,
    options: {
      target_url?: string;
      image_url?: string;
      notification_tag?: string;
    } = {}
  ) => {
    try {
      if (!isEnabled) {
        console.warn("Notifications are not enabled");
        return false;
      }
      
      // Re-check token before sending
      let notificationToken = token;
      if (!notificationToken) {
        console.log("No token available, attempting to get one");
        
        // Force re-initialization of Webpushr
        await initializeWebpushr();
        
        // Try to get the token after a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        notificationToken = await getWebpushrToken();
        if (notificationToken) {
          setToken(notificationToken);
          
          // Save new token if user id exists
          if (userId) {
            await saveWebpushrToken(userId, notificationToken);
          }
        }
        
        if (!notificationToken) {
          console.error("Failed to get notification token");
          return false;
        }
      }
      
      console.log("Sending notification with token:", notificationToken);
      console.log("Notification details:", { title, message, options });
      
      // Use the updated sendNotification that returns a Promise
      const result = await sendNotification({
        title,
        message,
        ...options
      });
      
      return result;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }, [isEnabled, token, userId]);
  
  return {
    isSupported,
    isEnabled,
    isLoading,
    token,
    enableNotifications,
    sendPushNotification
  };
};
