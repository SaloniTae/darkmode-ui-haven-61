
import { useState } from "react";
import { AdminConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Edit, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminListSection } from "./admin/AdminListSection";
import { useFirebaseService } from "@/hooks/useFirebaseService";

interface AdminPanelProps {
  adminConfig: AdminConfig;
  service: string;
}

export function AdminPanel({ adminConfig, service }: AdminPanelProps) {
  // Ensure adminConfig always has the required arrays
  const initialConfig: AdminConfig = {
    superior_admins: adminConfig?.superior_admins || [],
    inferior_admins: adminConfig?.inferior_admins || []
  };
  
  const [editedConfig, setEditedConfig] = useState<AdminConfig>(initialConfig);
  const [isEditing, setIsEditing] = useState(false);
  
  const { updateData } = useFirebaseService(service);

  const handleSaveChanges = async () => {
    try {
      await updateData("/admin_config", editedConfig);
      toast.success("Admin configuration updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating admin config:", error);
      toast.error("Failed to update admin configuration");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Configuration</h2>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => {
            if (isEditing) {
              setEditedConfig(initialConfig);
            }
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? "Cancel" : <><Edit className="mr-2 h-4 w-4" /> Edit</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminListSection 
          title="Superior Admins"
          adminList={editedConfig.superior_admins}
          isEditing={isEditing}
          onAddAdmin={(admin) => {
            setEditedConfig({
              ...editedConfig,
              superior_admins: [...editedConfig.superior_admins, admin]
            });
            return true;
          }}
          onRemoveAdmin={(admin) => {
            setEditedConfig({
              ...editedConfig,
              superior_admins: editedConfig.superior_admins.filter(id => id !== admin)
            });
          }}
          adminType="superior"
        />

        <AdminListSection 
          title="Inferior Admins"
          adminList={editedConfig.inferior_admins}
          isEditing={isEditing}
          onAddAdmin={(admin) => {
            setEditedConfig({
              ...editedConfig,
              inferior_admins: [...editedConfig.inferior_admins, admin]
            });
            return true;
          }}
          onRemoveAdmin={(admin) => {
            setEditedConfig({
              ...editedConfig,
              inferior_admins: editedConfig.inferior_admins.filter(id => id !== admin)
            });
          }}
          adminType="inferior"
        />
      </div>

      {isEditing && (
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
