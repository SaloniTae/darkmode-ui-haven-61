
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
    const init = async () => {
      try {
        setIsLoading(true);
        
        // Check if notifications are supported
        const supported = isPushNotificationsSupported();
        setIsSupported(supported);
        
        if (supported) {
          // Check if notifications are enabled
          const enabled = await areNotificationsEnabled();
          setIsEnabled(enabled);
          
          if (enabled) {
            // Initialize Webpushr first
            await initializeWebpushr();
            
            // Add a small delay to ensure Webpushr is fully initialized
            setTimeout(async () => {
              try {
                const subscriberToken = await getWebpushrToken();
                console.log("Token retrieved in useNotifications:", subscriberToken);
                setToken(subscriberToken);
                
                // Save token to Supabase if we have userId and token
                if (subscriberToken && userId) {
                  await saveWebpushrToken(userId, subscriberToken);
                }
              } catch (error) {
                console.error("Error getting token:", error);
              } finally {
                setIsLoading(false);
              }
            }, 1500);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
        setIsLoading(false);
      }
    };
    
    init();
  }, [userId]);
  
  // Request permission and enable notifications
  const enableNotifications = useCallback(async () => {
    try {
      if (!isSupported) return false;
      
      // Request notification permission
      const granted = await requestNotificationPermission();
      setIsEnabled(granted);
      
      if (granted) {
        // Ensure Webpushr is initialized
        await initializeWebpushr();
        
        // Add a small delay to ensure Webpushr is fully initialized
        return new Promise<boolean>((resolve) => {
          setTimeout(async () => {
            try {
              const subscriberToken = await getWebpushrToken();
              console.log("Token retrieved in enableNotifications:", subscriberToken);
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
          }, 1500);
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
      
      // Ensure we have a token before sending
      if (!token) {
        console.log("No token available, attempting to get one");
        const newToken = await getWebpushrToken();
        if (!newToken) {
          console.error("Failed to get notification token");
          return false;
        }
      }
      
      console.log("Sending notification:", { title, message, options });
      
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
  }, [isEnabled, token]);
  
  return {
    isSupported,
    isEnabled,
    isLoading,
    token,
    enableNotifications,
    sendPushNotification
  };
};
