import { useState, useEffect } from "react";
import { UIConfig, CrunchyrollScreen, NetflixPrimeScreen, DatabaseSchema } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Switch } from "@/components/ui/switch";
import { Edit, Save, Image, Plus, Trash, Settings } from "lucide-react";
import { updateData } from "@/lib/firebaseService";
import { updatePrimeData } from "@/lib/firebaseService";
import { updateNetflixData } from "@/lib/firebaseService";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
interface UIConfigPanelProps {
  uiConfig: UIConfig;
  service: string;
  maintenanceEnabled?: boolean;
}
export function UIConfigPanel({
  uiConfig,
  service,
  maintenanceEnabled = false
}: UIConfigPanelProps) {
  const [activeSection, setActiveSection] = useState("start_command");
  const [editedConfig, setEditedConfig] = useState<UIConfig>({
    ...uiConfig
  });
  const [isEditing, setIsEditing] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState(maintenanceEnabled);
  const location = useLocation();

  // Update edited config when uiConfig prop changes
  useEffect(() => {
    setEditedConfig({
      ...uiConfig
    });
  }, [uiConfig]);

  // Update maintenance status when prop changes
  useEffect(() => {
    setMaintenanceStatus(maintenanceEnabled);
  }, [maintenanceEnabled]);
  const getUpdateFunction = () => {
    if (location.pathname.includes("netflix")) {
      return updateNetflixData;
    } else if (location.pathname.includes("prime")) {
      return updatePrimeData;
    }
    return updateData; // Default for Crunchyroll
  };
  const handleSaveChanges = async () => {
    try {
      const updateFn = getUpdateFunction();
      await updateFn("/ui_config", editedConfig);
      toast.success("UI configuration updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating UI config:", error);
      toast.error("Failed to update UI configuration");
    }
  };
  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      const updateFn = getUpdateFunction();
      await updateFn("/maintenance", {
        enabled
      });
      setMaintenanceStatus(enabled);
      toast.success(`Bot is now ${enabled ? 'under maintenance' : 'active'}`);
    } catch (error) {
      console.error("Error updating maintenance status:", error);
      toast.error("Failed to update maintenance status");
    }
  };
  const handleInputChange = (section: string, field: string, value: any) => {
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...editedConfig[section as keyof UIConfig],
        [field]: value
      }
    });
  };
  const handleArrayChange = (section: string, field: string, index: number, value: any) => {
    const sectionData = editedConfig[section as keyof UIConfig] as any;
    const updatedArray = [...(sectionData[field] || [])];
    updatedArray[index] = value;
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        [field]: updatedArray
      }
    });
  };
  const handleObjectArrayChange = (section: string, field: string, index: number, objField: string, value: any) => {
    const sectionData = editedConfig[section as keyof UIConfig] as any;
    const updatedArray = [...(sectionData[field] || [])];
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
  const addButton = (section: string) => {
    const sectionData = editedConfig[section as keyof UIConfig] as any;
    const updatedButtons = [...(sectionData.buttons || []), {
      text: "New Button",
      callback_data: "new_button"
    }];
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        buttons: updatedButtons
      }
    });
  };
  const removeButton = (section: string, index: number) => {
    const sectionData = editedConfig[section as keyof UIConfig] as any;
    const updatedButtons = (sectionData.buttons || []).filter((_: any, i: number) => i !== index);
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        buttons: updatedButtons
      }
    });
  };

  // Handle maintenance mode toggle
  const handleMaintenanceModeToggle = async (newMode: "photo" | "text") => {
    const updatedConfig = {
      ...editedConfig,
      maintenance: {
        ...editedConfig.maintenance,
        mode: newMode
      }
    };
    setEditedConfig(updatedConfig);

    // Auto-save the mode change
    try {
      const updateFn = getUpdateFunction();
      await updateFn("/ui_config", updatedConfig);
      toast.success("Maintenance mode updated successfully");
    } catch (error) {
      console.error("Error updating maintenance mode:", error);
      toast.error("Failed to update maintenance mode");
    }
  };

  // This key helps force re-render of images when URLs change
  const [imageKey, setImageKey] = useState(Date.now());

  // Force re-render of images when edited config changes
  useEffect(() => {
    setImageKey(Date.now());
  }, [editedConfig]);
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">UI Configuration</h2>
        <Button variant={isEditing ? "default" : "outline"} onClick={() => {
        if (isEditing) {
          setEditedConfig({
            ...uiConfig
          });
        }
        setIsEditing(!isEditing);
      }}>
          {isEditing ? "Cancel" : <><Edit className="mr-2 h-4 w-4" /> Edit</>}
        </Button>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="w-full mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 h-auto p-1 glass-morphism">
          <TabsTrigger value="start_command">Start</TabsTrigger>
          <TabsTrigger value="slot_booking">Select Plan</TabsTrigger>
          <TabsTrigger value="confirmation_flow">Confirmation</TabsTrigger>
          <TabsTrigger value="oor_pay_screen">OOR Pay</TabsTrigger>
          <TabsTrigger value="approve_flow">Approve</TabsTrigger>
          <TabsTrigger value="reject_flow">Reject</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="posters">Posters</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
        
        <TabsContent value="start_command" className="mt-0">
          <DataCard title="Start Command Configuration">
            <div className="space-y-6">
              {isEditing ? <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcome-text">Welcome Text</Label>
                    <Textarea id="welcome-text" value={editedConfig.start_command?.welcome_text || ""} onChange={e => handleInputChange('start_command', 'welcome_text', e.target.value)} rows={3} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="welcome-photo">Welcome Photo URL</Label>
                    <Input id="welcome-photo" value={editedConfig.start_command?.welcome_photo || ""} onChange={e => handleInputChange('start_command', 'welcome_photo', e.target.value)} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Buttons</Label>
                      <Button size="sm" variant="outline" onClick={() => addButton('start_command')}>
                        <Plus className="h-4 w-4 mr-1" /> Add Button
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {(editedConfig.start_command?.buttons || []).map((button, index) => <div key={index} className="grid grid-cols-3 gap-2 items-start">
                          <div className="col-span-1">
                            <Input value={button.text} onChange={e => handleObjectArrayChange('start_command', 'buttons', index, 'text', e.target.value)} placeholder="Button Text" />
                          </div>
                          <div className="col-span-1">
                            <Input value={button.callback_data} onChange={e => handleObjectArrayChange('start_command', 'buttons', index, 'callback_data', e.target.value)} placeholder="Callback Data" />
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => removeButton('start_command', index)} className="col-span-1 h-10">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>)}
                    </div>
                  </div>
                </div> : <div className="space-y-4">
                  <div className="glass-morphism p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Welcome Text</h3>
                    <p className="whitespace-pre-line">{editedConfig.start_command?.welcome_text || ""}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Welcome Photo</h3>
                    <div className="glass-morphism p-2 rounded-md overflow-hidden">
                      <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                        <img key={`welcome-photo-${imageKey}`} src={editedConfig.start_command?.welcome_photo || ""} alt="Welcome" className="absolute inset-0 w-full h-full object-cover object-center" onError={e => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }} />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Buttons</h3>
                    <div className="flex flex-wrap gap-2">
                      {(editedConfig.start_command?.buttons || []).map((button, index) => <div key={index} className="glass-morphism p-2 rounded-md">
                          <div className="font-medium">{button.text}</div>
                          <div className="text-xs text-muted-foreground">{button.callback_data}</div>
                        </div>)}
                    </div>
                  </div>
                </div>}
            </div>
          </DataCard>
        </TabsContent>
        
        <TabsContent value="slot_booking" className="mt-0">
          <DataCard title="Select Plan Configuration">
            <div className="space-y-6">
              {isEditing ? <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slot-caption">Caption</Label>
                    <Textarea id="slot-caption" value={editedConfig.slot_booking?.caption || ""} onChange={e => handleInputChange('slot_booking', 'caption', e.target.value)} rows={3} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slot-photo">Photo URL</Label>
                    <Input id="slot-photo" value={editedConfig.slot_booking?.photo_url || ""} onChange={e => handleInputChange('slot_booking', 'photo_url', e.target.value)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="slot-format">Button Format</Label>
                      <Input id="slot-format" value={editedConfig.slot_booking?.button_format || ""} onChange={e => handleInputChange('slot_booking', 'button_format', e.target.value)} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="slot-callback">Callback Data</Label>
                      <Input id="slot-callback" value={editedConfig.slot_booking?.callback_data || ""} onChange={e => handleInputChange('slot_booking', 'callback_data', e.target.value)} />
                    </div>
                  </div>
                </div> : <div className="space-y-4">
                  <div className="glass-morphism p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h3>
                    <p className="whitespace-pre-line">{editedConfig.slot_booking?.caption || ""}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h3>
                    <div className="glass-morphism p-2 rounded-md overflow-hidden">
                      <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                        <img src={editedConfig.slot_booking?.photo_url || ""} alt="Select Plan" className="absolute inset-0 w-full h-full object-cover object-center" onError={e => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass-morphism p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Button Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Format:</span>
                        <p>{editedConfig.slot_booking?.button_format || ""}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Callback:</span>
                        <p>{editedConfig.slot_booking?.callback_data || ""}</p>
                      </div>
                    </div>
                  </div>
                </div>}
            </div>
          </DataCard>
        </TabsContent>
        
        <TabsContent value="confirmation_flow" className="mt-0">
          <DataCard title="Confirmation Flow Configuration">
            <div className="space-y-6">
              {isEditing ? <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmation-caption">Caption</Label>
                    <Textarea id="confirmation-caption" value={editedConfig.confirmation_flow?.caption || ""} onChange={e => handleInputChange('confirmation_flow', 'caption', e.target.value)} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmation-photo">Photo URL</Label>
                    <Input id="confirmation-photo" value={editedConfig.confirmation_flow?.photo_url || ""} onChange={e => handleInputChange('confirmation_flow', 'photo_url', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="confirmation-button-text">Button Text</Label>
                      <Input id="confirmation-button-text" value={editedConfig.confirmation_flow?.button_text || ""} onChange={e => handleInputChange('confirmation_flow', 'button_text', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmation-callback">Callback Data</Label>
                      <Input id="confirmation-callback" value={editedConfig.confirmation_flow?.callback_data || ""} onChange={e => handleInputChange('confirmation_flow', 'callback_data', e.target.value)} />
                    </div>
                  </div>
                </div> : <div className="space-y-4">
                  <div className="glass-morphism p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h3>
                    <p className="whitespace-pre-line">{editedConfig.confirmation_flow?.caption || ""}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h3>
                    <div className="glass-morphism p-2 rounded-md overflow-hidden">
                      <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                        <img src={editedConfig.confirmation_flow?.photo_url || ""} alt="Confirmation Photo" className="absolute inset-0 w-full h-full object-cover object-center" onError={e => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }} />
                      </div>
                    </div>
                  </div>

                  <div className="glass-morphism p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Button Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Text:</span>
                        <p>{editedConfig.confirmation_flow?.button_text || ""}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Callback:</span>
                        <p>{editedConfig.confirmation_flow?.callback_data || ""}</p>
                      </div>
                    </div>
                  </div>
                </div>}
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="oor_pay_screen" className="mt-0">
          <DataCard title="OOR Pay Configuration">
            <div className="space-y-6">
              {isEditing ? <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="upi-id">UPI ID</Label>
                      <Input id="upi-id" value={editedConfig.oor_pay_screen?.UPI_ID || ""} onChange={e => handleInputChange('oor_pay_screen', 'UPI_ID', e.target.value)} placeholder="Enter UPI ID" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="merchant-name">Merchant Name</Label>
                      <Input id="merchant-name" value={editedConfig.oor_pay_screen?.MERCHANT_NAME || ""} onChange={e => handleInputChange('oor_pay_screen', 'MERCHANT_NAME', e.target.value)} placeholder="Enter Merchant Name" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mid">MID</Label>
                      <Input id="mid" value={editedConfig.oor_pay_screen?.MID || ""} onChange={e => handleInputChange('oor_pay_screen', 'MID', e.target.value)} placeholder="Enter MID" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-url">Template URL</Label>
                      <Input id="template-url" value={editedConfig.oor_pay_screen?.TEMPLATE_URL || ""} onChange={e => handleInputChange('oor_pay_screen', 'TEMPLATE_URL', e.target.value)} placeholder="Enter Template URL" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logo-url">Logo URL</Label>
                      <Input id="logo-url" value={editedConfig.oor_pay_screen?.LOGO_URL || ""} onChange={e => handleInputChange('oor_pay_screen', 'LOGO_URL', e.target.value)} placeholder="Enter Logo URL" />
                    </div>
                  </div>
                </div> : <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-morphism p-4 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">UPI ID</h3>
                      <p>{editedConfig.oor_pay_screen?.UPI_ID || "Not configured"}</p>
                    </div>

                    <div className="glass-morphism p-4 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Merchant Name</h3>
                      <p>{editedConfig.oor_pay_screen?.MERCHANT_NAME || "Not configured"}</p>
                    </div>

                    <div className="glass-morphism p-4 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">MID</h3>
                      <p>{editedConfig.oor_pay_screen?.MID || "Not configured"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Template Photo</h3>
                      <div className="glass-morphism p-2 rounded-md overflow-hidden">
                        <AspectRatio ratio={16 / 9}>
                          <img src={editedConfig.oor_pay_screen?.TEMPLATE_URL || ""} alt="Template Photo" className="w-full h-full object-cover object-center rounded" onError={e => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Template+Not+Found';
                      }} />
                        </AspectRatio>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Logo Photo</h3>
                      <div className="glass-morphism p-2 rounded-md overflow-hidden">
                        <AspectRatio ratio={16 / 9}>
                          <img src={editedConfig.oor_pay_screen?.LOGO_URL || ""} alt="Logo Photo" className="w-full h-full object-cover object-center rounded" onError={e => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Logo+Not+Found';
                      }} />
                        </AspectRatio>
                      </div>
                    </div>
                  </div>
                </div>}
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="approve_flow" className="mt-0">
          <DataCard title="Approve Flow Configuration">
            <div className="space-y-6">
              {isEditing ? <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="approve-success-text">Success Text</Label>
                    <Textarea id="approve-success-text" value={editedConfig.approve_flow?.success_text || ""} onChange={e => handleInputChange('approve_flow', 'success_text', e.target.value)} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approve-account-format">Account Format</Label>
                    <Textarea id="approve-account-format" value={editedConfig.approve_flow?.account_format || ""} onChange={e => handleInputChange('approve_flow', 'account_format', e.target.value)} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approve-photo">Photo URL</Label>
                    <Input id="approve-photo" value={editedConfig.approve_flow?.photo_url || ""} onChange={e => handleInputChange('approve_flow', 'photo_url', e.target.value)} />
                  </div>
                </div> : <div className="space-y-4">
                  <div className="glass-morphism p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Success Text</h3>
                    <p className="whitespace-pre-line">{editedConfig.approve_flow?.success_text || ""}</p>
                  </div>

                  <div className="glass-morphism p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Account Format</h3>
                    <p className="whitespace-pre-line">{editedConfig.approve_flow?.account_format || ""}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h3>
                    <div className="glass-morphism p-2 rounded-md overflow-hidden">
                      <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                        <img src={editedConfig.approve_flow?.photo_url || ""} alt="Approve Flow Photo" className="absolute inset-0 w-full h-full object-cover object-center" onError={e => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }} />
                      </div>
                    </div>
                  </div>
                </div>}
            </div>
          </DataCard>
        </TabsContent>
        
        <TabsContent value="reject_flow" className="mt-0">
          <DataCard title="Reject Flow Configuration">
            <div className="space-y-6">
              {isEditing ? <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reject-error-text">Error Text</Label>
                    <Textarea id="reject-error-text" value={editedConfig.reject_flow?.error_text || ""} onChange={e => handleInputChange('reject_flow', 'error_text', e.target.value)} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reject-photo">Photo URL</Label>
                    <Input id="reject-photo" value={editedConfig.reject_flow?.photo_url || ""} onChange={e => handleInputChange('reject_flow', 'photo_url', e.target.value)} />
                  </div>
                </div> : <div className="space-y-4">
                  <div className="glass-morphism p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Error Text</h3>
                    <p className="whitespace-pre-line">{editedConfig.reject_flow?.error_text || ""}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h3>
                    <div className="glass-morphism p-2 rounded-md overflow-hidden">
                      <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                        <img src={editedConfig.reject_flow?.photo_url || ""} alt="Reject Flow Photo" className="absolute inset-0 w-full h-full object-cover object-center" onError={e => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }} />
                      </div>
                    </div>
                  </div>
                </div>}
            </div>
          </DataCard>
        </TabsContent>
        
        <TabsContent value="maintenance" className="mt-0">
          <div className="space-y-6">
            {/* Maintenance Status Toggle */}
            <DataCard title="Bot Status">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      <h3 className="font-medium">Maintenance Mode</h3>
                    </div>
                    
                  </div>
                  <Switch checked={maintenanceStatus} onCheckedChange={handleMaintenanceToggle} />
                </div>
                
                {/* Status indicator in a separate section */}
                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-center justify-center">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${maintenanceStatus ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${maintenanceStatus ? 'bg-orange-500' : 'bg-green-500'}`} />
                      {maintenanceStatus ? 'Under Maintenance' : 'Active'}
                    </div>
                  </div>
                </div>
              </div>
            </DataCard>
                   
              
          <DataCard title="Maintenance Configuration">
            <div className="space-y-6">
              {/* Mode Toggle - Always visible and functional */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Display Mode</Label>
                <div className="flex items-center bg-neutral-200 dark:bg-muted/50 p-1 rounded-lg w-fit">
                  <button onClick={() => handleMaintenanceModeToggle("photo")} className={`px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium ${editedConfig.maintenance?.mode === "photo" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Photo + Caption
                  </button>
                  <button onClick={() => handleMaintenanceModeToggle("text")} className={`px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium ${editedConfig.maintenance?.mode === "text" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    Text
                  </button>
                </div>
              </div>

              {isEditing ? <div className="space-y-6">
                  {/* Photo + Caption Mode Fields */}
                  {editedConfig.maintenance?.mode === "photo" && <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="maintenance-photo">Photo URL</Label>
                        <Input id="maintenance-photo" value={editedConfig.maintenance?.photo_url || ""} onChange={e => handleInputChange('maintenance', 'photo_url', e.target.value)} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maintenance-caption">Caption</Label>
                        <Textarea id="maintenance-caption" value={editedConfig.maintenance?.caption || ""} onChange={e => handleInputChange('maintenance', 'caption', e.target.value)} rows={2} />
                      </div>
                    </div>}

                  {/* Text Mode Fields */}
                  {editedConfig.maintenance?.mode === "text" && <div className="space-y-2">
                      <Label htmlFor="maintenance-message">Message</Label>
                      <Textarea id="maintenance-message" value={editedConfig.maintenance?.message || ""} onChange={e => handleInputChange('maintenance', 'message', e.target.value)} rows={4} />
                    </div>}

                  {/* Alert Fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenance-alert">Callback Alert</Label>
                      <Textarea id="maintenance-alert" value={editedConfig.maintenance?.alert || ""} onChange={e => handleInputChange('maintenance', 'alert', e.target.value)} rows={2} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maintenance-alert-notify">Notification Alert</Label>
                      <Textarea id="maintenance-alert-notify" value={editedConfig.maintenance?.alert_notify || ""} onChange={e => handleInputChange('maintenance', 'alert_notify', e.target.value)} rows={2} />
                    </div>
                  </div>

                  {/* Back Message - Fixed at bottom */}
                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="maintenance-back-message">Back Message</Label>
                    <Textarea id="maintenance-back-message" value={editedConfig.maintenance?.back_message || ""} onChange={e => handleInputChange('maintenance', 'back_message', e.target.value)} rows={3} />
                  </div>
                </div> : <div className="space-y-6">
                  {/* Content Preview */}
                  {editedConfig.maintenance?.mode === "photo" ? <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h3>
                        <div className="glass-morphism p-2 rounded-md overflow-hidden">
                          <AspectRatio ratio={16 / 9}>
                            <img src={editedConfig.maintenance?.photo_url || ""} alt="Maintenance Photo" className="w-full h-full object-cover object-center rounded" onError={e => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                        }} />
                          </AspectRatio>
                        </div>
                      </div>
                      
                      <div className="glass-morphism p-4 rounded-md">
                        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Caption</h3>
                        <p className="whitespace-pre-line">{editedConfig.maintenance?.caption || ""}</p>
                      </div>
                    </div> : <div className="glass-morphism p-4 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Message</h3>
                      <p className="whitespace-pre-line">{editedConfig.maintenance?.message || ""}</p>
                    </div>}

                  {/* Alert Messages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-morphism p-4 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Callback Alert</h3>
                      <p className="whitespace-pre-line">{editedConfig.maintenance?.alert || ""}</p>
                    </div>
                    
                    <div className="glass-morphism p-4 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Notification Alert</h3>
                      <p className="whitespace-pre-line">{editedConfig.maintenance?.alert_notify || ""}</p>
                    </div>
                  </div>

                  {/* Back Message - Fixed at bottom */}
                  <div className="glass-morphism p-4 rounded-md border-t bg-muted/20">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Maintenance Over Message</h3>
                    <p className="whitespace-pre-line">{editedConfig.maintenance?.back_message || ""}</p>
                  </div>
                </div>}
            </div>
          </DataCard>
         </div>  
        </TabsContent>
        
        <TabsContent value="posters" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataCard title="Referral Info">
              <div className="space-y-4">
                {isEditing ? <div className="space-y-2">
                    <Label htmlFor="referral-photo">Referral Photo URL</Label>
                    <Input id="referral-photo" value={editedConfig.referral_info?.photo_url || ""} onChange={e => handleInputChange('referral_info', 'photo_url', e.target.value)} />
                  </div> : <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Referral Photo</h3>
                    <div className="glass-morphism p-2 rounded-md overflow-hidden">
                      <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                        <img src={editedConfig.referral_info?.photo_url || ""} alt="Referral Information" className="absolute inset-0 w-full h-full object-cover object-center" onError={e => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }} />
                      </div>
                    </div>
                  </div>}
              </div>
            </DataCard>
            
            <DataCard title="Free Trial Info">
              <div className="space-y-4">
                {isEditing ? <div className="space-y-2">
                    <Label htmlFor="freetrial-photo">Free Trial Photo URL</Label>
                    <Input id="freetrial-photo" value={editedConfig.freetrial_info?.photo_url || ""} onChange={e => handleInputChange('freetrial_info', 'photo_url', e.target.value)} />
                  </div> : <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Free Trial Photo</h3>
                    <div className="glass-morphism p-2 rounded-md overflow-hidden">
                      <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                        <img src={editedConfig.freetrial_info?.photo_url || ""} alt="Free Trial Information" className="absolute inset-0 w-full h-full object-cover object-center" onError={e => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                    }} />
                      </div>
                    </div>
                  </div>}
              </div>
            </DataCard>
          </div>
        </TabsContent>
        
        <TabsContent value="other" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataCard title="Out of Stock">
              <div className="space-y-4">
                {isEditing ? <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock-photo">Photo URL</Label>
                      <Input id="stock-photo" value={editedConfig.out_of_stock?.photo_url || ""} onChange={e => handleInputChange('out_of_stock', 'photo_url', e.target.value)} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stock-text">Stock Text</Label>
                      <Textarea id="stock-text" value={editedConfig.out_of_stock?.stock_text || ""} onChange={e => handleInputChange('out_of_stock', 'stock_text', e.target.value)} rows={5} />
                    </div>
                  </div> : <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photo</h3>
                      <div className="glass-morphism p-2 rounded-md overflow-hidden">
                        <div className="relative aspect-video bg-black/20 rounded overflow-hidden">
                          <img src={editedConfig.out_of_stock?.photo_url || ""} alt="Out of Stock Photo" className="absolute inset-0 w-full h-full object-cover object-center" onError={e => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=Image+Not+Found';
                      }} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-morphism p-4 rounded-md">
                      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Stock Text</h3>
                      <p className="whitespace-pre-line">{editedConfig.out_of_stock?.stock_text || ""}</p>
                    </div>
                  </div>}
              </div>
            </DataCard>
            
            <DataCard title="Locked Flow">
              <div className="space-y-4">
                {isEditing ? <div className="space-y-2">
                    <Label htmlFor="locked-text">Locked Text</Label>
                    <Textarea id="locked-text" value={editedConfig.locked_flow?.locked_text || ""} onChange={e => handleInputChange('locked_flow', 'locked_text', e.target.value)} rows={5} />
                  </div> : <div className="glass-morphism p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Locked Text</h3>
                    <p className="whitespace-pre-line">{editedConfig.locked_flow?.locked_text || ""}</p>
                  </div>}
              </div>
            </DataCard>
          </div>
        </TabsContent>
        
      </Tabs>
      
      {isEditing && <div className="flex justify-end mt-4">
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>}
    </div>;
}
