
import { Session, User } from "@supabase/supabase-js";

export type ServiceType = "crunchyroll" | "netflix" | "prime" | "NSFW";

export interface AuthContextType {
  isAuthenticated: boolean;
  currentService: ServiceType | null;
  user: User | null;
  session: Session | null;
  displayUsername: string;
  pendingUsernameChange: string | null;
  isLoading: boolean;
  login: (username: string, password: string, service: ServiceType) => Promise<void>;
  signup: (username: string, password: string, token: string, service: ServiceType) => Promise<void>;
  logout: () => Promise<void>;
  generateToken: (service: ServiceType) => Promise<string | null>;
  isAdmin: boolean;
  updateUsername: (newUsername: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{error?: any}>;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentService: React.Dispatch<React.SetStateAction<ServiceType | null>>;
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
}
