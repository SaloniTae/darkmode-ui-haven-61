import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
interface DataCardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  cardClassName?: string;
  onClick?: () => void;
  headerAction?: ReactNode;
}
export function DataCard({
  title,
  children,
  footer,
  className,
  cardClassName,
  onClick,
  headerAction
}: DataCardProps) {
  return <Card className={cn("overflow-hidden transition-all duration-300 glass-morphism", onClick ? "cursor-pointer hover:translate-y-[-4px] hover:shadow-lg" : "", cardClassName)} onClick={onClick}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {headerAction && <div>{headerAction}</div>}
        </div>
      </CardHeader>
      <CardContent className={cn("", className)}>
        {children}
      </CardContent>
      {footer && <CardFooter className="border-t border-white/5 pt-4">
          {footer}
        </CardFooter>}
    </Card>;
}