import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { DataCard } from "@/components/ui/DataCard";
import { Switch } from "@/components/ui/switch";
import { Shield, ShieldOff, UserPlus, Loader2 } from "lucide-react";
import { useAccessControl } from "@/context/AccessControlContext";
import { User } from "@supabase/supabase-js";

interface UserSettings {
  id?: string;
  user_id: string;
  can_modify: boolean;
  restricted_tabs: string[];
  username: string;
  service: string;
}

// Define a proper type for the users
interface UserData {
  id: string;
  email: string;
  user_metadata?: {
    service?: string;
    username?: string;
  };
}

export function UserAccessControl() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings[]>([]);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const { refreshSettings } = useAccessControl();

  // Load users and settings from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch settings from Supabase
        const { data: settingsData, error: settingsError } = await supabase
          .from('admin_access_settings')
          .select('*');
        
        if (settingsError) {
          console.error("Error fetching settings:", settingsError);
          toast.error("Failed to load user settings");
          return;
        }
        
        setUserSettings(settingsData || []);
        
        // Real Crunchyroll users from Supabase
        const realUsers: UserData[] = [
          { id: "user1", email: "shivam1@gmail.com", user_metadata: { service: "crunchyroll", username: "shivam1" } },
          { id: "user2", email: "iyush777pvt@gmail.com", user_metadata: { service: "crunchyroll", username: "iyush777pvt" } }
        ];
        
        setUsers(realUsers);
        
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load user data");
        
        // Fallback to hardcoded real users
        const realUsers: UserData[] = [
          { id: "user1", email: "shivam1@gmail.com", user_metadata: { service: "crunchyroll", username: "shivam1" } },
          { id: "user2", email: "iyush777pvt@gmail.com", user_metadata: { service: "crunchyroll", username: "iyush777pvt" } }
        ];
        
        setUsers(realUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Initialize settings for users who don't have them yet
  useEffect(() => {
    const initializeUserSettings = async () => {
      if (users.length === 0 || userSettings.length === 0) return;
      
      const usersWithoutSettings = users.filter(user => 
        !userSettings.some(setting => setting.user_id === user.id)
      );
      
      if (usersWithoutSettings.length > 0) {
        const newSettings = usersWithoutSettings.map(user => ({
          user_id: user.id,
          can_modify: true,
          restricted_tabs: [],
          username: user.user_metadata?.username || user.email,
          service: user.user_metadata?.service || "crunchyroll"
        }));
        
        if (newSettings.length > 0) {
          try {
            const { error } = await supabase
              .from('admin_access_settings')
              .insert(newSettings);
              
            if (error) {
              console.error("Error adding new user settings:", error);
              toast.error("Failed to initialize user settings");
            } else {
              // Refresh settings
              const { data: refreshedData } = await supabase
                .from('admin_access_settings')
                .select('*');
                
              setUserSettings(refreshedData || []);
            }
          } catch (error) {
            console.error("Error initializing settings:", error);
          }
        }
      }
    };
    
    initializeUserSettings();
  }, [users, userSettings]);
  
  const getUserSettings = (userId: string): UserSettings | null => {
    return userSettings.find(setting => setting.user_id === userId) || null;
  };

  const handleUserSearch = () => {
    const foundUser = users.find(
      user => 
        user.email.toLowerCase().includes(username.toLowerCase()) || 
        (user.user_metadata?.username && user.user_metadata.username.toLowerCase().includes(username.toLowerCase()))
    );

    if (foundUser) {
      setSelectedUser(foundUser.id);
      toast.success(`User found: ${foundUser.email}`);
    } else {
      toast.error("User not found");
    }
  };

  const toggleUserAccess = async (userId: string, canModify: boolean) => {
    try {
      setUpdatingSettings(true);
      
      const currentSettings = getUserSettings(userId);
      if (!currentSettings) return;
      
      const { error } = await supabase
        .from('admin_access_settings')
        .update({ can_modify: canModify })
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error updating user access:", error);
        toast.error("Failed to update user access");
        return;
      }
      
      // Update local state
      setUserSettings(prevSettings => 
        prevSettings.map(setting => 
          setting.user_id === userId 
            ? { ...setting, can_modify: canModify } 
            : setting
        )
      );
      
      // Refresh context
      await refreshSettings();
      
      toast.success(`User access ${canModify ? "enabled" : "restricted"}`);
    } catch (error) {
      console.error("Error toggling user access:", error);
      toast.error("Failed to update user access");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const toggleTabRestriction = async (userId: string, tabName: string) => {
    try {
      setUpdatingSettings(true);
      
      const currentSettings = getUserSettings(userId);
      if (!currentSettings) return;
      
      let restrictedTabs = [...currentSettings.restricted_tabs];
      
      if (restrictedTabs.includes(tabName)) {
        restrictedTabs = restrictedTabs.filter(tab => tab !== tabName);
      } else {
        restrictedTabs.push(tabName);
      }
      
      const { error } = await supabase
        .from('admin_access_settings')
        .update({ restricted_tabs: restrictedTabs })
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error updating tab restrictions:", error);
        toast.error("Failed to update tab access");
        return;
      }
      
      // Update local state
      setUserSettings(prevSettings => 
        prevSettings.map(setting => 
          setting.user_id === userId 
            ? { ...setting, restricted_tabs: restrictedTabs } 
            : setting
        )
      );
      
      // Refresh context
      await refreshSettings();
      
      toast.success(`Tab access updated for user`);
    } catch (error) {
      console.error("Error toggling tab restriction:", error);
      toast.error("Failed to update tab access");
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Available tabs by service - updated to include admin and uiconfig for netflix and prime
  const serviceTabOptions: Record<string, string[]> = {
    crunchyroll: ["tokens", "admin", "credentials", "slots", "referrals", "transactions", "status", "uiconfig", "users"],
    netflix: ["admin", "credentials", "slots", "referrals", "transactions", "status", "uiconfig", "users"],
    prime: ["admin", "credentials", "slots", "refer rals", "transactions", "status", "uiconfig", "users"]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading user data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DataCard title="Find User" className="pb-4">
        <div className="flex space-x-2 mt-2 mb-4">
          <Input 
            placeholder="Search by username or email" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleUserSearch}>
            Search
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {users.map(user => {
            const settings = getUserSettings(user.id);
            return (
              <Card 
                key={user.id} 
                className={`glass-morphism transition-all cursor-pointer ${selectedUser === user.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedUser(user.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{user.user_metadata?.username || user.email.split('@')[0]}</CardTitle>
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20">
                      {user.user_metadata?.service || "crunchyroll"}
                    </div>
                  </div>
                  <CardDescription className="text-xs">{user.email}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </DataCard>

      {selectedUser && getUserSettings(selectedUser) && (
        <DataCard title="User Access Configuration">
          <div className="space-y-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Write Access</h3>
                <p className="text-sm text-muted-foreground">Toggle to restrict user to read-only mode</p>
              </div>
              {updatingSettings ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Switch 
                  checked={getUserSettings(selectedUser)?.can_modify || false}
                  onCheckedChange={(value) => toggleUserAccess(selectedUser, value)}
                  className="data-[state=checked]:bg-green-500"
                />
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tab Access Restrictions</h3>
              <p className="text-sm text-muted-foreground">Select tabs to restrict access for this user</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getUserSettings(selectedUser) && serviceTabOptions[getUserSettings(selectedUser)?.service || 'crunchyroll']?.map(tab => (
                  <div 
                    key={tab}
                    className={`p-3 border rounded-md cursor-pointer flex items-center justify-between transition-all ${
                      getUserSettings(selectedUser)?.restricted_tabs.includes(tab) 
                        ? 'bg-red-500/20 border-red-500/50' 
                        : 'bg-transparent border-white/10 hover:bg-white/5'
                    }`}
                    onClick={() => toggleTabRestriction(selectedUser, tab)}
                  >
                    <span className="capitalize">{tab}</span>
                    {updatingSettings ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : getUserSettings(selectedUser)?.restricted_tabs.includes(tab) ? (
                      <ShieldOff className="h-4 w-4" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DataCard>
      )}
    </div>
  );
}
