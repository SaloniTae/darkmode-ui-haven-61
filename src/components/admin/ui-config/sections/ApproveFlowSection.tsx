
import { UIConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ApproveFlowSectionProps {
  editedConfig: UIConfig;
  isEditing: boolean;
  handleInputChange: (section: string, field: string, value: any) => void;
}

export function ApproveFlowSection({
  editedConfig,
  isEditing,
  handleInputChange
}: ApproveFlowSectionProps) {
  return (
    <DataCard title="Approve Flow Configuration">
      <div className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approve-success-text">Success Text</Label>
              <Textarea
                id="approve-success-text"
                value={editedConfig.approve_flow.success_text}
                onChange={(e) => handleInputChange('approve_flow', 'success_text', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-account-format">Account Format</Label>
              <Textarea
                id="approve-account-format"
                value={editedConfig.approve_flow.account_format}
                onChange={(e) => handleInputChange('approve_flow', 'account_format', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-gif">GIF URL</Label>
              <Input
                id="approve-gif"
                value={editedConfig.approve_flow.gif_url}
                onChange={(e) => handleInputChange('approve_flow', 'gif_url', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Success Text</h3>
              <p className="whitespace-pre-line">{editedConfig.approve_flow.success_text}</p>
            </div>

            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Account Format</h3>
              <p className="whitespace-pre-line">{editedConfig.approve_flow.account_format}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">GIF</h3>
              <div className="glass-morphism p-2 rounded-md overflow-hidden">
                <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                  <img
                    src={editedConfig.approve_flow.gif_url}
                    alt="Approve Flow GIF"
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
