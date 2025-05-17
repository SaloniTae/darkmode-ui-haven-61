
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { user } = useAuth();

  // Function to fetch data from Supabase with better error handling
  const fetchAccessControlData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      console.log("Fetching access control settings...");
      
      // Fetch access settings
      const { data: accessData, error: accessError } = await supabase
        .from('admin_access_settings')
        .select('*');

      if (accessError) {
        console.error("Error fetching access settings:", accessError);
        setFetchError(`Failed to load access settings: ${accessError.message}`);
        toast.error("Failed to load access settings");
        setAccessSettings({}); // Use empty object as fallback
      } else {
        // Debug the access settings
        console.log("Fetched access settings:", accessData);
        
        // Transform access settings data to match our state structure
        const formattedAccessSettings: AccessSettings = {};
        accessData?.forEach(setting => {
          formattedAccessSettings[setting.user_id] = {
            canModify: setting.can_modify !== false, // Default to true if null
            restrictedTabs: setting.restricted_tabs || [],
            username: setting.username,
            service: setting.service
          };
        });
        
        setAccessSettings(formattedAccessSettings);
      }
      
      // Fetch UI restrictions
      const { data: restrictionsData, error: restrictionsError } = await supabase
        .from('ui_restrictions')
        .select('*');

      if (restrictionsError) {
        console.error("Error fetching UI restrictions:", restrictionsError);
        setFetchError(`Failed to load UI restrictions: ${restrictionsError.message}`);
        toast.error("Failed to load UI restrictions");
        setUiRestrictions([]); // Use empty array as fallback
      } else {
        console.log("Fetched UI restrictions:", restrictionsData);

        // Transform UI restrictions data
        const formattedUiRestrictions: UIRestriction[] = restrictionsData?.map(restriction => ({
          elementId: restriction.element_id,
          type: restriction.restriction_type as "blur" | "hide" | "disable",
          userIds: restriction.user_ids || []
        })) || [];

        setUiRestrictions(formattedUiRestrictions);
      }
    } catch (error: any) {
      const errorMessage = `Error loading access control settings: ${error.message || "Unknown error"}`;
      console.error(errorMessage, error);
      setFetchError(errorMessage);
      toast.error("Failed to load access control settings");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (user) {
      fetchAccessControlData();
      
      // Check if Supabase client is properly initialized
      if (!supabase) {
        console.error("Supabase client is not initialized");
        toast.error("Database connection error");
        return;
      }
    }
    
    // Set up subscription for real-time updates
    const accessChannel = supabase
      .channel('access-control-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_access_settings' },
        () => {
          console.log('Access settings changed, refreshing...');
          fetchAccessControlData();
        }
      )
      .subscribe((status) => {
        console.log("Access settings subscription status:", status);
      });
      
    const restrictionsChannel = supabase
      .channel('ui-restrictions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ui_restrictions' },
        () => {
          console.log('UI restrictions changed, refreshing...');
          fetchAccessControlData();
        }
      )
      .subscribe((status) => {
        console.log("UI restrictions subscription status:", status);
      });
    
    // Cleanup function
    return () => {
      supabase.removeChannel(accessChannel);
      supabase.removeChannel(restrictionsChannel);
    };
  }, [user]);

  const isElementRestricted = (elementId: string, userId: string) => {
    // If we're still loading or had an error, default to not restricted
    if (loading || fetchError) {
      return { restricted: false };
    }
    
    const restriction = uiRestrictions.find(r => 
      r.elementId === elementId && r.userIds.includes(userId)
    );

    return restriction 
      ? { restricted: true, type: restriction.type } 
      : { restricted: false };
  };

  const isTabRestricted = (tabName: string, userId: string) => {
    // If we're still loading or had an error, default to not restricted
    if (loading || fetchError) {
      return false;
    }
    
    const userSettings = accessSettings[userId];
    if (!userSettings) return false;
    
    console.log(`Checking if tab ${tabName} is restricted for user ${userId}`);
    console.log(`User restricted tabs:`, userSettings.restrictedTabs);
    
    return userSettings.restrictedTabs.includes(tabName);
  };

  const canUserModify = (userId: string) => {
    // If we're still loading or had an error, default to true
    if (loading || fetchError) {
      return true;
    }
    
    const userSettings = accessSettings[userId];
    if (!userSettings) return true; // Default to allowing if not configured
    
    console.log(`Checking if user ${userId} can modify. Result:`, userSettings.canModify);
    return userSettings.canModify;
  };
  
  // Function to manually refresh settings
  const refreshSettings = async () => {
    console.log("Manually refreshing access control settings");
    return fetchAccessControlData();
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
      {fetchError && (
        <div className="bg-red-500/10 border border-red-500 text-red-700 p-4 m-4 rounded-md" role="alert">
          <div className="font-bold">Access Control Error</div>
          <div className="text-sm">{fetchError}</div>
          <button 
            onClick={() => fetchAccessControlData()}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-2 rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}
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
