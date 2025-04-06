
import { UIConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PostersSectionProps {
  editedConfig: UIConfig;
  isEditing: boolean;
  handleInputChange: (section: string, field: string, value: any) => void;
}

export function PostersSection({
  editedConfig,
  isEditing,
  handleInputChange
}: PostersSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DataCard title="Referral Info">
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="referral-photo">Referral Photo URL</Label>
              <Input
                id="referral-photo"
                value={editedConfig.referral_info.photo_url}
                onChange={(e) => handleInputChange('referral_info', 'photo_url', e.target.value)}
              />
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Referral Photo</h3>
              <div className="glass-morphism p-2 rounded-md overflow-hidden">
                <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                  <img 
                    src={editedConfig.referral_info.photo_url}
                    alt="Referral Information"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DataCard>
      
      <DataCard title="Free Trial Info">
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="freetrial-photo">Free Trial Photo URL</Label>
              <Input
                id="freetrial-photo"
                value={editedConfig.freetrial_info.photo_url}
                onChange={(e) => handleInputChange('freetrial_info', 'photo_url', e.target.value)}
              />
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Free Trial Photo</h3>
              <div className="glass-morphism p-2 rounded-md overflow-hidden">
                <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                  <img 
                    src={editedConfig.freetrial_info.photo_url}
                    alt="Free Trial Information"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DataCard>
    </div>
  );
}
