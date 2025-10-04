
// Admin Config Types
export interface AdminConfig {
  inferior_admins: string[];
  superior_admins: string[];
}

// Credential Types
export interface Credential {
  belongs_to_slot: string;
  email: string;
  expiry_date: string;
  locked: number;
  max_usage: number;
  password: string;
  secret?: string;
  usage_count: number;
}

// Referral Settings Types
export interface ReferralSettings {
  buy_with_points_enabled: boolean;
  free_trial_enabled: boolean;
  points_per_referral: number;
  required_point: number;
}

// Referral Types
export interface Referral {
  referral_code: string;
  referral_points: number;
  referred_users?: (number | string)[];
  points_per_referral?: number;
}

// Slot Types - Updated schema
export interface Slot {
  duration_hours: number;
  enabled: boolean;
  name: string;
  required_amount: number;
}

export interface Slots {
  [key: string]: Slot;
}

export interface Settings {
  slots: Slots;
}

// Transaction Types
export interface Transaction {
  approved_at: string;
  end_time: string;
  slot_id: string;
  start_time: string;
  hidden?: boolean;
  assign_to?: string;
  last_email?: string;
  last_password?: string;
  user_id?: number;
}

export interface TransactionGroup {
  [key: string]: Transaction | number;
}

export interface Transactions {
  [key: string]: TransactionGroup | Transaction;
}

// UI Config Types
export interface CrunchyrollScreen {
  button_text: string;
  callback_data: string;
  caption: string;
  photo_url: string;
}

export interface NetflixPrimeScreen {
  button_text: string;
  callback_data: string;
  caption: string;
  photo_url: string;
}

export interface OORPayScreen {
  UPI_ID: string;
  MERCHANT_NAME: string;
  MID: string;
  TEMPLATE_URL: string;
  LOGO_URL: string;
}

export interface MaintenanceConfig {
  alert: string;
  alert_notify: string;
  back_message: string;
  caption: string;
  message: string;
  mode: "photo" | "text";
  photo_url: string;
}

export interface UIConfig {
  approve_flow: {
    account_format: string;
    photo_url: string;
    success_text: string;
  };
  confirmation_flow: {
    button_text: string;
    callback_data: string;
    caption: string;
    photo_url: string;
  };
  crunchyroll_screen: CrunchyrollScreen | NetflixPrimeScreen;
  freetrial_info: {
    photo_url: string;
  };
  locked_flow: {
    locked_text: string;
  };
  maintenance: MaintenanceConfig;
  out_of_stock: {
    photo_url: string;
    stock_text: string;
  };
  oor_pay_screen: OORPayScreen;
  referral_info: {
    photo_url: string;
  };
  reject_flow: {
    error_text: string;
    photo_url: string;
  };
  slot_booking: {
    button_format: string;
    callback_data: string;
    caption: string;
    photo_url: string;
  };
  start_command: {
    buttons: Array<{
      callback_data: string;
      text: string;
    }>;
    welcome_photo: string;
    welcome_text: string;
  };
}

// Database Schema
export interface DatabaseSchema {
  admin_config: AdminConfig;
  cred1?: Credential;
  cred2?: Credential;
  cred3?: Credential;
  cred4?: Credential;
  free_trial_claims: {
    [key: string]: boolean;
  };
  maintenance: {
    enabled: boolean;
  };
  referral_settings: ReferralSettings;
  referrals: {
    [key: string]: Referral;
  };
  settings: Settings;
  transactions: Transactions;
  ui_config: UIConfig;
  used_orderids: {
    [key: string]: boolean;
  };
  users: {
    [key: string]: boolean;
  };
  [key: string]: any; // Allow for dynamic credential keys beyond cred1-cred4
}
