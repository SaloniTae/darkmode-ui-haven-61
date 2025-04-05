
import { useState } from "react";
import { UIConfig } from "@/types/database";
import { toast } from "sonner";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, PlusIcon, SaveIcon, TrashIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface UIConfigPanelProps {
  uiConfig: UIConfig;
  service: string;
}

export function UIConfigPanel({ uiConfig, service }: UIConfigPanelProps) {
  const [config, setConfig] = useState<UIConfig>(uiConfig);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("start-command");
  const { updateData } = useFirebaseService(service);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateData("/ui_config", config);
      toast.success("UI configuration saved successfully");
    } catch (error) {
      console.error("Error saving UI config:", error);
      toast.error("Failed to save UI configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section: keyof UIConfig, field: string, value: any) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    });
  };

  const handleNestedInputChange = (section: keyof UIConfig, subSection: string, field: string, value: any) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [subSection]: {
          ...config[section][subSection],
          [field]: value
        }
      }
    });
  };

  const handleArrayChange = (section: keyof UIConfig, field: string, index: number, value: any) => {
    const newArray = [...config[section][field]];
    newArray[index] = value;
    
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: newArray
      }
    });
  };

  const handleAddButton = () => {
    const newButtons = [
      ...config.start_command.buttons,
      { text: "New Button", callback_data: "new_action" }
    ];
    
    setConfig({
      ...config,
      start_command: {
        ...config.start_command,
        buttons: newButtons
      }
    });
  };

  const handleRemoveButton = (index: number) => {
    const newButtons = [...config.start_command.buttons];
    newButtons.splice(index, 1);
    
    setConfig({
      ...config,
      start_command: {
        ...config.start_command,
        buttons: newButtons
      }
    });
  };

  const handleAddOutOfStockMessage = () => {
    const newMessages = [...config.out_of_stock.messages, "New out of stock message"];
    
    setConfig({
      ...config,
      out_of_stock: {
        ...config.out_of_stock,
        messages: newMessages
      }
    });
  };

  const handleRemoveOutOfStockMessage = (index: number) => {
    const newMessages = [...config.out_of_stock.messages];
    newMessages.splice(index, 1);
    
    setConfig({
      ...config,
      out_of_stock: {
        ...config.out_of_stock,
        messages: newMessages
      }
    });
  };

  // Helper function to display image preview
  const renderImagePreview = (url: string, altText: string) => {
    if (!url) return null;
    
    return (
      <div className="mt-2 relative">
        <div className="bg-black/5 border rounded-md p-2 inline-block">
          <div className="relative h-24 w-24 overflow-hidden rounded">
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <img 
              src={url} 
              alt={altText} 
              className="h-full w-full object-cover" 
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                e.currentTarget.classList.add("opacity-50");
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">UI Configuration</h2>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? "Saving..." : "Save Changes"}
          <SaveIcon size={16} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-8 lg:grid-cols-9 mb-8">
          <TabsTrigger value="start-command">Start Command</TabsTrigger>
          <TabsTrigger value="confirmation-flow">Confirmation</TabsTrigger>
          <TabsTrigger value="slot-booking">Slot Booking</TabsTrigger>
          <TabsTrigger value="approve-flow">Approval</TabsTrigger>
          <TabsTrigger value="reject-flow">Rejection</TabsTrigger>
          <TabsTrigger value="locked-flow">Locked</TabsTrigger>
          <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="service-screen">Service Screen</TabsTrigger>
        </TabsList>

        {/* Start Command Section */}
        <TabsContent value="start-command" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Screen</CardTitle>
              <CardDescription>Configure the welcome screen settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="welcome_text">Welcome Text</Label>
                  <Textarea 
                    id="welcome_text" 
                    value={config.start_command.welcome_text || ""} 
                    onChange={(e) => handleInputChange("start_command", "welcome_text", e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome_photo">Welcome Photo URL</Label>
                  <Input 
                    id="welcome_photo" 
                    value={config.start_command.welcome_photo || ""} 
                    onChange={(e) => handleInputChange("start_command", "welcome_photo", e.target.value)}
                  />
                  {renderImagePreview(config.start_command.welcome_photo, "Welcome image")}
                </div>
              </div>

              <Separator className="my-4" />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Welcome Buttons</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddButton}
                    className="flex items-center gap-1"
                  >
                    <PlusIcon size={16} />
                    Add Button
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {config.start_command.buttons.map((button, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <div>
                          <Label htmlFor={`button_text_${index}`} className="text-xs">Button Text</Label>
                          <Input
                            id={`button_text_${index}`}
                            value={button.text}
                            onChange={(e) => {
                              const newButtons = [...config.start_command.buttons];
                              newButtons[index] = {
                                ...newButtons[index],
                                text: e.target.value
                              };
                              handleInputChange("start_command", "buttons", newButtons);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`button_callback_${index}`} className="text-xs">Callback Data</Label>
                          <Input
                            id={`button_callback_${index}`}
                            value={button.callback_data}
                            onChange={(e) => {
                              const newButtons = [...config.start_command.buttons];
                              newButtons[index] = {
                                ...newButtons[index],
                                callback_data: e.target.value
                              };
                              handleInputChange("start_command", "buttons", newButtons);
                            }}
                          />
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveButton(index)}
                        className="mt-5"
                      >
                        <TrashIcon size={16} className="text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Confirmation Flow Section */}
        <TabsContent value="confirmation-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confirmation Flow</CardTitle>
              <CardDescription>Configure the confirmation flow settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="confirmation_caption">Caption</Label>
                  <Textarea 
                    id="confirmation_caption" 
                    value={config.confirmation_flow.caption || ""} 
                    onChange={(e) => handleInputChange("confirmation_flow", "caption", e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="confirmation_button_text">Button Text</Label>
                    <Input 
                      id="confirmation_button_text" 
                      value={config.confirmation_flow.button_text || ""} 
                      onChange={(e) => handleInputChange("confirmation_flow", "button_text", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmation_callback_data">Callback Data</Label>
                    <Input 
                      id="confirmation_callback_data" 
                      value={config.confirmation_flow.callback_data || ""} 
                      onChange={(e) => handleInputChange("confirmation_flow", "callback_data", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="confirmation_photo">Photo URL</Label>
                  <Input 
                    id="confirmation_photo" 
                    value={config.confirmation_flow.photo_url || ""} 
                    onChange={(e) => handleInputChange("confirmation_flow", "photo_url", e.target.value)}
                  />
                  {renderImagePreview(config.confirmation_flow.photo_url, "Confirmation photo")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmation_gif">GIF URL</Label>
                  <Input 
                    id="confirmation_gif" 
                    value={config.confirmation_flow.gif_url || ""} 
                    onChange={(e) => handleInputChange("confirmation_flow", "gif_url", e.target.value)}
                  />
                  {renderImagePreview(config.confirmation_flow.gif_url, "Confirmation GIF")}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slot Booking Section */}
        <TabsContent value="slot-booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slot Booking</CardTitle>
              <CardDescription>Configure the slot booking settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="slot_caption">Caption</Label>
                  <Textarea 
                    id="slot_caption" 
                    value={config.slot_booking.caption || ""} 
                    onChange={(e) => handleInputChange("slot_booking", "caption", e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="slot_button_format">Button Format</Label>
                    <Input 
                      id="slot_button_format" 
                      value={config.slot_booking.button_format || ""} 
                      onChange={(e) => handleInputChange("slot_booking", "button_format", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Use {"{slot_id}"} as placeholder for dynamic slot ID</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slot_callback_data">Callback Data</Label>
                    <Input 
                      id="slot_callback_data" 
                      value={config.slot_booking.callback_data || ""} 
                      onChange={(e) => handleInputChange("slot_booking", "callback_data", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Use {"{slot_id}"} as placeholder for dynamic slot ID</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="slot_photo">Photo URL</Label>
                  <Input 
                    id="slot_photo" 
                    value={config.slot_booking.photo_url || ""} 
                    onChange={(e) => handleInputChange("slot_booking", "photo_url", e.target.value)}
                  />
                  {renderImagePreview(config.slot_booking.photo_url, "Slot booking photo")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot_gif">GIF URL</Label>
                  <Input 
                    id="slot_gif" 
                    value={config.slot_booking.gif_url || ""} 
                    onChange={(e) => handleInputChange("slot_booking", "gif_url", e.target.value)}
                  />
                  {renderImagePreview(config.slot_booking.gif_url, "Slot booking GIF")}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approve Flow Section */}
        <TabsContent value="approve-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Flow</CardTitle>
              <CardDescription>Configure the approval flow settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="approve_success_text">Success Text</Label>
                  <Textarea 
                    id="approve_success_text" 
                    value={config.approve_flow.success_text || ""} 
                    onChange={(e) => handleInputChange("approve_flow", "success_text", e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="approve_account_format">Account Format</Label>
                    <Input 
                      id="approve_account_format" 
                      value={config.approve_flow.account_format || ""} 
                      onChange={(e) => handleInputChange("approve_flow", "account_format", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Use {"{email}"} and {"{password}"} as placeholders</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="approve_gif">GIF URL</Label>
                    <Input 
                      id="approve_gif" 
                      value={config.approve_flow.gif_url || ""} 
                      onChange={(e) => handleInputChange("approve_flow", "gif_url", e.target.value)}
                    />
                    {renderImagePreview(config.approve_flow.gif_url, "Approval GIF")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reject Flow Section */}
        <TabsContent value="reject-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejection Flow</CardTitle>
              <CardDescription>Configure the rejection flow settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reject_error_text">Error Text</Label>
                  <Textarea 
                    id="reject_error_text" 
                    value={config.reject_flow.error_text || ""} 
                    onChange={(e) => handleInputChange("reject_flow", "error_text", e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reject_gif">GIF URL</Label>
                  <Input 
                    id="reject_gif" 
                    value={config.reject_flow.gif_url || ""} 
                    onChange={(e) => handleInputChange("reject_flow", "gif_url", e.target.value)}
                  />
                  {renderImagePreview(config.reject_flow.gif_url, "Rejection GIF")}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locked Flow Section */}
        <TabsContent value="locked-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Locked Flow</CardTitle>
              <CardDescription>Configure the locked account flow settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="locked_text">Locked Text</Label>
                <Textarea 
                  id="locked_text" 
                  value={config.locked_flow.locked_text || ""} 
                  onChange={(e) => handleInputChange("locked_flow", "locked_text", e.target.value)}
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Out of Stock Section */}
        <TabsContent value="out-of-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Out of Stock</CardTitle>
              <CardDescription>Configure the out of stock settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="out_of_stock_gif">GIF URL</Label>
                <Input 
                  id="out_of_stock_gif" 
                  value={config.out_of_stock.gif_url || ""} 
                  onChange={(e) => handleInputChange("out_of_stock", "gif_url", e.target.value)}
                />
                {renderImagePreview(config.out_of_stock.gif_url, "Out of stock GIF")}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Out of Stock Messages</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddOutOfStockMessage}
                    className="flex items-center gap-1"
                  >
                    <PlusIcon size={16} />
                    Add Message
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {config.out_of_stock.messages.map((message, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Textarea
                        value={message}
                        onChange={(e) => handleArrayChange("out_of_stock", "messages", index, e.target.value)}
                        className="flex-1"
                        rows={2}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveOutOfStockMessage(index)}
                      >
                        <TrashIcon size={16} className="text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Section */}
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referrals</CardTitle>
              <CardDescription>Configure the referral information settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referral_photo">Photo URL</Label>
                <Input 
                  id="referral_photo" 
                  value={config.referral_info.photo_url || ""} 
                  onChange={(e) => handleInputChange("referral_info", "photo_url", e.target.value)}
                />
                {renderImagePreview(config.referral_info.photo_url, "Referral info")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="freetrial_photo">Free Trial Photo URL</Label>
                <Input 
                  id="freetrial_photo" 
                  value={config.freetrial_info.photo_url || ""} 
                  onChange={(e) => handleInputChange("freetrial_info", "photo_url", e.target.value)}
                />
                {renderImagePreview(config.freetrial_info.photo_url, "Free trial info")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service-specific Screen Section */}
        <TabsContent value="service-screen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Service Screen 
                <Badge variant="outline" className="ml-2">
                  {service === "crunchyroll" ? "Crunchyroll" : 
                   service === "netflix" ? "Netflix" : 
                   service === "prime" ? "Prime" : service}
                </Badge>
              </CardTitle>
              <CardDescription>Configure service-specific screen settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {service === "crunchyroll" && config.crunchyroll_screen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="crunchyroll_caption">Caption</Label>
                    <Textarea 
                      id="crunchyroll_caption" 
                      value={config.crunchyroll_screen.caption || ""} 
                      onChange={(e) => handleInputChange("crunchyroll_screen", "caption", e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <Label htmlFor="crunchyroll_button_text">Button Text</Label>
                      <Input 
                        id="crunchyroll_button_text" 
                        value={config.crunchyroll_screen.button_text || ""} 
                        onChange={(e) => handleInputChange("crunchyroll_screen", "button_text", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crunchyroll_callback_data">Callback Data</Label>
                      <Input 
                        id="crunchyroll_callback_data" 
                        value={config.crunchyroll_screen.callback_data || ""} 
                        onChange={(e) => handleInputChange("crunchyroll_screen", "callback_data", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crunchyroll_photo">Photo URL</Label>
                    <Input 
                      id="crunchyroll_photo" 
                      value={config.crunchyroll_screen.photo_url || ""} 
                      onChange={(e) => handleInputChange("crunchyroll_screen", "photo_url", e.target.value)}
                    />
                    {renderImagePreview(config.crunchyroll_screen.photo_url, "Crunchyroll screen photo")}
                  </div>
                  {config.crunchyroll_screen.gif_url !== undefined && (
                    <div className="space-y-2">
                      <Label htmlFor="crunchyroll_gif">GIF URL</Label>
                      <Input 
                        id="crunchyroll_gif" 
                        value={config.crunchyroll_screen.gif_url || ""} 
                        onChange={(e) => handleInputChange("crunchyroll_screen", "gif_url", e.target.value)}
                      />
                      {renderImagePreview(config.crunchyroll_screen.gif_url, "Crunchyroll screen GIF")}
                    </div>
                  )}
                </div>
              )}

              {service === "netflix" && config.crunchyroll_screen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="netflix_caption">Caption</Label>
                    <Textarea 
                      id="netflix_caption" 
                      value={config.crunchyroll_screen.caption || ""} 
                      onChange={(e) => handleInputChange("crunchyroll_screen", "caption", e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <Label htmlFor="netflix_button_text">Button Text</Label>
                      <Input 
                        id="netflix_button_text" 
                        value={config.crunchyroll_screen.button_text || ""} 
                        onChange={(e) => handleInputChange("crunchyroll_screen", "button_text", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="netflix_callback_data">Callback Data</Label>
                      <Input 
                        id="netflix_callback_data" 
                        value={config.crunchyroll_screen.callback_data || ""} 
                        onChange={(e) => handleInputChange("crunchyroll_screen", "callback_data", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="netflix_gif">GIF URL</Label>
                    <Input 
                      id="netflix_gif" 
                      value={config.crunchyroll_screen.gif_url || ""} 
                      onChange={(e) => handleInputChange("crunchyroll_screen", "gif_url", e.target.value)}
                    />
                    {renderImagePreview(config.crunchyroll_screen.gif_url, "Netflix screen GIF")}
                  </div>
                  {config.crunchyroll_screen.photo_url !== undefined && (
                    <div className="space-y-2">
                      <Label htmlFor="netflix_photo">Photo URL</Label>
                      <Input 
                        id="netflix_photo" 
                        value={config.crunchyroll_screen.photo_url || ""} 
                        onChange={(e) => handleInputChange("crunchyroll_screen", "photo_url", e.target.value)}
                      />
                      {renderImagePreview(config.crunchyroll_screen.photo_url, "Netflix screen photo")}
                    </div>
                  )}
                </div>
              )}

              {service === "prime" && config.crunchyroll_screen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prime_caption">Caption</Label>
                    <Textarea 
                      id="prime_caption" 
                      value={config.crunchyroll_screen.caption || ""} 
                      onChange={(e) => handleInputChange("crunchyroll_screen", "caption", e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <Label htmlFor="prime_button_text">Button Text</Label>
                      <Input 
                        id="prime_button_text" 
                        value={config.crunchyroll_screen.button_text || ""} 
                        onChange={(e) => handleInputChange("crunchyroll_screen", "button_text", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prime_callback_data">Callback Data</Label>
                      <Input 
                        id="prime_callback_data" 
                        value={config.crunchyroll_screen.callback_data || ""} 
                        onChange={(e) => handleInputChange("crunchyroll_screen", "callback_data", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prime_gif">GIF URL</Label>
                    <Input 
                      id="prime_gif" 
                      value={config.crunchyroll_screen.gif_url || ""} 
                      onChange={(e) => handleInputChange("crunchyroll_screen", "gif_url", e.target.value)}
                    />
                    {renderImagePreview(config.crunchyroll_screen.gif_url, "Prime screen GIF")}
                  </div>
                  {config.crunchyroll_screen.photo_url !== undefined && (
                    <div className="space-y-2">
                      <Label htmlFor="prime_photo">Photo URL</Label>
                      <Input 
                        id="prime_photo" 
                        value={config.crunchyroll_screen.photo_url || ""} 
                        onChange={(e) => handleInputChange("crunchyroll_screen", "photo_url", e.target.value)}
                      />
                      {renderImagePreview(config.crunchyroll_screen.photo_url, "Prime screen photo")}
                    </div>
                  )}
                </div>
              )}

              {/* PhonePe section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">PhonePe Screen Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phonepe_caption">Caption</Label>
                    <Textarea 
                      id="phonepe_caption" 
                      value={config.phonepe_screen.caption || ""} 
                      onChange={(e) => handleInputChange("phonepe_screen", "caption", e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phonepe_followup">Follow-up Text</Label>
                    <Textarea 
                      id="phonepe_followup" 
                      value={config.phonepe_screen.followup_text || ""} 
                      onChange={(e) => handleInputChange("phonepe_screen", "followup_text", e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phonepe_photo">Photo URL</Label>
                    <Input 
                      id="phonepe_photo" 
                      value={config.phonepe_screen.photo_url || ""} 
                      onChange={(e) => handleInputChange("phonepe_screen", "photo_url", e.target.value)}
                    />
                    {renderImagePreview(config.phonepe_screen.photo_url, "PhonePe screen photo")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
