
import { UIConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";

interface OtherSectionProps {
  editedConfig: UIConfig;
  isEditing: boolean;
  handleInputChange: (section: string, field: string, value: any) => void;
  handleArrayChange: (section: string, field: string, index: number, value: any) => void;
  addMessage: (section: string) => void;
  removeMessage: (section: string, index: number) => void;
}

export function OtherSection({
  editedConfig,
  isEditing,
  handleInputChange,
  handleArrayChange,
  addMessage,
  removeMessage
}: OtherSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DataCard title="Out of Stock Messages">
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock-gif">GIF URL</Label>
                <Input
                  id="stock-gif"
                  value={editedConfig.out_of_stock.gif_url}
                  onChange={(e) => handleInputChange('out_of_stock', 'gif_url', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Messages</Label>
                  <Button size="sm" variant="outline" onClick={() => addMessage('out_of_stock')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Message
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {editedConfig.out_of_stock.messages.map((message, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        value={message}
                        onChange={(e) => handleArrayChange('out_of_stock', 'messages', index, e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeMessage('out_of_stock', index)}
                        className="h-10"
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
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">GIF</h3>
                <div className="glass-morphism p-2 rounded-md overflow-hidden">
                  <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                    <img 
                      src={editedConfig.out_of_stock.gif_url}
                      alt="Out of Stock GIF"
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=GIF+Not+Found';
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Messages</h3>
                <div className="space-y-2">
                  {editedConfig.out_of_stock.messages.map((message, index) => (
                    <div key={index} className="glass-morphism p-3 rounded-md">
                      <p className="whitespace-pre-line">{message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DataCard>
      
      <DataCard title="Locked Flow">
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="locked-text">Locked Text</Label>
              <Textarea
                id="locked-text"
                value={editedConfig.locked_flow.locked_text}
                onChange={(e) => handleInputChange('locked_flow', 'locked_text', e.target.value)}
                rows={5}
              />
            </div>
          ) : (
            <div className="glass-morphism p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Locked Text</h3>
              <p className="whitespace-pre-line">{editedConfig.locked_flow.locked_text}</p>
            </div>
          )}
        </div>
      </DataCard>
    </div>
  );
}
