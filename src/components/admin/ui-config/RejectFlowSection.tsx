
import { UIConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RejectFlowSectionProps {
  editedConfig: UIConfig;
  isEditing: boolean;
  handleInputChange: (section: string, field: string, value: any) => void;
}

export function RejectFlowSection({
  editedConfig,
  isEditing,
  handleInputChange
}: RejectFlowSectionProps) {
  return (
    <DataCard title="Reject Flow Configuration">
      <div className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-error-text">Error Text</Label>
              <Textarea
                id="reject-error-text"
                value={editedConfig.reject_flow.error_text}
                onChange={(e) => handleInputChange('reject_flow', 'error_text', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reject-gif">GIF URL</Label>
              <Input
                id="reject-gif"
                value={editedConfig.reject_flow.gif_url}
                onChange={(e) => handleInputChange('reject_flow', 'gif_url', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Error Text</h3>
              <p className="whitespace-pre-line">{editedConfig.reject_flow.error_text}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">GIF</h3>
              <div className="glass-morphism p-2 rounded-md overflow-hidden">
                <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                  <img
                    src={editedConfig.reject_flow.gif_url}
                    alt="Reject Flow GIF"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=GIF+Not+Found';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DataCard>
  );
}
