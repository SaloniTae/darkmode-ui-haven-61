import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { CredentialsPanel } from "@/components/admin/CredentialsPanel";
import { SlotsPanel } from "@/components/admin/SlotsPanel";
import { ReferralsPanel } from "@/components/admin/ReferralsPanel";
import { TransactionsPanel } from "@/components/admin/TransactionsPanel";
import { UIConfigPanel } from "@/components/admin/UIConfigPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { StatusPanel } from "@/components/admin/StatusPanel";
import { Loader2 } from "lucide-react";
import { DatabaseSchema } from "@/types/database";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { RestrictedTab } from "@/components/config/RestrictedTab";
import { useAccessControl } from "@/context/AccessControlContext";

export default function NSWFAdmin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dbData, setDbData] = useState<DatabaseSchema | null>(null);
  const activeTab = searchParams.get("tab") || "admin";
  
  const { isAuthenticated, user } = useAuth();
  const { refreshSettings } = useAccessControl();
  const dataFetchedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { fetchData, subscribeToData, extractCredentials } = useFirebaseService('nswf');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Initial data load
      const data = await fetchData("/");
      setDbData(data);
      toast.success("NSWF database loaded successfully");
      dataFetchedRef.current = true;
      
      // Refresh access settings after database is loaded
      await refreshSettings();
      
      // Set up real-time listener
      unsubscribeRef.current = subscribeToData("/", (realtimeData) => {
        if (realtimeData) {
          setDbData(realtimeData);
        }
      });
    } catch (error) {
      console.error("Error loading NSWF database:", error);
      toast.error("Failed to load NSWF database");
    } finally {
      setLoading(false);
    }
  }, [fetchData, subscribeToData, refreshSettings, user?.id]);

  useEffect(() => {
    // Only fetch data if authenticated and not already fetched
    if (isAuthenticated && !dataFetchedRef.current) {
      loadData();
    }
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isAuthenticated, loadData]);

  // Clear session storage when user logs out
  useEffect(() => {
    if (!user) {
    }
  }, [user]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <MainLayout className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-medium">Loading NSWF database...</h2>
        </div>
      </MainLayout>;
  }

  if (!dbData) {
    return <MainLayout>
        <div className="glass-morphism p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Database Error</h2>
          <p className="text-red-400">Failed to load NSWF database. Please check your connection and try again.</p>
        </div>
      </MainLayout>;
  }

  const handleTabChange = (value: string) => {
    navigate(`/nswf?tab=${value}`, { replace: true });
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full mb-6 grid grid-cols-2 md:grid-cols-8 h-auto p-1 glass-morphism shadow-lg">
            <TabsTrigger className="py-2.5 text-sm font-medium transition-all hover:bg-white/10" value="admin">Admins</TabsTrigger>
            <TabsTrigger className="py-2.5 text-sm font-medium transition-all hover:bg-white/10" value="credentials">Credentials</TabsTrigger>
            <TabsTrigger className="py-2.5 text-sm font-medium transition-all hover:bg-white/10" value="slots">Slots</TabsTrigger>
            <TabsTrigger className="py-2.5 text-sm font-medium transition-all hover:bg-white/10" value="referrals">Referrals</TabsTrigger>
            <TabsTrigger className="py-2.5 text-sm font-medium transition-all hover:bg-white/10" value="transactions">Transactions</TabsTrigger>
            <TabsTrigger className="py-2.5 text-sm font-medium transition-all hover:bg-white/10" value="status">Status</TabsTrigger>
            <TabsTrigger className="py-2.5 text-sm font-medium transition-all hover:bg-white/10" value="uiconfig">UI Config</TabsTrigger>
            <TabsTrigger className="py-2.5 text-sm font-medium transition-all hover:bg-white/10" value="users">Users</TabsTrigger>
          </TabsList>
          
          <RestrictedTab tabName="admin">
            <AdminPanel adminConfig={dbData?.admin_config || { superior_admins: [], inferior_admins: [] }} service="nswf" />
          </RestrictedTab>
          
          <RestrictedTab tabName="credentials">
            <CredentialsPanel 
              credentials={extractCredentials(dbData)} 
              slots={dbData?.settings?.slots || {}} 
              service="nswf" 
            />
          </RestrictedTab>
          
          <RestrictedTab tabName="slots">
            <SlotsPanel slots={dbData?.settings?.slots || {}} service="nswf" />
          </RestrictedTab>
          
          <RestrictedTab tabName="referrals">
            <ReferralsPanel 
              referrals={dbData?.referrals || {}} 
              referralSettings={dbData?.referral_settings || {
                buy_with_points_enabled: false,
                free_trial_enabled: false,
                points_per_referral: 0,
                required_point: 0
              }} 
              freeTrialClaims={dbData?.free_trial_claims || {}}
              service="nswf"
            />
          </RestrictedTab>
          
          <RestrictedTab tabName="transactions">
            <TransactionsPanel transactions={dbData?.transactions || {}} usedOrderIds={dbData?.used_orderids || {}} service="nswf" />
          </RestrictedTab>
          
          <RestrictedTab tabName="status">
            <StatusPanel transactions={dbData?.transactions || {}} service="nswf" />
          </RestrictedTab>
          
          <RestrictedTab tabName="uiconfig">
            <UIConfigPanel uiConfig={dbData?.ui_config || {
              approve_flow: {
                account_format: "",
                photo_url: "",
                success_text: ""
              },
              confirmation_flow: {
                button_text: "",
                callback_data: "",
                caption: "",
                photo_url: ""
              },
              crunchyroll_screen: {
                button_text: "",
                callback_data: "",
                caption: "",
                photo_url: ""
              },
              freetrial_info: {
                photo_url: ""
              },
              locked_flow: {
                locked_text: ""
              },
              maintenance: {
                alert: "",
                alert_notify: "",
                back_message: "",
                caption: "",
                message: "",
                mode: "photo",
                photo_url: ""
              },
              out_of_stock: {
                photo_url: "",
                stock_text: ""
              },
              oor_pay_screen: {
                UPI_ID: "",
                MERCHANT_NAME: "",
                MID: "",
                TEMPLATE_URL: "",
                LOGO_URL: ""
              },
              referral_info: {
                photo_url: ""
              },
              reject_flow: {
                error_text: "",
                photo_url: ""
              },
              slot_booking: {
                button_format: "",
                callback_data: "",
                caption: "",
                photo_url: ""
              },
              start_command: {
                buttons: [],
                welcome_photo: "",
                welcome_text: ""
              }
            }} 
              service="nswf" 
              maintenanceEnabled={dbData?.maintenance?.enabled || false} />
          </RestrictedTab>
          
          <RestrictedTab tabName="users">
            <UsersPanel users={dbData?.users || {}} service="nswf" />
          </RestrictedTab>
        </Tabs>
      </div>
    </MainLayout>
  );
}
