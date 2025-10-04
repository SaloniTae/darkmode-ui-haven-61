
import { useState, useEffect } from "react";
import { Slots, Slot } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SlotCard } from "./SlotCard";
import { NewSlotDialog } from "./NewSlotDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { useFirebaseService } from "@/hooks/useFirebaseService";

interface SlotsPanelProps {
  slots: Slots;
  service: string;
}

export function SlotsPanel({ slots, service }: SlotsPanelProps) {
  // Initialize with empty object if slots is undefined
  const [currentSlots, setCurrentSlots] = useState<Slots>(slots || {});
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editedSlots, setEditedSlots] = useState<Slots>({ ...slots || {} });
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean; 
    action: () => Promise<void>; 
    title: string; 
    description: string
  }>({
    open: false,
    action: async () => {},
    title: "",
    description: ""
  });
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  
  const { updateData, setData, removeData, subscribeToData } = useFirebaseService(service);

  // Sync with incoming slots prop changes
  useEffect(() => {
    console.log("Slots prop updated:", slots);
    setCurrentSlots(slots || {});
    // Don't reset editedSlots if we're currently editing
    if (!editingSlot) {
      setEditedSlots(slots || {});
    }
  }, [slots, editingSlot]);

  // Set up real-time listener for slots with immediate updates
  useEffect(() => {
    console.log("Setting up real-time listener for slots");
    const unsubscribe = subscribeToData("/settings/slots", (data) => {
      if (data) {
        console.log("Real-time slots data received:", data);
        setCurrentSlots(data);
        
        // Update editedSlots immediately if not currently editing
        if (!editingSlot) {
          setEditedSlots(data);
        }
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [service, subscribeToData, editingSlot]);

  const handleEditSlot = (slotKey: string) => {
    setEditingSlot(slotKey);
  };

  const handleCancelEdit = () => {
    setEditedSlots({ ...currentSlots });
    setEditingSlot(null);
  };

  const handleSaveSlot = async (slotKey: string) => {
    try {
      await updateData(`/settings/slots/${slotKey}`, editedSlots[slotKey]);
      toast.success(`Slot ${slotKey} updated successfully`);
      setEditingSlot(null);
    } catch (error) {
      console.error(`Error updating ${slotKey}:`, error);
      toast.error(`Failed to update ${slotKey}`);
    }
  };

  const handleInputChange = (slotKey: string, field: keyof Slot, value: any) => {
    setEditedSlots({
      ...editedSlots,
      [slotKey]: {
        ...editedSlots[slotKey],
        [field]: value
      }
    });
  };
  
  const toggleSlotEnabled = async (slotKey: string) => {
    const currentSlot = currentSlots[slotKey];
    if (!currentSlot) return;
    
    const newEnabledValue = !currentSlot.enabled;
    
    setConfirmationDialog({
      open: true,
      action: async () => {
        try {
          // Update the entire slot object with the new enabled value
          const updatedSlot = { ...currentSlot, enabled: newEnabledValue };
          await updateData(`/settings/slots/${slotKey}`, updatedSlot);
          
          toast.success(`${slotKey} ${newEnabledValue ? 'enabled' : 'disabled'} successfully`);
        } catch (error) {
          console.error(`Error toggling enabled state for ${slotKey}:`, error);
          toast.error(`Failed to ${newEnabledValue ? 'enable' : 'disable'} ${slotKey}`);
        }
      },
      title: `${newEnabledValue ? 'Enable' : 'Disable'} ${slotKey}`,
      description: `Are you sure you want to ${newEnabledValue ? 'enable' : 'disable'} ${slotKey}?`
    });
  };

  const handleDeleteSlot = (slotKey: string) => {
    setConfirmationDialog({
      open: true,
      action: async () => {
        try {
          await removeData(`/settings/slots/${slotKey}`);
          toast.success(`Slot ${slotKey} deleted successfully`);
        } catch (error) {
          console.error(`Error deleting slot ${slotKey}:`, error);
          toast.error(`Failed to delete slot ${slotKey}`);
        }
      },
      title: `Delete ${slotKey}`,
      description: `Are you sure you want to delete ${slotKey}? This action cannot be undone.`
    });
  };
  
  const handleCreateSlot = async (newSlotKey: string, newSlot: Slot) => {
    if (!newSlotKey) {
      toast.error("Please enter a slot key");
      return;
    }
    
    try {
      await setData(`/settings/slots/${newSlotKey}`, newSlot);
      toast.success(`Slot ${newSlotKey} created successfully`);
      setIsAddingSlot(false);
    } catch (error) {
      console.error("Error creating slot:", error);
      toast.error("Failed to create slot");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Slots Management</h2>
        <Button onClick={() => setIsAddingSlot(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Slot
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(currentSlots).map(([slotKey, slot]) => {
          if (!slot) return null; // Skip rendering if slot is undefined
          
          const isEditing = editingSlot === slotKey;
          const currentSlot = currentSlots[slotKey];
          const editedSlot = editedSlots[slotKey];
          
          // Skip this slot if it doesn't exist in currentSlots
          if (!currentSlot) return null;
          
          return (
            <SlotCard
              key={slotKey}
              slotKey={slotKey}
              slot={currentSlot}
              editedSlot={editedSlot || currentSlot}
              isEditing={isEditing}
              onEdit={() => handleEditSlot(slotKey)}
              onDelete={() => handleDeleteSlot(slotKey)}
              onToggleEnabled={() => toggleSlotEnabled(slotKey)}
              onUpdate={(field, value) => handleInputChange(slotKey, field, value)}
              onSave={() => handleSaveSlot(slotKey)}
              onCancel={handleCancelEdit}
            />
          );
        })}
      </div>

      <ConfirmationDialog 
        open={confirmationDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmationDialog({...confirmationDialog, open: false});
          }
        }}
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        onConfirm={async () => {
          await confirmationDialog.action();
          setConfirmationDialog({...confirmationDialog, open: false});
        }}
      />
      
      <NewSlotDialog
        open={isAddingSlot}
        onOpenChange={setIsAddingSlot}
        onCreateSlot={handleCreateSlot}
      />
    </div>
  );
}
