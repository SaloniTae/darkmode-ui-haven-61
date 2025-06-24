import { useState, useEffect } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { UIConfig } from "@/types/database";
import { useFirebaseService } from "@/hooks/useFirebaseService";

interface UIConfigPanelProps {
  uiConfig: UIConfig;
  service: string;
}

export function UIConfigPanel({ uiConfig, service }: UIConfigPanelProps) {
  const [editedConfig, setEditedConfig] = useState<UIConfig>(uiConfig);
  const [activeSection, setActiveSection] = useState("start_command");
  const [isLoading, setIsLoading] = useState(false);
  const { updateData } = useFirebaseService(service);

  useEffect(() => {
    setEditedConfig(uiConfig);
  }, [uiConfig]);

  const saveData = async () => {
    setIsLoading(true);
    try {
      await updateData("/ui_config", editedConfig);
      toast.success("UI Config saved successfully");
    } catch (error) {
      console.error("Error saving UI Config:", error);
      toast.error("Failed to save UI Config");
    } finally {
      setIsLoading(false);
    }
  };

  // Add defensive check for start_command buttons
  const startCommandButtons = editedConfig?.start_command?.buttons || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">UI Configuration</h2>
        <Button variant="default" onClick={saveData} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="w-full mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 h-auto p-1 glass-morphism">
          <TabsTrigger value="start_command">Start</TabsTrigger>
          <TabsTrigger value="slot_booking">Select Plan</TabsTrigger>
          <TabsTrigger value="confirmation_flow">Confirmation</TabsTrigger>
          <TabsTrigger value="approve_flow">Approve</TabsTrigger>
          <TabsTrigger value="reject_flow">Reject</TabsTrigger>
          <TabsTrigger value="out_of_stock">Out of Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="start_command">
          <DataCard title="Start Command Configuration">
            <div>
              <Label htmlFor="welcome_text">Welcome Text</Label>
              <Textarea
                id="welcome_text"
                placeholder="Enter welcome text"
                value={editedConfig?.start_command?.welcome_text || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    start_command: {
                      ...prev.start_command,
                      welcome_text: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="welcome_photo">Welcome Photo URL</Label>
              <Input
                type="url"
                id="welcome_photo"
                placeholder="Enter welcome photo URL"
                value={editedConfig?.start_command?.welcome_photo || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    start_command: {
                      ...prev.start_command,
                      welcome_photo: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="buttons">Buttons</Label>
              <div className="space-y-2 mt-2">
                {startCommandButtons.map((button, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      placeholder="Button text"
                      value={button.text || ""}
                      onChange={(e) => {
                        const newButtons = [...startCommandButtons];
                        newButtons[index] = { ...button, text: e.target.value };
                        setEditedConfig(prev => ({
                          ...prev,
                          start_command: {
                            ...prev.start_command,
                            buttons: newButtons
                          }
                        }));
                      }}
                    />
                    <Input
                      placeholder="Callback data"
                      value={button.callback_data || ""}
                      onChange={(e) => {
                        const newButtons = [...startCommandButtons];
                        newButtons[index] = { ...button, callback_data: e.target.value };
                        setEditedConfig(prev => ({
                          ...prev,
                          start_command: {
                            ...prev.start_command,
                            buttons: newButtons
                          }
                        }));
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const newButtons = startCommandButtons.filter((_, i) => i !== index);
                        setEditedConfig(prev => ({
                          ...prev,
                          start_command: {
                            ...prev.start_command,
                            buttons: newButtons
                          }
                        }));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const newButtons = [...startCommandButtons, { text: "", callback_data: "" }];
                    setEditedConfig(prev => ({
                      ...prev,
                      start_command: {
                        ...prev.start_command,
                        buttons: newButtons
                      }
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Button
                </Button>
              </div>
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="slot_booking">
          <DataCard title="Slot Booking Configuration">
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Enter caption text"
                value={editedConfig?.slot_booking?.caption || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    slot_booking: {
                      ...prev.slot_booking,
                      caption: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                type="url"
                id="photo_url"
                placeholder="Enter photo URL"
                value={editedConfig?.slot_booking?.photo_url || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    slot_booking: {
                      ...prev.slot_booking,
                      photo_url: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="button_format">Button Format</Label>
              <Input
                type="text"
                id="button_format"
                placeholder="Enter button format"
                value={editedConfig?.slot_booking?.button_format || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    slot_booking: {
                      ...prev.slot_booking,
                      button_format: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="callback_data">Callback Data</Label>
              <Input
                type="text"
                id="callback_data"
                placeholder="Enter callback data"
                value={editedConfig?.slot_booking?.callback_data || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    slot_booking: {
                      ...prev.slot_booking,
                      callback_data: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="confirmation_flow">
          <DataCard title="Confirmation Flow Configuration">
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Enter caption text"
                value={editedConfig?.confirmation_flow?.caption || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    confirmation_flow: {
                      ...prev.confirmation_flow,
                      caption: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                type="url"
                id="photo_url"
                placeholder="Enter photo URL"
                value={editedConfig?.confirmation_flow?.photo_url || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    confirmation_flow: {
                      ...prev.confirmation_flow,
                      photo_url: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="button_text">Button Text</Label>
              <Input
                type="text"
                id="button_text"
                placeholder="Enter button text"
                value={editedConfig?.confirmation_flow?.button_text || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    confirmation_flow: {
                      ...prev.confirmation_flow,
                      button_text: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="callback_data">Callback Data</Label>
              <Input
                type="text"
                id="callback_data"
                placeholder="Enter callback data"
                value={editedConfig?.confirmation_flow?.callback_data || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    confirmation_flow: {
                      ...prev.confirmation_flow,
                      callback_data: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="approve_flow">
          <DataCard title="Approve Flow Configuration">
            <div>
              <Label htmlFor="success_text">Success Text</Label>
              <Textarea
                id="success_text"
                placeholder="Enter success text"
                value={editedConfig?.approve_flow?.success_text || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    approve_flow: {
                      ...prev.approve_flow,
                      success_text: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                type="url"
                id="photo_url"
                placeholder="Enter photo URL"
                value={editedConfig?.approve_flow?.photo_url || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    approve_flow: {
                      ...prev.approve_flow,
                      photo_url: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="account_format">Account Format</Label>
              <Input
                type="text"
                id="account_format"
                placeholder="Enter account format"
                value={editedConfig?.approve_flow?.account_format || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    approve_flow: {
                      ...prev.approve_flow,
                      account_format: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="reject_flow">
          <DataCard title="Reject Flow Configuration">
            <div>
              <Label htmlFor="error_text">Error Text</Label>
              <Textarea
                id="error_text"
                placeholder="Enter error text"
                value={editedConfig?.reject_flow?.error_text || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    reject_flow: {
                      ...prev.reject_flow,
                      error_text: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                type="url"
                id="photo_url"
                placeholder="Enter photo URL"
                value={editedConfig?.reject_flow?.photo_url || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    reject_flow: {
                      ...prev.reject_flow,
                      photo_url: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="phonepe_screen">
          <DataCard title="PhonePe Screen Configuration">
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Enter caption text"
                value={editedConfig?.phonepe_screen?.caption || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    phonepe_screen: {
                      ...prev.phonepe_screen,
                      caption: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                type="url"
                id="photo_url"
                placeholder="Enter photo URL"
                value={editedConfig?.phonepe_screen?.photo_url || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    phonepe_screen: {
                      ...prev.phonepe_screen,
                      photo_url: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="followup_text">Follow-up Text</Label>
              <Textarea
                id="followup_text"
                placeholder="Enter follow-up text"
                value={editedConfig?.phonepe_screen?.followup_text || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    phonepe_screen: {
                      ...prev.phonepe_screen,
                      followup_text: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="out_of_stock">
          <DataCard title="Out of Stock Configuration">
            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                type="url"
                id="photo_url"
                placeholder="Enter photo URL"
                value={editedConfig?.out_of_stock?.photo_url || ""}
                onChange={(e) =>
                  setEditedConfig((prev) => ({
                    ...prev,
                    out_of_stock: {
                      ...prev.out_of_stock,
                      photo_url: e.target.value,
                    },
                  }))
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="messages">Messages</Label>
              <div className="space-y-2 mt-2">
                {(editedConfig?.out_of_stock?.messages || []).map((message, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      placeholder="Message text"
                      value={message || ""}
                      onChange={(e) => {
                        const newMessages = [...(editedConfig?.out_of_stock?.messages || [])];
                        newMessages[index] = e.target.value;
                        setEditedConfig(prev => ({
                          ...prev,
                          out_of_stock: {
                            ...prev.out_of_stock,
                            messages: newMessages
                          }
                        }));
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const newMessages = (editedConfig?.out_of_stock?.messages || []).filter((_, i) => i !== index);
                        setEditedConfig(prev => ({
                          ...prev,
                          out_of_stock: {
                            ...prev.out_of_stock,
                            messages: newMessages
                          }
                        }));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const newMessages = [...(editedConfig?.out_of_stock?.messages || []), ""];
                    setEditedConfig(prev => ({
                      ...prev,
                      out_of_stock: {
                        ...prev.out_of_stock,
                        messages: newMessages
                      }
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Message
                </Button>
              </div>
            </div>
          </DataCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
