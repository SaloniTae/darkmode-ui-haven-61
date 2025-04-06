
import { UIConfig, CrunchyrollScreen, NetflixPrimeScreen } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CrunchyrollSectionProps {
  editedConfig: UIConfig;
  isEditing: boolean;
  isNetflixOrPrime: boolean;
  imageKey: number;
  handleInputChange: (section: string, field: string, value: any) => void;
  getMediaUrl: (screen: CrunchyrollScreen | NetflixPrimeScreen) => string;
}

export function CrunchyrollSection({
  editedConfig,
  isEditing,
  isNetflixOrPrime,
  imageKey,
  handleInputChange,
  getMediaUrl
}: CrunchyrollSectionProps) {
  return (
    <DataCard title="Crunchyroll Screen Configuration">
      <div className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cr-caption">Caption</Label>
              <Textarea
                id="cr-caption"
                value={editedConfig.crunchyroll_screen.caption}
                onChange={(e) => handleInputChange('crunchyroll_screen', 'caption', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              {isNetflixOrPrime ? (
                <>
                  <Label htmlFor="cr-gif">GIF URL</Label>
                  <Input
                    id="cr-gif"
                    value={(editedConfig.crunchyroll_screen as NetflixPrimeScreen).gif_url || ""}
                    onChange={(e) => handleInputChange('crunchyroll_screen', 'gif_url', e.target.value)}
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="cr-photo">Photo URL</Label>
                  <Input
                    id="cr-photo"
                    value={(editedConfig.crunchyroll_screen as CrunchyrollScreen).photo_url || ""}
                    onChange={(e) => handleInputChange('crunchyroll_screen', 'photo_url', e.target.value)}
                  />
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cr-button-text">Button Text</Label>
                <Input
                  id="cr-button-text"
                  value={editedConfig.crunchyroll_screen.button_text}
                  onChange={(e) => handleInputChange('crunchyroll_screen', 'button_text', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cr-callback">Callback Data</Label>
                <Input
                  id="cr-callback"
                  value={editedConfig.crunchyroll_screen.callback_data}
                  onChange={(e) => handleInputChange('crunchyroll_screen', 'callback_data', e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h3>
              <p className="whitespace-pre-line">{editedConfig.crunchyroll_screen.caption}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                {isNetflixOrPrime ? "GIF" : "Photo"}
              </h3>
              <div className="glass-morphism p-2 rounded-md overflow-hidden">
                <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                  <img 
                    key={`crunchyroll-media-${imageKey}`}
                    src={getMediaUrl(editedConfig.crunchyroll_screen)}
                    alt="Crunchyroll Screen"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Button</h3>
              <div className="flex justify-between">
                <div>{editedConfig.crunchyroll_screen.button_text}</div>
                <div className="text-sm text-muted-foreground">{editedConfig.crunchyroll_screen.callback_data}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DataCard>
  );
}
