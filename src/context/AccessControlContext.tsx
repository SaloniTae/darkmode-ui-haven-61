
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export function AccessControlProvider({ children }: { children: ReactNode }) {
  const [accessSettings, setAccessSettings] = useState<AccessSettings>({});
  const [uiRestrictions, setUiRestrictions] = useState<UIRestriction[]>([]);

  useEffect(() => {
    // Load settings from localStorage
    const loadSettings = () => {
      try {
        const savedAccessSettings = localStorage.getItem("admin_access_settings");
        if (savedAccessSettings) {
          setAccessSettings(JSON.parse(savedAccessSettings));
        }

        const savedUiRestrictions = localStorage.getItem("ui_restrictions");
        if (savedUiRestrictions) {
          setUiRestrictions(JSON.parse(savedUiRestrictions));
        }
      } catch (error) {
        console.error("Error loading access control settings:", error);
      }
    };

    loadSettings();

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin_access_settings") {
        try {
          const newSettings = e.newValue ? JSON.parse(e.newValue) : {};
          setAccessSettings(newSettings);
        } catch (error) {
          console.error("Error parsing access settings from storage:", error);
        }
      }

      if (e.key === "ui_restrictions") {
        try {
          const newRestrictions = e.newValue ? JSON.parse(e.newValue) : [];
          setUiRestrictions(newRestrictions);
        } catch (error) {
          console.error("Error parsing UI restrictions from storage:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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

  return (
    <AccessControlContext.Provider value={{
      accessSettings,
      uiRestrictions,
      isElementRestricted,
      isTabRestricted,
      canUserModify,
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
