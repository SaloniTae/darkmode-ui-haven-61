
import { UIConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PhonePeSectionProps {
  editedConfig: UIConfig;
  isEditing: boolean;
  handleInputChange: (section: string, field: string, value: any) => void;
}

export function PhonePeSection({
  editedConfig,
  isEditing,
  handleInputChange
}: PhonePeSectionProps) {
  return (
    <DataCard title="PhonePe Screen Configuration">
      <div className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phonepe-caption">Caption</Label>
              <Textarea
                id="phonepe-caption"
                value={editedConfig.phonepe_screen.caption}
                onChange={(e) => handleInputChange('phonepe_screen', 'caption', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phonepe-followup">Follow-up Text</Label>
              <Textarea
                id="phonepe-followup"
                value={editedConfig.phonepe_screen.followup_text}
                onChange={(e) => handleInputChange('phonepe_screen', 'followup_text', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phonepe-photo">Photo URL</Label>
              <Input
                id="phonepe-photo"
                value={editedConfig.phonepe_screen.photo_url}
                onChange={(e) => handleInputChange('phonepe_screen', 'photo_url', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h3>
              <p className="whitespace-pre-line">{editedConfig.phonepe_screen.caption}</p>
            </div>

            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Follow-up Text</h3>
              <p className="whitespace-pre-line">{editedConfig.phonepe_screen.followup_text}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h3>
              <div className="glass-morphism p-2 rounded-md overflow-hidden">
                <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                  <img
                    src={editedConfig.phonepe_screen.photo_url}
                    alt="PhonePe Screen"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
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
