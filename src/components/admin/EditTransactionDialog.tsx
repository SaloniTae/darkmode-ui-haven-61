import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "./DateTimePicker";
import { toast } from "sonner";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { format } from "date-fns";

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: string;
    type: string;
    slot?: string;
    startTime?: string;
    endTime?: string;
    originalData: any;
  };
  service: string;
}

export function EditTransactionDialog({ open, onOpenChange, transaction, service }: EditTransactionDialogProps) {
  const [editedData, setEditedData] = useState({
    slot_id: transaction.originalData.slot_id || "",
    assign_to: transaction.originalData.assign_to || "",
    user_id: transaction.originalData.user_id || "",
    start_time: transaction.startTime || "",
    end_time: transaction.endTime || "",
    last_email: transaction.originalData.last_email || "",
    last_password: transaction.originalData.last_password || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const { updateData } = useFirebaseService(service);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const path = transaction.type === "Regular" 
        ? `/transactions/${transaction.id}` 
        : `/transactions/${transaction.type === "Free Trial" ? "FTRIAL-ID" : "REF-ID"}/${transaction.id}`;

      await updateData(path, editedData);
      toast.success("Transaction updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartTimeChange = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd HH:mm:ss');
    setEditedData({ ...editedData, start_time: formattedDate });
  };

  const handleEndTimeChange = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd HH:mm:ss');
    setEditedData({ ...editedData, end_time: formattedDate });
  };

  const formatDisplayTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr.replace(' ', 'T'));
      return format(date, 'hh:mm:ss dd MMM');
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit: {transaction.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slot_id">Slot ID</Label>
              <Input
                id="slot_id"
                value={editedData.slot_id}
                onChange={(e) => setEditedData({ ...editedData, slot_id: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assign_to">Assigned To</Label>
              <Input
                id="assign_to"
                value={editedData.assign_to}
                onChange={(e) => setEditedData({ ...editedData, assign_to: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_id">User ID</Label>
            <Input
              id="user_id"
              value={editedData.user_id}
              onChange={(e) => setEditedData({ ...editedData, user_id: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={formatDisplayTime(editedData.start_time)}
                  readOnly
                  className="flex-1"
                />
                <DateTimePicker
                  value={editedData.start_time}
                  onChange={handleStartTimeChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={formatDisplayTime(editedData.end_time)}
                  readOnly
                  className="flex-1"
                />
                <DateTimePicker
                  value={editedData.end_time}
                  onChange={handleEndTimeChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_email">Email</Label>
            <Input
              id="last_email"
              value={editedData.last_email}
              onChange={(e) => setEditedData({ ...editedData, last_email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_password">Password</Label>
            <Input
              id="last_password"
              value={editedData.last_password}
              onChange={(e) => setEditedData({ ...editedData, last_password: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
