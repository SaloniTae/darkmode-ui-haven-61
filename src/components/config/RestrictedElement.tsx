
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAccessControl } from "@/context/AccessControlContext";

interface RestrictedElementProps {
  elementId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RestrictedElement({ elementId, children, fallback = null }: RestrictedElementProps) {
  const { user } = useAuth();
  const { isElementRestricted } = useAccessControl();
  
  if (!user) return <>{children}</>; // If no user, just render normally
  
  const userId = user.id;
  const { restricted, type } = isElementRestricted(elementId, userId);
  
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
      return <>{fallback}</>;
    case "disable":
      return (
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      );
    default:
      return <>{children}</>;
  }
}
