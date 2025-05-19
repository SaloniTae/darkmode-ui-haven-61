
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getWebpushrToken,
  saveWebpushrToken,
  isPushNotificationsSupported,
  sendNotification
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
          // Check permission status
          const permissionStatus = await Notification.requestPermission();
          setIsEnabled(permissionStatus === "granted");
          
          // Get token if permissions are granted
          if (permissionStatus === "granted") {
            const subscriberToken = await getWebpushrToken();
            setToken(subscriberToken);
            
            // Save token to Supabase if we have userId and token
            if (subscriberToken && userId) {
              await saveWebpushrToken(userId, subscriberToken);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [userId]);
  
  // Request permission and enable notifications
  const enableNotifications = useCallback(async () => {
    try {
      if (!isSupported) return false;
      
      const permissionStatus = await Notification.requestPermission();
      setIsEnabled(permissionStatus === "granted");
      
      if (permissionStatus === "granted") {
        const subscriberToken = await getWebpushrToken();
        setToken(subscriberToken);
        
        // Save token to Supabase if we have userId and token
        if (subscriberToken && userId) {
          await saveWebpushrToken(userId, subscriberToken);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error enabling notifications:", error);
      return false;
    }
  }, [isSupported, userId]);
  
  // Send a notification
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
      
      await sendNotification({
        title,
        message,
        ...options
      });
      
      return true;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }, [isEnabled]);
  
  return {
    isSupported,
    isEnabled,
    isLoading,
    token,
    enableNotifications,
    sendPushNotification
  };
};
