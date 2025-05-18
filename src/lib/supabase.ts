
import { createClient } from "@supabase/supabase-js";

// Use environment variables when available, fallback to hardcoded for development
const supabaseUrl = "https://rqtncenvanahxthockwn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdG5jZW52YW5haHh0aG9ja3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNjEyMzMsImV4cCI6MjA1ODYzNzIzM30.QcAlzMuhNUAEzZnmuQZyJ_LUsPIyENboNbx6SXizgLE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Utility function to check if a session has been invalidated
export const isSessionInvalidated = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      console.info("Session check: No valid session found");
      return true;
    }
    
    return false;
  } catch (err) {
    console.error("Error checking session validity:", err);
    return true; // Assume session is invalid if an error occurs
  }
};

// Create a function to send notifications to all registered tokens for a user
export const sendNotificationToUser = async (
  userId: string,
  title: string,
  message: string,
  options: {
    target_url?: string;
    image_url?: string;
    notification_tag?: string;
  } = {}
) => {
  try {
    const { data, error } = await supabase
      .from('notification_tokens')
      .select('token')
      .eq('user_id', userId);
    
    if (error) throw error;
    if (!data || data.length === 0) return { success: false, message: "No notification tokens found" };
    
    // Will implement server-side notification sending in future
    return { success: true, message: `Would send to ${data.length} devices` };
  } catch (e) {
    console.error("Error sending notification:", e);
    return { success: false, message: "Error sending notification" };
  }
};
