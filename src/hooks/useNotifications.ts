
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useNotifications = (userId?: string) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Return dummy implementation since notifications are not used anymore
  return {
    isSupported: false,
    isEnabled: false,
    isLoading: false,
    token: null,
    enableNotifications: async () => false,
    sendPushNotification: async () => false
  };
};
