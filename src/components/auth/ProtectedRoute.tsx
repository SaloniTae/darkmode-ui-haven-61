
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAccessControl } from "@/context/AccessControlContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredService?: "crunchyroll" | "netflix" | "prime";
}

export const ProtectedRoute = ({ children, requiredService }: ProtectedRouteProps) => {
  const { user, currentService } = useAuth();
  const { isTabRestricted } = useAccessControl();
  const location = useLocation();

  // Basic protection - user must be logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Service-specific authorization check
  if (requiredService && currentService !== requiredService) {
    return <Navigate to="/login" replace state={{ message: `You don't have access to ${requiredService}` }} />;
  }

  // Check for tab access - parse the current tab from the URL if in admin
  const currentPath = location.pathname;
  const tabMatches = currentPath.match(/\/(crunchyroll|netflix|prime)\/?(.*)?/);
  
  if (tabMatches && tabMatches[2] && user) {
    const currentTab = tabMatches[2];
    
    if (isTabRestricted(currentTab, user.id)) {
      // If the user doesn't have access to this tab, redirect to the service root
      return <Navigate to={`/${tabMatches[1]}`} replace state={{ message: `You don't have access to this tab` }} />;
    }
  }

  return <>{children}</>;
};
