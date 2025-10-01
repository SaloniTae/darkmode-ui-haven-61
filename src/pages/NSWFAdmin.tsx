import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { CredentialsPanel } from "@/components/admin/CredentialsPanel";
import { SlotsPanel } from "@/components/admin/SlotsPanel";
import { ReferralsPanel } from "@/components/admin/ReferralsPanel";
import { TransactionsPanel } from "@/components/admin/TransactionsPanel";
import { StatusPanel } from "@/components/admin/StatusPanel";
import { UIConfigPanel } from "@/components/admin/UIConfigPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useFirebaseService } from "@/hooks/useFirebaseService";
import { RestrictedTab } from "@/components/config/RestrictedTab";
import { useAccessControl } from "@/context/AccessControlContext";

export default function NSWFAdmin() {
  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState<any>(null);
  const { isAuthenticated } = useAuth();
  const { fetchData, subscribeToData } = useFirebaseService('nswf');
  const { refreshSettings } = useAccessControl();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchData('/');
      console.log("NSWF Admin data loaded:", data);
      setDbData(data);

      const unsubscribe = subscribeToData('/', (updatedData) => {
        console.log("NSWF Admin data updated:", updatedData);
        setDbData(updatedData);
      });

      await refreshSettings();
      
      return unsubscribe;
    } catch (error) {
      console.error("Error loading NSWF admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (isAuthenticated && !dbData) {
      loadData().then(unsub => {
        unsubscribe = unsub;
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading NSWF Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dbData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Failed to load database</p>
        </div>
      </MainLayout>
    );
  }

  const maintenanceEnabled = dbData?.maintenance?.enabled || false;

  return (
    <MainLayout>
      <Tabs defaultValue="admin" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <RestrictedTab tabName="admin">
            Admin
          </RestrictedTab>
          <RestrictedTab tabName="credentials">
            Credentials
          </RestrictedTab>
          <RestrictedTab tabName="slots">
            Slots
          </RestrictedTab>
          <RestrictedTab tabName="referrals">
            Referrals
          </RestrictedTab>
          <RestrictedTab tabName="transactions">
            Transactions
          </RestrictedTab>
          <RestrictedTab tabName="status">
            Status
          </RestrictedTab>
          <RestrictedTab tabName="uiconfig">
            UI Config
          </RestrictedTab>
          <RestrictedTab tabName="users">
            Users
          </RestrictedTab>
        </TabsList>

        <TabsContent value="admin" className="space-y-4">
          <AdminPanel
            adminConfig={dbData?.admin || {}}
            service="nswf"
          />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <CredentialsPanel
            credentials={dbData?.credentials || {}}
            slots={dbData?.slots || {}}
            service="nswf"
          />
        </TabsContent>

        <TabsContent value="slots" className="space-y-4">
          <SlotsPanel
            slots={dbData?.slots || {}}
            service="nswf"
          />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <ReferralsPanel
            referrals={dbData?.referrals || {}}
            referralSettings={dbData?.referral_settings || {}}
            freeTrialClaims={dbData?.free_trial_claims || {}}
            service="nswf"
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsPanel
            transactions={dbData?.transactions || {}}
            usedOrderIds={dbData?.used_order_ids || {}}
            service="nswf"
          />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <StatusPanel
            transactions={dbData?.transactions || {}}
            service="nswf"
          />
        </TabsContent>

        <TabsContent value="uiconfig" className="space-y-4">
          <UIConfigPanel
            uiConfig={dbData?.ui_config || {}}
            maintenanceEnabled={maintenanceEnabled}
            service="nswf"
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersPanel 
            users={dbData?.users || {}}
            service="nswf" 
          />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
