import { useState } from "react";
import { AdminConfig } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Plus, Save, Edit } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useFirebaseService } from "@/hooks/useFirebaseService";

interface AdminPanelProps {
  adminConfig: AdminConfig;
  service: string;
}

export function AdminPanel({ adminConfig, service }: AdminPanelProps) {
  const [editedConfig, setEditedConfig] = useState<AdminConfig>({ ...adminConfig });
  const [isEditing, setIsEditing] = useState(false);
  const [isRemovingSuperior, setIsRemovingSuperior] = useState(false);
  const [isRemovingInferior, setIsRemovingInferior] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null);
  const [newSuperiorAdmin, setNewSuperiorAdmin] = useState("");
  const [newInferiorAdmin, setNewInferiorAdmin] = useState("");
  
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

  const handleAddSuperiorAdmin = () => {
    if (!newSuperiorAdmin.trim()) return;
    
    const adminId = newSuperiorAdmin.trim();
    
    if (editedConfig.superior_admins.includes(adminId)) {
      toast.error("This admin is already a superior admin");
      return;
    }
    
    setEditedConfig({
      ...editedConfig,
      superior_admins: [...editedConfig.superior_admins, adminId]
    });
    
    setNewSuperiorAdmin("");
    toast.success(`Added ${adminId} as superior admin`);
  };

  const handleAddInferiorAdmin = () => {
    if (!newInferiorAdmin.trim()) return;
    
    const adminId = newInferiorAdmin.trim();
    
    if (editedConfig.inferior_admins.includes(adminId)) {
      toast.error("This admin is already an inferior admin");
      return;
    }
    
    setEditedConfig({
      ...editedConfig,
      inferior_admins: [...editedConfig.inferior_admins, adminId]
    });
    
    setNewInferiorAdmin("");
    toast.success(`Added ${adminId} as inferior admin`);
  };

  const confirmRemoveSuperiorAdmin = (adminId: string) => {
    setAdminToRemove(adminId);
    setIsRemovingSuperior(true);
  };

  const confirmRemoveInferiorAdmin = (adminId: string) => {
    setAdminToRemove(adminId);
    setIsRemovingInferior(true);
  };

  const handleRemoveSuperiorAdmin = () => {
    if (adminToRemove === null) return;
    
    setEditedConfig({
      ...editedConfig,
      superior_admins: editedConfig.superior_admins.filter(id => id !== adminToRemove)
    });
    
    setIsRemovingSuperior(false);
    setAdminToRemove(null);
    toast.success(`Removed ${adminToRemove} from superior admins`);
  };

  const handleRemoveInferiorAdmin = () => {
    if (adminToRemove === null) return;
    
    setEditedConfig({
      ...editedConfig,
      inferior_admins: editedConfig.inferior_admins.filter(id => id !== adminToRemove)
    });
    
    setIsRemovingInferior(false);
    setAdminToRemove(null);
    toast.success(`Removed ${adminToRemove} from inferior admins`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Configuration</h2>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => {
            if (isEditing) {
              setEditedConfig({ ...adminConfig });
            }
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? "Cancel" : <><Edit className="mr-2 h-4 w-4" /> Edit</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataCard title="Superior Admins" className="h-full">
          <div className="space-y-4">
            {isEditing && (
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter admin ID"
                  value={newSuperiorAdmin}
                  onChange={(e) => setNewSuperiorAdmin(e.target.value)}
                />
                <Button onClick={() => {
                  if (!newSuperiorAdmin.trim()) return;
                  
                  const adminId = newSuperiorAdmin.trim();
                  
                  if (editedConfig.superior_admins.includes(adminId)) {
                    toast.error("This admin is already a superior admin");
                    return;
                  }
                  
                  setEditedConfig({
                    ...editedConfig,
                    superior_admins: [...editedConfig.superior_admins, adminId]
                  });
                  
                  setNewSuperiorAdmin("");
                  toast.success(`Added ${adminId} as superior admin`);
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            )}

            <div className="grid gap-3">
              {editedConfig.superior_admins.map((admin) => (
                <div 
                  key={admin} 
                  className="flex items-center justify-between p-3 rounded-md glass-morphism"
                >
                  <span className="font-medium">{admin}</span>
                  {isEditing && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setAdminToRemove(admin);
                        setIsRemovingSuperior(true);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DataCard>

        <DataCard title="Inferior Admins" className="h-full">
          <div className="space-y-4">
            {isEditing && (
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter admin ID"
                  value={newInferiorAdmin}
                  onChange={(e) => setNewInferiorAdmin(e.target.value)}
                />
                <Button onClick={() => {
                  if (!newInferiorAdmin.trim()) return;
                  
                  const adminId = newInferiorAdmin.trim();
                  
                  if (editedConfig.inferior_admins.includes(adminId)) {
                    toast.error("This admin is already an inferior admin");
                    return;
                  }
                  
                  setEditedConfig({
                    ...editedConfig,
                    inferior_admins: [...editedConfig.inferior_admins, adminId]
                  });
                  
                  setNewInferiorAdmin("");
                  toast.success(`Added ${adminId} as inferior admin`);
                }}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            )}

            <div className="grid gap-3">
              {editedConfig.inferior_admins.map((admin) => (
                <div 
                  key={admin} 
                  className="flex items-center justify-between p-3 rounded-md glass-morphism"
                >
                  <span className="font-medium">{admin}</span>
                  {isEditing && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setAdminToRemove(admin);
                        setIsRemovingInferior(true);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DataCard>
      </div>

      {isEditing && (
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      )}

      {/* Remove Superior Admin Dialog */}
      <AlertDialog open={isRemovingSuperior} onOpenChange={setIsRemovingSuperior}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin {adminToRemove} from superior admins?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (adminToRemove === null) return;
              
              setEditedConfig({
                ...editedConfig,
                superior_admins: editedConfig.superior_admins.filter(id => id !== adminToRemove)
              });
              
              setIsRemovingSuperior(false);
              setAdminToRemove(null);
              toast.success(`Removed ${adminToRemove} from superior admins`);
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Inferior Admin Dialog */}
      <AlertDialog open={isRemovingInferior} onOpenChange={setIsRemovingInferior}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin {adminToRemove} from inferior admins?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (adminToRemove === null) return;
              
              setEditedConfig({
                ...editedConfig,
                inferior_admins: editedConfig.inferior_admins.filter(id => id !== adminToRemove)
              });
              
              setIsRemovingInferior(false);
              setAdminToRemove(null);
              toast.success(`Removed ${adminToRemove} from inferior admins`);
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
