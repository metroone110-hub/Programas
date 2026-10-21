export type MealCategory = 'entree' | 'plat' | 'vegetarien' | 'accompagnement' | 'dessert';

export type DietaryTag = 
  | 'veggie' 
  | 'vegan' 
  | 'bio' 
  | 'fait_maison' 
  | 'viande_francaise' 
  | 'local' 
  | 'sans_porc' 
  | 'halal';

export interface MenuItem {
  id: string;
  title: string;
  description?: string;
  category: MealCategory;
  tags: DietaryTag[];
  allergens?: string[];
  priceExtra?: string; // ex: "+0,50€" pour option premium
  isAvailable: boolean;
}

export type ServiceType = 'dejeuner' | 'diner';

export interface ServiceMenu {
  id?: string;
  date: string; // format YYYY-MM-DD
  service: ServiceType;
  theme?: string;
  items: MenuItem[];
  publishedAt?: string;
}

export interface RestaurantPricing {
  ticketUnique?: number; // 200 FCFA pour tout le monde
  boursier: number;
  nonBoursier: number;
  personnel: number;
  visiteur: number;
  currency: string;
}

export interface AuthStatus {
  isConfigured: boolean;
  username?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
}

export interface RestaurantHours {
  midi: string;
  soir: string;
  weekEnd: string;
  crowdLevel: 'faible' | 'moyen' | 'fort';
  customStatus?: string;
}

export interface RestaurantData {
  id: string;
  name: string;
  subname: string;
  campus: string;
  address: string;
  announcement: string;
  paymentMethods: string[];
  pricing: RestaurantPricing;
  hours: RestaurantHours;
  currentMenu: ServiceMenu;
  menuHistory?: ServiceMenu[];
  updatedAt: string;
}

export interface ScanMenuResult {
  date?: string;
  service?: ServiceType;
  theme?: string;
  items: Array<{
    title: string;
    category: MealCategory;
    description?: string;
    tags?: DietaryTag[];
    allergens?: string[];
    priceExtra?: string;
  }>;
  pricing?: Partial<RestaurantPricing>;
  detectedNotes?: string;
}

export interface VirtualTicket {
  id: string;
  type: 'unitaire' | 'carnet_unit';
  packId?: string;
  unitIndex?: number;
  label: string;
  price: number;
  currency: string;
  status: 'valid' | 'used';
  createdAt: string;
  usedAt?: string;
  payerPhone?: string;
  paymentMethod: 'MTN_MOMO' | 'MOOV_MONEY' | 'CINETPAY' | 'DEMO' | 'CASH';
  transactionId?: string;
  securityCode: string; // 6-digit code for cashier verification
  isSimulation?: boolean;
}

export interface MomoPayRequest {
  phone: string;
  type: 'unitaire' | 'souche';
  visitorId: string;
  paymentMethod?: 'MTN_MOMO' | 'MOOV_MONEY' | 'CINETPAY' | 'DEMO';
  forceSimulation?: boolean;
}

export interface MomoPayResponse {
  success: boolean;
  referenceId: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REJECTED_KEY';
  message: string;
  tickets?: VirtualTicket[];
  amount: number;
  isSimulation?: boolean;
  errorDetail?: string;
  apiStatus?: {
    connected: boolean;
    statusCode?: number;
    reason?: string;
  };
}

export interface CinetPayDiagnosisResult {
  testedAt: string;
  apiKeyPreview: string;
  siteId: string;
  mode: 'sandbox' | 'production';
  connected: boolean;
  httpStatus: number;
  code: string;
  message: string;
  description: string;
  supportedChannels: string[];
  isUsableForRealMoney: boolean;
  explanations: string[];
  recommendations: string[];
  rawResponse?: string;
}

export interface CinetPayInitResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
  paymentToken?: string;
  mode: 'sandbox' | 'production' | 'simulation';
  message: string;
  error?: string;
}

export interface PaymentDiagnosisResult {
  momoApiKey: string;
  status: 'invalid_key' | 'sandbox_ready' | 'live_ready' | 'network_error';
  statusCode: number;
  message: string;
  rawResponse: string;
  isUsableForRealMoney: boolean;
  explanations: string[];
  recommendations: string[];
  testedAt: string;
}

export interface MoovDiagnosisResult {
  testedAt: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  username: string;
  tokenGenerated: boolean;
  tokenPreview: string;
  connected: boolean;
  httpStatus: number;
  statusCode?: number;
  statusMessage: string;
  explanations: string[];
  recommendations: string[];
  rawResponse?: string;
}

export interface OpenApiStepResult {
  step: string;
  name: string;
  endpoint: string;
  method: string;
  httpStatus: number;
  success: boolean;
  details: string;
  rawResponse?: string;
}

export interface OpenApiFullDiagnostic {
  testedAt: string;
  environment: string;
  baseUrl: string;
  subscriptionKeyPreview: string;
  apiUser: string;
  allSuccess: boolean;
  steps: OpenApiStepResult[];
  summary: string;
  recommendations: string[];
}

export interface PaymentConfigData {
  momoApiKey: string;
  momoApiUser: string;
  momoSubscriptionKey: string;
  momoSecondaryKey?: string;
  momoProduct?: string;
  momoTargetEnvironment?: 'sandbox' | 'production' | 'mtnciv' | string;
  momoBaseUrl?: string;
  momoCurrency?: string;
  momoReceiverPhone: string;
  momoMerchantCode: string;
  crouMerchantName: string;
  allowDemoMode: boolean;
  // Moov Money fields
  moovUsername?: string;
  moovPassword?: string;
  moovEncryptionKey?: string;
  moovBaseUrl?: string;
  moovUseSandbox?: boolean;
  moovReceiverPhone?: string;
  // CinetPay fields
  cinetpayApiKey?: string;
  cinetpaySiteId?: string;
  cinetpaySecretKey?: string;
  cinetpayMode?: 'sandbox' | 'production';
  cinetpayNotifyUrl?: string;
}

export interface TicketValidationResult {
  valid: boolean;
  status: 'valid' | 'used' | 'not_found';
  message: string;
  ticket?: VirtualTicket;
  validatedAt?: string;
}

export interface TicketStats {
  totalSold: number;
  totalUsed: number;
  totalActive: number;
  totalRevenue: number;
  currency: string;
  recentValidations: Array<{
    id: string;
    securityCode: string;
    usedAt: string;
    label: string;
    payerPhone?: string;
  }>;
}
