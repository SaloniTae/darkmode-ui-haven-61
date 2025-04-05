
import { useState, useEffect } from "react";
import { UIConfig } from "@/types/database";
import { toast } from "sonner";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Edit } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UIConfigPanelProps {
  uiConfig: UIConfig;
  service: string;
}

export function UIConfigPanel({ uiConfig, service }: UIConfigPanelProps) {
  const [editedConfig, setEditedConfig] = useState<UIConfig>(uiConfig);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { updateData } = useFirebaseService(service);

  // Update local state when uiConfig prop changes (e.g. real-time updates)
  useEffect(() => {
    setEditedConfig(uiConfig);
  }, [uiConfig]);

  const handleInputChange = (path: string[], value: string | string[]) => {
    setEditedConfig((prevConfig) => {
      const newConfig = { ...prevConfig };
      let current: any = newConfig;
      
      // Navigate to the nested property
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      // Set the value
      current[path[path.length - 1]] = value;
      
      return newConfig;
    });
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      await updateData("/ui_config", editedConfig);
      setEditMode(false);
      toast.success(`UI Config updated successfully for ${service}`);
    } catch (error) {
      console.error("Error updating UI config:", error);
      toast.error(`Failed to update UI Config for ${service}`);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to render edit fields based on data type
  const renderEditField = (path: string[], value: any, label: string) => {
    if (typeof value === "string") {
      // Determine if this is a long text field
      const isLongText = value.length > 100;
      
      return (
        <div className="space-y-2 mb-4">
          <Label>{label}</Label>
          {isLongText ? (
            <Textarea 
              value={value}
              onChange={(e) => handleInputChange(path, e.target.value)}
              rows={5}
            />
          ) : (
            <Input 
              value={value}
              onChange={(e) => handleInputChange(path, e.target.value)}
            />
          )}
        </div>
      );
    } else if (Array.isArray(value)) {
      return (
        <div className="space-y-2 mb-4">
          <Label>{label}</Label>
          <div className="space-y-2">
            {value.map((item, idx) => {
              if (typeof item === "string") {
                return (
                  <Input 
                    key={idx}
                    value={item}
                    onChange={(e) => {
                      const newArray = [...value];
                      newArray[idx] = e.target.value;
                      handleInputChange(path, newArray as any);
                    }}
                  />
                );
              } else if (typeof item === "object") {
                return (
                  <Card key={idx} className="p-2">
                    {Object.entries(item).map(([key, val]) => (
                      renderEditField([...path, idx.toString(), key], val, key)
                    ))}
                  </Card>
                );
              }
              return null;
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper function to render configuration sections
  const renderConfigSection = (section: string, configData: any) => {
    return (
      <TabsContent value={section} className="space-y-4 p-4 glass-morphism rounded">
        <h3 className="text-lg font-medium mb-4">{section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
        {editMode ? (
          <div className="space-y-4">
            {Object.entries(configData).map(([key, value]) => {
              // Handle nested objects
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-md">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Object.entries(value as object).map(([nestedKey, nestedValue]) => (
                        renderEditField([section, key, nestedKey], nestedValue, nestedKey)
                      ))}
                    </CardContent>
                  </Card>
                );
              } else {
                return renderEditField([section, key], value, key);
              }
            })}
          </div>
        ) : (
          <pre className="p-4 rounded bg-background/30 overflow-auto text-sm">
            {JSON.stringify(configData, null, 2)}
          </pre>
        )}
      </TabsContent>
    );
  };

  const configSections = Object.keys(editedConfig);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">UI Configuration - {service}</h2>
        <div className="space-x-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => {
                setEditedConfig(uiConfig);
                setEditMode(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveConfig} 
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" /> 
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Configuration
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[70vh] pr-4">
        <Tabs defaultValue={configSections[0]} className="w-full">
          <TabsList className="mb-4 flex flex-wrap">
            {configSections.map(section => (
              <TabsTrigger 
                key={section} 
                value={section}
                className="mb-2"
              >
                {section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {configSections.map(section => (
            renderConfigSection(section, editedConfig[section as keyof UIConfig])
          ))}
        </Tabs>
      </ScrollArea>
    </div>
  );
}
