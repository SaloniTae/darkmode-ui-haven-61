import { useState } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { useAuth } from "@/context/AuthContext";

interface UIConfigPanelProps {
  uiConfig: UIConfig;
  service: string;
  maintenanceEnabled: boolean;
}

interface UIConfig {
  approve_flow: ApproveFlowConfig;
  confirmation_flow: ConfirmationFlowConfig;
  crunchyroll_screen: CrunchyrollScreenConfig;
  freetrial_info: FreeTrialInfoConfig;
  locked_flow: LockedFlowConfig;
  maintenance: MaintenanceConfig;
  out_of_stock: OutOfStockConfig;
  oor_pay_screen: OORPayScreenConfig;
  referral_info: ReferralInfoConfig;
  reject_flow: RejectFlowConfig;
  slot_booking: SlotBookingConfig;
  start_command: StartCommandConfig;
}

interface ApproveFlowConfig {
  account_format: string;
  photo_url: string;
  success_text: string;
}

interface ConfirmationFlowConfig {
  button_text: string;
  callback_data: string;
  caption: string;
  photo_url: string;
}

interface CrunchyrollScreenConfig {
  button_text: string;
  callback_data: string;
  caption: string;
  photo_url: string;
}

interface FreeTrialInfoConfig {
  photo_url: string;
}

interface LockedFlowConfig {
  locked_text: string;
}

interface MaintenanceConfig {
  alert: string;
  alert_notify: string;
  back_message: string;
  caption: string;
  message: string;
  mode: "photo" | "text";
  photo_url: string;
}

interface OutOfStockConfig {
  photo_url: string;
  stock_text: string;
}

interface OORPayScreenConfig {
  UPI_ID: string;
  MERCHANT_NAME: string;
  MID: string;
  TEMPLATE_URL: string;
  LOGO_URL: string;
}

interface ReferralInfoConfig {
  photo_url: string;
}

interface RejectFlowConfig {
  error_text: string;
  photo_url: string;
}

interface SlotBookingConfig {
  button_format: string;
  callback_data: string;
  caption: string;
  photo_url: string;
}

interface StartCommandConfig {
  buttons: string[];
  welcome_photo: string;
  welcome_text: string;
}

export function UIConfigPanel({ uiConfig, service, maintenanceEnabled }: UIConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<UIConfig>(uiConfig);
  const [loading, setLoading] = useState(false);
  const { updateData } = useFirebaseService(service);
  const { user } = useAuth();

  const updateMaintenanceField = (field: string, value: string) => {
    setLocalConfig((prevConfig) => ({
      ...prevConfig,
      maintenance: {
        ...prevConfig.maintenance,
        [field]: value,
      },
    }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      await updateData("/ui_config/maintenance", localConfig.maintenance);
      toast({
        title: "Success",
        description: "Maintenance settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving maintenance settings:", error);
      toast({
        title: "Error",
        description: "Failed to save maintenance settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      await updateData("/maintenance/enabled", checked);
      toast({
        title: "Success",
        description: `Maintenance mode ${checked ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      toast({
        title: "Error",
        description: "Failed to toggle maintenance mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Section */}
      <DataCard title="Maintenance Settings">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance-mode" className="text-base font-medium">
                Bot Status
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Toggle maintenance mode for the bot
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={maintenanceEnabled}
              onCheckedChange={handleMaintenanceToggle}
            />
          </div>
          
          {/* Status Badge */}
          <div className="flex justify-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
              maintenanceEnabled 
                ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' 
                : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                maintenanceEnabled ? 'bg-orange-500' : 'bg-green-500'
              }`} />
              {maintenanceEnabled ? 'Under Maintenance' : 'Active'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance-mode-select">Display Mode</Label>
              <Select
                value={localConfig.maintenance?.mode || "photo"}
                onValueChange={(value) => updateMaintenanceField("mode", value)}
              >
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="Select display mode" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="photo" className="text-foreground hover:bg-accent">Photo</SelectItem>
                  <SelectItem value="text" className="text-foreground hover:bg-accent">Text Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-photo">Photo URL</Label>
              <Input
                id="maintenance-photo"
                value={localConfig.maintenance?.photo_url || ""}
                onChange={(e) => updateMaintenanceField("photo_url", e.target.value)}
                placeholder="Enter photo URL"
                className="bg-background border-input text-foreground"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance-message">Maintenance Message</Label>
              <Textarea
                id="maintenance-message"
                value={localConfig.maintenance?.message || ""}
                onChange={(e) => updateMaintenanceField("message", e.target.value)}
                placeholder="Enter maintenance message"
                className="min-h-[100px] bg-background border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-caption">Caption</Label>
              <Textarea
                id="maintenance-caption"
                value={localConfig.maintenance?.caption || ""}
                onChange={(e) => updateMaintenanceField("caption", e.target.value)}
                placeholder="Enter caption text"
                className="bg-background border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-back-message">Back Message</Label>
              <Input
                id="maintenance-back-message"
                value={localConfig.maintenance?.back_message || ""}
                onChange={(e) => updateMaintenanceField("back_message", e.target.value)}
                placeholder="Enter back message"
                className="bg-background border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-alert">Alert Message</Label>
              <Input
                id="maintenance-alert"
                value={localConfig.maintenance?.alert || ""}
                onChange={(e) => updateMaintenanceField("alert", e.target.value)}
                placeholder="Enter alert message"
                className="bg-background border-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-alert-notify">Alert Notification</Label>
              <Input
                id="maintenance-alert-notify"
                value={localConfig.maintenance?.alert_notify || ""}
                onChange={(e) => updateMaintenanceField("alert_notify", e.target.value)}
                placeholder="Enter alert notification"
                className="bg-background border-input text-foreground"
              />
            </div>
          </div>

          <Button 
            onClick={handleSaveChanges} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Maintenance Settings"}
          </Button>
        </div>
      </DataCard>

      {/* Start Command Section */}
      <DataCard title="Start Command Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="welcome-photo">Welcome Photo URL</Label>
            <Input
              id="welcome-photo"
              value={localConfig.start_command?.welcome_photo || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  start_command: {
                    ...prevConfig.start_command,
                    welcome_photo: e.target.value,
                  },
                }))
              }
              placeholder="Enter welcome photo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome-text">Welcome Text</Label>
            <Textarea
              id="welcome-text"
              value={localConfig.start_command?.welcome_text || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  start_command: {
                    ...prevConfig.start_command,
                    welcome_text: e.target.value,
                  },
                }))
              }
              placeholder="Enter welcome text"
              className="min-h-[100px] bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Start Command Settings
          </Button>
        </div>
      </DataCard>

      {/* Slot Booking Section */}
      <DataCard title="Slot Booking Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="slot-photo">Slot Photo URL</Label>
            <Input
              id="slot-photo"
              value={localConfig.slot_booking?.photo_url || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  slot_booking: {
                    ...prevConfig.slot_booking,
                    photo_url: e.target.value,
                  },
                }))
              }
              placeholder="Enter slot photo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot-caption">Slot Caption</Label>
            <Textarea
              id="slot-caption"
              value={localConfig.slot_booking?.caption || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  slot_booking: {
                    ...prevConfig.slot_booking,
                    caption: e.target.value,
                  },
                }))
              }
              placeholder="Enter slot caption"
              className="min-h-[100px] bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot-button-format">Slot Button Format</Label>
            <Input
              id="slot-button-format"
              value={localConfig.slot_booking?.button_format || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  slot_booking: {
                    ...prevConfig.slot_booking,
                    button_format: e.target.value,
                  },
                }))
              }
              placeholder="Enter slot button format"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slot-callback-data">Slot Callback Data</Label>
            <Input
              id="slot-callback-data"
              value={localConfig.slot_booking?.callback_data || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  slot_booking: {
                    ...prevConfig.slot_booking,
                    callback_data: e.target.value,
                  },
                }))
              }
              placeholder="Enter slot callback data"
              className="bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Slot Booking Settings
          </Button>
        </div>
      </DataCard>

      {/* Confirmation Flow Section */}
      <DataCard title="Confirmation Flow Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="confirmation-photo">Confirmation Photo URL</Label>
            <Input
              id="confirmation-photo"
              value={localConfig.confirmation_flow?.photo_url || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  confirmation_flow: {
                    ...prevConfig.confirmation_flow,
                    photo_url: e.target.value,
                  },
                }))
              }
              placeholder="Enter confirmation photo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation-caption">Confirmation Caption</Label>
            <Textarea
              id="confirmation-caption"
              value={localConfig.confirmation_flow?.caption || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  confirmation_flow: {
                    ...prevConfig.confirmation_flow,
                    caption: e.target.value,
                  },
                }))
              }
              placeholder="Enter confirmation caption"
              className="min-h-[100px] bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation-button-text">Confirmation Button Text</Label>
            <Input
              id="confirmation-button-text"
              value={localConfig.confirmation_flow?.button_text || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  confirmation_flow: {
                    ...prevConfig.confirmation_flow,
                    button_text: e.target.value,
                  },
                }))
              }
              placeholder="Enter confirmation button text"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation-callback-data">Confirmation Callback Data</Label>
            <Input
              id="confirmation-callback-data"
              value={localConfig.confirmation_flow?.callback_data || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  confirmation_flow: {
                    ...prevConfig.confirmation_flow,
                    callback_data: e.target.value,
                  },
                }))
              }
              placeholder="Enter confirmation callback data"
              className="bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Confirmation Flow Settings
          </Button>
        </div>
      </DataCard>

      {/* Approve Flow Section */}
      <DataCard title="Approve Flow Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="approve-photo">Approve Photo URL</Label>
            <Input
              id="approve-photo"
              value={localConfig.approve_flow?.photo_url || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  approve_flow: {
                    ...prevConfig.approve_flow,
                    photo_url: e.target.value,
                  },
                }))
              }
              placeholder="Enter approve photo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="approve-account-format">Approve Account Format</Label>
            <Input
              id="approve-account-format"
              value={localConfig.approve_flow?.account_format || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  approve_flow: {
                    ...prevConfig.approve_flow,
                    account_format: e.target.value,
                  },
                }))
              }
              placeholder="Enter approve account format"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="approve-success-text">Approve Success Text</Label>
            <Textarea
              id="approve-success-text"
              value={localConfig.approve_flow?.success_text || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  approve_flow: {
                    ...prevConfig.approve_flow,
                    success_text: e.target.value,
                  },
                }))
              }
              placeholder="Enter approve success text"
              className="min-h-[100px] bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Approve Flow Settings
          </Button>
        </div>
      </DataCard>

      {/* Reject Flow Section */}
      <DataCard title="Reject Flow Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reject-photo">Reject Photo URL</Label>
            <Input
              id="reject-photo"
              value={localConfig.reject_flow?.photo_url || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  reject_flow: {
                    ...prevConfig.reject_flow,
                    photo_url: e.target.value,
                  },
                }))
              }
              placeholder="Enter reject photo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reject-error-text">Reject Error Text</Label>
            <Textarea
              id="reject-error-text"
              value={localConfig.reject_flow?.error_text || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  reject_flow: {
                    ...prevConfig.reject_flow,
                    error_text: e.target.value,
                  },
                }))
              }
              placeholder="Enter reject error text"
              className="min-h-[100px] bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Reject Flow Settings
          </Button>
        </div>
      </DataCard>

      {/* Crunchyroll Screen Section */}
      <DataCard title="Crunchyroll Screen Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="crunchyroll-photo">Crunchyroll Photo URL</Label>
            <Input
              id="crunchyroll-photo"
              value={localConfig.crunchyroll_screen?.photo_url || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  crunchyroll_screen: {
                    ...prevConfig.crunchyroll_screen,
                    photo_url: e.target.value,
                  },
                }))
              }
              placeholder="Enter Crunchyroll photo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crunchyroll-caption">Crunchyroll Caption</Label>
            <Textarea
              id="crunchyroll-caption"
              value={localConfig.crunchyroll_screen?.caption || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  crunchyroll_screen: {
                    ...prevConfig.crunchyroll_screen,
                    caption: e.target.value,
                  },
                }))
              }
              placeholder="Enter Crunchyroll caption"
              className="min-h-[100px] bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crunchyroll-button-text">Crunchyroll Button Text</Label>
            <Input
              id="crunchyroll-button-text"
              value={localConfig.crunchyroll_screen?.button_text || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  crunchyroll_screen: {
                    ...prevConfig.crunchyroll_screen,
                    button_text: e.target.value,
                  },
                }))
              }
              placeholder="Enter Crunchyroll button text"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crunchyroll-callback-data">Crunchyroll Callback Data</Label>
            <Input
              id="crunchyroll-callback-data"
              value={localConfig.crunchyroll_screen?.callback_data || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  crunchyroll_screen: {
                    ...prevConfig.crunchyroll_screen,
                    callback_data: e.target.value,
                  },
                }))
              }
              placeholder="Enter Crunchyroll callback data"
              className="bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Crunchyroll Screen Settings
          </Button>
        </div>
      </DataCard>

      {/* Free Trial Info Section */}
      <DataCard title="Free Trial Info Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="freetrial-photo">Free Trial Photo URL</Label>
            <Input
              id="freetrial-photo"
              value={localConfig.freetrial_info?.photo_url || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  freetrial_info: {
                    ...prevConfig.freetrial_info,
                    photo_url: e.target.value,
                  },
                }))
              }
              placeholder="Enter free trial photo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Free Trial Info Settings
          </Button>
        </div>
      </DataCard>

      {/* Referral Info Section */}
      <DataCard title="Referral Info Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="referral-photo">Referral Photo URL</Label>
            <Input
              id="referral-photo"
              value={localConfig.referral_info?.photo_url || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  referral_info: {
                    ...prevConfig.referral_info,
                    photo_url: e.target.value,
                  },
                }))
              }
              placeholder="Enter referral photo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Referral Info Settings
          </Button>
        </div>
      </DataCard>

      {/* Out of Stock Section */}
      <DataCard title="Out of Stock Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="out-of-stock-photo">Out of Stock Photo URL</Label>
            <Input
              id="out-of-stock-photo"
              value={localConfig.out_of_stock?.photo_url || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  out_of_stock: {
                    ...prevConfig.out_of_stock,
                    photo_url: e.target.value,
                  },
                }))
              }
              placeholder="Enter out of stock photo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="out-of-stock-text">Out of Stock Text</Label>
            <Textarea
              id="out-of-stock-text"
              value={localConfig.out_of_stock?.stock_text || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  out_of_stock: {
                    ...prevConfig.out_of_stock,
                    stock_text: e.target.value,
                  },
                }))
              }
              placeholder="Enter out of stock text"
              className="min-h-[100px] bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Out of Stock Settings
          </Button>
        </div>
      </DataCard>

      {/* Locked Flow Section */}
      <DataCard title="Locked Flow Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="locked-text">Locked Text</Label>
            <Textarea
              id="locked-text"
              value={localConfig.locked_flow?.locked_text || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  locked_flow: {
                    ...prevConfig.locked_flow,
                    locked_text: e.target.value,
                  },
                }))
              }
              placeholder="Enter locked text"
              className="min-h-[100px] bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Locked Flow Settings
          </Button>
        </div>
      </DataCard>

      {/* OOR Pay Screen Section */}
      <DataCard title="OOR Pay Screen Settings">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="oor-upi-id">OOR UPI ID</Label>
            <Input
              id="oor-upi-id"
              value={localConfig.oor_pay_screen?.UPI_ID || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  oor_pay_screen: {
                    ...prevConfig.oor_pay_screen,
                    UPI_ID: e.target.value,
                  },
                }))
              }
              placeholder="Enter OOR UPI ID"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oor-merchant-name">OOR Merchant Name</Label>
            <Input
              id="oor-merchant-name"
              value={localConfig.oor_pay_screen?.MERCHANT_NAME || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  oor_pay_screen: {
                    ...prevConfig.oor_pay_screen,
                    MERCHANT_NAME: e.target.value,
                  },
                }))
              }
              placeholder="Enter OOR Merchant Name"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oor-mid">OOR MID</Label>
            <Input
              id="oor-mid"
              value={localConfig.oor_pay_screen?.MID || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  oor_pay_screen: {
                    ...prevConfig.oor_pay_screen,
                    MID: e.target.value,
                  },
                }))
              }
              placeholder="Enter OOR MID"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oor-template-url">OOR Template URL</Label>
            <Input
              id="oor-template-url"
              value={localConfig.oor_pay_screen?.TEMPLATE_URL || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  oor_pay_screen: {
                    ...prevConfig.oor_pay_screen,
                    TEMPLATE_URL: e.target.value,
                  },
                }))
              }
              placeholder="Enter OOR Template URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oor-logo-url">OOR Logo URL</Label>
            <Input
              id="oor-logo-url"
              value={localConfig.oor_pay_screen?.LOGO_URL || ""}
              onChange={(e) =>
                setLocalConfig((prevConfig) => ({
                  ...prevConfig,
                  oor_pay_screen: {
                    ...prevConfig.oor_pay_screen,
                    LOGO_URL: e.target.value,
                  },
                }))
              }
              placeholder="Enter OOR Logo URL"
              className="bg-background border-input text-foreground"
            />
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Save OOR Pay Screen Settings
          </Button>
        </div>
      </DataCard>
    </div>
  );
}
