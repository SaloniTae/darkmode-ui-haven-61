
import { useState, useEffect } from "react";
import { User, UserData, UserInfo } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, Lock, Unlock, UserCheck, UserX, Search } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UsersPanelProps {
  users: User;
  userData?: UserData;
  service: string;
}

export function UsersPanel({ users, userData = {}, service }: UsersPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editedUserData, setEditedUserData] = useState<UserData>({});
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    action: () => Promise<void>;
    title: string;
    description: string;
  }>({
    open: false,
    action: async () => {},
    title: "",
    description: ""
  });
  
  const { updateData, fetchData } = useFirebaseService(service);

  // Make sure userData exists and has a safe default
  useEffect(() => {
    if (userData) {
      setEditedUserData(userData);
    }
  }, [userData]);

  // Fetch userData if not provided
  useEffect(() => {
    const loadUserData = async () => {
      if (Object.keys(editedUserData).length === 0) {
        try {
          const data = await fetchData("/userData");
          if (data) {
            setEditedUserData(data);
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      }
    };
    
    loadUserData();
  }, [fetchData]);

  const handleEditUser = (userId: string) => {
    setEditingUser(userId);
  };

  const handleSaveUser = async (userId: string) => {
    try {
      if (!editedUserData[userId]) {
        // Create default userData if it doesn't exist
        editedUserData[userId] = { locked: 0, verified: 0 };
      }
      
      await updateData(`/userData/${userId}`, editedUserData[userId]);
      toast.success(`User ${userId} updated successfully`);
      setEditingUser(null);
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      toast.error(`Failed to update user ${userId}`);
    }
  };

  const handleInputChange = (userId: string, field: string, value: any) => {
    setEditedUserData({
      ...editedUserData,
      [userId]: {
        ...editedUserData[userId],
        [field]: value
      }
    });
  };

  const handleToggleLock = async (userId: string) => {
    // Make sure the user data exists
    if (!editedUserData[userId]) {
      // Initialize user data if it doesn't exist
      editedUserData[userId] = { locked: 0, verified: 0 };
    }
    
    const currentLockState = editedUserData[userId].locked || 0; // Default to 0 if undefined
    const newLockState = currentLockState === 0 ? 1 : 0;
    
    setConfirmAction({
      open: true,
      action: async () => {
        try {
          await updateData(`/userData/${userId}`, {
            ...editedUserData[userId],
            locked: newLockState
          });
          
          setEditedUserData({
            ...editedUserData,
            [userId]: {
              ...editedUserData[userId],
              locked: newLockState
            }
          });
          
          toast.success(`User ${userId} ${newLockState === 1 ? 'locked' : 'unlocked'} successfully`);
        } catch (error) {
          console.error(`Error toggling lock state for user ${userId}:`, error);
          toast.error(`Failed to ${newLockState === 1 ? 'lock' : 'unlock'} user ${userId}`);
        }
      },
      title: `${currentLockState === 0 ? 'Lock' : 'Unlock'} User`,
      description: `Are you sure you want to ${currentLockState === 0 ? 'lock' : 'unlock'} user ${userId}?`
    });
  };

  const handleToggleVerification = async (userId: string) => {
    // Make sure the user data exists
    if (!editedUserData[userId]) {
      // Initialize user data if it doesn't exist
      editedUserData[userId] = { locked: 0, verified: 0 };
    }
    
    const currentVerificationState = editedUserData[userId].verified || 0; // Default to 0 if undefined
    const newVerificationState = currentVerificationState === 0 ? 1 : 0;
    
    setConfirmAction({
      open: true,
      action: async () => {
        try {
          await updateData(`/userData/${userId}`, {
            ...editedUserData[userId],
            verified: newVerificationState
          });
          
          setEditedUserData({
            ...editedUserData,
            [userId]: {
              ...editedUserData[userId],
              verified: newVerificationState
            }
          });
          
          toast.success(`User ${userId} ${newVerificationState === 1 ? 'verified' : 'unverified'} successfully`);
        } catch (error) {
          console.error(`Error toggling verification state for user ${userId}:`, error);
          toast.error(`Failed to ${newVerificationState === 1 ? 'verify' : 'unverify'} user ${userId}`);
        }
      },
      title: `${currentVerificationState === 0 ? 'Verify' : 'Unverify'} User`,
      description: `Are you sure you want to ${currentVerificationState === 0 ? 'verify' : 'unverify'} user ${userId}?`
    });
  };

  const filteredUsers = Object.entries(users || {}).filter(([userId, user]) => {
    const userInfo = user as UserInfo;
    return userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (userInfo.email && typeof userInfo.email === 'string' && userInfo.email.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <DataCard title="Users" className="w-full">
        <div className="rounded-md border">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary z-10">
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(([userId, user]) => {
                    const userInfo = user as UserInfo;
                    // Make sure userData and user-specific data exists
                    const userSpecificData = editedUserData?.[userId] || { locked: 0, verified: 0 };
                    const isEditing = editingUser === userId;
                    
                    return (
                      <TableRow key={userId}>
                        <TableCell className="font-medium">{userId}</TableCell>
                        <TableCell>{userInfo.email || 'No email'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Badge variant={userSpecificData.locked === 1 ? "destructive" : "outline"}>
                              {userSpecificData.locked === 1 ? "Locked" : "Unlocked"}
                            </Badge>
                            <Badge variant={userSpecificData.verified === 1 ? "success" : "secondary"}>
                              {userSpecificData.verified === 1 ? "Verified" : "Unverified"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant={userSpecificData.locked === 1 ? "outline" : "destructive"} 
                              size="sm"
                              onClick={() => handleToggleLock(userId)}
                            >
                              {userSpecificData.locked === 1 ? (
                                <><Unlock className="mr-2 h-4 w-4" /> Unlock</>
                              ) : (
                                <><Lock className="mr-2 h-4 w-4" /> Lock</>
                              )}
                            </Button>
                            <Button 
                              variant={userSpecificData.verified === 1 ? "destructive" : "outline"} 
                              size="sm"
                              onClick={() => handleToggleVerification(userId)}
                            >
                              {userSpecificData.verified === 1 ? (
                                <><UserX className="mr-2 h-4 w-4" /> Unverify</>
                              ) : (
                                <><UserCheck className="mr-2 h-4 w-4" /> Verify</>
                              )}
                            </Button>
                            {isEditing ? (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleSaveUser(userId)}
                              >
                                <Save className="mr-2 h-4 w-4" /> Save
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditUser(userId)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DataCard>
      
      <ConfirmationDialog 
        open={confirmAction.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction({...confirmAction, open: false});
          }
        }}
        title={confirmAction.title}
        description={confirmAction.description}
        onConfirm={confirmAction.action}
      />
    </div>
  );
}
