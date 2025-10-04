import { useState, useEffect, useRef, useCallback } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { formatTimeWithAmPm } from "@/utils/dateFormatUtils";
import { Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  approved_at: string;
  end_time: string;
  slot_id: string;
  start_time: string;
  assign_to?: string;
  last_email?: string;
  last_password?: string;
  user_id?: number;
  hidden?: boolean;
}

interface StatusPanelProps {
  transactions: Record<string, any>;
  service: string;
}

type SortOption = 'time' | 'slot' | 'credential';

export function StatusPanel({ transactions, service }: StatusPanelProps) {
  const [activeTransactions, setActiveTransactions] = useState<[string, Transaction][]>([]);
  const [expiredTransactions, setExpiredTransactions] = useState<[string, Transaction][]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTransaction, setSelectedTransaction] = useState<[string, Transaction] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [notifiedExpiries, setNotifiedExpiries] = useState<Record<string, boolean>>({});
  const [upcomingExpiryNotices, setUpcomingExpiryNotices] = useState<Record<string, boolean>>({});
  const [sortOption, setSortOption] = useState<SortOption>('time');
  const { fetchData, updateData } = useFirebaseService(service);
  const { user } = useAuth();

  const groupTransactionsByExpiryHour = (transactions: [string, Transaction][]) => {
    const groupedByHour: Record<string, [string, Transaction][]> = {};
    
    transactions.forEach(transaction => {
      const endTimeDate = new Date(transaction[1].end_time.replace(' ', 'T'));
      const hourKey = endTimeDate.toISOString().split(':')[0]; // Group by hour
      
      if (!groupedByHour[hourKey]) {
        groupedByHour[hourKey] = [];
      }
      
      groupedByHour[hourKey].push(transaction);
    });
    
    return groupedByHour;
  };

  const getNextExpiryTime = (transactions: [string, Transaction][]) => {
    if (transactions.length === 0) return null;
    
    const now = new Date();
    const futureExpirations = transactions.filter(([_, tx]) => 
      new Date(tx.end_time.replace(' ', 'T')) > now
    );
    
    if (futureExpirations.length === 0) return null;
    
    // Sort by end_time (closest first)
    futureExpirations.sort((a, b) => 
      new Date(a[1].end_time.replace(' ', 'T')).getTime() - 
      new Date(b[1].end_time.replace(' ', 'T')).getTime()
    );
    
    return futureExpirations[0];
  };

  // Function to format date and time for display
  const formatDateWithTime = (dateString: string) => {
    try {
      const date = new Date(dateString.replace(' ', 'T'));
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      // Compare dates
      if (date.toDateString() === today.toDateString()) {
        return `Today at ${formatTimeWithAmPm(dateString)}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow at ${formatTimeWithAmPm(dateString)}`;
      } else {
        return `${format(date, "MMM d")} at ${formatTimeWithAmPm(dateString)}`;
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      return formatTimeWithAmPm(dateString);
    }
  };

  // Helper function to extract all transactions including FTRIAL-ID and REF-ID
  const extractAllTransactions = (transactionsData: Record<string, any>) => {
    const allTransactions: [string, Transaction][] = [];
    
    Object.entries(transactionsData).forEach(([key, value]) => {
      // Skip entries that are just numbers (counters)
      if (typeof value === "number") return;
      
      // Handle FTRIAL-ID transactions
      if (key === "FTRIAL-ID" && typeof value === "object") {
        Object.entries(value).forEach(([childKey, childValue]) => {
          if (typeof childValue === "object" && childValue && (childValue as any).end_time) {
            allTransactions.push([childKey, childValue as Transaction]);
          }
        });
        return; // Skip further processing for FTRIAL-ID
      }
      
      // Handle REF-ID transactions
      if (key === "REF-ID" && typeof value === "object") {
        Object.entries(value).forEach(([childKey, childValue]) => {
          if (typeof childValue === "object" && childValue && (childValue as any).end_time) {
            allTransactions.push([childKey, childValue as Transaction]);
          }
        });
        return; // Skip further processing for REF-ID
      }
      
      // Handle regular transactions (direct children of transactions)
      if (typeof value === "object" && value.end_time) {
        allTransactions.push([key, value as Transaction]);
      }
      
      // Handle nested transaction groups (existing logic for other nested structures)
      if (typeof value === "object" && !value.end_time && key !== "FTRIAL-ID" && key !== "REF-ID") {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (typeof nestedValue === "object" && nestedValue && (nestedValue as any).end_time) {
            allTransactions.push([`${key}-${nestedKey}`, nestedValue as Transaction]);
          }
        });
      }
    });
    
    return allTransactions;
  };

  // Sort transactions based on selected option
  const sortTransactions = (transactions: [string, Transaction][], sortBy: SortOption) => {
    return [...transactions].sort((a, b) => {
      switch (sortBy) {
        case 'slot':
          return (a[1].slot_id || '').localeCompare(b[1].slot_id || '');
        case 'credential':
          return (a[1].assign_to || '').localeCompare(b[1].assign_to || '');
        case 'time':
        default:
          // Keep existing time-based sorting
          return new Date(a[1].end_time.replace(' ', 'T')).getTime() - 
                 new Date(b[1].end_time.replace(' ', 'T')).getTime();
      }
    });
  };

  // Filter transactions into active and expired
  const filterTransactions = useCallback(() => {
    const now = new Date();
    const active: [string, Transaction][] = [];
    const expired: [string, Transaction][] = [];
    let newExpirations = false;

    // Extract all transactions including FTRIAL-ID and REF-ID
    const allTransactions = extractAllTransactions(transactions);

    allTransactions.forEach(([id, transaction]) => {
      if (!transaction.end_time) return;
      
      // Skip hidden transactions
      if (transaction.hidden === true) return;

      // Parse the end time
      const endTime = new Date(transaction.end_time.replace(' ', 'T'));
      
      if (endTime > now) {
        active.push([id, transaction]);
      } else {
        // Only include expired transactions that are less than 24 hours old
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (endTime > twentyFourHoursAgo) {
          expired.push([id, transaction]);
          
          // Check if this is a new expiration we haven't notified about yet
          if (!notifiedExpiries[id]) {
            newExpirations = true;
            // Mark as notified
            setNotifiedExpiries(prev => ({...prev, [id]: true}));
          }
        }
      }
    });

    // Apply sorting to both active and expired transactions
    const sortedActive = sortTransactions(active, sortOption);
    const sortedExpired = sortTransactions(expired, sortOption);

    // Check for upcoming expirations in the next hour that we haven't notified about
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const upcomingExpiries = sortedActive.filter(([id, tx]) => {
      const endTime = new Date(tx.end_time.replace(' ', 'T'));
      return endTime <= oneHourFromNow && !upcomingExpiryNotices[id];
    });

    // Group upcoming expirations by hour
    const groupedUpcoming = groupTransactionsByExpiryHour(upcomingExpiries);
    
    // Show notifications for upcoming expirations
    Object.entries(groupedUpcoming).forEach(([hourKey, txs]) => {
      if (txs.length > 0 && !upcomingExpiryNotices[hourKey]) {
        const exampleTx = txs[0];
        const expiryDate = new Date(exampleTx[1].end_time.replace(' ', 'T'));
        const formattedTime = formatDateWithTime(exampleTx[1].end_time);
        
        toast({
          title: "Upcoming Expirations",
          description: `${txs.length} account${txs.length > 1 ? 's' : ''} will expire ${formattedTime}`,
          variant: "default",
          duration: 10000,
        });
        
        // Mark this hour as notified
        setUpcomingExpiryNotices(prev => ({...prev, [hourKey]: true}));
      }
    });

    // Send notification for newly expired accounts
    if (newExpirations && sortedExpired.length > 0) {
      const nextExpiry = getNextExpiryTime(sortedActive);
      let nextExpiryInfo = "";
      
      if (nextExpiry) {
        const nextExpiryTime = formatDateWithTime(nextExpiry[1].end_time);
        nextExpiryInfo = ` Next account expires ${nextExpiryTime}.`;
      }
      
      const toastMessage = `${sortedExpired.length} account${sortedExpired.length > 1 ? 's' : ''} have expired.${nextExpiryInfo}`;
      
      toast({
        title: "Accounts Expired",
        description: toastMessage,
        variant: "destructive",
        duration: 5000,
      });
    }

    setActiveTransactions(sortedActive);
    setExpiredTransactions(sortedExpired);
  }, [transactions, notifiedExpiries, upcomingExpiryNotices, sortOption]);

  // Initialize and set up auto-refresh
  useEffect(() => {
    filterTransactions();
    
    // Set up minute-by-minute refresh
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
      filterTransactions();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [transactions, filterTransactions]);

  // Also refresh when currentTime updates
  useEffect(() => {
    filterTransactions();
  }, [currentTime, filterTransactions]);

  const openTransactionDetails = (transaction: [string, Transaction]) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  // Function to get display text for buttons based on sort option with custom font styling
  const getButtonDisplayText = (transaction: Transaction, sortBy: SortOption) => {
    switch (sortBy) {
      case 'slot':
        const slotId = transaction.slot_id ? transaction.slot_id.toUpperCase() : 'NO SLOT';
        // Parse SLOT and numbers separately for different fonts
        const slotParts = slotId.match(/([A-Z]+)(_?)(\d*)/);
        if (slotParts) {
          return (
            <>
              <span className="font-nexa-extrabold">{slotParts[1]}</span>
              <span className="font-sans">{slotParts[2]}{slotParts[3]}</span>
            </>
          );
        }
        return <span className="font-nexa-extrabold">{slotId}</span>;
      case 'credential':
        const credId = transaction.assign_to ? transaction.assign_to.toUpperCase() : 'NO CREDENTIAL';
        // Parse CRED and numbers separately for different fonts
        const credParts = credId.match(/([A-Z]+)(_?)(\d*)/);
        if (credParts) {
          return (
            <>
              <span className="font-nexa-extrabold">{credParts[1]}</span>
              <span className="font-sans">{credParts[2]}{credParts[3]}</span>
            </>
          );
        }
        return <span className="font-nexa-extrabold">{credId}</span>;
      case 'time':
      default:
        return formatTimeWithCustomFonts(transaction.end_time);
    }
  };

  // Custom formatting function to separate hours+minutes from AM/PM
  const formatTimeWithCustomFonts = (timeString: string) => {
    const formattedTime = formatTimeWithAmPm(timeString);
    const parts = formattedTime.split(' ');
    
    if (parts.length === 2) {
      return (
        <>
          <span className="time-hour-minute">{parts[0]}</span>
          <span className="time-am-pm">{parts[1]}</span>
        </>
      );
    }
    
    return formattedTime;
  };

  // Helper function to get the correct path for updating transactions
  const getTransactionUpdatePath = (transactionId: string) => {
    // Check if this transaction exists in FTRIAL-ID
    if (transactions["FTRIAL-ID"] && transactions["FTRIAL-ID"][transactionId]) {
      return `/transactions/FTRIAL-ID/${transactionId}`;
    }
    
    // Check if this transaction exists in REF-ID
    if (transactions["REF-ID"] && transactions["REF-ID"][transactionId]) {
      return `/transactions/REF-ID/${transactionId}`;
    }
    
    // Default to regular transaction path
    return `/transactions/${transactionId}`;
  };

  // Mark expired orders as hidden and update credentials
  const handleClearExpired = async () => {
    try {
      // Get all the credential data
      const credData = await fetchData("/");
      
      // Counter for cleared orders
      let clearedCount = 0;
      let errorCount = 0;

      // Step 1: Group expired transactions by credential to count them
      const credentialCounts: Record<string, number> = {};
      expiredTransactions.forEach(([id, transaction]) => {
        if (transaction.assign_to) {
          credentialCounts[transaction.assign_to] = (credentialCounts[transaction.assign_to] || 0) + 1;
        }
      });

      // Step 2: Mark all transactions as hidden (can be done in parallel)
      const hidingPromises = expiredTransactions.map(async ([id, transaction]) => {
        try {
          const updatePath = getTransactionUpdatePath(id);
          await updateData(updatePath, { hidden: true });
          clearedCount++;
        } catch (e) {
          console.error(`Error hiding transaction ${id}:`, e);
          errorCount++;
        }
      });
      
      await Promise.all(hidingPromises);
      
      // Step 3: Update each credential's usage_count once with the batch count
      const credentialUpdatePromises = Object.entries(credentialCounts).map(async ([credKey, count]) => {
        try {
          // Check if the credential exists in the database
          if (credData[credKey] && typeof credData[credKey].usage_count === 'number') {
            // Decrement by the total count, ensuring it doesn't go below 0
            const currentCount = credData[credKey].usage_count;
            const newCount = Math.max(0, currentCount - count);
            
            // Update the credential's usage count once
            await updateData(`/${credKey}`, { usage_count: newCount });
          }
        } catch (e) {
          console.error(`Error updating credential ${credKey}:`, e);
        }
      });
      
      await Promise.all(credentialUpdatePromises);
      
      // Clear expired transactions from UI
      setExpiredTransactions([]);
      
      // Show appropriate toast message
      if (errorCount > 0) {
        if (clearedCount > 0) {
          toast({
            title: "Partially Completed",
            description: `Cleared ${clearedCount} orders, but ${errorCount} failed. Usage counts updated.`,
            variant: "default"
          });
        } else {
          toast({
            title: "Failed to Clear Orders",
            description: "Could not clear any expired orders. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Success",
          description: `Cleared ${clearedCount} expired orders. Usage counts updated.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error clearing expired orders:", error);
      toast({
        title: "Error",
        description: "Failed to clear expired orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConfirmationOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <DataCard 
        title="Account Status" 
        headerAction={
          <div className="flex items-center space-x-2">
            <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="slot">Slot</SelectItem>
                <SelectItem value="credential">Cred</SelectItem>
              </SelectContent>
            </Select>
            {expiredTransactions.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsConfirmationOpen(true)}
                className="text-sm"
              >
                Clear
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-10 py-4">
          {/* Active Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground">ACTIVE</h2>
            
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 xs:grid-cols-2 max-[400px]:grid-cols-3 max-[400px]:gap-2">
              {activeTransactions.length > 0 ? (
                activeTransactions.map(([id, transaction]) => (
                  <button
                    key={id}
                    onClick={() => openTransactionDetails([id, transaction])}
                    className="time-button active-time-button max-[400px]:w-full max-[400px]:mx-auto"
                    title={formatDateWithTime(transaction.end_time)}
                  >
                    <span className="time-text">
                      {getButtonDisplayText(transaction, sortOption)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center col-span-3 max-[400px]:col-span-3 py-6">
                  <p className="text-muted-foreground">No active accounts</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Divider */}
          <div className="flex items-center justify-center py-1">
            <Minus className="w-full h-0.5 text-muted-foreground" />
          </div>
          
          {/* Expired Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold uppercase text-foreground tracking-wider">EXPIRED</h2>
            
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 xs:grid-cols-2 max-[400px]:grid-cols-3 max-[400px]:gap-2">
              {expiredTransactions.length > 0 ? (
                expiredTransactions.map(([id, transaction]) => (
                  <button
                    key={id}
                    onClick={() => openTransactionDetails([id, transaction])}
                    className="time-button expired-time-button max-[400px]:w-full max-[400px]:mx-auto"
                    title={formatDateWithTime(transaction.end_time)}
                  >
                    <span className="time-text text-red-500 dark:text-red-400">
                      {getButtonDisplayText(transaction, sortOption)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center col-span-3 max-[400px]:col-span-3 py-6">
                  <p className="text-muted-foreground">No expired accounts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DataCard>
      
      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background border-border backdrop-blur-xl text-foreground max-w-sm max-[400px]:max-w-[90%] dialog-animation">
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-foreground">Account Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="break-all text-foreground">{selectedTransaction[0]}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slot:</span>
                  <span className="text-foreground">{selectedTransaction[1].slot_id}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 max-[400px]:grid-cols-1 max-[400px]:gap-2">
                  {selectedTransaction[1].start_time && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">Start</div>
                      <div className="dialog-time-button" title={formatDateWithTime(selectedTransaction[1].start_time)}>
                        <span className="inline-flex items-center justify-center text-foreground">
                          <span className="time-hour-minute">{formatTimeWithAmPm(selectedTransaction[1].start_time).split(' ')[0]}</span>
                          <span className="time-am-pm">{formatTimeWithAmPm(selectedTransaction[1].start_time).split(' ')[1]}</span>
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedTransaction[1].approved_at && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">Approved</div>
                      <div className="dialog-time-button" title={formatDateWithTime(selectedTransaction[1].approved_at)}>
                        <span className="inline-flex items-center justify-center text-foreground">
                          <span className="time-hour-minute">{formatTimeWithAmPm(selectedTransaction[1].approved_at).split(' ')[0]}</span>
                          <span className="time-am-pm">{formatTimeWithAmPm(selectedTransaction[1].approved_at).split(' ')[1]}</span>
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedTransaction[1].end_time && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">End</div>
                      <div className={cn(
                        "dialog-time-button",
                        new Date(selectedTransaction[1].end_time.replace(' ', 'T')) < new Date() ? "text-red-500 dark:text-red-400" : "text-foreground"
                      )}
                      title={formatDateWithTime(selectedTransaction[1].end_time)}>
                        <span className="inline-flex items-center justify-center">
                          <span className="time-hour-minute">{formatTimeWithAmPm(selectedTransaction[1].end_time).split(' ')[0]}</span>
                          <span className="time-am-pm">{formatTimeWithAmPm(selectedTransaction[1].end_time).split(' ')[1]}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedTransaction[1].assign_to && (
                  <div className="text-center mt-4">
                    <p className="font-semibold max-[400px]:break-all text-foreground">Account: {selectedTransaction[1].assign_to}</p>
                  </div>
                )}
                
                {selectedTransaction[1].last_email && (
                  <div className="text-center">
                    <p className="text-sm max-[400px]:break-all text-foreground">Email: {selectedTransaction[1].last_email}</p>
                  </div>
                )}
                
                {selectedTransaction[1].user_id && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">User ID: {selectedTransaction[1].user_id}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog for Clear Expired Orders */}
      <ConfirmationDialog
        open={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
        title="Clear Expired Orders"
        description="Are you sure you want to clear all expired orders? This will also decrement usage counts on their accounts."
        onConfirm={handleClearExpired}
      />
    </div>
  );
}
