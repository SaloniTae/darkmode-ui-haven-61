
import { UIConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SlotBookingSectionProps {
  editedConfig: UIConfig;
  isEditing: boolean;
  handleInputChange: (section: string, field: string, value: any) => void;
}

export function SlotBookingSection({
  editedConfig,
  isEditing,
  handleInputChange
}: SlotBookingSectionProps) {
  return (
    <DataCard title="Slot Booking Configuration">
      <div className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slot-caption">Caption</Label>
              <Textarea
                id="slot-caption"
                value={editedConfig.slot_booking.caption}
                onChange={(e) => handleInputChange('slot_booking', 'caption', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slot-photo">Photo URL</Label>
                <Input
                  id="slot-photo"
                  value={editedConfig.slot_booking.photo_url}
                  onChange={(e) => handleInputChange('slot_booking', 'photo_url', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slot-gif">GIF URL</Label>
                <Input
                  id="slot-gif"
                  value={editedConfig.slot_booking.gif_url}
                  onChange={(e) => handleInputChange('slot_booking', 'gif_url', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slot-format">Button Format</Label>
                <Input
                  id="slot-format"
                  value={editedConfig.slot_booking.button_format}
                  onChange={(e) => handleInputChange('slot_booking', 'button_format', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slot-callback">Callback Data</Label>
                <Input
                  id="slot-callback"
                  value={editedConfig.slot_booking.callback_data}
                  onChange={(e) => handleInputChange('slot_booking', 'callback_data', e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h3>
              <p className="whitespace-pre-line">{editedConfig.slot_booking.caption}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h3>
                <div className="glass-morphism p-2 rounded-md overflow-hidden">
                  <div className="relative aspect-square bg-black/20 rounded overflow-hidden">
                    <img 
                      src={editedConfig.slot_booking.photo_url}
                      alt="Slot Booking"
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
                      src={editedConfig.slot_booking.gif_url}
                      alt="Slot Booking GIF"
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
                  <span className="text-sm text-muted-foreground">Format:</span>
                  <p>{editedConfig.slot_booking.button_format}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Callback:</span>
                  <p>{editedConfig.slot_booking.callback_data}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DataCard>
  );
}
