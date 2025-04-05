import { useState } from "react";
import { Referral, ReferralSettings } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Save, Award, User, Users, Trash2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ConfirmationDialog } from "./ConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFirebaseService } from "@/hooks/useFirebaseService";

interface ReferralsPanelProps {
  referrals: { [key: string]: Referral };
  referralSettings: ReferralSettings;
  freeTrialClaims: { [key: string]: boolean };
  service: string;
}

export function ReferralsPanel({ referrals, referralSettings, freeTrialClaims, service }: ReferralsPanelProps) {
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editedSettings, setEditedSettings] = useState<ReferralSettings>({ ...referralSettings });
  const [searchTerm, setSearchTerm] = useState("");
  const [editingReferral, setEditingReferral] = useState<string | null>(null);
  const [editedReferral, setEditedReferral] = useState<Referral | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{open: boolean; userId: string}>({
    open: false,
    userId: ""
  });
  
  const { updateData, removeData } = useFirebaseService(service);

  const handleSaveSettings = async () => {
    try {
      await updateData("/referral_settings", editedSettings);
      toast.success("Referral settings updated successfully");
      setIsEditingSettings(false);
    } catch (error) {
      console.error("Error updating referral settings:", error);
      toast.error("Failed to update referral settings");
    }
  };

  const handleSettingChange = (field: keyof ReferralSettings, value: any) => {
    setEditedSettings({
      ...editedSettings,
      [field]: value
    });
  };

  const handleEditReferral = (userId: string, referral: Referral) => {
    setEditingReferral(userId);
    setEditedReferral({...referral});
  };

  const handleReferralChange = (field: keyof Referral, value: any) => {
    if (!editedReferral) return;
    
    setEditedReferral({
      ...editedReferral,
      [field]: value
    });
  };

  const handleSaveReferral = async () => {
    if (!editingReferral || !editedReferral) return;
    
    try {
      await updateData(`/referrals/${editingReferral}`, editedReferral);
      toast.success("Referral updated successfully");
      setEditingReferral(null);
      setEditedReferral(null);
    } catch (error) {
      console.error("Error updating referral:", error);
      toast.error("Failed to update referral");
    }
  };

  const handleDeleteReferral = async () => {
    try {
      await removeData(`/referrals/${deleteConfirmation.userId}`);
      toast.success("Referral deleted successfully");
    } catch (error) {
      console.error("Error deleting referral:", error);
      toast.error("Failed to delete referral");
      throw error;
    }
  };

  const filteredReferrals = Object.entries(referrals).filter(([userId, referral]) =>
    userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    referral.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedReferrals = filteredReferrals.sort((a, b) => 
    b[1].referral_points - a[1].referral_points
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Referral System</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DataCard title="Referral Settings" className="md:col-span-1">
          <div className="space-y-4">
            {isEditingSettings ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="free-trial-enabled"
                      checked={editedSettings.free_trial_enabled}
                      onCheckedChange={(checked) => handleSettingChange('free_trial_enabled', checked === true)}
                    />
                    <Label htmlFor="free-trial-enabled" className="text-sm font-medium">
                      Free Trial Enabled
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="buy-with-points"
                      checked={editedSettings.buy_with_points_enabled}
                      onCheckedChange={(checked) => handleSettingChange('buy_with_points_enabled', checked === true)}
                    />
                    <Label htmlFor="buy-with-points" className="text-sm font-medium">
                      Buy With Points Enabled
                    </Label>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="points-per-referral">Points Per Referral</Label>
                    <Input
                      id="points-per-referral"
                      type="number"
                      value={editedSettings.points_per_referral}
                      onChange={(e) => handleSettingChange('points_per_referral', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="required-points">Required Points</Label>
                    <Input
                      id="required-points"
                      type="number"
                      value={editedSettings.required_point}
                      onChange={(e) => handleSettingChange('required_point', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button variant="outline" onClick={() => {
                    setEditedSettings({ ...referralSettings });
                    setIsEditingSettings(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSettings}>
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${editedSettings.free_trial_enabled ? "bg-green-500" : "bg-red-500"}`}></div>
                      <span className="text-sm">Free Trial</span>
                    </div>
                    <span className="text-sm font-medium">{editedSettings.free_trial_enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${editedSettings.buy_with_points_enabled ? "bg-green-500" : "bg-red-500"}`}></div>
                      <span className="text-sm">Buy With Points</span>
                    </div>
                    <span className="text-sm font-medium">{editedSettings.buy_with_points_enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Points Per Referral</span>
                    <span className="text-sm font-medium">{editedSettings.points_per_referral}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Required Points</span>
                    <span className="text-sm font-medium">{editedSettings.required_point}</span>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => setIsEditingSettings(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Settings
                  </Button>
                </div>
              </>
            )}
          </div>
        </DataCard>
        
        <DataCard title="Free Trial Claims" className="md:col-span-2">
          <div className="space-y-4">
            <div className="overflow-auto" style={{ maxHeight: '200px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(freeTrialClaims).length > 0 ? (
                    Object.entries(freeTrialClaims).map(([userId, claimed]) => (
                      <TableRow key={userId}>
                        <TableCell>{userId}</TableCell>
                        <TableCell className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${claimed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                            {claimed ? "Claimed" : "Pending"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No free trial claims yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DataCard>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">User Referrals</h3>
          <div className="w-64">
            <Input
              placeholder="Search by User ID or Code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="glass-morphism rounded-lg overflow-hidden">
          <div className="overflow-auto" style={{ maxHeight: '400px' }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Referred Users</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReferrals.length > 0 ? (
                  sortedReferrals.map(([userId, referral]) => (
                    <TableRow key={userId}>
                      <TableCell className="font-medium">{userId}</TableCell>
                      <TableCell>{referral.referral_code}</TableCell>
                      <TableCell>
                        <span className="flex items-center">
                          <Award className="h-4 w-4 mr-1 text-yellow-500" />
                          {referral.referral_points}
                        </span>
                      </TableCell>
                      <TableCell>
                        {referral.referred_users ? (
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-blue-400" />
                            {referral.referred_users.length}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditReferral(userId, referral)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setDeleteConfirmation({open: true, userId})}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No referrals found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {editedReferral && (
        <Dialog open={!!editingReferral} onOpenChange={(open) => {
          if (!open) {
            setEditingReferral(null);
            setEditedReferral(null);
          }
        }}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Edit Referral</DialogTitle>
              <DialogDescription>
                Update the referral details for user ID: {editingReferral}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="referral-code">Referral Code</Label>
                <Input
                  id="referral-code"
                  value={editedReferral.referral_code}
                  onChange={(e) => handleReferralChange('referral_code', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referral-points">Referral Points</Label>
                <Input
                  id="referral-points"
                  type="number"
                  value={editedReferral.referral_points}
                  onChange={(e) => handleReferralChange('referral_points', parseInt(e.target.value))}
                />
              </div>
              
              {editedReferral.referred_users && (
                <div className="space-y-2">
                  <Label>Referred Users</Label>
                  <div className="bg-background/50 p-2 border rounded-md max-h-[150px] overflow-y-auto">
                    {editedReferral.referred_users.length > 0 ? (
                      <div className="space-y-1">
                        {editedReferral.referred_users.map((user, idx) => (
                          <div key={idx} className="flex items-center justify-between p-1.5 bg-background/80 rounded">
                            <span className="text-sm">{user}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const newUsers = [...editedReferral.referred_users as (string | number)[]];
                                newUsers.splice(idx, 1);
                                handleReferralChange('referred_users', newUsers);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">No referred users</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditingReferral(null);
                setEditedReferral(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveReferral}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <ConfirmationDialog 
        open={deleteConfirmation.open} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmation({...deleteConfirmation, open: false});
          }
        }}
        title="Delete Referral?"
        description={`This will permanently delete the referral for user ID: ${deleteConfirmation.userId}. This action cannot be undone.`}
        onConfirm={handleDeleteReferral}
      />
    </div>
  );
}
