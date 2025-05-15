
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { UserAccessControl } from "@/components/config/UserAccessControl";
import { UIRestrictions } from "@/components/config/UIRestrictions";

const CONFIG_PASSWORD = "ayush1234";

export default function ConfigPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CONFIG_PASSWORD) {
      setAuthenticated(true);
      toast.success("Access granted to configuration panel");
    } else {
      toast.error("Incorrect password");
    }
  };

  if (!authenticated) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto">
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle>Configuration Access</CardTitle>
              <CardDescription>Enter the password to access the configuration panel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="glass-morphism"
                />
                <Button type="submit" className="w-full">
                  Access Configuration
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Configuration Panel</h1>
        </div>

        <Tabs defaultValue="user-access" className="w-full">
          <TabsList className="w-full mb-6 grid grid-cols-2 h-auto p-1 glass-morphism shadow-lg">
            <TabsTrigger value="user-access">User Access Control</TabsTrigger>
            <TabsTrigger value="ui-restrictions">UI Restrictions</TabsTrigger>
          </TabsList>

          <TabsContent value="user-access" className="mt-0">
            <UserAccessControl />
          </TabsContent>

          <TabsContent value="ui-restrictions" className="mt-0">
            <UIRestrictions />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
