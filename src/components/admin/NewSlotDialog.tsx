
import { useState } from "react";
import { Slot } from "@/types/database";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlotForm } from "./SlotForm";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSlot: (key: string, slot: Slot) => Promise<void>;
}

export function NewSlotDialog({ open, onOpenChange, onCreateSlot }: NewSlotDialogProps) {
  const [newSlotKey, setNewSlotKey] = useState("");
  const [newSlot, setNewSlot] = useState<Slot>({
    duration_hours: 6,
    enabled: true,
    name: "Standard Plan",
    required_amount: 1
  });

  const handleNewSlotChange = (field: keyof Slot, value: any) => {
    setNewSlot({
      ...newSlot,
      [field]: value
    });
  };

  const handleCreateSlot = async () => {
    await onCreateSlot(newSlotKey, newSlot);
    resetForm();
  };

  const resetForm = () => {
    setNewSlotKey("");
    setNewSlot({
      duration_hours: 6,
      enabled: true,
      name: "Standard Plan",
      required_amount: 1
    });
  };

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
        }
        onOpenChange(isOpen);
      }}
    >
      <AlertDialogContent className="bg-background max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <AlertDialogHeader>
              <AlertDialogTitle>Add New Slot</AlertDialogTitle>
              <AlertDialogDescription>
                Create a new booking slot
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-slot-key">Slot Key</Label>
                <Input
                  id="new-slot-key"
                  placeholder="e.g., slot_4"
                  value={newSlotKey}
                  onChange={(e) => setNewSlotKey(e.target.value)}
                />
              </div>
              
              <SlotForm 
                slotData={newSlot}
                onSlotChange={handleNewSlotChange}
                onSave={handleCreateSlot}
                onCancel={() => onOpenChange(false)}
              />
            </div>
          </div>
        </ScrollArea>
      </AlertDialogContent>
    </AlertDialog>
  );
}
