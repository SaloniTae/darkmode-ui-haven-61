
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAccessControl } from "@/context/AccessControlContext";
import { toast } from "sonner";
import { Shield } from "lucide-react";

interface RestrictedElementProps {
  elementId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RestrictedElement({ elementId, children, fallback = null }: RestrictedElementProps) {
  const { user } = useAuth();
  const { isElementRestricted, refreshSettings } = useAccessControl();
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
        console.error("Failed to refresh restriction settings:", err);
        setError("Failed to load restriction settings");
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [refreshSettings]);
  
  // If no user, just render normally - this is important to avoid restricting for non-logged in users
  if (!user) return <>{children}</>; 
  
  if (loading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>;
  }
  
  if (error) {
    console.warn(`Element ${elementId} restriction check failed:`, error);
    // Default to showing the content if there's an error checking restrictions
    return <>{children}</>;
  }
  
  const userId = user.id;
  const { restricted, type } = isElementRestricted(elementId, userId);
  
  console.log(`Element ${elementId} restricted for user ${userId}:`, restricted, type);
  
  if (!restricted) {
    return <>{children}</>;
  }
  
  switch (type) {
    case "blur":
      return (
        <div className="filter blur-md pointer-events-none">
          {children}
        </div>
      );
    case "hide":
      return fallback ? <>{fallback}</> : null;
    case "disable":
      return (
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      );
    default:
      // Default case, shouldn't reach here but just in case
      return <>{children}</>;
  }
}
