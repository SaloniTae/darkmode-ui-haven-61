
import { useState, useEffect } from "react";
import { Credential, Slots } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, Plus, Trash2, Eye, EyeOff, Calendar, Users, Lock, Unlock } from "lucide-react";
import { updateData } from "@/lib/firebaseService";
import { updatePrimeData } from "@/lib/firebaseService";
import { updateNetflixData } from "@/lib/firebaseService";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

interface CredentialsPanelProps {
  credentials: { [key: string]: Credential };
  slots: Slots;
  service: string;
}

export function CredentialsPanel({ credentials, slots, service }: CredentialsPanelProps) {
  const [editedCredentials, setEditedCredentials] = useState<{ [key: string]: Credential }>({ ...credentials });
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [newCredentialName, setNewCredentialName] = useState("");
  const location = useLocation();

  // Update edited credentials when credentials prop changes
  useEffect(() => {
    setEditedCredentials({ ...credentials });
  }, [credentials]);

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
      
      // Update each credential individually
      for (const [key, credential] of Object.entries(editedCredentials)) {
        await updateFn(`/${key}`, credential);
      }
      
      toast.success("Credentials updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating credentials:", error);
      toast.error("Failed to update credentials");
    }
  };

  const handleCredentialChange = (credKey: string, field: keyof Credential, value: any) => {
    setEditedCredentials({
      ...editedCredentials,
      [credKey]: {
        ...editedCredentials[credKey],
        [field]: value
      }
    });
  };

  const togglePasswordVisibility = (credKey: string) => {
    setShowPasswords({
      ...showPasswords,
      [credKey]: !showPasswords[credKey]
    });
  };

  const addNewCredential = async () => {
    if (!newCredentialName.trim()) {
      toast.error("Please enter a credential name");
      return;
    }

    const credKey = newCredentialName.toLowerCase().replace(/\s+/g, '_');
    
    if (editedCredentials[credKey]) {
      toast.error("Credential with this name already exists");
      return;
    }

    const newCredential: Credential = {
      belongs_to_slot: "",
      email: "",
      password: "",
      expiry_date: "",
      locked: 0,
      max_usage: 0,
      usage_count: 0
    };

    try {
      const updateFn = getUpdateFunction();
      await updateFn(`/${credKey}`, newCredential);
      
      setEditedCredentials({
        ...editedCredentials,
        [credKey]: newCredential
      });
      
      setNewCredentialName("");
      toast.success("New credential added successfully");
    } catch (error) {
      console.error("Error adding new credential:", error);
      toast.error("Failed to add new credential");
    }
  };

  const removeCredential = async (credKey: string) => {
    try {
      const updateFn = getUpdateFunction();
      await updateFn(`/${credKey}`, null);
      
      const { [credKey]: removed, ...remaining } = editedCredentials;
      setEditedCredentials(remaining);
      
      toast.success("Credential removed successfully");
    } catch (error) {
      console.error("Error removing credential:", error);
      toast.error("Failed to remove credential");
    }
  };

  const getStatusColor = (credential: Credential) => {
    if (credential.locked === 1) return "bg-red-500";
    if (credential.usage_count >= credential.max_usage && credential.max_usage > 0) return "bg-orange-500";
    return "bg-green-500";
  };

  const getStatusText = (credential: Credential) => {
    if (credential.locked === 1) return "Locked";
    if (credential.usage_count >= credential.max_usage && credential.max_usage > 0) return "Max Usage Reached";
    return "Active";
  };

  const slotOptions = [
    { value: "all", label: "All Slots" },
    { value: "none", label: "None" },
    ...Object.keys(slots).map(slotKey => ({
      value: slotKey,
      label: slots[slotKey].name || slotKey
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Credentials Management</h2>
        <div className="flex gap-2">
          {isEditing && (
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          )}
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => {
              if (isEditing) {
                setEditedCredentials({ ...credentials });
              }
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? "Cancel" : <><Edit className="mr-2 h-4 w-4" /> Edit</>}
          </Button>
        </div>
      </div>

      {/* Add New Credential */}
      {isEditing && (
        <DataCard title="Add New Credential">
          <div className="flex gap-2">
            <Input
              placeholder="Enter credential name (e.g., cred5, premium_account)"
              value={newCredentialName}
              onChange={(e) => setNewCredentialName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addNewCredential}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
        </DataCard>
      )}

      {/* Credentials List */}
      <div className="grid gap-6">
        {Object.entries(editedCredentials).map(([credKey, credential]) => (
          <DataCard key={credKey} title={`Credential: ${credKey}`} className="relative">
            {/* Status Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(credential)}`} />
                {getStatusText(credential)}
              </Badge>
              {isEditing && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeCredential(credKey)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {/* Slot Assignment */}
              <div className="space-y-2">
                <Label htmlFor={`${credKey}-slot`}>Assigned Slot</Label>
                {isEditing ? (
                  <Select
                    value={credential.belongs_to_slot}
                    onValueChange={(value) => handleCredentialChange(credKey, 'belongs_to_slot', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {slotOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {credential.belongs_to_slot || "Not assigned"}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor={`${credKey}-email`}>Email</Label>
                {isEditing ? (
                  <Input
                    id={`${credKey}-email`}
                    value={credential.email}
                    onChange={(e) => handleCredentialChange(credKey, 'email', e.target.value)}
                    placeholder="Enter email"
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {credential.email || "Not set"}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor={`${credKey}-password`}>Password</Label>
                <div className="relative">
                  {isEditing ? (
                    <Input
                      id={`${credKey}-password`}
                      type={showPasswords[credKey] ? "text" : "password"}
                      value={credential.password}
                      onChange={(e) => handleCredentialChange(credKey, 'password', e.target.value)}
                      placeholder="Enter password"
                    />
                  ) : (
                    <div className="text-sm p-2 bg-muted rounded">
                      {showPasswords[credKey] 
                        ? (credential.password || "Not set")
                        : "••••••••"
                      }
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => togglePasswordVisibility(credKey)}
                  >
                    {showPasswords[credKey] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor={`${credKey}-expiry`} className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expiry Date
                </Label>
                {isEditing ? (
                  <Input
                    id={`${credKey}-expiry`}
                    value={credential.expiry_date}
                    onChange={(e) => handleCredentialChange(credKey, 'expiry_date', e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {credential.expiry_date || "Not set"}
                  </div>
                )}
              </div>

              {/* Usage Stats */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Usage Count
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={credential.usage_count}
                    onChange={(e) => handleCredentialChange(credKey, 'usage_count', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {credential.usage_count} / {credential.max_usage || "∞"}
                  </div>
                )}
              </div>

              {/* Max Usage */}
              <div className="space-y-2">
                <Label htmlFor={`${credKey}-max-usage`}>Max Usage</Label>
                {isEditing ? (
                  <Input
                    id={`${credKey}-max-usage`}
                    type="number"
                    value={credential.max_usage}
                    onChange={(e) => handleCredentialChange(credKey, 'max_usage', parseInt(e.target.value) || 0)}
                    min="0"
                    placeholder="0 = unlimited"
                  />
                ) : (
                  <div className="text-sm p-2 bg-muted rounded">
                    {credential.max_usage || "Unlimited"}
                  </div>
                )}
              </div>

              {/* Lock Status */}
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label className="flex items-center gap-1">
                  {credential.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  Lock Status
                </Label>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Switch
                      checked={credential.locked === 1}
                      onCheckedChange={(checked) => handleCredentialChange(credKey, 'locked', checked ? 1 : 0)}
                    />
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${credential.locked ? 'bg-red-500' : 'bg-green-500'}`} />
                  )}
                  <span className="text-sm">
                    {credential.locked ? "Locked" : "Unlocked"}
                  </span>
                </div>
              </div>
            </div>
          </DataCard>
        ))}
      </div>

      {Object.keys(editedCredentials).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No credentials found.</p>
          {isEditing && (
            <p className="mt-2">Add your first credential using the form above.</p>
          )}
        </div>
      )}
    </div>
  );
}
