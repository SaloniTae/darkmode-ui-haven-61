
import { useState, useEffect } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { formatTimeWithAmPm } from "@/utils/dateFormatUtils";
import { Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Transaction {
  approved_at: string;
  end_time: string;
  slot_id: string;
  start_time: string;
  assign_to?: string;
  last_email?: string;
  last_password?: string;
  user_id?: number;
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

  // Filter transactions into active and expired
  const filterTransactions = () => {
    const now = new Date();
    const active: [string, Transaction][] = [];
    const expired: [string, Transaction][] = [];

    Object.entries(transactions).forEach(([id, data]) => {
      // Skip entries that are just numbers (counters)
      if (typeof data === "number") return;
      
      const transaction = data as Transaction;
      if (!transaction.end_time) return;

      // Parse the end time
      const endTime = new Date(transaction.end_time.replace(' ', 'T'));
      
      // Check if it's active (future end time)
      if (endTime > now) {
        active.push([id, transaction]);
      } else {
        // For expired, check if it's within the last 24 hours
        const twentyFourHoursAgo = new Date(now);
        twentyFourHoursAgo.setHours(now.getHours() - 24);
        
        if (endTime >= twentyFourHoursAgo) {
          expired.push([id, transaction]);
        }
        // If older than 24 hours, don't include it
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

  return (
    <div className="space-y-6">
      <DataCard title="Account Status">
        <div className="space-y-10 py-4">
          {/* Active Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-wider">ACTIVE</h2>
            
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 xs:grid-cols-2 max-[400px]:grid-cols-1">
              {activeTransactions.length > 0 ? (
                activeTransactions.map(([id, transaction]) => (
                  <button
                    key={id}
                    onClick={() => openTransactionDetails([id, transaction])}
                    className="time-button group max-[400px]:w-full max-[400px]:mx-auto"
                  >
                    <span className="time-text group-hover:text-black group-active:text-black">
                      {formatTimeWithCustomFonts(transaction.end_time)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center col-span-3 max-[400px]:col-span-1 py-6">
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
            
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 xs:grid-cols-2 max-[400px]:grid-cols-1">
              {expiredTransactions.length > 0 ? (
                expiredTransactions.map(([id, transaction]) => (
                  <button
                    key={id}
                    onClick={() => openTransactionDetails([id, transaction])}
                    className="time-button-expired group max-[400px]:w-full max-[400px]:mx-auto"
                  >
                    <span className="time-text text-red-400 group-hover:text-white group-active:text-white">
                      {formatTimeWithCustomFonts(transaction.end_time)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center col-span-3 max-[400px]:col-span-1 py-6">
                  <p className="text-white/60">No expired accounts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DataCard>
      
      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-black border-white/10 backdrop-blur-xl text-white max-w-sm max-[400px]:max-w-[90%]">
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
                      <div className="px-3 py-2 rounded-full border border-white/10 bg-black/60 inline-flex justify-center max-[400px]:w-full">
                        <span className="font-['NexaLight'] tracking-wider">{formatTimeWithAmPm(selectedTransaction[1].start_time).split(' ')[0]}</span>
                        <span className="font-['NexaExtraBold'] text-sm ml-0.5">{formatTimeWithAmPm(selectedTransaction[1].start_time).split(' ')[1]}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedTransaction[1].approved_at && (
                    <div className="text-center">
                      <div className="text-sm text-white/60 mb-1">Approved</div>
                      <div className="px-3 py-2 rounded-full border border-white/10 bg-black/60 inline-flex justify-center max-[400px]:w-full">
                        <span className="font-['NexaLight'] tracking-wider">{formatTimeWithAmPm(selectedTransaction[1].approved_at).split(' ')[0]}</span>
                        <span className="font-['NexaExtraBold'] text-sm ml-0.5">{formatTimeWithAmPm(selectedTransaction[1].approved_at).split(' ')[1]}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedTransaction[1].end_time && (
                    <div className="text-center">
                      <div className="text-sm text-white/60 mb-1">End</div>
                      <div className={cn(
                        "px-3 py-2 rounded-full border border-white/10 bg-black/60 inline-flex justify-center max-[400px]:w-full",
                        new Date(selectedTransaction[1].end_time.replace(' ', 'T')) < new Date() ? "text-red-400" : ""
                      )}>
                        <span className="font-['NexaLight'] tracking-wider">{formatTimeWithAmPm(selectedTransaction[1].end_time).split(' ')[0]}</span>
                        <span className="font-['NexaExtraBold'] text-sm ml-0.5">{formatTimeWithAmPm(selectedTransaction[1].end_time).split(' ')[1]}</span>
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
    </div>
  );
}
