import { guardrailService } from './guardrailService.js';
import { intentClassifier } from './nlp/intentClassifier.js';
import { entityExtractor } from './nlp/entityExtractor.js';
import { localFuzzyMatcher } from './nlp/fuzzyMatcher.js';
import { responseMatrix } from './nlp/responseMatrix.js';
import { ChatRequest, ChatResponse, ChatMessage } from '../types.js';
import { DialogueContext, IntentType } from './nlp/types.js';

export class AgentService {
  /**
   * Main conversational chat processor executing the 4-Layer Offline Deterministic NLP Pipeline:
   * 1. Safety Guardrails
   * 2. Layer 1: Intent Classification (Deterministic Regex + Multinomial Naive Bayes)
   * 3. Layer 2: Entity Extraction & Slot Filling
   * 4. Layer 3: Local Fuzzy Matching (Typo correction against inventory)
   * 5. Layer 4: Response Matrix & Template Engine
   */
  public async processChat(request: ChatRequest): Promise<ChatResponse> {
    const lastUserMessage = request.messages[request.messages.length - 1];
    const userText = lastUserMessage ? lastUserMessage.content.trim() : '';
    const messageId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Extract conversation context
    const currentContext: DialogueContext = {
      isLiveAgentState: request.context?.isLiveAgentState ?? false,
      pendingQuestion: request.context?.pendingQuestion,
      pendingRetries: request.context?.pendingRetries ?? 0,
      orderId: request.context?.orderId,
      consecutiveFallbacks: request.context?.consecutiveFallbacks ?? 0,
    };

    // 0. Safety & Guardrail Check
    const guardrailResult = guardrailService.inspect(userText);
    if (!guardrailResult.passed && guardrailResult.refusalMessage) {
      const refusalMsg: ChatMessage = {
        id: messageId,
        role: 'assistant',
        content: guardrailResult.refusalMessage,
        timestamp,
        quickReplies: ['Track an Order', 'Return Policy & Link', 'Gear Recommendations', 'Connect with Live Agent']
      };
      return {
        message: refusalMsg,
        detectedIntent: 'guardrail_refusal',
        newContext: currentContext
      };
    }

    // 1. Layer 1: Intent Classification
    const classification = intentClassifier.classify(userText, currentContext);
    let resolvedIntent: IntentType = classification.intent;

    // Post-classification validation: downgrade spurious intents from Naive Bayes
    if (classification.method === 'naive_bayes_classifier' && !currentContext.pendingQuestion) {
      const lowerText = userText.toLowerCase();
      const hasDigits = /\d/.test(userText);
      const ORDER_KEYWORDS = ['order', 'package', 'shipment', 'tracking', 'delivery', 'parcel', 'shipped', 'deliver', 'ship'];
      const hasOrderKeyword = ORDER_KEYWORDS.some(kw => lowerText.includes(kw));

      if (resolvedIntent === 'order_tracking') {
        if (!hasOrderKeyword && !hasDigits) {
          resolvedIntent = 'fallback_scenario';
        }
      } else if (resolvedIntent === 'order_cancellation') {
        const CANCEL_KEYWORDS = ['cancel', 'cancellation', 'stop order', 'abort', 'don\'t want', 'dont want', 'not anymore', 'change size', 'wrong size', 'wrong item'];
        if (!CANCEL_KEYWORDS.some(kw => lowerText.includes(kw)) && !hasDigits) {
          resolvedIntent = 'fallback_scenario';
        }
      } else if (resolvedIntent === 'fallback_scenario' && hasOrderKeyword) {
        const isOrderVerb = /\b(want|like|going|need|trying)\s+to\s+order\b/i.test(userText)
          || /\border\s+(a|some|the|pizza|food|lunch|dinner|drinks?|coffee|clothes)\b/i.test(userText);
        if (!isOrderVerb) {
          resolvedIntent = 'order_tracking';
        }
      }
    }

    // Disambiguation: when classifier is ambiguous and no pending flow, ask user to clarify
    const SKIP_DISAMBIGUATION: IntentType[] = ['main_menu', 'gratitude_farewell', 'out_of_scope', 'fallback_scenario'];
    if (
      classification.isAmbiguous &&
      classification.method === 'naive_bayes_classifier' &&
      !currentContext.pendingQuestion &&
      !SKIP_DISAMBIGUATION.includes(resolvedIntent)
    ) {
      const sorted = Object.entries(classification.scores)
        .filter(([k]) => !SKIP_DISAMBIGUATION.includes(k as IntentType))
        .sort((a, b) => b[1] - a[1]);
      if (sorted.length >= 2 && sorted[0][1] - sorted[1][1] < 0.15) {
        const INTENT_LABELS: Record<string, string> = {
          order_tracking: 'Track an Order',
          return_exchange: 'Returns & Exchanges',
          order_cancellation: 'Cancel an Order',
          product_recommendation: 'Gear Recommendations',
          shipping_info: 'Shipping Speeds',
          human_handoff: 'Connect with Live Agent',
          defect_replacement: 'Replace Damaged Item',
          product_specs_inquiry: 'Product Specifications',
          pricing_inquiry: 'Product Pricing',
          store_info_contact: 'Store Contact Info',
          warranty_inquiry: 'Warranty Information'
        };
        const top2 = sorted.slice(0, 3).map(([k]) => INTENT_LABELS[k] || k).filter(Boolean);
        if (top2.length >= 2) {
          const disambigMsg: ChatMessage = {
            id: messageId,
            role: 'assistant',
            content: `I want to make sure I help you with the right thing. Did you mean:`,
            timestamp,
            quickReplies: [...top2, 'Return to Main Menu']
          };
          return {
            message: disambigMsg,
            detectedIntent: 'disambiguation',
            newContext: currentContext
          };
        }
      }
    }

    // Handle bare "no"/"nope" as farewell ONLY when no active multi-turn flow
    if (!currentContext.pendingQuestion) {
      const bareNo = userText.toLowerCase().trim();
      if (bareNo === 'no' || bareNo === 'nope' || bareNo === 'nah') {
        resolvedIntent = 'gratitude_farewell';
      }
    }

    // Multi-turn context overrides with topic-shift detection:
    // Only force the user into the pending flow if their message is relevant to it.
    // If they said something completely unrelated, let them escape naturally.
    const breakoutIntents: IntentType[] = ['main_menu', 'gratitude_farewell', 'human_handoff'];
    if (currentContext.pendingQuestion && !breakoutIntents.includes(resolvedIntent)) {
      const lowerForFlow = userText.toLowerCase();
      const hasDigitsForFlow = /\d/.test(userText);
      let isRelevantToFlow = true;

      if (currentContext.pendingQuestion === 'order_number' || currentContext.pendingQuestion === 'cancel_order_number') {
        const isOrderNoun = /\b(my|the|an|this|that)\s+order\b/i.test(userText)
          || /\border\s*#/i.test(userText)
          || /\border\s+\d/i.test(userText)
          || /\b(package|shipment|tracking|parcel)\b/i.test(lowerForFlow);
        const isShortResponse = userText.trim().split(/\s+/).length <= 3;
        isRelevantToFlow = hasDigitsForFlow || isShortResponse || isOrderNoun;
      } else if (currentContext.pendingQuestion === 'recommendation_activity') {
        isRelevantToFlow = true;
      } else if (currentContext.pendingQuestion.startsWith('cancel_') || currentContext.pendingQuestion === 'confirm_cancel') {
        const hasCancelRelevance = /\b(cancel|order|keep|confirm|yes|no|size|wrong|don't want|dont want)\b/i.test(lowerForFlow);
        const isShortResponse = userText.trim().split(/\s+/).length <= 4;
        isRelevantToFlow = hasCancelRelevance || hasDigitsForFlow || isShortResponse;
      } else if (currentContext.pendingQuestion === 'defect_order_number' || currentContext.pendingQuestion === 'delivered_order_action') {
        const hasRelevance = /\b(order|replace|return|refund|damaged|broken|size|swap)\b/i.test(lowerForFlow);
        const isShortResponse = userText.trim().split(/\s+/).length <= 4;
        isRelevantToFlow = hasRelevance || hasDigitsForFlow || isShortResponse;
      }

      if (isRelevantToFlow) {
        if (currentContext.pendingQuestion.startsWith('cancel_') || currentContext.pendingQuestion === 'confirm_cancel') {
          resolvedIntent = 'order_cancellation';
        } else if (currentContext.pendingQuestion === 'order_number') {
          resolvedIntent = 'order_tracking';
        } else if (currentContext.pendingQuestion === 'recommendation_activity') {
          resolvedIntent = 'product_recommendation';
        } else if (currentContext.pendingQuestion === 'defect_order_number' || currentContext.pendingQuestion === 'delivered_order_action') {
          resolvedIntent = 'defect_replacement';
        }
      } else {
        // Topic shift: clear pending state and re-validate the classified intent
        currentContext.pendingQuestion = undefined;
        currentContext.pendingRetries = 0;
        const lowerText = userText.toLowerCase();
        const hasDigits = /\d/.test(userText);

        if (resolvedIntent === 'order_tracking') {
          const ORDER_KW = ['order', 'package', 'shipment', 'tracking', 'delivery', 'parcel', 'shipped', 'deliver', 'ship'];
          if (!ORDER_KW.some(kw => lowerText.includes(kw)) && !hasDigits) {
            resolvedIntent = 'fallback_scenario';
          }
        } else if (resolvedIntent === 'order_cancellation') {
          const CANCEL_KW = ['cancel', 'cancellation', 'stop order', 'abort', 'don\'t want', 'dont want', 'not anymore', 'change size', 'wrong size', 'wrong item'];
          if (!CANCEL_KW.some(kw => lowerText.includes(kw)) && !hasDigits) {
            resolvedIntent = 'fallback_scenario';
          }
        }
      }
    }

    // Clear stale orderId when user starts an unrelated flow
    const ORDER_RELATED_INTENTS: IntentType[] = [
      'order_tracking', 'order_cancellation', 'defect_replacement',
      'shipping_info', 'order_disambiguation', 'order_issue_clarification'
    ];
    const ORDER_PENDING_QUESTIONS = ['order_number', 'cancel_', 'defect_order_number', 'delivered_order_action'];
    const hasPendingOrderFlow = currentContext.pendingQuestion &&
      ORDER_PENDING_QUESTIONS.some(p => currentContext.pendingQuestion!.startsWith(p));
    if (
      currentContext.orderId &&
      !ORDER_RELATED_INTENTS.includes(resolvedIntent) &&
      !hasPendingOrderFlow
    ) {
      currentContext.orderId = undefined;
    }

    // 2. Layer 2: Entity Extraction & Slot Filling
    const entities = entityExtractor.extract(userText, currentContext);

    // 3. Layer 3: Local Fuzzy Matching
    // Auto-match products or typos against inventory for product-related flows
    if (
      resolvedIntent === 'product_recommendation' ||
      resolvedIntent === 'product_specs_inquiry' ||
      resolvedIntent === 'pricing_inquiry' ||
      userText.toLowerCase().includes('tell me more') ||
      userText.toLowerCase().includes('about')
    ) {
      const fuzzyProduct = localFuzzyMatcher.matchProduct(userText);
      if (fuzzyProduct.isMatch && fuzzyProduct.item) {
        entities.matchedProduct = fuzzyProduct.item;
      }
    }

    // Check fuzzy order number
    const fuzzyOrder = localFuzzyMatcher.extractFuzzyOrderNumber(userText);
    if (fuzzyOrder) {
      entities.orderId = fuzzyOrder;
    }

    // If user provided ONLY an isolated order number without intent words, disambiguate
    if (entities.isDirectNumberOnly && !currentContext.pendingQuestion && resolvedIntent !== 'order_tracking') {
      resolvedIntent = 'order_disambiguation';
    }

    // 4. Layer 4: Response Matrix & Deterministic Template Rendering
    const renderResult = responseMatrix.renderResponse(
      resolvedIntent,
      entities,
      currentContext,
      userText
    );

    // Track pending flow retries (bounded loops)
    let finalContext = renderResult.newContext || {};
    if (finalContext.pendingQuestion && finalContext.pendingQuestion === currentContext.pendingQuestion) {
      finalContext.pendingRetries = (currentContext.pendingRetries || 0) + 1;
    } else {
      finalContext.pendingRetries = 0;
    }

    // Track consecutive fallbacks for proactive escalation
    if (resolvedIntent === 'fallback_scenario' || resolvedIntent === 'out_of_scope') {
      const prevCount = currentContext.consecutiveFallbacks || 0;
      finalContext.consecutiveFallbacks = prevCount + 1;
    } else {
      finalContext.consecutiveFallbacks = 0;
    }

    // Proactive escalation: after 2 consecutive fallbacks offer live agent, after 3 auto-connect
    let finalMessage = renderResult.message;
    let finalCard = renderResult.card;
    let finalQuickReplies = renderResult.quickReplies;
    if ((finalContext.consecutiveFallbacks || 0) >= 3 && resolvedIntent !== 'human_handoff') {
      const handoffResult = responseMatrix.renderHumanHandoff(userText);
      finalMessage = handoffResult.message;
      finalCard = handoffResult.card;
      finalQuickReplies = handoffResult.quickReplies;
      finalContext = handoffResult.newContext || {};
      finalContext.consecutiveFallbacks = 0;
    } else if ((finalContext.consecutiveFallbacks || 0) === 2 && resolvedIntent !== 'human_handoff') {
      finalMessage = `I can see I'm not quite understanding what you need, and I apologize for the inconvenience.\n\nWould you like me to **connect you with a Live Agent** who can assist you directly? Or you can try rephrasing your question — I'm best with order tracking, returns, gear recommendations, and shipping info.`;
      finalCard = {
        type: 'fallback_help',
        fallbackQuery: userText,
        title: 'Let Me Get You More Help',
        content: 'A live specialist can help with complex or unusual requests.'
      };
      finalQuickReplies = [
        'Connect with Live Agent',
        'Track an Order',
        'Return Policy & Link',
        'Gear Recommendations',
        'Return to Main Menu'
      ];
    }

    const botMessage: ChatMessage = {
      id: messageId,
      role: 'assistant',
      content: finalMessage,
      timestamp,
      card: finalCard,
      quickReplies: finalQuickReplies,
      isLiveAgentState: renderResult.isLiveAgentState ?? renderResult.newContext?.isLiveAgentState
    };

    return {
      message: botMessage,
      detectedIntent: resolvedIntent,
      newContext: finalContext
    };
  }
}

export const agentService = new AgentService();
