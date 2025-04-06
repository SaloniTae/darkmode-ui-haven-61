
import { UIConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ConfirmationSectionProps {
  editedConfig: UIConfig;
  isEditing: boolean;
  handleInputChange: (section: string, field: string, value: any) => void;
}

export function ConfirmationSection({
  editedConfig,
  isEditing,
  handleInputChange
}: ConfirmationSectionProps) {
  return (
    <DataCard title="Confirmation Flow Configuration">
      <div className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirmation-caption">Caption</Label>
              <Textarea
                id="confirmation-caption"
                value={editedConfig.confirmation_flow.caption}
                onChange={(e) => handleInputChange('confirmation_flow', 'caption', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation-photo">Photo URL</Label>
                <Input
                  id="confirmation-photo"
                  value={editedConfig.confirmation_flow.photo_url}
                  onChange={(e) => handleInputChange('confirmation_flow', 'photo_url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation-gif">GIF URL</Label>
                <Input
                  id="confirmation-gif"
                  value={editedConfig.confirmation_flow.gif_url}
                  onChange={(e) => handleInputChange('confirmation_flow', 'gif_url', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation-button-text">Button Text</Label>
                <Input
                  id="confirmation-button-text"
                  value={editedConfig.confirmation_flow.button_text}
                  onChange={(e) => handleInputChange('confirmation_flow', 'button_text', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation-callback">Callback Data</Label>
                <Input
                  id="confirmation-callback"
                  value={editedConfig.confirmation_flow.callback_data}
                  onChange={(e) => handleInputChange('confirmation_flow', 'callback_data', e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h3>
              <p className="whitespace-pre-line">{editedConfig.confirmation_flow.caption}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h3>
                <div className="glass-morphism p-2 rounded-md overflow-hidden">
                  <div className="relative aspect-square bg-black/20 rounded overflow-hidden">
                    <img
                      src={editedConfig.confirmation_flow.photo_url}
                      alt="Confirmation Photo"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=Image+Not+Found';
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">GIF</h3>
                <div className="glass-morphism p-2 rounded-md overflow-hidden">
                  <div className="relative aspect-square bg-black/20 rounded overflow-hidden">
                    <img
                      src={editedConfig.confirmation_flow.gif_url}
                      alt="Confirmation GIF"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=GIF+Not+Found';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Button Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Text:</span>
                  <p>{editedConfig.confirmation_flow.button_text}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Callback:</span>
                  <p>{editedConfig.confirmation_flow.callback_data}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DataCard>
  );
}
