import { RichCardData, Product, Order, SupportTicket } from '../../types.js';

export type IntentType =
  | 'main_menu'
  | 'order_tracking'
  | 'return_exchange'
  | 'order_cancellation'
  | 'product_recommendation'
  | 'shipping_info'
  | 'human_handoff'
  | 'order_disambiguation'
  | 'order_issue_clarification'
  | 'defect_replacement'
  | 'product_specs_inquiry'
  | 'pricing_inquiry'
  | 'store_info_contact'
  | 'warranty_inquiry'
  | 'gratitude_farewell'
  | 'fallback_scenario'
  | 'out_of_scope'
  | 'live_agent_chat';

export interface ClassificationResult {
  intent: IntentType;
  confidence: number;
  scores: Record<string, number>;
  method: 'deterministic_pattern' | 'naive_bayes_classifier' | 'semantic_vectorizer' | 'context_override' | 'fallback';
  isAmbiguous: boolean;
  rawInput: string;
}

export type CancelChoice = 'size_change' | 'cancel_entirely' | 'keep_order' | 'confirm_cancel';

export interface ExtractedEntities {
  orderId?: string;
  multipleOrderIds?: string[];
  email?: string;
  productTerm?: string;
  categoryTerm?: string;
  matchedProduct?: Product;
  cancelAction?: CancelChoice;
  confirmation?: 'confirm' | 'cancel' | 'keep' | 'abort';
  defectIssue?: string;
  specQuery?: string;
  priceQuery?: string;
  isDirectNumberOnly?: boolean;
  cleanedText: string;
  tokens: string[];
}

export interface FuzzyMatchResult<T = unknown> {
  original: string;
  matched: string;
  similarity: number; // 0.0 - 1.0
  distance: number;
  item?: T;
  isMatch: boolean;
}

export interface DialogueContext {
  pendingQuestion?: string;
  pendingRetries?: number;
  isLiveAgentState?: boolean;
  orderId?: string;
  subStep?: string;
  lastIntent?: IntentType;
  consecutiveFallbacks?: number;
}

export interface TemplateRenderResult {
  message: string;
  card?: RichCardData;
  quickReplies?: string[];
  newContext?: DialogueContext;
  isLiveAgentState?: boolean;
}
