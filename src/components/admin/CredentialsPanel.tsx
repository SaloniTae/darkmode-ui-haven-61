import { useState, useEffect } from "react";
import { Slots } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Edit, Save, Lock, Unlock, Check, X, CalendarIcon, PlusCircle, Trash, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { getRandomPassword } from "@/data/passwordList";

interface Credential {
  belongs_to_slot: string;
  email: string;
  password: string;
  secret?: string;
  expiry_date: string;
  locked: number;
  max_usage: number;
  usage_count: number;
}

interface CredentialsPanelProps {
  credentials: {
    cred1?: Credential;
    cred2?: Credential;
    cred3?: Credential;
    cred4?: Credential;
    [key: string]: Credential | undefined;
  };
  slots: Slots;
  service: string;
}

export function CredentialsPanel({ credentials, slots, service }: CredentialsPanelProps) {
  const [currentCredentials, setCurrentCredentials] = useState(credentials || {});
  const [editingCredential, setEditingCredential] = useState<string | null>(null);
  const [editedCredentials, setEditedCredentials] = useState(credentials || {});
  const [confirmationDialog, setConfirmationDialog] = useState<{open: boolean; action: () => Promise<void>; title: string; description: string}>({
    open: false,
    action: async () => {},
    title: "",
    description: ""
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const [newCredential, setNewCredential] = useState<Credential>({
    belongs_to_slot: "",
    email: "",
    password: "",
    secret: "",    
    expiry_date: format(new Date(), 'yyyy-MM-dd'),
    locked: 0,
    max_usage: 4,
    usage_count: 0
  });
  const [newCredentialKey, setNewCredentialKey] = useState("");
  
  const { updateData, setData, removeData, subscribeToData } = useFirebaseService(service);

  // Sync with incoming credentials prop changes
  useEffect(() => {
    console.log("Credentials prop updated:", credentials);
    setCurrentCredentials(credentials || {});
    // Don't reset editedCredentials if we're currently editing
    if (!editingCredential) {
      setEditedCredentials(credentials || {});
    }
  }, [credentials, editingCredential]);

  // Set up real-time listener for credentials with immediate updates
  useEffect(() => {
    console.log("Setting up real-time listener for credentials");
    const unsubscribe = subscribeToData("/", (data) => {
      if (data) {
        console.log("Real-time data received:", data);
        const credentialKeys = Object.keys(data).filter(key => key.startsWith('cred'));
        const updatedCredentials: { [key: string]: Credential | undefined } = {};
        
        credentialKeys.forEach(key => {
          if (data[key] && typeof data[key] === 'object') {
            updatedCredentials[key] = data[key];
          }
        });
        
        console.log("Updated credentials from real-time:", updatedCredentials);
        setCurrentCredentials(updatedCredentials);
        
        // Update editedCredentials immediately if not currently editing
        if (!editingCredential) {
          setEditedCredentials(updatedCredentials);
        }
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [service, subscribeToData, editingCredential]);

  const getAvailableSlots = () => {
    const availableSlots = ["all", "none"];
    if (slots) {
      availableSlots.push(...Object.keys(slots));
    }
    return availableSlots;
  };

  const handleEditCredential = (credKey: string) => {
    setEditingCredential(credKey);
    
    // Initialize editedCredentials with current values for editing
    const currentCred = currentCredentials[credKey];
    if (currentCred) {
      setEditedCredentials(prev => ({
        ...prev,
        [credKey]: { ...currentCred }
      }));
      
      try {
        if (currentCred.expiry_date) {
          setSelectedDate(parse(currentCred.expiry_date, 'yyyy-MM-dd', new Date()));
        } else {
          setSelectedDate(new Date());
        }
      } catch (e) {
        setSelectedDate(new Date());
      }
    }
  };

  const handleCancelEdit = () => {
    // Reset edited credentials to current values
    setEditedCredentials({ ...currentCredentials });
    setEditingCredential(null);
    setSelectedDate(undefined);
  };

  const handleSaveCredential = async (credKey: string) => {
    try {
      const credToSave = editedCredentials[credKey];
      if (!credToSave) {
        toast.error(`Cannot save undefined credential: ${credKey}`);
        return;
      }
      
      console.log(`Saving credential ${credKey}:`, credToSave);
      await updateData(`/${credKey}`, credToSave);
      toast.success(`${credKey} updated successfully`);
      setEditingCredential(null);
      setSelectedDate(undefined);
    } catch (error) {
      console.error(`Error updating ${credKey}:`, error);
      toast.error(`Failed to update ${credKey}`);
    }
  };

  const handleInputChange = (credKey: string, field: keyof Credential, value: any) => {
    console.log(`Updating ${credKey}.${field} to:`, value);
    
    // Remove spaces from secret field
    if (field === 'secret' && typeof value === 'string') {
      value = value.replace(/\s+/g, '');
    }
    
    setEditedCredentials(prev => ({
      ...prev,
      [credKey]: {
        ...(prev[credKey] || currentCredentials[credKey] || {}),
        [field]: value
      } as Credential
    }));
  };

  // Fixed number input handler to prevent leading zeros
  const handleNumberInputChange = (credKey: string, field: keyof Credential, value: string) => {
    // Allow empty string or convert to number, ensuring no leading zeros
    const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
    handleInputChange(credKey, field, numValue);
  };

  const handleToggleLock = async (credKey: string) => {
    const currentCred = currentCredentials[credKey];
    if (!currentCred) {
      toast.error(`Cannot toggle lock for undefined credential: ${credKey}`);
      return;
    }
    
    const newLockedValue = currentCred.locked === 0 ? 1 : 0;
    
    try {
      console.log(`Toggling lock for ${credKey} to:`, newLockedValue);
      await updateData(`/${credKey}`, { locked: newLockedValue });
      toast.success(`${credKey} ${newLockedValue === 1 ? 'locked' : 'unlocked'} successfully`);
    } catch (error) {
      console.error(`Error updating lock state for ${credKey}:`, error);
      toast.error(`Failed to ${newLockedValue === 1 ? 'lock' : 'unlock'} ${credKey}`);
    }
  };

  const toggleLockState = (credKey: string) => {
    const currentCred = currentCredentials[credKey];
    if (!currentCred) {
      toast.error(`Cannot toggle lock state for undefined credential: ${credKey}`);
      return;
    }
    
    const newLockedValue = currentCred.locked === 0 ? 1 : 0;
    
    setConfirmationDialog({
      open: true,
      action: () => handleToggleLock(credKey),
      title: `${newLockedValue === 1 ? 'Lock' : 'Unlock'} ${credKey}`,
      description: `Are you sure you want to ${newLockedValue === 1 ? 'lock' : 'unlock'} ${credKey}?`
    });
  };

  const handleDeleteCredential = async (credKey: string) => {
    try {
      console.log(`Deleting credential: ${credKey}`);
      await removeData(`/${credKey}`);
      toast.success(`${credKey} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${credKey}:`, error);
      toast.error(`Failed to delete ${credKey}`);
    }
  };

  const confirmDeleteCredential = (credKey: string) => {
    setConfirmationDialog({
      open: true,
      action: () => handleDeleteCredential(credKey),
      title: `Delete ${credKey}`,
      description: `Are you sure you want to delete ${credKey}? This action cannot be undone.`
    });
  };

  const handleRotatePassword = (credKey: string) => {
    const randomPassword = getRandomPassword();
    
    if (credKey === 'new') {
      setNewCredential({
        ...newCredential,
        password: randomPassword
      });
    } else {
      handleInputChange(credKey, 'password', randomPassword);
    }
    
    toast.success("Password rotated successfully");
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(parse(dateString, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const handleDateSelect = (credKey: string, date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      if (credKey === 'new') {
        setNewCredential({
          ...newCredential,
          expiry_date: formattedDate
        });
      } else {
        handleInputChange(credKey, 'expiry_date', formattedDate);
      }
    }
  };
  
  const handleNewCredentialChange = (field: keyof Credential, value: any) => {
    // Remove spaces from secret field
    if (field === 'secret' && typeof value === 'string') {
      value = value.replace(/\s+/g, '');
    }
    
    setNewCredential({
      ...newCredential,
      [field]: value
    });
  };

  // Fixed number input handler for new credential
  const handleNewCredentialNumberChange = (field: keyof Credential, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
    handleNewCredentialChange(field, numValue);
  };
  
  const handleCreateCredential = async () => {
    if (!newCredentialKey || !newCredential.email || !newCredential.password || !newCredential.belongs_to_slot) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      console.log(`Creating new credential: ${newCredentialKey}`, newCredential);
      await setData(`/${newCredentialKey}`, newCredential);
      toast.success(`${newCredentialKey} created successfully`);
      
      setNewCredentialKey("");
      setNewCredential({
        belongs_to_slot: "",
        email: "",
        password: "",
        secret: "",
        expiry_date: format(new Date(), 'yyyy-MM-dd'),
        locked: 0,
        max_usage: 4,
        usage_count: 0
      });
      setIsAddingCredential(false);
    } catch (error) {
      console.error("Error creating credential:", error);
      toast.error("Failed to create credential");
    }
  };

  const validCredentialEntries = Object.entries(currentCredentials).filter(
    ([key, cred]) => {
      return cred && 
             typeof cred === "object" && 
             key.startsWith('cred') &&
             (cred.email !== undefined || cred.password !== undefined);
    }
  );

  console.log("Valid credential entries:", validCredentialEntries);

  if (validCredentialEntries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Credentials
            <span className="md:hidden"><br /></span>
            <span className="hidden md:inline"> </span>
            Management
          </h2>
          <Button onClick={() => setIsAddingCredential(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Credential
          </Button>
        </div>
        
        <div className="glass-morphism p-8 text-center">
          <h3 className="text-xl font-medium mb-4">No credentials found</h3>
          <p className="text-muted-foreground mb-6">Add credentials to manage user access</p>
          <Button onClick={() => setIsAddingCredential(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add First Credential
          </Button>
        </div>
        
        <AlertDialog 
          open={isAddingCredential} 
          onOpenChange={setIsAddingCredential}
        >
          <AlertDialogContent className="bg-background">
            <ScrollArea className="max-h-[85vh]">
              <div className="p-6">
                <AlertDialogHeader>
                  <AlertDialogTitle>Add New Credential</AlertDialogTitle>
                  <AlertDialogDescription>
                    Create a new credential for user access
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-cred-key">Credential Key</Label>
                    <Input
                      id="new-cred-key"
                      placeholder="e.g., cred5"
                      value={newCredentialKey}
                      onChange={(e) => setNewCredentialKey(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-cred-email">Email</Label>
                    <Input
                      id="new-cred-email"
                      placeholder="email@example.com"
                      value={newCredential.email}
                      onChange={(e) => handleNewCredentialChange('email', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-cred-password">Password</Label>
                    <div className="flex">
                      <Input
                        id="new-cred-password"
                        placeholder="password"
                        value={newCredential.password}
                        onChange={(e) => handleNewCredentialChange('password', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleRotatePassword('new')}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-cred-secret">Secret</Label>
                    <Input
                      id="new-cred-secret"
                      placeholder="secret"
                      value={newCredential.secret || ""}
                      onChange={(e) => handleNewCredentialChange('secret', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-cred-slot">Slot</Label>
                    <Select
                      value={newCredential.belongs_to_slot}
                      onValueChange={(value) => handleNewCredentialChange('belongs_to_slot', value)}
                    >
                      <SelectTrigger id="new-cred-slot">
                        <SelectValue placeholder="Select slot" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-input">
                        {getAvailableSlots().map((slotKey) => (
                          <SelectItem key={slotKey} value={slotKey}>{slotKey}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-cred-expiry">Expiry Date</Label>
                    <div className="flex">
                      <Input
                        id="new-cred-expiry"
                        value={newCredential.expiry_date}
                        onChange={(e) => handleNewCredentialChange('expiry_date', e.target.value)}
                        className="flex-1"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="ml-2">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover">
                          <Calendar
                            mode="single"
                            selected={parse(newCredential.expiry_date, 'yyyy-MM-dd', new Date())}
                            onSelect={(date) => handleDateSelect('new', date)}
                            initialFocus
                            className="bg-background"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-cred-max-usage">Max Usage</Label>
                      <Input
                        id="new-cred-max-usage"
                        type="number"
                        min="0"
                        value={newCredential.max_usage.toString()}
                        onChange={(e) => handleNewCredentialNumberChange('max_usage', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-cred-lock">Lock Status</Label>
                      <div className="flex items-center h-10 space-x-2">
                        <button
                          type="button"
                          onClick={() => handleNewCredentialChange('locked', newCredential.locked === 0 ? 1 : 0)}
                          className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                            newCredential.locked === 0 
                              ? "bg-green-500 text-white hover:bg-green-600" 
                              : "bg-red-500 text-white hover:bg-red-600"
                          )}
                        >
                          {newCredential.locked === 0 ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </button>
                        <span>{newCredential.locked === 0 ? "Unlocked" : "Locked"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCreateCredential}>
                    Create Credential
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            </ScrollArea>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Credentials
          <span className="md:hidden"><br /></span>
          <span className="hidden md:inline"> </span>
          Management
        </h2>
        <Button onClick={() => setIsAddingCredential(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Credential
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {validCredentialEntries.map(([credKey, cred]) => {
          if (!cred) return null;
          
          const isEditing = editingCredential === credKey;
          const currentCred = currentCredentials[credKey];
          const editedCred = editedCredentials[credKey];
          
          if (!currentCred) return null;
          
          return (
            <DataCard
              key={credKey}
              title={credKey}
              className={currentCred.locked === 0 ? "border-green-500/30" : "border-red-500/30"}
            >
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor={`${credKey}-email`}>Email</Label>
                        <Input
                          id={`${credKey}-email`}
                          value={editedCred?.email || ""}
                          onChange={(e) => handleInputChange(credKey, 'email', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor={`${credKey}-password`}>Password</Label>
                        <div className="flex">
                          <Input
                            id={`${credKey}-password`}
                            type="text"
                            value={editedCred?.password || ""}
                            onChange={(e) => handleInputChange(credKey, 'password', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleRotatePassword(credKey)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`${credKey}-secret`}>Secret</Label>
                        <Input
                          id={`${credKey}-secret`}
                          type="text"
                          value={editedCred?.secret || ""}
                          onChange={(e) => handleInputChange(credKey, 'secret', e.target.value)}
                          placeholder="Enter secret"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor={`${credKey}-slot`}>Slot</Label>
                        <Select
                          value={editedCred?.belongs_to_slot || ""}
                          onValueChange={(value) => handleInputChange(credKey, 'belongs_to_slot', value)}
                        >
                          <SelectTrigger id={`${credKey}-slot`}>
                            <SelectValue placeholder="Select slot" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-input">
                            {getAvailableSlots().map((slotKey) => (
                              <SelectItem key={slotKey} value={slotKey}>{slotKey}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor={`${credKey}-expiry`}>Expiry Date</Label>
                        <div className="flex">
                          <Input
                            id={`${credKey}-expiry`}
                            value={editedCred?.expiry_date || ""}
                            onChange={(e) => handleInputChange(credKey, 'expiry_date', e.target.value)}
                            className="flex-1"
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="ml-2">
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-popover">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => handleDateSelect(credKey, date)}
                                initialFocus
                                className="bg-background"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`${credKey}-max-usage`}>Max Usage</Label>
                          <Input
                            id={`${credKey}-max-usage`}
                            type="number"
                            min="0"
                            value={editedCred?.max_usage?.toString() || "0"}
                            onChange={(e) => handleNumberInputChange(credKey, 'max_usage', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`${credKey}-usage-count`}>Usage Count</Label>
                          <Input
                            id={`${credKey}-usage-count`}
                            type="number"
                            min="0"
                            value={editedCred?.usage_count?.toString() || "0"}
                            onChange={(e) => handleNumberInputChange(credKey, 'usage_count', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Label className="flex items-center gap-2">
                          Lock Status:
                          <button
                            onClick={() => handleInputChange(credKey, 'locked', (editedCred?.locked || 0) === 0 ? 1 : 0)}
                            className={cn(
                              "flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                              (editedCred?.locked || 0) === 0 
                                ? "bg-green-500 text-white hover:bg-green-600" 
                                : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                            )}
                          >
                            {(editedCred?.locked || 0) === 0 ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      <Button onClick={() => handleSaveCredential(credKey)}>
                        <Save className="mr-2 h-4 w-4" /> Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={currentCred.locked === 0 ? "outline" : "destructive"} className={cn("px-2 py-1", currentCred.locked === 0 ? "bg-green-500/20 text-green-600 hover:bg-green-500/30 hover:text-green-700" : "")}>
                          {currentCred.locked === 0 ? "Unlocked" : "Locked"}
                        </Badge>
                        <Badge variant="outline" className="bg-primary/10">{currentCred.belongs_to_slot}</Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="glass-morphism p-3 rounded-md">
                          <p className="text-sm text-muted-foreground mb-1">Email</p>
                          <p className="font-medium text-sm break-all">{currentCred.email}</p>
                        </div>
                        
                        <div className="glass-morphism p-3 rounded-md">
                          <p className="text-sm text-muted-foreground mb-1">Password</p>
                          <p className="font-medium text-sm break-all">{currentCred.password}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="glass-morphism p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Expiry</p>
                          <p className="font-medium text-sm">{formatDate(currentCred.expiry_date)}</p>
                        </div>
                        <div className="glass-morphism p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Max Usage</p>
                          <p className="font-medium text-sm">{currentCred.max_usage}</p>
                        </div>
                        <div className="glass-morphism p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Usage Count</p>
                          <p className="font-medium text-sm">{currentCred.usage_count}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => confirmDeleteCredential(credKey)}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </Button>
                      <Button 
                        variant={currentCred.locked === 0 ? "destructive" : "outline"} 
                        size="sm"
                        onClick={() => toggleLockState(credKey)}
                      >
                        {currentCred.locked === 0 ? (
                          <><Lock className="mr-2 h-4 w-4" /> Lock</>
                        ) : (
                          <><Unlock className="mr-2 h-4 w-4" /> Unlock</>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditCredential(credKey)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DataCard>
          );
        })}
      </div>
      
      <AlertDialog 
        open={confirmationDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setConfirmationDialog({...confirmationDialog, open: false});
          }
        }}
      >
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                await confirmationDialog.action();
                setConfirmationDialog({...confirmationDialog, open: false});
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog 
        open={isAddingCredential} 
        onOpenChange={setIsAddingCredential}
      >
        <AlertDialogContent className="bg-background max-h-[85vh] p-0 overflow-hidden">
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6">
              <AlertDialogHeader>
                <AlertDialogTitle>Add New Credential</AlertDialogTitle>
                <AlertDialogDescription>
                  Create a new credential for user access
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-cred-key">Credential Key</Label>
                  <Input
                    id="new-cred-key"
                    placeholder="e.g., cred5"
                    value={newCredentialKey}
                    onChange={(e) => setNewCredentialKey(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-cred-email">Email</Label>
                  <Input
                    id="new-cred-email"
                    placeholder="email@example.com"
                    value={newCredential.email}
                    onChange={(e) => handleNewCredentialChange('email', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-cred-password">Password</Label>
                  <div className="flex">
                    <Input
                      id="new-cred-password"
                      placeholder="password"
                      value={newCredential.password}
                      onChange={(e) => handleNewCredentialChange('password', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => handleRotatePassword('new')}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-cred-secret">Secret</Label>
                  <Input
                    id="new-cred-secret"
                    placeholder="secret"
                    value={newCredential.secret || ""}
                    onChange={(e) => handleNewCredentialChange('secret', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-cred-slot">Slot</Label>
                  <Select
                    value={newCredential.belongs_to_slot}
                    onValueChange={(value) => handleNewCredentialChange('belongs_to_slot', value)}
                  >
                    <SelectTrigger id="new-cred-slot">
                      <SelectValue placeholder="Select slot" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-input">
                      {getAvailableSlots().map((slotKey) => (
                        <SelectItem key={slotKey} value={slotKey}>{slotKey}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-cred-expiry">Expiry Date</Label>
                  <div className="flex">
                    <Input
                      id="new-cred-expiry"
                      value={newCredential.expiry_date}
                      onChange={(e) => handleNewCredentialChange('expiry_date', e.target.value)}
                      className="flex-1"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="ml-2">
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover">
                        <Calendar
                          mode="single"
                          selected={parse(newCredential.expiry_date, 'yyyy-MM-dd', new Date())}
                          onSelect={(date) => handleDateSelect('new', date)}
                          initialFocus
                          className="bg-background"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-cred-max-usage">Max Usage</Label>
                    <Input
                      id="new-cred-max-usage"
                      type="number"
                      min="0"
                      value={newCredential.max_usage.toString()}
                      onChange={(e) => handleNewCredentialNumberChange('max_usage', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-cred-lock">Lock Status</Label>
                    <div className="flex items-center h-10 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleNewCredentialChange('locked', newCredential.locked === 0 ? 1 : 0)}
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                          newCredential.locked === 0 
                            ? "bg-green-500 text-white hover:bg-green-600" 
                            : "bg-red-500 text-white hover:bg-red-600"
                        )}
                      >
                        {newCredential.locked === 0 ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                      <span>{newCredential.locked === 0 ? "Unlocked" : "Locked"}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateCredential}>
                  Create Credential
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </ScrollArea>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
