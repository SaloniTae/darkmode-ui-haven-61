
import { useState, useEffect } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { Separator } from "@/components/ui/separator";
import { formatDateTimeForDisplay, formatTimeWithAmPm } from "@/utils/dateFormatUtils";
import { Minus } from "lucide-react";

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
      
      if (endTime > now) {
        active.push([id, transaction]);
      } else {
        expired.push([id, transaction]);
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

  return (
    <div className="space-y-6">
      <DataCard title="Account Status">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">ACTIVE</h2>
            <div className="space-y-4">
              {activeTransactions.length > 0 ? (
                activeTransactions.map(([id, transaction]) => (
                  <div key={id} className="glass-morphism p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">ID: {id}</span>
                      <span className="text-sm text-muted-foreground">
                        Slot: {transaction.slot_id}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {transaction.start_time && (
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-1">Start</div>
                            <div className="glass-morphism px-6 py-3 rounded-full inline-flex justify-center">
                              <span className="text-xl font-medium">
                                {formatTimeWithAmPm(transaction.start_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {transaction.approved_at && (
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-1">Approved</div>
                            <div className="glass-morphism px-6 py-3 rounded-full inline-flex justify-center">
                              <span className="text-xl font-medium">
                                {formatTimeWithAmPm(transaction.approved_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {transaction.end_time && (
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-1">End</div>
                            <div className="glass-morphism px-6 py-3 rounded-full inline-flex justify-center">
                              <span className="text-xl font-medium">
                                {formatTimeWithAmPm(transaction.end_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {transaction.last_email && (
                      <div className="text-center mt-2">
                        <p className="text-sm text-muted-foreground">
                          {transaction.assign_to && (
                            <span className="mr-2">Account: {transaction.assign_to}</span>
                          )}
                          {transaction.last_email && (
                            <span>Email: {transaction.last_email}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No active accounts</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-center my-6">
            <Minus className="w-full h-4 text-neutral-gray" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-red-400">EXPIRED</h2>
            <div className="space-y-4">
              {expiredTransactions.length > 0 ? (
                expiredTransactions.map(([id, transaction]) => (
                  <div key={id} className="glass-morphism p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">ID: {id}</span>
                      <span className="text-sm text-muted-foreground">
                        Slot: {transaction.slot_id}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {transaction.start_time && (
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-1">Start</div>
                            <div className="glass-morphism px-6 py-3 rounded-full inline-flex justify-center">
                              <span className="text-xl font-medium text-red-400">
                                {formatTimeWithAmPm(transaction.start_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {transaction.approved_at && (
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-1">Approved</div>
                            <div className="glass-morphism px-6 py-3 rounded-full inline-flex justify-center">
                              <span className="text-xl font-medium text-red-400">
                                {formatTimeWithAmPm(transaction.approved_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {transaction.end_time && (
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-1">End</div>
                            <div className="glass-morphism px-6 py-3 rounded-full inline-flex justify-center">
                              <span className="text-xl font-medium text-red-400">
                                {formatTimeWithAmPm(transaction.end_time)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {transaction.last_email && (
                      <div className="text-center mt-2">
                        <p className="text-sm text-muted-foreground">
                          {transaction.assign_to && (
                            <span className="mr-2">Account: {transaction.assign_to}</span>
                          )}
                          {transaction.last_email && (
                            <span>Email: {transaction.last_email}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No expired accounts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DataCard>
    </div>
  );
}
