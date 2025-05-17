
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAccessControl } from "@/context/AccessControlContext";
import { Shield } from "lucide-react";

interface RestrictedElementProps {
  elementId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RestrictedElement({ elementId, children, fallback = null }: RestrictedElementProps) {
  const { user } = useAuth();
  const { isElementRestricted } = useAccessControl();
  const [loading, setLoading] = useState(false);
  
  // If no user, just render normally - this is important to avoid restricting for non-logged in users
  if (!user) return <>{children}</>; 
  
  const userId = user.id;
  const { restricted, type } = isElementRestricted(elementId, userId);
  
  if (loading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>;
  }
  
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
