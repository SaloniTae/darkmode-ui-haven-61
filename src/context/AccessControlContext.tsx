
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AccessSettings {
  [userId: string]: {
    canModify: boolean;
    restrictedTabs: string[];
    username: string;
    service: string;
  };
}

interface UIRestriction {
  elementId: string;
  type: "blur" | "hide" | "disable";
  userIds: string[];
}

interface AccessControlContextType {
  accessSettings: AccessSettings;
  uiRestrictions: UIRestriction[];
  isElementRestricted: (elementId: string, userId: string) => { restricted: boolean, type?: "blur" | "hide" | "disable" };
  isTabRestricted: (tabName: string, userId: string) => boolean;
  canUserModify: (userId: string) => boolean;
  refreshSettings: () => Promise<void>;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export function AccessControlProvider({ children }: { children: ReactNode }) {
  const [accessSettings, setAccessSettings] = useState<AccessSettings>({});
  const [uiRestrictions, setUiRestrictions] = useState<UIRestriction[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch data from Supabase
  const fetchAccessControlData = async () => {
    try {
      setLoading(true);
      
      // Fetch access settings
      const { data: accessData, error: accessError } = await supabase
        .from('admin_access_settings')
        .select('*');

      if (accessError) {
        console.error("Error fetching access settings:", accessError);
        toast.error("Failed to load access settings");
        return;
      }

      // Fetch UI restrictions
      const { data: restrictionsData, error: restrictionsError } = await supabase
        .from('ui_restrictions')
        .select('*');

      if (restrictionsError) {
        console.error("Error fetching UI restrictions:", restrictionsError);
        toast.error("Failed to load UI restrictions");
        return;
      }

      // Transform access settings data to match our state structure
      const formattedAccessSettings: AccessSettings = {};
      accessData?.forEach(setting => {
        formattedAccessSettings[setting.user_id] = {
          canModify: setting.can_modify,
          restrictedTabs: setting.restricted_tabs || [],
          username: setting.username,
          service: setting.service
        };
      });

      // Transform UI restrictions data
      const formattedUiRestrictions: UIRestriction[] = restrictionsData?.map(restriction => ({
        elementId: restriction.element_id,
        type: restriction.restriction_type as "blur" | "hide" | "disable",
        userIds: restriction.user_ids || []
      })) || [];

      setAccessSettings(formattedAccessSettings);
      setUiRestrictions(formattedUiRestrictions);
    } catch (error) {
      console.error("Error loading access control settings:", error);
      toast.error("Failed to load access control settings");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAccessControlData();
    
    // Subscribe to changes (using PostgreSQL changes requires additional setup,
    // for now we'll just use manual refresh)
  }, []);

  const isElementRestricted = (elementId: string, userId: string) => {
    const restriction = uiRestrictions.find(r => 
      r.elementId === elementId && r.userIds.includes(userId)
    );

    return restriction 
      ? { restricted: true, type: restriction.type } 
      : { restricted: false };
  };

  const isTabRestricted = (tabName: string, userId: string) => {
    const userSettings = accessSettings[userId];
    if (!userSettings) return false;
    return userSettings.restrictedTabs.includes(tabName);
  };

  const canUserModify = (userId: string) => {
    const userSettings = accessSettings[userId];
    if (!userSettings) return true; // Default to allowing if not configured
    return userSettings.canModify;
  };
  
  // Function to manually refresh settings
  const refreshSettings = async () => {
    await fetchAccessControlData();
  };

  return (
    <AccessControlContext.Provider value={{
      accessSettings,
      uiRestrictions,
      isElementRestricted,
      isTabRestricted,
      canUserModify,
      refreshSettings
    }}>
      {children}
    </AccessControlContext.Provider>
  );
}

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error("useAccessControl must be used within an AccessControlProvider");
  }
  return context;
};
