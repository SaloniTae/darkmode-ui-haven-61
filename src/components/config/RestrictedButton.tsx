
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAccessControl } from "@/context/AccessControlContext";
import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface RestrictedButtonProps extends ButtonProps {
  children: ReactNode;
  fallback?: ReactNode;
  showTooltip?: boolean;
  tooltipContent?: string;
}

export function RestrictedButton({ 
  children, 
  fallback = null, 
  showTooltip = true,
  tooltipContent = "You don't have permission to perform this action",
  ...props 
}: RestrictedButtonProps) {
  const { user } = useAuth();
  const { canUserModify } = useAccessControl();
  
  // Check for user - this is important for non-logged in users
  if (!user) return <Button {...props}>{children}</Button>;
  
  const userId = user.id;
  const hasWriteAccess = canUserModify(userId);
  
  // If user has write access, render the button normally
  if (hasWriteAccess) {
    return <Button {...props}>{children}</Button>;
  }
  
  // If user doesn't have write access, render a disabled button with tooltip
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button {...props} disabled className="opacity-50 cursor-not-allowed flex items-center gap-2">
                {children}
                <InfoIcon size={14} />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Without tooltip, just show disabled button
  return (
    <Button {...props} disabled className="opacity-50 cursor-not-allowed">
      {children}
    </Button>
  );
}
