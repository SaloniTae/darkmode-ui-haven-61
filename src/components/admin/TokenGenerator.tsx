
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clipboard, Check, KeyRound, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { DataCard } from "@/components/ui/DataCard";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

export function TokenGenerator() {
  const { generateToken, user } = useAuth();
  const [service, setService] = useState<"netflix" | "prime">("netflix");
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAccessControls, setShowAccessControls] = useState(false);
  const [canModify, setCanModify] = useState(true);
  const [restrictedTabs, setRestrictedTabs] = useState<string[]>([]);

  // Available tabs by service
  const serviceTabOptions: Record<string, string[]> = {
    netflix: ["credentials", "slots", "transactions", "status", "users"],
    prime: ["credentials", "slots", "transactions", "status", "users"]
  };

  const handleGenerateToken = async () => {
    try {
      const newToken = await generateToken(service);
      
      if (newToken && showAccessControls) {
        // Get user information from the token
        const { data: tokenData, error: tokenError } = await supabase
          .from('tokens')
          .select('*')
          .eq('token', newToken)
          .single();
          
        if (tokenError) {
          console.error("Error retrieving token data:", tokenError);
          toast.error("Failed to configure access settings");
          return;
        }
        
        // Create access control settings for this token
        // We'll create placeholder settings with the token ID as user_id
        // These will be updated with the real user_id when the user registers
        const { error: settingsError } = await supabase
          .from('admin_access_settings')
          .insert([{
            token_id: tokenData.id,
            can_modify: canModify,
            restricted_tabs: restrictedTabs,
            service: service,
            // Temporary values until user registers
            user_id: tokenData.id,
            username: `${service}_user_${Math.floor(Math.random() * 1000)}`
          }]);
          
        if (settingsError) {
          console.error("Error configuring access settings:", settingsError);
          toast.error("Failed to configure access settings");
          return;
        }
        
        toast.success("Token generated with access control settings");
      }
      
      setToken(newToken);
    } catch (error) {
      console.error("Error generating token:", error);
      toast.error("Failed to generate token");
    }
  };

  const copyToClipboard = () => {
    if (!token) return;
    
    navigator.clipboard.writeText(token)
      .then(() => {
        setCopied(true);
        toast.success("Token copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast.error("Failed to copy token");
      });
  };

  const handleToggleTab = (tab: string) => {
    setRestrictedTabs(current =>
      current.includes(tab)
        ? current.filter(t => t !== tab)
        : [...current, tab]
    );
  };

  return (
    <DataCard title="Generate Access Tokens">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Token Generator</CardTitle>
          <CardDescription>
            Generate invitation tokens for new users. These tokens are required for signup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Select Service</label>
            <Select
              value={service}
              onValueChange={(value) => setService(value as "netflix" | "prime")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="netflix">Netflix</SelectItem>
                <SelectItem value="prime">Prime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-primary" />
              <Label htmlFor="show-access-controls" className="text-sm font-medium">
                Configure Access Controls
              </Label>
            </div>
            <Switch
              id="show-access-controls"
              checked={showAccessControls}
              onCheckedChange={setShowAccessControls}
            />
          </div>

          {showAccessControls && (
            <div className="mt-4 space-y-4 p-4 border border-border rounded-md bg-muted/30">
              <div className="flex items-center justify-between">
                <Label htmlFor="can-modify" className="text-sm">
                  Allow Write Access
                </Label>
                <Switch
                  id="can-modify"
                  checked={canModify}
                  onCheckedChange={setCanModify}
                />
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="restricted-tabs">
                  <AccordionTrigger className="text-sm font-medium py-2">
                    Restricted Tabs
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 mt-2">
                      {serviceTabOptions[service]?.map(tab => (
                        <div key={tab} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tab-${tab}`}
                            checked={restrictedTabs.includes(tab)}
                            onCheckedChange={() => handleToggleTab(tab)}
                          />
                          <Label
                            htmlFor={`tab-${tab}`}
                            className="text-sm font-normal capitalize"
                          >
                            {tab}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {token && (
            <div>
              <label className="text-sm font-medium mb-1 block">Generated Token</label>
              <div className="flex items-center mt-1">
                <Input value={token} readOnly className="bg-muted font-mono" />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-2"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This token will expire in 7 days and can only be used once.
                {showAccessControls && ' Access controls will be applied when the user registers.'}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateToken} 
            className="w-full"
          >
            <KeyRound className="mr-2 h-4 w-4" /> Generate New Token
          </Button>
        </CardFooter>
      </Card>
    </DataCard>
  );
}
