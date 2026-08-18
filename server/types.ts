export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export type OrderStatus = 'Shipped, arriving tomorrow' | 'Processing, ships in 24 hours' | 'Delivered' | 'Invalid Order';

export interface Order {
  id: string; // "111", "222", "333"
  status: OrderStatus;
  statusDetail: string;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  items: OrderItem[];
  followUpPrompt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'Apparel' | 'Tents' | 'Sleep Systems' | 'Packs' | 'Footwear';
  price: number;
  rating: number;
  image: string;
  description: string;
  specs: string;
  bestFor: string;
}

export interface ReturnPolicyInfo {
  windowDays: number;
  condition: string;
  packaging: string;
  returnsUrl: string;
}

export interface ShippingPolicyInfo {
  standard: string;
  expedited: string;
}

export interface SupportTicket {
  ticketId: string;
  customerName?: string;
  summary: string;
  agentName: string;
  status: 'Connected to Live Agent' | 'Pending Response';
  createdAt: string;
}

export type CardType = 
  | 'order_status' 
  | 'order_invalid' 
  | 'return_policy' 
  | 'product_recommendations' 
  | 'recommendation_quiz'
  | 'human_handoff' 
  | 'shipping_info' 
  | 'fallback_help';

export interface RichCardData {
  type: CardType;
  order?: Order;
  returnPolicy?: ReturnPolicyInfo;
  shippingPolicy?: ShippingPolicyInfo;
  products?: Product[];
  recommendedCategory?: string;
  ticket?: SupportTicket;
  fallbackQuery?: string;
  title?: string;
  content?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  card?: RichCardData;
  quickReplies?: string[];
  isLiveAgentState?: boolean;
}

export interface ChatRequest {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  conversationId?: string;
  context?: {
    pendingQuestion?: string;
    pendingRetries?: number;
    isLiveAgentState?: boolean;
    orderId?: string;
    consecutiveFallbacks?: number;
  };
}

export interface ChatResponse {
  message: ChatMessage;
  detectedIntent?: string;
  newContext?: {
    pendingQuestion?: string;
    pendingRetries?: number;
    isLiveAgentState?: boolean;
    orderId?: string;
    consecutiveFallbacks?: number;
  };
}
