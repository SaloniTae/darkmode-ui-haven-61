
import { useState } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminRemoveDialog } from "./AdminRemoveDialog";

interface AdminListSectionProps {
  title: string;
  adminList: string[];
  isEditing: boolean;
  onAddAdmin: (admin: string) => boolean;
  onRemoveAdmin: (admin: string) => void;
  adminType: "superior" | "inferior";
}

export function AdminListSection({
  title,
  adminList,
  isEditing,
  onAddAdmin,
  onRemoveAdmin,
  adminType
}: AdminListSectionProps) {
  const [newAdmin, setNewAdmin] = useState("");
  const [isRemovingAdmin, setIsRemovingAdmin] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null);

  const handleAddAdmin = () => {
    if (!newAdmin.trim()) return;
    
    const adminId = newAdmin.trim();
    
    if (adminList.includes(adminId)) {
      toast.error(`This admin is already a ${adminType} admin`);
      return;
    }
    
    const success = onAddAdmin(adminId);
    
    if (success) {
      setNewAdmin("");
      toast.success(`Added ${adminId} as ${adminType} admin`);
    }
  };

  const confirmRemoveAdmin = (adminId: string) => {
    setAdminToRemove(adminId);
    setIsRemovingAdmin(true);
  };

  const handleRemoveAdmin = () => {
    if (adminToRemove === null) return;
    
    onRemoveAdmin(adminToRemove);
    
    setIsRemovingAdmin(false);
    setAdminToRemove(null);
    toast.success(`Removed ${adminToRemove} from ${adminType} admins`);
  };

  return (
    <DataCard title={title} className="h-full">
      <div className="space-y-4">
        {isEditing && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter admin ID"
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
            />
            <Button onClick={handleAddAdmin}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </div>
        )}

        <div className="grid gap-3">
          {adminList && adminList.length > 0 ? (
            adminList.map((admin) => (
              <div 
                key={admin} 
                className="flex items-center justify-between p-3 rounded-md glass-morphism"
              >
                <span className="font-medium">{admin}</span>
                {isEditing && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => confirmRemoveAdmin(admin)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              No {adminType} admins configured
            </p>
          )}
        </div>
      </div>

      <AdminRemoveDialog
        open={isRemovingAdmin}
        onOpenChange={setIsRemovingAdmin}
        adminToRemove={adminToRemove}
        adminType={adminType}
        onConfirm={handleRemoveAdmin}
      />
    </DataCard>
  );
}
