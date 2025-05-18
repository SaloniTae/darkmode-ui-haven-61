
import { useState, useEffect } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { formatTimeWithAmPm } from "@/utils/dateFormatUtils";
import { Minus, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { useFirebaseService } from "@/hooks/useFirebaseService";

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
  const [upcomingExpiryNotices, setUpcomingExpiryNotices] = useState<Record<string, string>>({});
  const [notificationPermission, setNotificationPermission] = useState<string | null>(null);
  const { fetchData, updateData } = useFirebaseService(service);

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  const groupTransactionsByExpiryHour = (transactions: [string, Transaction][]) => {
    const groupedByHour: Record<string, [string, Transaction][]> = {};
    
    transactions.forEach(transaction => {
      const endTimeDate = new Date(transaction[1].end_time.replace(' ', 'T'));
      // Use both hour and date in the key to differentiate same hours on different days
      const hourKey = `${endTimeDate.toISOString().split('T')[0]}_${endTimeDate.getHours()}`; 
      
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
    const futureExpirations = transactions.filter(([_, tx]) => {
      const endTime = new Date(tx.end_time.replace(' ', 'T'));
      return endTime > now;
    });
    
    if (futureExpirations.length === 0) return null;
    
    // Sort by end_time (closest first)
    futureExpirations.sort((a, b) => 
      new Date(a[1].end_time.replace(' ', 'T')).getTime() - 
      new Date(b[1].end_time.replace(' ', 'T')).getTime()
    );
    
    return futureExpirations[0];
  };

  // Send web push notification
  const sendWebPushNotification = (title: string, body: string) => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      return;
    }
    
    if (Notification.permission === "granted") {
      const notification = new Notification(title, { 
        body, 
        icon: "/favicon.ico",
        tag: `account-expiry-${new Date().getTime()}`, // Unique tag to avoid duplicates
        requireInteraction: true // Keep notification until user interacts with it
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return notification;
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          sendWebPushNotification(title, body);
        }
      });
    }
  };

  // Filter transactions into active and expired
  const filterTransactions = () => {
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

    // Check for upcoming expirations today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const upcomingExpiries = active.filter(([_, tx]) => {
      const endTime = new Date(tx.end_time.replace(' ', 'T'));
      // Only consider expirations before tomorrow (i.e., today)
      return endTime < tomorrow;
    });

    // Group upcoming expirations by hour
    const groupedUpcoming = groupTransactionsByExpiryHour(upcomingExpiries);
    
    // Show notifications for upcoming expirations (today only)
    Object.entries(groupedUpcoming).forEach(([hourKey, txs]) => {
      if (txs.length > 0) {
        const [dateStr, hour] = hourKey.split('_');
        const exampleDate = new Date(txs[0][1].end_time.replace(' ', 'T'));
        const formattedTime = formatTimeWithAmPm(txs[0][1].end_time);
        const endTimeDate = new Date(txs[0][1].end_time.replace(' ', 'T'));
        
        // Check if notification for this hour was already sent
        const notificationKey = `${dateStr}_${hour}`;
        const alreadyNotified = upcomingExpiryNotices[notificationKey];
        
        // Calculate time until expiry (in minutes)
        const timeUntilExpiry = Math.floor((endTimeDate.getTime() - now.getTime()) / (60 * 1000));
        
        // Only notify if it's within the next hour and we haven't notified yet
        if (timeUntilExpiry <= 60 && timeUntilExpiry > 0 && !alreadyNotified) {
          const title = "Upcoming Account Expiration";
          const body = `${txs.length} account${txs.length > 1 ? 's' : ''} expiring at ${formattedTime} (in ${timeUntilExpiry} minutes)`;
          
          // Send push notification
          sendWebPushNotification(title, body);
          
          // Also show toast
          toast({
            title,
            description: body,
            variant: "default",
            duration: 10000,
          });
          
          // Mark this hour as notified
          setUpcomingExpiryNotices(prev => ({...prev, [notificationKey]: formattedTime}));
        }
      }
    });

    // Send notification for newly expired accounts
    if (newExpirations && expired.length > 0) {
      const nextExpiry = getNextExpiryTime(active);
      let nextExpiryInfo = "";
      
      if (nextExpiry) {
        const nextExpiryTime = formatTimeWithAmPm(nextExpiry[1].end_time);
        const nextExpiryDate = new Date(nextExpiry[1].end_time.replace(' ', 'T'));
        const isToday = nextExpiryDate.toDateString() === now.toDateString();
        
        nextExpiryInfo = isToday
          ? ` Next account expires at ${nextExpiryTime} today.`
          : ` Next account expires at ${nextExpiryTime} on ${nextExpiryDate.toLocaleDateString()}.`;
      }
      
      const title = "Accounts Expired";
      const body = `${expired.length} account${expired.length > 1 ? 's' : ''} expired.${nextExpiryInfo}`;
      
      // Send push notification
      sendWebPushNotification(title, body);
      
      // Also show toast
      toast({
        title,
        description: body,
        variant: "destructive",
        duration: 8000,
      });
    }

    setActiveTransactions(active);
    setExpiredTransactions(expired);
  };

  // Initialize and set up auto-refresh
  useEffect(() => {
    filterTransactions();
    
    // Set up minute-by-minute refresh
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
      filterTransactions();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [transactions]);

  // Also refresh when currentTime updates
  useEffect(() => {
    filterTransactions();
  }, [currentTime]);

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
      const expiryTime = formatTimeWithAmPm(nextExpiry[1].end_time);
      const expiryDate = new Date(nextExpiry[1].end_time.replace(' ', 'T'));
      const isToday = expiryDate.toDateString() === new Date().toDateString();
      
      const title = "Next Account Expiry";
      const body = isToday
        ? `An account will expire at ${expiryTime} today`
        : `An account will expire at ${expiryTime} on ${expiryDate.toLocaleDateString()}`;
      
      sendWebPushNotification(title, body);
      
      toast({
        title: "Notification Sent",
        description: isToday
          ? `Next account expires at ${expiryTime} today`
          : `Next account expires at ${expiryTime} on ${expiryDate.toLocaleDateString()}`,
        variant: "default"
      });
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
            {notificationPermission !== "granted" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  Notification.requestPermission().then(permission => {
                    setNotificationPermission(permission);
                    if (permission === "granted") {
                      toast({
                        title: "Notifications Enabled",
                        description: "You will now receive notifications about account expirations.",
                        variant: "default"
                      });
                    }
                  });
                }}
                className="text-sm"
              >
                Enable Notifications
              </Button>
            )}
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
                activeTransactions.map(([id, transaction]) => {
                  const endDate = new Date(transaction.end_time.replace(' ', 'T'));
                  const isToday = endDate.toDateString() === new Date().toDateString();
                  
                  return (
                    <button
                      key={id}
                      onClick={() => openTransactionDetails([id, transaction])}
                      className="time-button active-time-button max-[400px]:w-full max-[400px]:mx-auto"
                      title={isToday ? 'Expires today' : `Expires on ${endDate.toLocaleDateString()}`}
                    >
                      <span className="time-text">
                        {formatTimeWithCustomFonts(transaction.end_time)}
                        {!isToday && (
                          <span className="block text-xs mt-1 opacity-75">
                            {endDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
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
                      <div className="dialog-time-button">
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
                      <div className="dialog-time-button">
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
                      )}>
                        <span className="inline-flex items-center justify-center">
                          <span className="time-hour-minute">{formatTimeWithAmPm(selectedTransaction[1].end_time).split(' ')[0]}</span>
                          <span className="time-am-pm">{formatTimeWithAmPm(selectedTransaction[1].end_time).split(' ')[1]}</span>
                        </span>
                        <span className="block text-xs mt-1">
                          {new Date(selectedTransaction[1].end_time.replace(' ', 'T')).toLocaleDateString()}
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
