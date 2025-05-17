
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAccessControl } from "@/context/AccessControlContext";
import { TabsContent } from "@/components/ui/tabs";
import { Shield } from "lucide-react";

interface RestrictedTabProps {
  tabName: string;
  children: ReactNode;
}

export function RestrictedTab({ tabName, children }: RestrictedTabProps) {
  const { user } = useAuth();
  const { isTabRestricted, refreshSettings } = useAccessControl();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Refresh settings when component mounts
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshSettings();
      } catch (err: any) {
        console.error("Failed to refresh tab restriction settings:", err);
        setError("Failed to load tab restriction settings");
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [refreshSettings]);
  
  // If no user, just render normally - this is important to avoid restricting for non-logged in users
  if (!user) return <TabsContent value={tabName}>{children}</TabsContent>;
  
  if (loading) {
    return (
      <TabsContent value={tabName}>
        <div className="animate-pulse p-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2.5"></div>
        </div>
      </TabsContent>
    );
  }
  
  if (error) {
    console.warn(`Tab ${tabName} restriction check failed:`, error);
    // Default to showing the tab content if there's an error checking restrictions
    return <TabsContent value={tabName}>{children}</TabsContent>;
  }
  
  const userId = user.id;
  const restricted = isTabRestricted(tabName, userId);
  
  console.log(`Tab ${tabName} restricted for user ${userId}:`, restricted);
  
  if (!restricted) {
    return <TabsContent value={tabName}>{children}</TabsContent>;
  }
  
  // If tab is restricted, show an access denied message
  return (
    <TabsContent value={tabName}>
      <div className="flex flex-col items-center justify-center h-64 text-center p-8 glass-morphism rounded-lg">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this tab.
          Please contact an administrator if you need access.
        </p>
      </div>
    </TabsContent>
  );
}
