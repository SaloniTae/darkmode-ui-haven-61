
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
import { Shield, ShieldOff, UserPlus } from "lucide-react";

interface UserAccessSettings {
  [userId: string]: {
    canModify: boolean;
    restrictedTabs: string[];
    username: string;
    service: string;
  };
}

export function UserAccessControl() {
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [accessSettings, setAccessSettings] = useState<UserAccessSettings>({});

  // Load users from Supabase auth
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // First, try to get access settings from localStorage
        const savedSettings = localStorage.getItem("admin_access_settings");
        if (savedSettings) {
          setAccessSettings(JSON.parse(savedSettings));
        }

        // For demo purposes, we'll load data from localStorage
        // In a real app, this would come from Supabase
        const demoUsers = [
          { id: "user1", email: "admin@crunchyroll.com", user_metadata: { service: "crunchyroll", username: "admin" } },
          { id: "user2", email: "manager@netflix.com", user_metadata: { service: "netflix", username: "manager" } },
          { id: "user3", email: "staff@prime.com", user_metadata: { service: "prime", username: "staff" } }
        ];
        
        setUsers(demoUsers);
        
        // Initialize access settings for any new users
        let updatedSettings = { ...accessSettings };
        demoUsers.forEach(user => {
          if (!updatedSettings[user.id]) {
            updatedSettings[user.id] = {
              canModify: true,
              restrictedTabs: [],
              username: user.user_metadata?.username || user.email,
              service: user.user_metadata?.service || "unknown"
            };
          }
        });
        
        setAccessSettings(updatedSettings);
        localStorage.setItem("admin_access_settings", JSON.stringify(updatedSettings));
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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

  const toggleUserAccess = (userId: string, canModify: boolean) => {
    const updatedSettings = { 
      ...accessSettings,
      [userId]: {
        ...accessSettings[userId],
        canModify
      }
    };
    setAccessSettings(updatedSettings);
    localStorage.setItem("admin_access_settings", JSON.stringify(updatedSettings));
    toast.success(`User access ${canModify ? "enabled" : "restricted"}`);
  };

  const toggleTabRestriction = (userId: string, tabName: string) => {
    const userSettings = accessSettings[userId];
    let restrictedTabs = [...userSettings.restrictedTabs];
    
    if (restrictedTabs.includes(tabName)) {
      restrictedTabs = restrictedTabs.filter(tab => tab !== tabName);
    } else {
      restrictedTabs.push(tabName);
    }
    
    const updatedSettings = {
      ...accessSettings,
      [userId]: {
        ...userSettings,
        restrictedTabs
      }
    };
    
    setAccessSettings(updatedSettings);
    localStorage.setItem("admin_access_settings", JSON.stringify(updatedSettings));
    toast.success(`Tab access updated for user`);
  };

  // Available tabs by service
  const serviceTabOptions: Record<string, string[]> = {
    crunchyroll: ["tokens", "admin", "credentials", "slots", "referrals", "transactions", "status", "uiconfig", "users"],
    netflix: ["credentials", "slots", "transactions", "status", "users"],
    prime: ["credentials", "slots", "transactions", "status", "users"]
  };

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
          {users.map(user => (
            <Card 
              key={user.id} 
              className={`glass-morphism transition-all cursor-pointer ${selectedUser === user.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedUser(user.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{user.user_metadata?.username || user.email.split('@')[0]}</CardTitle>
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20">
                    {user.user_metadata?.service || "no service"}
                  </div>
                </div>
                <CardDescription className="text-xs">{user.email}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </DataCard>

      {selectedUser && accessSettings[selectedUser] && (
        <DataCard title="User Access Configuration">
          <div className="space-y-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Write Access</h3>
                <p className="text-sm text-muted-foreground">Toggle to restrict user to read-only mode</p>
              </div>
              <Switch 
                checked={accessSettings[selectedUser].canModify}
                onCheckedChange={(value) => toggleUserAccess(selectedUser, value)}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tab Access Restrictions</h3>
              <p className="text-sm text-muted-foreground">Select tabs to restrict access for this user</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {serviceTabOptions[accessSettings[selectedUser].service || 'crunchyroll']?.map(tab => (
                  <div 
                    key={tab}
                    className={`p-3 border rounded-md cursor-pointer flex items-center justify-between transition-all ${
                      accessSettings[selectedUser].restrictedTabs.includes(tab) 
                        ? 'bg-red-500/20 border-red-500/50' 
                        : 'bg-transparent border-white/10 hover:bg-white/5'
                    }`}
                    onClick={() => toggleTabRestriction(selectedUser, tab)}
                  >
                    <span className="capitalize">{tab}</span>
                    {accessSettings[selectedUser].restrictedTabs.includes(tab) ? (
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
