
import { useState } from "react";
import { Transactions } from "@/types/database";
import { DataCard } from "@/components/ui/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { safeFormat } from "@/utils/dateFormatUtils";
import { useFirebaseService } from "@/hooks/useFirebaseService";

interface TransactionsPanelProps {
  transactions: Transactions;
  usedOrderIds: { [key: string]: boolean };
  service: string;
}

interface ProcessedTransaction {
  id: string;
  type: string;
  approved: string;
  slot?: string;
  startTime?: string;
  endTime?: string;
  originalData: any;
}

export function TransactionsPanel({ transactions, usedOrderIds, service }: TransactionsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{open: boolean; id: string; type: string}>({
    open: false,
    id: "",
    type: ""
  });
  const [deleteOrderIdConfirmation, setDeleteOrderIdConfirmation] = useState<{open: boolean; orderId: string}>({
    open: false,
    orderId: ""
  });
  
  const { removeData } = useFirebaseService(service);
  
  const processTransactions = (): ProcessedTransaction[] => {
    const processedTransactions: ProcessedTransaction[] = [];
    const now = Date.now();
    
    const regularTransactions: Record<string, any> = {};
    const specialTransactions: Record<string, Record<string, any>> = {};
    
    Object.entries(transactions || {}).forEach(([key, value]) => {
      if (key === "FTRIAL-ID" || key === "REF-ID") {
        specialTransactions[key] = value as Record<string, any>;
      } else {
        regularTransactions[key] = value;
      }
    });
    
    Object.entries(regularTransactions).forEach(([transactionId, details]) => {
      const transaction = details as any;
      
      // Check if transaction matches search term (transaction ID or user ID)
      const matchesSearch = searchTerm === "" || 
        transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.user_id && transaction.user_id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Check if transaction is expired
      const isExpired = transaction.end_time ? new Date(transaction.end_time).getTime() < now : false;
      
      // Check if transaction matches status filter
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && !isExpired) ||
        (statusFilter === "expired" && isExpired);
      
      if (
        (filterType === "all" || filterType === "regular") &&
        matchesSearch &&
        matchesStatus
      ) {
        processedTransactions.push({
          id: transactionId,
          type: "Regular",
          approved: transaction.approved_at || "Unknown",
          slot: transaction.slot_id,
          startTime: transaction.start_time,
          endTime: transaction.end_time,
          originalData: transaction
        });
      }
    });
    
    Object.entries(specialTransactions).forEach(([type, transactions]) => {
      Object.entries(transactions).forEach(([transactionId, details]) => {
        const transaction = details as any;
        
        // Check if transaction matches search term (transaction ID or user ID)
        const matchesSearch = searchTerm === "" || 
          transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (transaction.user_id && transaction.user_id.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Check if transaction is expired
        const isExpired = transaction.end_time ? new Date(transaction.end_time).getTime() < now : false;
        
        // Check if transaction matches status filter
        const matchesStatus = statusFilter === "all" || 
          (statusFilter === "active" && !isExpired) ||
          (statusFilter === "expired" && isExpired);
        
        if (
          (transactionId !== type + "-OTTONRENT") && 
          (filterType === "all" || 
           (filterType === "freetrial" && type === "FTRIAL-ID") ||
           (filterType === "referral" && type === "REF-ID")) &&
          matchesSearch &&
          matchesStatus
        ) {
          processedTransactions.push({
            id: transactionId,
            type: type === "FTRIAL-ID" ? "Free Trial" : "Referral",
            approved: transaction.approved_at || "Unknown",
            slot: transaction.slot_id,
            startTime: transaction.start_time,
            endTime: transaction.end_time,
            originalData: transaction
          });
        }
      });
    });
    
    return processedTransactions.sort((a, b) => {
      // Safe comparison with fallback to alphabetical sorting if dates are invalid
      try {
        const dateA = new Date(a.approved).getTime();
        const dateB = new Date(b.approved).getTime();
        
        if (isNaN(dateA) || isNaN(dateB)) {
          // If either date is invalid, fall back to string comparison
          return a.id.localeCompare(b.id);
        }
        
        return dateB - dateA;
      } catch (error) {
        console.warn("Error sorting by date:", error);
        return a.id.localeCompare(b.id);
      }
    });
  };

  const handleDeleteTransaction = async () => {
    const { id, type } = deleteConfirmation;
    const path = type === "Regular" 
      ? `/transactions/${id}` 
      : `/transactions/${type === "Free Trial" ? "FTRIAL-ID" : "REF-ID"}/${id}`;
    
    try {
      await removeData(path);
      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
      throw error;
    }
  };

  const handleDeleteOrderId = async () => {
    const path = `/used_orderids/${deleteOrderIdConfirmation.orderId}`;
    try {
      await removeData(path);
      toast.success("Order ID deleted successfully");
    } catch (error) {
      console.error("Error deleting Order ID:", error);
      toast.error("Failed to delete Order ID");
      throw error;
    }
  };

  // Safe formatting for date display
  const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString) return "N/A";
    return safeFormat(dateString, "PPP p", "Invalid Date");
  };

  // Safely format time for display
  const formatTimeRange = (startTime?: string, endTime?: string): JSX.Element | string => {
    if (!startTime || !endTime) return "N/A";
    
    try {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "Invalid Time Range";
      }
      
      return (
        <div className="text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{safeFormat(startDate, "MMM dd, yyyy", "Invalid Date")}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            <span>
              {safeFormat(startDate, "h:mm a", "?")} - 
              {safeFormat(endDate, "h:mm a", "?")}
            </span>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error formatting time range:", error);
      return "Error formatting time";
    }
  };

  const processedTransactions = processTransactions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <h2 className="text-2xl font-bold">Transactions</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Transaction/User ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="all">All Status</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="freetrial">Free Trial</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataCard title="Total Transactions" className="text-center">
          <div className="py-4">
            <span className="text-3xl font-bold">
              {Object.keys(transactions || {}).filter(key => key !== "FTRIAL-ID" && key !== "REF-ID").length}
            </span>
            <p className="text-muted-foreground text-sm mt-1">Regular transactions</p>
          </div>
        </DataCard>
        
        <DataCard title="Free Trials" className="text-center">
          <div className="py-4">
            <span className="text-3xl font-bold">
              {transactions && transactions["FTRIAL-ID"] && 
               Object.keys(transactions["FTRIAL-ID"]).filter(id => id !== "FTRIAL-ID-OTTONRENT").length}
            </span>
            <p className="text-muted-foreground text-sm mt-1">Total claimed</p>
          </div>
        </DataCard>
        
        <DataCard title="Referral Redemptions" className="text-center">
          <div className="py-4">
            <span className="text-3xl font-bold">
              {transactions && transactions["REF-ID"] ? 
               Object.keys(transactions["REF-ID"]).filter(key => key !== "REF-ID-OTTONRENT").length : 
               0}
            </span>
            <p className="text-muted-foreground text-sm mt-1">Point redemptions</p>
          </div>
        </DataCard>
      </div>
      
      <div className="glass-morphism rounded-lg overflow-hidden">
        {processedTransactions.length > 0 ? (
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Time Period</TableHead>
                  <TableHead>Approval Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.type === "Regular" ? "bg-blue-500/20 text-blue-400" :
                        transaction.type === "Free Trial" ? "bg-purple-500/20 text-purple-400" : 
                                                           "bg-green-500/20 text-green-400"
                      }`}>
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.slot || "N/A"}</TableCell>
                    <TableCell>
                      {formatTimeRange(transaction.startTime, transaction.endTime)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(transaction.approved)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setDeleteConfirmation({
                            open: true, 
                            id: transaction.id,
                            type: transaction.type
                          })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState 
            title="No transactions found"
            description="Try adjusting your search or filter settings."
            icon={<Search className="h-10 w-10" />}
          />
        )}
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-4">Used Order IDs</h3>
        <div className="glass-morphism rounded-lg overflow-hidden">
          <div className="overflow-auto p-4" style={{ maxHeight: '200px' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(usedOrderIds || {}).map(([orderId, used]) => (
                <div key={orderId} className="flex items-center justify-between p-2 rounded-md bg-white/5">
                  <span className="text-sm truncate mr-2">{orderId}</span>
                  <div className="flex gap-1">
                    {used ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => setDeleteOrderIdConfirmation({
                        open: true,
                        orderId
                      })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Transaction Confirmation Dialog */}
      <ConfirmationDialog 
        open={deleteConfirmation.open} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmation({...deleteConfirmation, open: false});
          }
        }}
        title="Delete Transaction?"
        description={`This will permanently delete the transaction ID: ${deleteConfirmation.id}. This action cannot be undone.`}
        onConfirm={handleDeleteTransaction}
      />
      
      {/* Delete Order ID Confirmation Dialog */}
      <ConfirmationDialog 
        open={deleteOrderIdConfirmation.open} 
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOrderIdConfirmation({...deleteOrderIdConfirmation, open: false});
          }
        }}
        title="Delete Order ID?"
        description={`This will permanently delete the Order ID: ${deleteOrderIdConfirmation.orderId}. This action cannot be undone.`}
        onConfirm={handleDeleteOrderId}
      />
    </div>
  );
}
