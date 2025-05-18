
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AccessControlContextType {
  isTabRestricted: (tabName: string, userId: string) => boolean;
  restrictedTabs: Record<string, string[]>;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export function AccessControlProvider({ children }: { children: React.ReactNode }) {
  const [restrictedTabs, setRestrictedTabs] = useState<Record<string, string[]>>({});
  
  useEffect(() => {
    const fetchAccessSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_access_settings')
          .select('user_id, restricted_tabs');
        
        if (error) {
          console.error("Error fetching access settings:", error);
          return;
        }

        // Build a map of user_id -> restricted_tabs
        const tabsMap: Record<string, string[]> = {};
        data.forEach(item => {
          if (item.user_id && item.restricted_tabs) {
            tabsMap[item.user_id] = item.restricted_tabs;
          }
        });
        
        setRestrictedTabs(tabsMap);
        console.log("Loaded tab restrictions:", tabsMap);
      } catch (err) {
        console.error("Failed to load access settings:", err);
      }
    };
    
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
  
  const value = {
    isTabRestricted,
    restrictedTabs
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
