

import { useState } from "react";
import { UIConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { useFirebaseService } from "@/hooks/useFirebaseService";

interface UIConfigPanelProps {
  uiConfig: UIConfig;
  service: string;
}

export function UIConfigPanel({ uiConfig, service }: UIConfigPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState<UIConfig>(uiConfig);
  const { updateData } = useFirebaseService(service);

  const handleInputChange = (section: keyof UIConfig, field: string, value: any) => {
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...(editedConfig[section] as any),
        [field]: value
      }
    });
  };

  const handleArrayChange = (section: keyof UIConfig, field: string, index: number, value: string) => {
    const sectionData = editedConfig[section] as any;
    const currentArray = Array.isArray(sectionData[field]) ? sectionData[field] : [];
    const updatedArray = [...currentArray];
    updatedArray[index] = value;
    
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        [field]: updatedArray
      }
    });
  };

  const handleObjectArrayChange = (section: keyof UIConfig, field: string, index: number, objField: string, value: any) => {
    const sectionData = editedConfig[section] as any;
    const currentArray = Array.isArray(sectionData[field]) ? sectionData[field] : [];
    const updatedArray = [...currentArray];
    updatedArray[index] = {
      ...updatedArray[index],
      [objField]: value
    };
    
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        [field]: updatedArray
      }
    });
  };

  const addButton = () => {
    const currentButtons = Array.isArray(editedConfig.start_command?.buttons) ? editedConfig.start_command.buttons : [];
    const updatedButtons = [
      ...currentButtons,
      { text: "New Button", callback_data: "new_callback" }
    ];
    
    setEditedConfig({
      ...editedConfig,
      start_command: {
        ...editedConfig.start_command,
        buttons: updatedButtons
      }
    });
  };

  const removeButton = (index: number) => {
    const currentButtons = Array.isArray(editedConfig.start_command?.buttons) ? editedConfig.start_command.buttons : [];
    const updatedButtons = currentButtons.filter((_, i) => i !== index);
    
    setEditedConfig({
      ...editedConfig,
      start_command: {
        ...editedConfig.start_command,
        buttons: updatedButtons
      }
    });
  };

  const addStockText = (section: string) => {
    const sectionData = editedConfig[section as keyof UIConfig] as any;
    const currentStockText = Array.isArray(sectionData?.stock_text) ? sectionData.stock_text : [];
    const updatedStockText = [
      ...currentStockText,
      "New stock text"
    ];
    
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        stock_text: updatedStockText
      }
    });
  };

  const removeStockText = (section: string, index: number) => {
    const sectionData = editedConfig[section as keyof UIConfig] as any;
    const currentStockText = Array.isArray(sectionData?.stock_text) ? sectionData.stock_text : [];
    const updatedStockText = currentStockText.filter((_: any, i: number) => i !== index);
    
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        stock_text: updatedStockText
      }
    });
  };

  const handleSave = async () => {
    try {
      await updateData("/ui_config", editedConfig);
      toast.success("UI configuration updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating UI config:", error);
      toast.error("Failed to update UI configuration");
    }
  };

  const handleCancel = () => {
    setEditedConfig(uiConfig);
    setIsEditing(false);
  };

  // Helper function to safely get array data
  const getSafeArray = (data: any): any[] => {
    return Array.isArray(data) ? data : [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">UI Configuration</h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="start" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="start">Start</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="flows">Flows</TabsTrigger>
          <TabsTrigger value="screens">Screens</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="start" className="mt-0">
          <DataCard title="Start Command Configuration">
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcome-text">Welcome Text</Label>
                    <Textarea
                      id="welcome-text"
                      value={editedConfig.start_command?.welcome_text || ""}
                      onChange={(e) => handleInputChange('start_command', 'welcome_text', e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="welcome-photo">Welcome Photo URL</Label>
                    <Input
                      id="welcome-photo"
                      value={editedConfig.start_command?.welcome_photo || ""}
                      onChange={(e) => handleInputChange('start_command', 'welcome_photo', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Buttons</Label>
                      <Button size="sm" variant="outline" onClick={addButton}>
                        <Plus className="h-4 w-4 mr-1" /> Add Button
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {getSafeArray(editedConfig.start_command?.buttons).map((button, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={button.text}
                            onChange={(e) => handleObjectArrayChange('start_command', 'buttons', index, 'text', e.target.value)}
                            placeholder="Button text"
                            className="flex-1"
                          />
                          <Input
                            value={button.callback_data}
                            onChange={(e) => handleObjectArrayChange('start_command', 'buttons', index, 'callback_data', e.target.value)}
                            placeholder="Callback data"
                            className="flex-1"
                          />
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeButton(index)}
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
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Welcome Message</h4>
                    <div className="glass-morphism p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{editedConfig.start_command?.welcome_text}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Welcome Photo</h4>
                    <div className="glass-morphism p-2 rounded-md overflow-hidden">
                      <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                        <img 
                          src={editedConfig.start_command?.welcome_photo || ""}
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
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Buttons</h4>
                    <div className="grid gap-2">
                      {getSafeArray(editedConfig.start_command?.buttons).map((button, index) => (
                        <div key={index} className="glass-morphism p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{button.text}</span>
                            <span className="text-sm text-muted-foreground">{button.callback_data}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="booking" className="mt-0">
          <DataCard title="Slot Booking Configuration">
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="booking-caption">Caption</Label>
                    <Textarea
                      id="booking-caption"
                      value={editedConfig.slot_booking?.caption || ""}
                      onChange={(e) => handleInputChange('slot_booking', 'caption', e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="booking-photo">Photo URL</Label>
                    <Input
                      id="booking-photo"
                      value={editedConfig.slot_booking?.photo_url || ""}
                      onChange={(e) => handleInputChange('slot_booking', 'photo_url', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="button-format">Button Format</Label>
                    <Input
                      id="button-format"
                      value={editedConfig.slot_booking?.button_format || ""}
                      onChange={(e) => handleInputChange('slot_booking', 'button_format', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="booking-callback">Callback Data</Label>
                    <Input
                      id="booking-callback"
                      value={editedConfig.slot_booking?.callback_data || ""}
                      onChange={(e) => handleInputChange('slot_booking', 'callback_data', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h4>
                    <div className="glass-morphism p-4 rounded-md">
                      <p className="whitespace-pre-wrap">{editedConfig.slot_booking?.caption}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h4>
                    <div className="glass-morphism p-2 rounded-md overflow-hidden">
                      <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                        <img 
                          src={editedConfig.slot_booking?.photo_url || ""}
                          alt="Slot Booking"
                          className="absolute inset-0 w-full h-full object-cover object-center"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Button Format</h4>
                      <div className="glass-morphism p-3 rounded-md">
                        <p className="text-sm">{editedConfig.slot_booking?.button_format}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Callback Data</h4>
                      <div className="glass-morphism p-3 rounded-md">
                        <p className="text-sm">{editedConfig.slot_booking?.callback_data}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="payment" className="mt-0">
          <DataCard title="Payment Configuration">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">PhonePe Screen</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phonepe-caption">Caption</Label>
                        <Textarea
                          id="phonepe-caption"
                          value={editedConfig.phonepe_screen?.caption || ""}
                          onChange={(e) => handleInputChange('phonepe_screen', 'caption', e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phonepe-photo">Photo URL</Label>
                        <Input
                          id="phonepe-photo"
                          value={editedConfig.phonepe_screen?.photo_url || ""}
                          onChange={(e) => handleInputChange('phonepe_screen', 'photo_url', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phonepe-followup">Follow-up Text</Label>
                        <Textarea
                          id="phonepe-followup"
                          value={editedConfig.phonepe_screen?.followup_text || ""}
                          onChange={(e) => handleInputChange('phonepe_screen', 'followup_text', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h4>
                        <div className="glass-morphism p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{editedConfig.phonepe_screen?.caption}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h4>
                        <div className="glass-morphism p-2 rounded-md overflow-hidden">
                          <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                            <img 
                              src={editedConfig.phonepe_screen?.photo_url || ""}
                              alt="PhonePe"
                              className="absolute inset-0 w-full h-full object-cover object-center"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Follow-up Text</h4>
                        <div className="glass-morphism p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{editedConfig.phonepe_screen?.followup_text}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Confirmation Flow</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="confirmation-caption">Caption</Label>
                        <Textarea
                          id="confirmation-caption"
                          value={editedConfig.confirmation_flow?.caption || ""}
                          onChange={(e) => handleInputChange('confirmation_flow', 'caption', e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmation-photo">Photo URL</Label>
                        <Input
                          id="confirmation-photo"
                          value={editedConfig.confirmation_flow?.photo_url || ""}
                          onChange={(e) => handleInputChange('confirmation_flow', 'photo_url', e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="confirmation-button">Button Text</Label>
                          <Input
                            id="confirmation-button"
                            value={editedConfig.confirmation_flow?.button_text || ""}
                            onChange={(e) => handleInputChange('confirmation_flow', 'button_text', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmation-callback">Callback Data</Label>
                          <Input
                            id="confirmation-callback"
                            value={editedConfig.confirmation_flow?.callback_data || ""}
                            onChange={(e) => handleInputChange('confirmation_flow', 'callback_data', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h4>
                        <div className="glass-morphism p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{editedConfig.confirmation_flow?.caption}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h4>
                        <div className="glass-morphism p-2 rounded-md overflow-hidden">
                          <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                            <img 
                              src={editedConfig.confirmation_flow?.photo_url || ""}
                              alt="Confirmation"
                              className="absolute inset-0 w-full h-full object-cover object-center"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Button Text</h4>
                          <div className="glass-morphism p-3 rounded-md">
                            <p className="text-sm">{editedConfig.confirmation_flow?.button_text}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Callback Data</h4>
                          <div className="glass-morphism p-3 rounded-md">
                            <p className="text-sm">{editedConfig.confirmation_flow?.callback_data}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="flows" className="mt-0">
          <DataCard title="Flow Configuration">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Approve Flow</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="approve-success">Success Text</Label>
                        <Textarea
                          id="approve-success"
                          value={editedConfig.approve_flow?.success_text || ""}
                          onChange={(e) => handleInputChange('approve_flow', 'success_text', e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="approve-photo">Photo URL</Label>
                        <Input
                          id="approve-photo"
                          value={editedConfig.approve_flow?.photo_url || ""}
                          onChange={(e) => handleInputChange('approve_flow', 'photo_url', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="account-format">Account Format</Label>
                        <Input
                          id="account-format"
                          value={editedConfig.approve_flow?.account_format || ""}
                          onChange={(e) => handleInputChange('approve_flow', 'account_format', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Success Text</h4>
                        <div className="glass-morphism p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{editedConfig.approve_flow?.success_text}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h4>
                        <div className="glass-morphism p-2 rounded-md overflow-hidden">
                          <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                            <img 
                              src={editedConfig.approve_flow?.photo_url || ""}
                              alt="Approve Flow"
                              className="absolute inset-0 w-full h-full object-cover object-center"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Account Format</h4>
                        <div className="glass-morphism p-3 rounded-md">
                          <p className="text-sm">{editedConfig.approve_flow?.account_format}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Reject Flow</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reject-error">Error Text</Label>
                        <Textarea
                          id="reject-error"
                          value={editedConfig.reject_flow?.error_text || ""}
                          onChange={(e) => handleInputChange('reject_flow', 'error_text', e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reject-photo">Photo URL</Label>
                        <Input
                          id="reject-photo"
                          value={editedConfig.reject_flow?.photo_url || ""}
                          onChange={(e) => handleInputChange('reject_flow', 'photo_url', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Error Text</h4>
                        <div className="glass-morphism p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{editedConfig.reject_flow?.error_text}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h4>
                        <div className="glass-morphism p-2 rounded-md overflow-hidden">
                          <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                            <img 
                              src={editedConfig.reject_flow?.photo_url || ""}
                              alt="Reject Flow"
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
              </div>
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="screens" className="mt-0">
          <DataCard title="Screen Configuration">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Crunchyroll Screen</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="crunchyroll-caption">Caption</Label>
                        <Textarea
                          id="crunchyroll-caption"
                          value={editedConfig.crunchyroll_screen?.caption || ""}
                          onChange={(e) => handleInputChange('crunchyroll_screen', 'caption', e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="crunchyroll-photo">Photo URL</Label>
                        <Input
                          id="crunchyroll-photo"
                          value={editedConfig.crunchyroll_screen?.photo_url || ""}
                          onChange={(e) => handleInputChange('crunchyroll_screen', 'photo_url', e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="crunchyroll-button">Button Text</Label>
                          <Input
                            id="crunchyroll-button"
                            value={editedConfig.crunchyroll_screen?.button_text || ""}
                            onChange={(e) => handleInputChange('crunchyroll_screen', 'button_text', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="crunchyroll-callback">Callback Data</Label>
                          <Input
                            id="crunchyroll-callback"
                            value={editedConfig.crunchyroll_screen?.callback_data || ""}
                            onChange={(e) => handleInputChange('crunchyroll_screen', 'callback_data', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h4>
                        <div className="glass-morphism p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{editedConfig.crunchyroll_screen?.caption}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h4>
                        <div className="glass-morphism p-2 rounded-md overflow-hidden">
                          <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                            <img 
                              src={editedConfig.crunchyroll_screen?.photo_url || ""}
                              alt="Crunchyroll Screen"
                              className="absolute inset-0 w-full h-full object-cover object-center"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Button Text</h4>
                          <div className="glass-morphism p-3 rounded-md">
                            <p className="text-sm">{editedConfig.crunchyroll_screen?.button_text}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Callback Data</h4>
                          <div className="glass-morphism p-3 rounded-md">
                            <p className="text-sm">{editedConfig.crunchyroll_screen?.callback_data}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="other" className="mt-0">
          <DataCard title="Other Configuration">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Out of Stock</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="stock-photo">Photo URL</Label>
                        <Input
                          id="stock-photo"
                          value={editedConfig.out_of_stock?.photo_url || ""}
                          onChange={(e) => handleInputChange('out_of_stock', 'photo_url', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Stock Text</Label>
                          <Button size="sm" variant="outline" onClick={() => addStockText('out_of_stock')}>
                            <Plus className="h-4 w-4 mr-1" /> Add Text
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {getSafeArray(editedConfig.out_of_stock?.stock_text).map((text: string, index: number) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={text}
                                onChange={(e) => handleArrayChange('out_of_stock', 'stock_text', index, e.target.value)}
                                placeholder="Stock text"
                                className="flex-1"
                              />
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeStockText('out_of_stock', index)}
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
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h4>
                        <div className="glass-morphism p-2 rounded-md overflow-hidden">
                          <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                            <img 
                              src={editedConfig.out_of_stock?.photo_url || ""}
                              alt="Out of Stock"
                              className="absolute inset-0 w-full h-full object-cover object-center"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Stock Text</h4>
                        <div className="space-y-2">
                          {getSafeArray(editedConfig.out_of_stock?.stock_text).map((text: string, index: number) => (
                            <div key={index} className="glass-morphism p-2 rounded-md">
                              <p className="text-sm">{text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Locked Flow</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="locked-text">Locked Text</Label>
                        <Textarea
                          id="locked-text"
                          value={editedConfig.locked_flow?.locked_text || ""}
                          onChange={(e) => handleInputChange('locked_flow', 'locked_text', e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Locked Text</h4>
                        <div className="glass-morphism p-4 rounded-md">
                          <p className="whitespace-pre-wrap">{editedConfig.locked_flow?.locked_text}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Free Trial Info</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="freetrial-photo">Photo URL</Label>
                        <Input
                          id="freetrial-photo"
                          value={editedConfig.freetrial_info?.photo_url || ""}
                          onChange={(e) => handleInputChange('freetrial_info', 'photo_url', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h4>
                        <div className="glass-morphism p-2 rounded-md overflow-hidden">
                          <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                            <img 
                              src={editedConfig.freetrial_info?.photo_url || ""}
                              alt="Free Trial Info"
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

                <div>
                  <h3 className="text-lg font-medium mb-4">Referral Info</h3>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="referral-photo">Photo URL</Label>
                        <Input
                          id="referral-photo"
                          value={editedConfig.referral_info?.photo_url || ""}
                          onChange={(e) => handleInputChange('referral_info', 'photo_url', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h4>
                        <div className="glass-morphism p-2 rounded-md overflow-hidden">
                          <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                            <img 
                              src={editedConfig.referral_info?.photo_url || ""}
                              alt="Referral Info"
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

              </div>
            </div>
          </DataCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

