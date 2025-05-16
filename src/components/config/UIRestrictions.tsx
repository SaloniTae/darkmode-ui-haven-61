
import { useState, useEffect } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Eye, EyeOff, User, Lock, UserCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAccessControl } from "@/context/AccessControlContext";

interface UIElement {
  id: string;
  name: string;
  path: string;
  type: "field" | "button" | "section";
}

interface UIRestriction {
  id?: string;
  element_id: string;
  restriction_type: "blur" | "hide" | "disable";
  user_ids: string[];
}

interface UserData {
  id: string;
  email: string;
  user_metadata?: {
    service?: string;
    username?: string;
  };
}

export function UIRestrictions() {
  const [elements, setElements] = useState<UIElement[]>([]);
  const [restrictions, setRestrictions] = useState<UIRestriction[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [restrictionType, setRestrictionType] = useState<"blur" | "hide" | "disable">("blur");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { refreshSettings } = useAccessControl();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch UI restrictions from Supabase
        const { data: restrictionsData, error: restrictionsError } = await supabase
          .from('ui_restrictions')
          .select('*');
        
        if (restrictionsError) {
          console.error("Error fetching UI restrictions:", restrictionsError);
          toast.error("Failed to load UI restrictions");
          return;
        }
        
        setRestrictions(restrictionsData || []);
        
        // Real Crunchyroll users
        const realUsers: UserData[] = [
          { id: "user1", email: "shivam1@gmail.com", user_metadata: { service: "crunchyroll", username: "shivam1" } },
          { id: "user2", email: "iyush777pvt@gmail.com", user_metadata: { service: "crunchyroll", username: "iyush777pvt" } }
        ];
        
        setUsers(realUsers);
        
        const demoElements = [
          { id: "email-field", name: "Email Field", path: "credentials/email", type: "field" as const },
          { id: "password-field", name: "Password Field", path: "credentials/password", type: "field" as const },
          { id: "add-credential-btn", name: "Add Credential Button", path: "credentials/add", type: "button" as const },
          { id: "edit-credential-btn", name: "Edit Credential Button", path: "credentials/edit", type: "button" as const },
          { id: "delete-credential-btn", name: "Delete Credential Button", path: "credentials/delete", type: "button" as const },
          { id: "add-slot-btn", name: "Add Slot Button", path: "slots/add", type: "button" as const },
          { id: "edit-slot-btn", name: "Edit Slot Button", path: "slots/edit", type: "button" as const },
          { id: "delete-slot-btn", name: "Delete Slot Button", path: "slots/delete", type: "button" as const },
          { id: "user-section", name: "User Management Section", path: "users", type: "section" as const },
        ];
        
        setElements(demoElements);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load UI restrictions data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addRestriction = async () => {
    if (!selectedElement || !restrictionType || !selectedUser) {
      toast.error("Please select all required fields");
      return;
    }

    try {
      setUpdating(true);
      
      // Check if this restriction already exists
      const existingRestriction = restrictions.find(
        r => r.element_id === selectedElement && r.restriction_type === restrictionType
      );
      
      if (existingRestriction) {
        // User already included in this restriction
        if (existingRestriction.user_ids.includes(selectedUser)) {
          toast.error("This restriction already exists for this user");
          setUpdating(false);
          return;
        }
        
        // Add the user to existing restriction
        const updatedUserIds = [...existingRestriction.user_ids, selectedUser];
        
        const { error } = await supabase
          .from('ui_restrictions')
          .update({ user_ids: updatedUserIds })
          .eq('id', existingRestriction.id);
          
        if (error) {
          console.error("Error updating restriction:", error);
          toast.error("Failed to update restriction");
          setUpdating(false);
          return;
        }
        
        // Update local state
        setRestrictions(prevRestrictions => 
          prevRestrictions.map(r => 
            r.id === existingRestriction.id 
              ? { ...r, user_ids: updatedUserIds } 
              : r
          )
        );
      } else {
        // Create a new restriction
        const newRestriction = {
          element_id: selectedElement,
          restriction_type: restrictionType,
          user_ids: [selectedUser]
        };
        
        const { data, error } = await supabase
          .from('ui_restrictions')
          .insert([newRestriction])
          .select();
          
        if (error) {
          console.error("Error adding restriction:", error);
          toast.error("Failed to add restriction");
          setUpdating(false);
          return;
        }
        
        // Update local state
        if (data && data.length > 0) {
          setRestrictions(prevRestrictions => [...prevRestrictions, data[0]]);
        }
      }
      
      // Refresh context
      await refreshSettings();
      
      toast.success("UI restriction added successfully");
    } catch (error) {
      console.error("Error adding UI restriction:", error);
      toast.error("Failed to add UI restriction");
    } finally {
      setUpdating(false);
    }
  };

  const removeRestriction = async (restrictionId: string | undefined, userId: string) => {
    if (!restrictionId) return;
    
    try {
      setUpdating(true);
      
      const restriction = restrictions.find(r => r.id === restrictionId);
      if (!restriction) return;
      
      // Remove the user from the userIds array
      const updatedUserIds = restriction.user_ids.filter(id => id !== userId);
      
      if (updatedUserIds.length === 0) {
        // If there are no more users, remove the restriction entirely
        const { error } = await supabase
          .from('ui_restrictions')
          .delete()
          .eq('id', restrictionId);
          
        if (error) {
          console.error("Error removing restriction:", error);
          toast.error("Failed to remove restriction");
          setUpdating(false);
          return;
        }
        
        // Update local state
        setRestrictions(prevRestrictions => 
          prevRestrictions.filter(r => r.id !== restrictionId)
        );
      } else {
        // Update the restriction with fewer users
        const { error } = await supabase
          .from('ui_restrictions')
          .update({ user_ids: updatedUserIds })
          .eq('id', restrictionId);
          
        if (error) {
          console.error("Error updating restriction:", error);
          toast.error("Failed to update restriction");
          setUpdating(false);
          return;
        }
        
        // Update local state
        setRestrictions(prevRestrictions => 
          prevRestrictions.map(r => 
            r.id === restrictionId 
              ? { ...r, user_ids: updatedUserIds } 
              : r
          )
        );
      }
      
      // Refresh context
      await refreshSettings();
      
      toast.success("UI restriction removed");
    } catch (error) {
      console.error("Error removing UI restriction:", error);
      toast.error("Failed to remove UI restriction");
    } finally {
      setUpdating(false);
    }
  };

  const getRestrictionIcon = (type: "blur" | "hide" | "disable") => {
    switch(type) {
      case "blur": return <EyeOff className="h-4 w-4" />;
      case "hide": return <Eye className="h-4 w-4" />;
      case "disable": return <Lock className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading UI restrictions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DataCard title="Create UI Restriction">
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="element-select">Select UI Element</Label>
              <Select 
                value={selectedElement || ""} 
                onValueChange={(value) => setSelectedElement(value)}
              >
                <SelectTrigger id="element-select">
                  <SelectValue placeholder="Select UI element" />
                </SelectTrigger>
                <SelectContent>
                  {elements.map((element) => (
                    <SelectItem key={element.id} value={element.id}>
                      {element.name} ({element.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restriction-type">Restriction Type</Label>
              <Select 
                value={restrictionType} 
                onValueChange={(value: "blur" | "hide" | "disable") => setRestrictionType(value)}
              >
                <SelectTrigger id="restriction-type">
                  <SelectValue placeholder="Select restriction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blur">Blur Element</SelectItem>
                  <SelectItem value="hide">Hide Element</SelectItem>
                  <SelectItem value="disable">Disable Element</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-select">Affected User</Label>
              <Select 
                value={selectedUser || ""} 
                onValueChange={(value) => setSelectedUser(value)}
              >
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.user_metadata?.username || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={addRestriction} 
            className="w-full mt-4"
            disabled={updating}
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Restriction...
              </>
            ) : (
              "Add Restriction"
            )}
          </Button>
        </div>
      </DataCard>

      <DataCard title="Active UI Restrictions" className="pb-4">
        <div className="space-y-4 py-2">
          {restrictions.length > 0 ? (
            restrictions.map((restriction) => {
              const element = elements.find(e => e.id === restriction.element_id);
              return (
                <Card key={`${restriction.id}`} className="glass-morphism">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        {element?.name || restriction.element_id}
                      </CardTitle>
                      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/20 text-xs">
                        {getRestrictionIcon(restriction.restriction_type)}
                        <span className="capitalize">{restriction.restriction_type}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Applied to users:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {restriction.user_ids.map(userId => {
                          const user = users.find(u => u.id === userId);
                          return (
                            <div 
                              key={userId}
                              className="flex items-center space-x-1 bg-primary/10 text-sm rounded-full px-3 py-1"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>{user?.user_metadata?.username || user?.email || userId}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-4 w-4 rounded-full hover:bg-destructive/20 ml-1"
                                onClick={() => removeRestriction(restriction.id, userId)}
                                disabled={updating}
                              >
                                {updating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <span className="sr-only">Remove</span>
                                )}
                                ×
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No UI restrictions configured
            </div>
          )}
        </div>
      </DataCard>
    </div>
  );
}
