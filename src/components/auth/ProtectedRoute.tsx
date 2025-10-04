
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAccessControl } from "@/context/AccessControlContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredService?: "crunchyroll" | "netflix" | "prime" | "NSFW";
}

export const ProtectedRoute = ({ children, requiredService }: ProtectedRouteProps) => {
  const { user, currentService } = useAuth();
  const { isTabRestricted, isInitialized } = useAccessControl();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set loading to false after a brief delay to allow auth state to be determined
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Clear the session flag when user logs out
  useEffect(() => {
    if (!user) {
      // Clear all restriction flags for all users when logging out
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('restrictions_applied_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, [user]);

  // Special case for the config route - we don't redirect
  if (location.pathname === "/config") {
    return <>{children}</>;
  }

  // Show loading state while checking access
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg">Checking access permissions...</p>
        </div>
      </div>
    );
  }

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
  const tabMatches = currentPath.match(/\/(crunchyroll|netflix|prime|NSFW)\/?(.*)?/);
  
  if (tabMatches && tabMatches[2] && user) {
    const currentTab = tabMatches[2];
    
    if (isTabRestricted(currentTab, user.id)) {
      toast.error(`You don't have access to the ${currentTab} tab`);
      // If the user doesn't have access to this tab, redirect to the service root
      return <Navigate to={`/${tabMatches[1]}`} replace />;
    }
  }

  return <>{children}</>;
};
