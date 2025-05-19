
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getWebpushrToken,
  saveWebpushrToken,
  isPushNotificationsSupported,
  sendNotification,
  initializeWebpushr
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
        
        // Make sure Webpushr is initialized
        initializeWebpushr();
        
        // Check if notifications are supported
        const supported = isPushNotificationsSupported();
        setIsSupported(supported);
        
        if (supported) {
          // Check permission status
          const permissionStatus = await Notification.requestPermission();
          setIsEnabled(permissionStatus === "granted");
          
          // Get token if permissions are granted
          if (permissionStatus === "granted") {
            // Add a small delay to ensure Webpushr is fully initialized
            setTimeout(async () => {
              const subscriberToken = await getWebpushrToken();
              console.log("Token retrieved in useNotifications:", subscriberToken);
              setToken(subscriberToken);
              
              // Save token to Supabase if we have userId and token
              if (subscriberToken && userId) {
                await saveWebpushrToken(userId, subscriberToken);
              }
              
              setIsLoading(false);
            }, 1000);
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
      
      // Initialize Webpushr again to be safe
      initializeWebpushr();
      
      const permissionStatus = await Notification.requestPermission();
      setIsEnabled(permissionStatus === "granted");
      
      if (permissionStatus === "granted") {
        // Add a small delay to ensure Webpushr is fully initialized
        return new Promise<boolean>((resolve) => {
          setTimeout(async () => {
            const subscriberToken = await getWebpushrToken();
            console.log("Token retrieved in enableNotifications:", subscriberToken);
            setToken(subscriberToken);
            
            // Save token to Supabase if we have userId and token
            if (subscriberToken && userId) {
              await saveWebpushrToken(userId, subscriberToken);
            }
            
            resolve(!!subscriberToken);
          }, 1000);
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
      if (!isEnabled) return false;
      
      // Ensure we have a token before sending
      if (!token) {
        const newToken = await getWebpushrToken();
        if (!newToken) return false;
      }
      
      const result = sendNotification({
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
