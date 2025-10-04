
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
import { supabase } from "@/lib/supabase";
import { useAccessControl } from "@/context/AccessControlContext";

export function TokenGenerator() {
  const { generateToken, user, isAdmin } = useAuth();
  const { isTabRestricted } = useAccessControl();
  const [service, setService] = useState<"crunchyroll" | "netflix" | "prime" | "NSFW">("crunchyroll");
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAccessControls, setShowAccessControls] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restrictedTabs, setRestrictedTabs] = useState<string[]>([]);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Available tabs by service - updated to include admin and uiconfig for netflix and prime
  const serviceTabOptions: Record<string, string[]> = {
    crunchyroll: ["tokens", "admin", "credentials", "slots", "referrals", "transactions", "status", "uiconfig", "users"],
    netflix: ["admin", "credentials", "slots", "referrals", "transactions", "status", "uiconfig", "users"],
    prime: ["admin", "credentials", "slots", "referrals", "transactions", "status", "uiconfig", "users"],
    NSFW: ["admin", "credentials", "slots", "referrals", "transactions", "status", "uiconfig", "users"]
  };

  const handleGenerateToken = async () => {
    setTokenError(null);
    setIsLoading(true);
    setToken(null); // Clear previous token
    
    // Check if user is an admin before proceeding
    if (!isAdmin) {
      setTokenError("Only Crunchyroll administrators can generate tokens");
      toast.error("You don't have permission to generate tokens");
      setIsLoading(false);
      return;
    }
    
    try {
      // Generate token
      const newToken = await generateToken(service);
      
      if (!newToken) {
        setTokenError("Failed to generate token");
        toast.error("Failed to generate token");
        return;
      }
      
      // Configure access settings if option is selected
      if (newToken && showAccessControls) {
        console.log("Configuring access settings for token:", newToken);
        
        try {
          // Get token information from the database
          const { data: tokenData, error: tokenError } = await supabase
            .from('tokens')
            .select('*')
            .eq('token', newToken)
            .single();
            
          if (tokenError) {
            throw new Error(`Error retrieving token data: ${tokenError.message}`);
          }
          
          if (!tokenData) {
            throw new Error("Token data not found");
          }
          
          console.log("Token data retrieved:", tokenData);
          
          // Create access control settings for this token
          // Use tokenData.id directly instead of token_id field
          const { error: settingsError } = await supabase
            .from('admin_access_settings')
            .insert([{
              user_id: tokenData.id, // Use this as a temporary user ID until registration
              restricted_tabs: restrictedTabs,
              service: service,
              // We'll need to update this once the user registers
              username: `${service}_user_${Math.floor(Math.random() * 1000)}`
            }]);
            
          if (settingsError) {
            throw new Error(`Error configuring access settings: ${settingsError.message}`);
          }
          
          toast.success("Token generated with access control settings");
        } catch (err: any) {
          console.error("Access control configuration error:", err);
          setTokenError("Failed to configure access settings");
          toast.error(`Failed to configure access settings: ${err.message}`);
          // We still display the token even if access controls failed
        }
      } else {
        toast.success("Token generated successfully");
      }
      
      // Set the token regardless of access control success/failure
      setToken(newToken);
    } catch (error: any) {
      console.error("Error generating token:", error);
      setTokenError(error.message || "Failed to generate token");
      toast.error("Failed to generate token");
    } finally {
      setIsLoading(false);
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
              onValueChange={(value) => setService(value as "crunchyroll" | "netflix" | "prime" | "NSFW")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crunchyroll">Crunchyroll</SelectItem>
                <SelectItem value="netflix">Netflix</SelectItem>
                <SelectItem value="prime">Prime</SelectItem>
                <SelectItem value="NSFW">NSFW</SelectItem>
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

          {tokenError && (
            <div className="p-2 bg-destructive/20 border border-destructive/50 rounded text-sm text-destructive mt-2">
              {tokenError}
            </div>
          )}

          {token && (
            <div className="mt-4">
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
            disabled={isLoading}
          >
            {isLoading ? (
              <>Loading...</>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" /> Generate New Token
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </DataCard>
  );
}
