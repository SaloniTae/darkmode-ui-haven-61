
import { useState, useEffect } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Eye, EyeOff, User, Lock, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UIElement {
  id: string;
  name: string;
  path: string;
  type: "field" | "button" | "section";
}

interface UIRestriction {
  elementId: string;
  type: "blur" | "hide" | "disable";
  userIds: string[];
}

export function UIRestrictions() {
  const [elements, setElements] = useState<UIElement[]>([]);
  const [restrictions, setRestrictions] = useState<UIRestriction[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [restrictionType, setRestrictionType] = useState<"blur" | "hide" | "disable">("blur");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  useEffect(() => {
    // Demo data
    const demoUsers = [
      { id: "user1", email: "admin@crunchyroll.com", user_metadata: { service: "crunchyroll", username: "admin" } },
      { id: "user2", email: "manager@netflix.com", user_metadata: { service: "netflix", username: "manager" } },
      { id: "user3", email: "staff@prime.com", user_metadata: { service: "prime", username: "staff" } }
    ];
    
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
    
    setUsers(demoUsers);
    setElements(demoElements);

    // Load saved restrictions from localStorage
    const savedRestrictions = localStorage.getItem("ui_restrictions");
    if (savedRestrictions) {
      setRestrictions(JSON.parse(savedRestrictions));
    }
  }, []);

  const addRestriction = () => {
    if (!selectedElement || !restrictionType || !selectedUser) {
      toast.error("Please select all required fields");
      return;
    }

    // Check if this restriction already exists
    const existingIndex = restrictions.findIndex(
      r => r.elementId === selectedElement && r.type === restrictionType && r.userIds.includes(selectedUser)
    );

    if (existingIndex >= 0) {
      toast.error("This restriction already exists");
      return;
    }

    // Check if there's a restriction of the same type for this element
    const sameTypeIndex = restrictions.findIndex(
      r => r.elementId === selectedElement && r.type === restrictionType
    );

    let updatedRestrictions;
    
    if (sameTypeIndex >= 0) {
      // Add the user to the existing restriction
      updatedRestrictions = [...restrictions];
      updatedRestrictions[sameTypeIndex] = {
        ...updatedRestrictions[sameTypeIndex],
        userIds: [...updatedRestrictions[sameTypeIndex].userIds, selectedUser]
      };
    } else {
      // Create a new restriction
      updatedRestrictions = [
        ...restrictions, 
        {
          elementId: selectedElement,
          type: restrictionType,
          userIds: [selectedUser]
        }
      ];
    }

    setRestrictions(updatedRestrictions);
    localStorage.setItem("ui_restrictions", JSON.stringify(updatedRestrictions));
    toast.success("UI restriction added successfully");
  };

  const removeRestriction = (elementId: string, type: "blur" | "hide" | "disable", userId: string) => {
    const restrictionIndex = restrictions.findIndex(
      r => r.elementId === elementId && r.type === type
    );

    if (restrictionIndex === -1) return;

    const updatedRestrictions = [...restrictions];
    
    // Remove the user from the userIds array
    updatedRestrictions[restrictionIndex] = {
      ...updatedRestrictions[restrictionIndex],
      userIds: updatedRestrictions[restrictionIndex].userIds.filter(id => id !== userId)
    };

    // If there are no more users, remove the restriction entirely
    if (updatedRestrictions[restrictionIndex].userIds.length === 0) {
      updatedRestrictions.splice(restrictionIndex, 1);
    }

    setRestrictions(updatedRestrictions);
    localStorage.setItem("ui_restrictions", JSON.stringify(updatedRestrictions));
    toast.success("UI restriction removed");
  };

  const getRestrictionIcon = (type: "blur" | "hide" | "disable") => {
    switch(type) {
      case "blur": return <EyeOff className="h-4 w-4" />;
      case "hide": return <Eye className="h-4 w-4" />;
      case "disable": return <Lock className="h-4 w-4" />;
      default: return null;
    }
  };

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

          <Button onClick={addRestriction} className="w-full mt-4">
            Add Restriction
          </Button>
        </div>
      </DataCard>

      <DataCard title="Active UI Restrictions" className="pb-4">
        <div className="space-y-4 py-2">
          {restrictions.length > 0 ? (
            restrictions.map((restriction) => {
              const element = elements.find(e => e.id === restriction.elementId);
              return (
                <Card key={`${restriction.elementId}-${restriction.type}`} className="glass-morphism">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        {element?.name || restriction.elementId}
                      </CardTitle>
                      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/20 text-xs">
                        {getRestrictionIcon(restriction.type)}
                        <span className="capitalize">{restriction.type}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Applied to users:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {restriction.userIds.map(userId => {
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
                                onClick={() => removeRestriction(restriction.elementId, restriction.type, userId)}
                              >
                                <span className="sr-only">Remove</span>
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
