
import { ReactNode } from "react";
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
  const { isTabRestricted } = useAccessControl();
  
  // If no user, just render normally
  if (!user) return <TabsContent value={tabName}>{children}</TabsContent>;
  
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
