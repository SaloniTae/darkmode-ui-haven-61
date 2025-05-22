
import { useState, useEffect, useRef, useCallback } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { formatTimeWithAmPm } from "@/utils/dateFormatUtils";
import { Minus, Bell, BellRing } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

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

export function StatusPanel({ transactions, service }: StatusPanelProps) {
  const [activeTransactions, setActiveTransactions] = useState<[string, Transaction][]>([]);
  const [expiredTransactions, setExpiredTransactions] = useState<[string, Transaction][]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTransaction, setSelectedTransaction] = useState<[string, Transaction] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [notifiedExpiries, setNotifiedExpiries] = useState<Record<string, boolean>>({});
  const [upcomingExpiryNotices, setUpcomingExpiryNotices] = useState<Record<string, boolean>>({});
  const { fetchData, updateData } = useFirebaseService(service);
  const { user } = useAuth();
  const { 
    isSupported, 
    isEnabled, 
    enableNotifications, 
    sendPushNotification 
  } = useNotifications(user?.id);

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

  // Filter transactions into active and expired
  const filterTransactions = useCallback(() => {
    const now = new Date();
    const active: [string, Transaction][] = [];
    const expired: [string, Transaction][] = [];
    let newExpirations = false;

    Object.entries(transactions).forEach(([id, data]) => {
      // Skip entries that are just numbers (counters)
      if (typeof data === "number") return;
      
      const transaction = data as Transaction;
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

    // Sort by end time (most recent expiring first for active, most recently expired first for expired)
    active.sort((a, b) => 
      new Date(a[1].end_time.replace(' ', 'T')).getTime() - 
      new Date(b[1].end_time.replace(' ', 'T')).getTime()
    );
    
    expired.sort((a, b) => 
      new Date(b[1].end_time.replace(' ', 'T')).getTime() - 
      new Date(a[1].end_time.replace(' ', 'T')).getTime()
    );

    // Check for upcoming expirations in the next hour that we haven't notified about
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const upcomingExpiries = active.filter(([id, tx]) => {
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
        
        // Send web push notification
        if (isEnabled) {
          sendPushNotification(
            "Upcoming Account Expirations",
            `${txs.length} account${txs.length > 1 ? 's' : ''} will expire ${formattedTime}`,
            {
              notification_tag: `upcoming-${hourKey}`
            }
          );
        }
        
        // Mark this hour as notified
        setUpcomingExpiryNotices(prev => ({...prev, [hourKey]: true}));
      }
    });

    // Send notification for newly expired accounts
    if (newExpirations && expired.length > 0) {
      const nextExpiry = getNextExpiryTime(active);
      let nextExpiryInfo = "";
      
      if (nextExpiry) {
        const nextExpiryTime = formatDateWithTime(nextExpiry[1].end_time);
        nextExpiryInfo = ` Next account expires ${nextExpiryTime}.`;
      }
      
      const toastMessage = `${expired.length} account${expired.length > 1 ? 's' : ''} have expired.${nextExpiryInfo}`;
      
      toast({
        title: "Accounts Expired",
        description: toastMessage,
        variant: "destructive",
        duration: 5000,
      });

      // Send web push notification
      if (isEnabled) {
        sendPushNotification(
          "Accounts Expired",
          toastMessage,
          {
            notification_tag: `expired-${new Date().toISOString().split('T')[0]}`
          }
        );
      }
    }

    setActiveTransactions(active);
    setExpiredTransactions(expired);
  }, [transactions, notifiedExpiries, upcomingExpiryNotices, isEnabled, sendPushNotification]);

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

  // Mark expired orders as hidden and update credentials
  const handleClearExpired = async () => {
    try {
      // Get all the credential data
      const credData = await fetchData("/");
      
      // Counter for cleared orders
      let clearedCount = 0;
      let errorCount = 0;

      // Process each expired transaction
      const processingPromises = expiredTransactions.map(async ([id, transaction]) => {
        try {
          // Mark the transaction as hidden in the database
          await updateData(`/transactions/${id}`, {
            hidden: true
          });
          
          // Only update credential usage if it has assign_to property
          if (transaction.assign_to) {
            const credKey = transaction.assign_to;
            
            // Check if the credential exists in the database
            if (credData[credKey] && typeof credData[credKey].usage_count === 'number') {
              // Decrement the usage count, ensuring it doesn't go below 0
              const currentCount = credData[credKey].usage_count;
              const newCount = Math.max(0, currentCount - 1);
              
              // Update the credential's usage count
              await updateData(`/${credKey}`, {
                usage_count: newCount
              });
            }
          }
          
          clearedCount++;
        } catch (e) {
          console.error(`Error processing transaction ${id}:`, e);
          errorCount++;
        }
      });
      
      // Wait for all processes to complete
      await Promise.all(processingPromises);
      
      // Clear expired transactions from UI
      setExpiredTransactions([]);
      
      // Show appropriate toast message
      if (errorCount > 0) {
        if (clearedCount > 0) {
          toast({
            title: "Partially Completed",
            description: `Cleared ${clearedCount} orders, but ${errorCount} failed. Some usage counts updated.`,
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

  // Test push notification
  const testPushNotification = () => {
    const nextExpiry = getNextExpiryTime(activeTransactions);
    
    if (nextExpiry) {
      const expiryTime = formatDateWithTime(nextExpiry[1].end_time);
      const title = "Next Account Expiry";
      const message = `An account will expire ${expiryTime}`;
      
      if (isEnabled) {
        sendPushNotification(title, message, {
          notification_tag: `test-${Date.now()}`
        });
        
        toast({
          title: "Web Push Notification Sent",
          description: message,
          variant: "default"
        });
      } else if (isSupported) {
        toast({
          title: "Notifications Not Enabled",
          description: "Please enable notifications to receive alerts.",
          variant: "default",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => enableNotifications()}
              className="ml-2"
            >
              Enable
            </Button>
          )
        });
      } else {
        toast({
          title: "Notifications Not Supported",
          description: "Your browser doesn't support push notifications.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "No Upcoming Expirations",
        description: "There are no active accounts about to expire",
        variant: "default"
      });
    }
  };

  return (
    <div className="space-y-6">
      <DataCard 
        title="Account Status" 
        headerAction={
          <div className="flex items-center space-x-2">
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
            {!isEnabled && isSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={enableNotifications}
                className="text-sm flex items-center"
                title="Enable notifications"
              >
                <BellRing size={16} className="mr-1" />
                Enable Alerts
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={testPushNotification}
              className="text-primary"
              title="Test notification"
            >
              <Bell size={18} />
            </Button>
          </div>
        }
      >
        <div className="space-y-10 py-4">
          {/* Active Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-wider">ACTIVE</h2>
            
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
                      {formatTimeWithCustomFonts(transaction.end_time)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center col-span-3 max-[400px]:col-span-3 py-6">
                  <p className="text-white/60">No active accounts</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Divider */}
          <div className="flex items-center justify-center py-1">
            <Minus className="w-full h-0.5 text-white/50" />
          </div>
          
          {/* Expired Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold uppercase text-white tracking-wider">EXPIRED</h2>
            
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 xs:grid-cols-2 max-[400px]:grid-cols-3 max-[400px]:gap-2">
              {expiredTransactions.length > 0 ? (
                expiredTransactions.map(([id, transaction]) => (
                  <button
                    key={id}
                    onClick={() => openTransactionDetails([id, transaction])}
                    className="time-button expired-time-button max-[400px]:w-full max-[400px]:mx-auto"
                    title={formatDateWithTime(transaction.end_time)}
                  >
                    <span className="time-text text-red-400">
                      {formatTimeWithCustomFonts(transaction.end_time)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center col-span-3 max-[400px]:col-span-3 py-6">
                  <p className="text-white/60">No expired accounts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DataCard>
      
      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-black border-white/10 backdrop-blur-xl text-white max-w-sm max-[400px]:max-w-[90%] dialog-animation">
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Account Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex justify-between">
                  <span className="text-white/60">ID:</span>
                  <span className="break-all">{selectedTransaction[0]}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-white/60">Slot:</span>
                  <span>{selectedTransaction[1].slot_id}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 max-[400px]:grid-cols-1 max-[400px]:gap-2">
                  {selectedTransaction[1].start_time && (
                    <div className="text-center">
                      <div className="text-sm text-white/60 mb-1">Start</div>
                      <div className="dialog-time-button" title={formatDateWithTime(selectedTransaction[1].start_time)}>
                        <span className="inline-flex items-center justify-center">
                          <span className="time-hour-minute">{formatTimeWithAmPm(selectedTransaction[1].start_time).split(' ')[0]}</span>
                          <span className="time-am-pm">{formatTimeWithAmPm(selectedTransaction[1].start_time).split(' ')[1]}</span>
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedTransaction[1].approved_at && (
                    <div className="text-center">
                      <div className="text-sm text-white/60 mb-1">Approved</div>
                      <div className="dialog-time-button" title={formatDateWithTime(selectedTransaction[1].approved_at)}>
                        <span className="inline-flex items-center justify-center">
                          <span className="time-hour-minute">{formatTimeWithAmPm(selectedTransaction[1].approved_at).split(' ')[0]}</span>
                          <span className="time-am-pm">{formatTimeWithAmPm(selectedTransaction[1].approved_at).split(' ')[1]}</span>
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedTransaction[1].end_time && (
                    <div className="text-center">
                      <div className="text-sm text-white/60 mb-1">End</div>
                      <div className={cn(
                        "dialog-time-button",
                        new Date(selectedTransaction[1].end_time.replace(' ', 'T')) < new Date() ? "text-red-400" : ""
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
                    <p className="font-semibold max-[400px]:break-all">Account: {selectedTransaction[1].assign_to}</p>
                  </div>
                )}
                
                {selectedTransaction[1].last_email && (
                  <div className="text-center">
                    <p className="text-sm max-[400px]:break-all">Email: {selectedTransaction[1].last_email}</p>
                  </div>
                )}
                
                {selectedTransaction[1].user_id && (
                  <div className="text-center">
                    <p className="text-sm text-white/60">User ID: {selectedTransaction[1].user_id}</p>
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

