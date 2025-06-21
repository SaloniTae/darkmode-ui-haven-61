
import { Slot } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface SlotFormProps {
  slotData: Slot;
  onSlotChange: (field: keyof Slot, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  slotKey?: string;
}

export function SlotForm({ slotData, onSlotChange, onSave, onCancel, slotKey }: SlotFormProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`${slotKey || 'new'}-enabled`}
          checked={slotData.enabled}
          onCheckedChange={(checked) => onSlotChange('enabled', checked === true)}
        />
        <Label htmlFor={`${slotKey || 'new'}-enabled`} className="text-sm font-medium">
          Enabled
        </Label>
      </div>
      
      <div className="space-y-1">
        <Label htmlFor={`${slotKey || 'new'}-name`}>Plan Name</Label>
        <Input
          id={`${slotKey || 'new'}-name`}
          type="text"
          placeholder="e.g., Standard Plan"
          value={slotData.name}
          onChange={(e) => onSlotChange('name', e.target.value)}
        />
      </div>
      
      <div className="space-y-1">
        <Label htmlFor={`${slotKey || 'new'}-duration`}>Duration (Hours)</Label>
        <Input
          id={`${slotKey || 'new'}-duration`}
          type="number"
          min="1"
          value={slotData.duration_hours}
          onChange={(e) => onSlotChange('duration_hours', parseInt(e.target.value))}
        />
      </div>
      
      <div className="space-y-1">
        <Label htmlFor={`${slotKey || 'new'}-amount`}>Required Amount</Label>
        <Input
          id={`${slotKey || 'new'}-amount`}
          type="number"
          min="0"
          value={slotData.required_amount}
          onChange={(e) => onSlotChange('required_amount', parseInt(e.target.value))}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave}>
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}
