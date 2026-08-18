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

    // Post-classification validation: downgrade spurious order_tracking from Naive Bayes
    if (
      resolvedIntent === 'order_tracking' &&
      classification.method === 'naive_bayes_classifier' &&
      !currentContext.pendingQuestion
    ) {
      const lowerText = userText.toLowerCase();
      const ORDER_DOMAIN_KEYWORDS = ['order', 'package', 'shipment', 'tracking', 'delivery', 'parcel', 'shipped', 'deliver', 'ship'];
      const hasOrderKeyword = ORDER_DOMAIN_KEYWORDS.some(kw => lowerText.includes(kw));
      const hasDigits = /\d/.test(userText);

      if (!hasOrderKeyword && !hasDigits) {
        resolvedIntent = 'fallback_scenario';
      }
    }

    // Handle bare "no"/"nope" as farewell ONLY when no active multi-turn flow
    if (!currentContext.pendingQuestion) {
      const bareNo = userText.toLowerCase().trim();
      if (bareNo === 'no' || bareNo === 'nope' || bareNo === 'nah') {
        resolvedIntent = 'gratitude_farewell';
      }
    }

    // Multi-turn context overrides:
    // If we are waiting for a specific sub-turn response and the user didn't explicitly change topic
    const breakoutIntents: IntentType[] = ['main_menu', 'gratitude_farewell'];
    if (currentContext.pendingQuestion && !breakoutIntents.includes(resolvedIntent)) {
      if (currentContext.pendingQuestion.startsWith('cancel_') || currentContext.pendingQuestion === 'confirm_cancel') {
        resolvedIntent = 'order_cancellation';
      } else if (currentContext.pendingQuestion === 'order_number') {
        resolvedIntent = 'order_tracking';
      } else if (currentContext.pendingQuestion === 'recommendation_activity') {
        resolvedIntent = 'product_recommendation';
      } else if (currentContext.pendingQuestion === 'defect_order_number' || currentContext.pendingQuestion === 'delivered_order_action') {
        resolvedIntent = 'defect_replacement';
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

    // Track consecutive fallbacks for proactive escalation
    let finalContext = renderResult.newContext || {};
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
