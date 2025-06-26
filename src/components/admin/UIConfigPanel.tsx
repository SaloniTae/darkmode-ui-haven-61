import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DataCard } from "@/components/ui/DataCard";
import { toast } from "sonner";
import { useFirebaseService } from "@/hooks/useFirebaseService";

interface UIConfig {
  approve_flow: {
    account_format: string;
    photo_url: string;
    success_text: string;
  };
  confirmation_flow: {
    button_text: string;
    callback_data: string;
    caption: string;
    photo_url: string;
  };
  crunchyroll_screen: {
    button_text: string;
    callback_data: string;
    caption: string;
    photo_url: string;
  };
  freetrial_info: {
    photo_url: string;
  };
  locked_flow: {
    locked_text: string;
  };
  maintenance: {
    alert: string;
    alert_notify: string;
    back_message: string;
    caption: string;
    message: string;
    mode: string;
    photo_url: string;
  };
  out_of_stock: {
    photo_url: string;
    stock_text: string;
  };
  oor_pay_screen: {
    UPI_ID: string;
    MERCHANT_NAME: string;
    MID: string;
    TEMPLATE_URL: string;
    LOGO_URL: string;
  };
  referral_info: {
    photo_url: string;
  };
  reject_flow: {
    error_text: string;
    photo_url: string;
  };
  slot_booking: {
    button_format: string;
    callback_data: string;
    caption: string;
    photo_url: string;
  };
  start_command: {
    buttons: { callback_data: string; text: string; }[];
    welcome_photo: string;
    welcome_text: string;
  };
}

interface UIConfigPanelProps {
  uiConfig: UIConfig;
  service: string;
  maintenanceEnabled?: boolean;
}

export function UIConfigPanel({ uiConfig, service, maintenanceEnabled = false }: UIConfigPanelProps) {
  const [config, setConfig] = useState<UIConfig>(uiConfig);
  const [isMaintenanceEnabled, setIsMaintenanceEnabled] = useState(maintenanceEnabled);
  const [loading, setLoading] = useState(false);
  const { updateData } = useFirebaseService(service);

  useEffect(() => {
    setConfig(uiConfig);
  }, [uiConfig]);

  useEffect(() => {
    setIsMaintenanceEnabled(maintenanceEnabled);
  }, [maintenanceEnabled]);

  const handleInputChange = (section: keyof UIConfig, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      setLoading(true);
      await updateData("/maintenance", { enabled });
      setIsMaintenanceEnabled(enabled);
      toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Error updating maintenance mode:", error);
      toast.error("Failed to update maintenance mode");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateData("/ui_config", config);
      toast.success("UI configuration updated successfully");
    } catch (error) {
      console.error("Error updating UI config:", error);
      toast.error("Failed to update UI configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleStartCommandButtonChange = (index: number, field: 'text' | 'callback_data', value: string) => {
    setConfig(prev => ({
      ...prev,
      start_command: {
        ...prev.start_command,
        buttons: prev.start_command.buttons.map((button, i) => 
          i === index ? { ...button, [field]: value } : button
        )
      }
    }));
  };

  const addStartCommandButton = () => {
    setConfig(prev => ({
      ...prev,
      start_command: {
        ...prev.start_command,
        buttons: [...prev.start_command.buttons, { text: "", callback_data: "" }]
      }
    }));
  };

  const removeStartCommandButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      start_command: {
        ...prev.start_command,
        buttons: prev.start_command.buttons.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Section */}
      <DataCard title="Maintenance Mode">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-toggle" className="text-base font-medium text-foreground">
              Enable Maintenance Mode
            </Label>
            <Switch
              id="maintenance-toggle"
              checked={isMaintenanceEnabled}
              onCheckedChange={handleMaintenanceToggle}
              disabled={loading}
            />
          </div>
          
          {/* Status Display */}
          <div className="flex justify-center mt-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isMaintenanceEnabled 
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isMaintenanceEnabled 
                  ? 'bg-orange-500 dark:bg-orange-400' 
                  : 'bg-green-500 dark:bg-green-400'
              }`} />
              {isMaintenanceEnabled ? 'Under Maintenance' : 'Active'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maintenance-message" className="text-foreground">Message</Label>
              <Textarea
                id="maintenance-message"
                value={config.maintenance.message}
                onChange={(e) => handleInputChange('maintenance', 'message', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
            <div>
              <Label htmlFor="maintenance-caption" className="text-foreground">Caption</Label>
              <Textarea
                id="maintenance-caption"
                value={config.maintenance.caption}
                onChange={(e) => handleInputChange('maintenance', 'caption', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
            <div>
              <Label htmlFor="maintenance-alert" className="text-foreground">Alert</Label>
              <Input
                id="maintenance-alert"
                value={config.maintenance.alert}
                onChange={(e) => handleInputChange('maintenance', 'alert', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
            <div>
              <Label htmlFor="maintenance-alert-notify" className="text-foreground">Alert Notify</Label>
              <Input
                id="maintenance-alert-notify"
                value={config.maintenance.alert_notify}
                onChange={(e) => handleInputChange('maintenance', 'alert_notify', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
            <div>
              <Label htmlFor="maintenance-back-message" className="text-foreground">Back Message</Label>
              <Input
                id="maintenance-back-message"
                value={config.maintenance.back_message}
                onChange={(e) => handleInputChange('maintenance', 'back_message', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
            <div>
              <Label htmlFor="maintenance-mode" className="text-foreground">Mode</Label>
              <Input
                id="maintenance-mode"
                value={config.maintenance.mode}
                onChange={(e) => handleInputChange('maintenance', 'mode', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="maintenance-photo-url" className="text-foreground">Photo URL</Label>
              <Input
                id="maintenance-photo-url"
                value={config.maintenance.photo_url}
                onChange={(e) => handleInputChange('maintenance', 'photo_url', e.target.value)}
                className="bg-background text-foreground border-border"
              />
            </div>
          </div>
        </div>
      </DataCard>

      {/* Start Command Section */}
      
      <DataCard title="Start Command">
        <div className="space-y-4">
          <div>
            <Label htmlFor="start-welcome-text">Welcome Text</Label>
            <Textarea
              id="start-welcome-text"
              value={config.start_command.welcome_text}
              onChange={(e) => handleInputChange('start_command', 'welcome_text', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="start-welcome-photo">Welcome Photo URL</Label>
            <Input
              id="start-welcome-photo"
              value={config.start_command.welcome_photo}
              onChange={(e) => handleInputChange('start_command', 'welcome_photo', e.target.value)}
            />
          </div>
          <div>
            <Label>Buttons</Label>
            {config.start_command.buttons.map((button, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  placeholder="Button Text"
                  value={button.text}
                  onChange={(e) => handleStartCommandButtonChange(index, 'text', e.target.value)}
                />
                <Input
                  placeholder="Callback Data"
                  value={button.callback_data}
                  onChange={(e) => handleStartCommandButtonChange(index, 'callback_data', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeStartCommandButton(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStartCommandButton}
              className="mt-2"
            >
              Add Button
            </Button>
          </div>
        </div>
      </DataCard>

      {/* Approve Flow Section */}
      <DataCard title="Approve Flow">
        <div className="space-y-4">
          <div>
            <Label htmlFor="approve-account-format">Account Format</Label>
            <Input
              id="approve-account-format"
              value={config.approve_flow.account_format}
              onChange={(e) => handleInputChange('approve_flow', 'account_format', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="approve-success-text">Success Text</Label>
            <Textarea
              id="approve-success-text"
              value={config.approve_flow.success_text}
              onChange={(e) => handleInputChange('approve_flow', 'success_text', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="approve-photo-url">Photo URL</Label>
            <Input
              id="approve-photo-url"
              value={config.approve_flow.photo_url}
              onChange={(e) => handleInputChange('approve_flow', 'photo_url', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {/* Confirmation Flow Section */}
      <DataCard title="Confirmation Flow">
        <div className="space-y-4">
          <div>
            <Label htmlFor="confirm-button-text">Button Text</Label>
            <Input
              id="confirm-button-text"
              value={config.confirmation_flow.button_text}
              onChange={(e) => handleInputChange('confirmation_flow', 'button_text', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirm-callback-data">Callback Data</Label>
            <Input
              id="confirm-callback-data"
              value={config.confirmation_flow.callback_data}
              onChange={(e) => handleInputChange('confirmation_flow', 'callback_data', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirm-caption">Caption</Label>
            <Textarea
              id="confirm-caption"
              value={config.confirmation_flow.caption}
              onChange={(e) => handleInputChange('confirmation_flow', 'caption', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirm-photo-url">Photo URL</Label>
            <Input
              id="confirm-photo-url"
              value={config.confirmation_flow.photo_url}
              onChange={(e) => handleInputChange('confirmation_flow', 'photo_url', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {/* Service Screen Section */}
      <DataCard title={`${service.charAt(0).toUpperCase() + service.slice(1)} Screen`}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="service-button-text">Button Text</Label>
            <Input
              id="service-button-text"
              value={config.crunchyroll_screen.button_text}
              onChange={(e) => handleInputChange('crunchyroll_screen', 'button_text', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="service-callback-data">Callback Data</Label>
            <Input
              id="service-callback-data"
              value={config.crunchyroll_screen.callback_data}
              onChange={(e) => handleInputChange('crunchyroll_screen', 'callback_data', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="service-caption">Caption</Label>
            <Textarea
              id="service-caption"
              value={config.crunchyroll_screen.caption}
              onChange={(e) => handleInputChange('crunchyroll_screen', 'caption', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="service-photo-url">Photo URL</Label>
            <Input
              id="service-photo-url"
              value={config.crunchyroll_screen.photo_url}
              onChange={(e) => handleInputChange('crunchyroll_screen', 'photo_url', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {/* Slot Booking Section */}
      <DataCard title="Slot Booking">
        <div className="space-y-4">
          <div>
            <Label htmlFor="slot-button-format">Button Format</Label>
            <Input
              id="slot-button-format"
              value={config.slot_booking.button_format}
              onChange={(e) => handleInputChange('slot_booking', 'button_format', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="slot-callback-data">Callback Data</Label>
            <Input
              id="slot-callback-data"
              value={config.slot_booking.callback_data}
              onChange={(e) => handleInputChange('slot_booking', 'callback_data', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="slot-caption">Caption</Label>
            <Textarea
              id="slot-caption"
              value={config.slot_booking.caption}
              onChange={(e) => handleInputChange('slot_booking', 'caption', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="slot-photo-url">Photo URL</Label>
            <Input
              id="slot-photo-url"
              value={config.slot_booking.photo_url}
              onChange={(e) => handleInputChange('slot_booking', 'photo_url', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {/* Out of Stock Section */}
      <DataCard title="Out of Stock">
        <div className="space-y-4">
          <div>
            <Label htmlFor="oos-stock-text">Stock Text</Label>
            <Textarea
              id="oos-stock-text"
              value={config.out_of_stock.stock_text}
              onChange={(e) => handleInputChange('out_of_stock', 'stock_text', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="oos-photo-url">Photo URL</Label>
            <Input
              id="oos-photo-url"
              value={config.out_of_stock.photo_url}
              onChange={(e) => handleInputChange('out_of_stock', 'photo_url', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {/* Reject Flow Section */}
      <DataCard title="Reject Flow">
        <div className="space-y-4">
          <div>
            <Label htmlFor="reject-error-text">Error Text</Label>
            <Textarea
              id="reject-error-text"
              value={config.reject_flow.error_text}
              onChange={(e) => handleInputChange('reject_flow', 'error_text', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reject-photo-url">Photo URL</Label>
            <Input
              id="reject-photo-url"
              value={config.reject_flow.photo_url}
              onChange={(e) => handleInputChange('reject_flow', 'photo_url', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {/* Locked Flow Section */}
      <DataCard title="Locked Flow">
        <div className="space-y-4">
          <div>
            <Label htmlFor="locked-text">Locked Text</Label>
            <Textarea
              id="locked-text"
              value={config.locked_flow.locked_text}
              onChange={(e) => handleInputChange('locked_flow', 'locked_text', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {/* Free Trial Info Section */}
      <DataCard title="Free Trial Info">
        <div className="space-y-4">
          <div>
            <Label htmlFor="freetrial-photo-url">Photo URL</Label>
            <Input
              id="freetrial-photo-url"
              value={config.freetrial_info.photo_url}
              onChange={(e) => handleInputChange('freetrial_info', 'photo_url', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {/* Referral Info Section */}
      <DataCard title="Referral Info">
        <div className="space-y-4">
          <div>
            <Label htmlFor="referral-photo-url">Photo URL</Label>
            <Input
              id="referral-photo-url"
              value={config.referral_info.photo_url}
              onChange={(e) => handleInputChange('referral_info', 'photo_url', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {/* OOR Pay Screen Section */}
      <DataCard title="OOR Pay Screen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="oor-upi-id">UPI ID</Label>
            <Input
              id="oor-upi-id"
              value={config.oor_pay_screen.UPI_ID}
              onChange={(e) => handleInputChange('oor_pay_screen', 'UPI_ID', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="oor-merchant-name">Merchant Name</Label>
            <Input
              id="oor-merchant-name"
              value={config.oor_pay_screen.MERCHANT_NAME}
              onChange={(e) => handleInputChange('oor_pay_screen', 'MERCHANT_NAME', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="oor-mid">MID</Label>
            <Input
              id="oor-mid"
              value={config.oor_pay_screen.MID}
              onChange={(e) => handleInputChange('oor_pay_screen', 'MID', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="oor-template-url">Template URL</Label>
            <Input
              id="oor-template-url"
              value={config.oor_pay_screen.TEMPLATE_URL}
              onChange={(e) => handleInputChange('oor_pay_screen', 'TEMPLATE_URL', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="oor-logo-url">Logo URL</Label>
            <Input
              id="oor-logo-url"
              value={config.oor_pay_screen.LOGO_URL}
              onChange={(e) => handleInputChange('oor_pay_screen', 'LOGO_URL', e.target.value)}
            />
          </div>
        </div>
      </DataCard>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save UI Configuration"}
        </Button>
      </div>
    </div>
  );
}
