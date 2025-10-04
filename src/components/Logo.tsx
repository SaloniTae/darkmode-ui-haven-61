
import { memo } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  service?: 'crunchyroll' | 'netflix' | 'prime' | 'NSFW';
}

export const Logo = memo(function Logo({ 
  className, 
  size = 'md',
  service = 'crunchyroll'
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  // Get the appropriate logo based on service and resolved theme
  const getLogo = () => {
    switch (service) {
      case 'netflix':
        return resolvedTheme === "light" 
          ? "https://img.icons8.com/?size=512&id=YiCrW5hUkQCr&format=png" 
          : "https://raw.githubusercontent.com/OTTONRENT01/FOR-PHOTOS/refs/heads/main/Netflix-white.png";
      case 'prime':
        return resolvedTheme === "light" 
          ? "https://raw.githubusercontent.com/OTTONRENT01/FOR-PHOTOS/refs/heads/main/Prime-black.png" 
          : "https://raw.githubusercontent.com/OTTONRENT01/FOR-PHOTOS/refs/heads/main/Prime-white.png";
      case 'NSFW':
        return resolvedTheme === "light"
          ? "https://img.icons8.com/?size=500&id=35348&format=png&color=000000"
          : "https://img.icons8.com/?size=500&id=35348&format=png&color=FFFFFF";
      case 'crunchyroll':
      default:
        return resolvedTheme === "light" 
          ? "https://static-00.iconduck.com/assets.00/crunchyroll-icon-512x512-4xi4az2l.png" 
          : "https://img.icons8.com/ios-glyphs/120/FFFFFF/crunchyroll.png";
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <img 
        src={getLogo()} 
        alt={`${service} logo`} 
        className={cn(sizeClasses[size], "transition-all duration-300")} 
      />
    </div>
  );
});
