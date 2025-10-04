
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface AccessControlContextType {
  isTabRestricted: (tabName: string, userId: string) => boolean;
  isElementRestricted: (elementId: string, userId: string) => { restricted: boolean; type: string };
  restrictedTabs: Record<string, string[]>;
  refreshSettings: () => Promise<void>;
  lastRefresh: number;
  isInitialized: boolean;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export function AccessControlProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [restrictedTabs, setRestrictedTabs] = useState<Record<string, string[]>>({});
  const [uiRestrictions, setUIRestrictions] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);
  
  const fetchAccessSettings = async () => {
    try {
      // Fetch tab restrictions
      const { data: tabData, error: tabError } = await supabase
        .from('admin_access_settings')
        .select('user_id, restricted_tabs');
      
      if (tabError) {
        console.error("Error fetching tab restrictions:", tabError);
        return;
      }

      // Build a map of user_id -> restricted_tabs
      const tabsMap: Record<string, string[]> = {};
      tabData?.forEach(item => {
        if (item.user_id && item.restricted_tabs) {
          tabsMap[item.user_id] = item.restricted_tabs;
        }
      });
      
      setRestrictedTabs(tabsMap);
      console.log("Loaded tab restrictions:", tabsMap);
      
      // Fetch UI element restrictions
      const { data: uiData, error: uiError } = await supabase
        .from('ui_restrictions')
        .select('*');
        
      if (uiError) {
        console.error("Error fetching UI restrictions:", uiError);
        return;
      }
      
      setUIRestrictions(uiData || []);
      console.log("Loaded UI restrictions:", uiData);
      
      // Update last refresh timestamp and mark as initialized
      setLastRefresh(Date.now());
      setIsInitialized(true);
    } catch (err) {
      console.error("Failed to load access settings:", err);
    }
  };
  
  // Auto-refresh access settings when user logs in or changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("User authenticated, refreshing access settings for user:", user.id);
      // Reset initialized state when user changes to force a fresh fetch
      setIsInitialized(false);
      fetchAccessSettings();
    } else if (!isAuthenticated) {
      // Clear restrictions when user logs out
      setRestrictedTabs({});
      setUIRestrictions([]);
      setIsInitialized(false);
    }
  }, [isAuthenticated, user?.id]);
  
  // Initial fetch on mount
  useEffect(() => {
    fetchAccessSettings();
  }, []);

  // Check if a specific tab is restricted for a user
  const isTabRestricted = (tabName: string, userId: string): boolean => {
    const userRestrictions = restrictedTabs[userId];
    
    if (!userRestrictions) {
      // No specific restrictions for this user
      return false;
    }
    
    return userRestrictions.includes(tabName);
  };
  
  // Check if a specific UI element is restricted for a user
  const isElementRestricted = (elementId: string, userId: string): { restricted: boolean; type: string } => {
    // Find any restrictions for this element
    const elementRestriction = uiRestrictions.find(r => 
      r.element_id === elementId && r.user_ids.includes(userId)
    );
    
    if (!elementRestriction) {
      return { restricted: false, type: "none" };
    }
    
    return { 
      restricted: true, 
      type: elementRestriction.restriction_type || "disable" 
    };
  };
  
  // Function to refresh access control settings
  const refreshSettings = async (): Promise<void> => {
    await fetchAccessSettings();
  };
  
  const value = {
    isTabRestricted,
    isElementRestricted,
    restrictedTabs,
    refreshSettings,
    lastRefresh,
    isInitialized
  };

  return <AccessControlContext.Provider value={value}>{children}</AccessControlContext.Provider>;
}

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error("useAccessControl must be used within an AccessControlProvider");
  }
  return context;
};
