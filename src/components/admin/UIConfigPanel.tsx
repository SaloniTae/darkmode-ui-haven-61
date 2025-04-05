import { useState } from "react";
import { UIConfig } from "@/types/database";
import { toast } from "sonner";
import { useFirebaseService } from "@/hooks/useFirebaseService";

interface UIConfigPanelProps {
  uiConfig: UIConfig;
  service: string;
}

export function UIConfigPanel({ uiConfig, service }: UIConfigPanelProps) {
  // Implementation of the component
  return (
    <div>
      <h2>UI Config Panel - {service}</h2>
      <pre>{JSON.stringify(uiConfig, null, 2)}</pre>
    </div>
  );
}
