
import { useState, useEffect } from "react";
import { UIConfig, CrunchyrollScreen, NetflixPrimeScreen } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateData } from "@/lib/firebaseService";
import { updatePrimeData } from "@/lib/firebaseService";
import { updateNetflixData } from "@/lib/firebaseService";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

// Import the refactored components
import { UIConfigHeader } from "./ui-config/UIConfigHeader";
import { StartCommandSection } from "./ui-config/sections/StartCommandSection";
import { CrunchyrollSection } from "./ui-config/sections/CrunchyrollSection";
import { SlotBookingSection } from "./ui-config/sections/SlotBookingSection";
import { ConfirmationSection } from "./ui-config/sections/ConfirmationSection";
import { PhonePeSection } from "./ui-config/sections/PhonePeSection";
import { ApproveFlowSection } from "./ui-config/sections/ApproveFlowSection";
import { RejectFlowSection } from "./ui-config/sections/RejectFlowSection";
import { PostersSection } from "./ui-config/sections/PostersSection";
import { OtherSection } from "./ui-config/sections/OtherSection";

interface UIConfigPanelProps {
  uiConfig: UIConfig;
  service: string;
}

export function UIConfigPanel({ uiConfig, service }: UIConfigPanelProps) {
  const [activeSection, setActiveSection] = useState("start_command");
  const [editedConfig, setEditedConfig] = useState<UIConfig>({ ...uiConfig });
  const [isEditing, setIsEditing] = useState(false);
  const location = useLocation();

  const isNetflixOrPrime = location.pathname.includes("netflix") || location.pathname.includes("prime");

  // Update edited config when uiConfig prop changes
  useEffect(() => {
    setEditedConfig({ ...uiConfig });
  }, [uiConfig]);

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
    const updatedArray = [...sectionData[field]];
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
    const updatedArray = [...sectionData[field]];
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
    const updatedButtons = [
      ...sectionData.buttons,
      { text: "New Button", callback_data: "new_button" }
    ];
    
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
    const updatedButtons = sectionData.buttons.filter((_: any, i: number) => i !== index);
    
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        buttons: updatedButtons
      }
    });
  };

  const addMessage = (section: string) => {
    const sectionData = editedConfig[section as keyof UIConfig] as any;
    const updatedMessages = [
      ...sectionData.messages,
      "New message"
    ];
    
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        messages: updatedMessages
      }
    });
  };

  const removeMessage = (section: string, index: number) => {
    const sectionData = editedConfig[section as keyof UIConfig] as any;
    const updatedMessages = sectionData.messages.filter((_: any, i: number) => i !== index);
    
    setEditedConfig({
      ...editedConfig,
      [section]: {
        ...sectionData,
        messages: updatedMessages
      }
    });
  };

  // Function to get the correct media URL based on service type
  const getMediaUrl = (screen: CrunchyrollScreen | NetflixPrimeScreen): string => {
    if (isNetflixOrPrime) {
      return (screen as NetflixPrimeScreen).gif_url || "";
    } else {
      return (screen as CrunchyrollScreen).photo_url || "";
    }
  };

  // This key helps force re-render of images when URLs change
  const [imageKey, setImageKey] = useState(Date.now());
  
  // Force re-render of images when edited config changes
  useEffect(() => {
    setImageKey(Date.now());
  }, [editedConfig]);

  const handleCancel = () => {
    setEditedConfig({ ...uiConfig });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <UIConfigHeader 
        isEditing={isEditing} 
        setIsEditing={setIsEditing} 
        onSave={handleSaveChanges} 
        onCancel={handleCancel}
      />

      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="w-full mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 h-auto p-1 glass-morphism">
          <TabsTrigger value="start_command">Start</TabsTrigger>
          <TabsTrigger value="crunchyroll_screen">Crunchyroll</TabsTrigger>
          <TabsTrigger value="slot_booking">Slot Booking</TabsTrigger>
          <TabsTrigger value="confirmation_flow">Confirmation</TabsTrigger>
          <TabsTrigger value="phonepe_screen">PhonePe</TabsTrigger>
          <TabsTrigger value="approve_flow">Approve</TabsTrigger>
          <TabsTrigger value="reject_flow">Reject</TabsTrigger>
          <TabsTrigger value="posters">Posters</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
        
        <TabsContent value="start_command" className="mt-0">
          <StartCommandSection 
            editedConfig={editedConfig}
            isEditing={isEditing}
            imageKey={imageKey}
            handleInputChange={handleInputChange}
            handleObjectArrayChange={handleObjectArrayChange}
            addButton={addButton}
            removeButton={removeButton}
          />
        </TabsContent>
        
        <TabsContent value="crunchyroll_screen" className="mt-0">
          <CrunchyrollSection 
            editedConfig={editedConfig}
            isEditing={isEditing}
            isNetflixOrPrime={isNetflixOrPrime}
            imageKey={imageKey}
            handleInputChange={handleInputChange}
            getMediaUrl={getMediaUrl}
          />
        </TabsContent>
        
        <TabsContent value="slot_booking" className="mt-0">
          <SlotBookingSection 
            editedConfig={editedConfig}
            isEditing={isEditing}
            handleInputChange={handleInputChange}
          />
        </TabsContent>
        
        <TabsContent value="confirmation_flow" className="mt-0">
          <ConfirmationSection 
            editedConfig={editedConfig}
            isEditing={isEditing}
            handleInputChange={handleInputChange}
          />
        </TabsContent>
        
        <TabsContent value="phonepe_screen" className="mt-0">
          <PhonePeSection 
            editedConfig={editedConfig}
            isEditing={isEditing}
            handleInputChange={handleInputChange}
          />
        </TabsContent>
        
        <TabsContent value="approve_flow" className="mt-0">
          <ApproveFlowSection 
            editedConfig={editedConfig}
            isEditing={isEditing}
            handleInputChange={handleInputChange}
          />
        </TabsContent>
        
        <TabsContent value="reject_flow" className="mt-0">
          <RejectFlowSection 
            editedConfig={editedConfig}
            isEditing={isEditing}
            handleInputChange={handleInputChange}
          />
        </TabsContent>
        
        <TabsContent value="posters" className="mt-0">
          <PostersSection 
            editedConfig={editedConfig}
            isEditing={isEditing}
            handleInputChange={handleInputChange}
          />
        </TabsContent>
        
        <TabsContent value="other" className="mt-0">
          <OtherSection 
            editedConfig={editedConfig}
            isEditing={isEditing}
            handleInputChange={handleInputChange}
            handleArrayChange={handleArrayChange}
            addMessage={addMessage}
            removeMessage={removeMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
