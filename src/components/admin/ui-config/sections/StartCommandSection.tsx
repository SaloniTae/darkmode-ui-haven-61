
import { UIConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";

interface StartCommandSectionProps {
  editedConfig: UIConfig;
  isEditing: boolean;
  imageKey: number;
  handleInputChange: (section: string, field: string, value: any) => void;
  handleObjectArrayChange: (section: string, field: string, index: number, objField: string, value: any) => void;
  addButton: (section: string) => void;
  removeButton: (section: string, index: number) => void;
}

export function StartCommandSection({
  editedConfig,
  isEditing,
  imageKey,
  handleInputChange,
  handleObjectArrayChange,
  addButton,
  removeButton
}: StartCommandSectionProps) {
  return (
    <DataCard title="Start Command Configuration">
      <div className="space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcome-text">Welcome Text</Label>
              <Textarea
                id="welcome-text"
                value={editedConfig.start_command.welcome_text}
                onChange={(e) => handleInputChange('start_command', 'welcome_text', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="welcome-photo">Welcome Photo URL</Label>
              <Input
                id="welcome-photo"
                value={editedConfig.start_command.welcome_photo}
                onChange={(e) => handleInputChange('start_command', 'welcome_photo', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Buttons</Label>
                <Button size="sm" variant="outline" onClick={() => addButton('start_command')}>
                  <Plus className="h-4 w-4 mr-1" /> Add Button
                </Button>
              </div>
              
              <div className="space-y-3">
                {editedConfig.start_command.buttons.map((button, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-start">
                    <div className="col-span-1">
                      <Input
                        value={button.text}
                        onChange={(e) => handleObjectArrayChange('start_command', 'buttons', index, 'text', e.target.value)}
                        placeholder="Button Text"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        value={button.callback_data}
                        onChange={(e) => handleObjectArrayChange('start_command', 'buttons', index, 'callback_data', e.target.value)}
                        placeholder="Callback Data"
                      />
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeButton('start_command', index)}
                      className="col-span-1 h-10"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Welcome Text</h3>
              <p className="whitespace-pre-line">{editedConfig.start_command.welcome_text}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Welcome Photo</h3>
              <div className="glass-morphism p-2 rounded-md overflow-hidden">
                <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                  <img 
                    key={`welcome-photo-${imageKey}`}
                    src={editedConfig.start_command.welcome_photo}
                    alt="Welcome"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Buttons</h3>
              <div className="flex flex-wrap gap-2">
                {editedConfig.start_command.buttons.map((button, index) => (
                  <div key={index} className="glass-morphism p-2 rounded-md">
                    <div className="font-medium">{button.text}</div>
                    <div className="text-xs text-muted-foreground">{button.callback_data}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DataCard>
  );
}
