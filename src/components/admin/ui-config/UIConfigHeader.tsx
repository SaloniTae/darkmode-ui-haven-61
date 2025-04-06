
import { Button } from "@/components/ui/button";
import { Edit, Save } from "lucide-react";

interface UIConfigHeaderProps {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function UIConfigHeader({ 
  isEditing, 
  setIsEditing, 
  onSave, 
  onCancel 
}: UIConfigHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">UI Configuration</h2>
      {isEditing ? (
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
      )}
    </div>
  );
}
