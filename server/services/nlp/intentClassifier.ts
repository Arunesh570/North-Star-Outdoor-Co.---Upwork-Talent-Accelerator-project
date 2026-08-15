import { IntentType, ClassificationResult, DialogueContext } from './types.js';
import { localFuzzyMatcher } from './fuzzyMatcher.js';
import { synsetLemmatizer } from './synsetLemmatizer.js';
import { semanticVectorizer } from './semanticVectorizer.js';

interface TrainingDocument {
  text: string;
  intent: IntentType;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'by',
  'to', 'for', 'of', 'and', 'or', 'my', 'me', 'i', 'you', 'your', 'ur',
  'it', 'its', 'we', 'us', 'our', 'with', 'from', 'as', 'do', 'does',
  'can', 'could', 'would', 'will', 'have', 'has', 'had', 'please', 'pls'
]);

/**
 * Enterprise Training dataset of domain customer support utterances.
 */
const TRAINING_DATASET: TrainingDocument[] = [
  // 1. MAIN MENU & GREETINGS
  { text: 'menu', intent: 'main_menu' },
  { text: 'main menu', intent: 'main_menu' },
  { text: 'return to main menu', intent: 'main_menu' },
  { text: 'go to main menu', intent: 'main_menu' },
  { text: 'start over', intent: 'main_menu' },
  { text: 'restart conversation', intent: 'main_menu' },
  { text: 'reset chat', intent: 'main_menu' },
  { text: 'home', intent: 'main_menu' },
  { text: 'hello', intent: 'main_menu' },
  { text: 'hi there', intent: 'main_menu' },
  { text: 'hey north star', intent: 'main_menu' },
  { text: 'help menu', intent: 'main_menu' },
  { text: 'show options', intent: 'main_menu' },
  { text: 'good morning', intent: 'main_menu' },
  { text: 'good afternoon', intent: 'main_menu' },
  { text: 'good evening', intent: 'main_menu' },
  { text: 'howdy', intent: 'main_menu' },

  // 2. ORDER TRACKING
  { text: 'where is my order', intent: 'order_tracking' },
  { text: 'track my package', intent: 'order_tracking' },
  { text: 'track an order', intent: 'order_tracking' },
  { text: 'where is order 111', intent: 'order_tracking' },
  { text: 'track my order 222', intent: 'order_tracking' },
  { text: 'check status of order 333', intent: 'order_tracking' },
  { text: 'has my order shipped yet', intent: 'order_tracking' },
  { text: 'when will my package arrive', intent: 'order_tracking' },
  { text: 'is my order delivered', intent: 'order_tracking' },
  { text: 'delivery status for my package', intent: 'order_tracking' },
  { text: 'tracking number lookup', intent: 'order_tracking' },
  { text: 'where is my shipment', intent: 'order_tracking' },
  { text: 'check order status', intent: 'order_tracking' },
  { text: 'status of package', intent: 'order_tracking' },
  { text: 'find my parcel', intent: 'order_tracking' },

  // 3. RETURNS & EXCHANGES (STANDARD POLICY)
  { text: 'what is your return policy', intent: 'return_exchange' },
  { text: 'how do i return an item', intent: 'return_exchange' },
  { text: 'where is the return link', intent: 'return_exchange' },
  { text: 'return portal link', intent: 'return_exchange' },
  { text: '30 day return policy rules', intent: 'return_exchange' },
  { text: 'can i exchange my boots for another size', intent: 'return_exchange' },
  { text: 'i want to exchange my jacket for a larger size', intent: 'return_exchange' },
  { text: 'exchange an item for another size', intent: 'return_exchange' },
  { text: 'how do returns and exchanges work', intent: 'return_exchange' },
  { text: 'i need a refund for my order', intent: 'return_exchange' },
  { text: 'send back my product', intent: 'return_exchange' },
  { text: 'exchange policy details', intent: 'return_exchange' },
  { text: 'return instructions', intent: 'return_exchange' },
  { text: 'return window deadline', intent: 'return_exchange' },
  { text: 'money back policy', intent: 'return_exchange' },

  // 4. ORDER CANCELLATION
  { text: 'cancel my order', intent: 'order_cancellation' },
  { text: 'i want to cancel order 111', intent: 'order_cancellation' },
  { text: 'cancellation request', intent: 'order_cancellation' },
  { text: 'stop my shipment', intent: 'order_cancellation' },
  { text: 'i do not want this order anymore', intent: 'order_cancellation' },
  { text: 'cancel order immediately', intent: 'order_cancellation' },
  { text: 'abort order', intent: 'order_cancellation' },
  { text: 'change size of product ordered', intent: 'order_cancellation' },
  { text: 'swap item before shipping', intent: 'order_cancellation' },

  // 5. ORDER ISSUE CLARIFICATION (BROAD ISSUE)
  { text: 'i am facing a problem with the order', intent: 'order_issue_clarification' },
  { text: 'problem with my order', intent: 'order_issue_clarification' },
  { text: 'issue with order', intent: 'order_issue_clarification' },
  { text: 'trouble with my package', intent: 'order_issue_clarification' },
  { text: 'something is wrong with my order', intent: 'order_issue_clarification' },
  { text: 'need help with an order issue', intent: 'order_issue_clarification' },
  { text: 'my order has a problem', intent: 'order_issue_clarification' },

  // 6. DEFECT REPLACEMENT & MALFUNCTION (SPECIFIC DEFECT REQUEST)
  { text: 'i want to replace the order because it is malfunctioning', intent: 'defect_replacement' },
  { text: 'replace malfunctioning item', intent: 'defect_replacement' },
  { text: 'my product is broken and i need a replacement', intent: 'defect_replacement' },
  { text: 'defective product exchange', intent: 'defect_replacement' },
  { text: 'the zipper on my jacket broke', intent: 'defect_replacement' },
  { text: 'my tent arrived torn and damaged', intent: 'defect_replacement' },
  { text: 'item is faulty need replacement', intent: 'defect_replacement' },
  { text: 'damaged gear replacement claim', intent: 'defect_replacement' },

  // 7. PRODUCT RECOMMENDATIONS
  { text: 'can you recommend some outdoor gear', intent: 'product_recommendation' },
  { text: 'gear finder quiz', intent: 'product_recommendation' },
  { text: 'what should i buy for a rainy hike', intent: 'product_recommendation' },
  { text: 'recommend a waterproof rain jacket', intent: 'product_recommendation' },
  { text: 'looking for camping tents', intent: 'product_recommendation' },
  { text: 'suggest a warm sleeping bag for cold weather', intent: 'product_recommendation' },
  { text: 'best hiking boots for rocky trails', intent: 'product_recommendation' },
  { text: 'backpack recommendations for multi day trek', intent: 'product_recommendation' },
  { text: 'what gear do i need for backpacking', intent: 'product_recommendation' },
  { text: 'suggest outdoor clothing and apparel', intent: 'product_recommendation' },
  { text: 'recommendations for camping trip', intent: 'product_recommendation' },

  // 8. PRODUCT SPECS & DETAILS DEEP DIVE
  { text: 'what is the waterproof rating of the rain jacket', intent: 'product_specs_inquiry' },
  { text: 'how much does the alpinedome tent weigh', intent: 'product_specs_inquiry' },
  { text: 'what is the temperature rating on the sleeping bag', intent: 'product_specs_inquiry' },
  { text: 'tell me the specifications of the hiking boots', intent: 'product_specs_inquiry' },
  { text: 'what fabric is the grid fleece made of', intent: 'product_specs_inquiry' },
  { text: 'does the backpack have internal frame', intent: 'product_specs_inquiry' },
  { text: 'tell me about the materials and specs', intent: 'product_specs_inquiry' },
  { text: 'how heavy is the tent', intent: 'product_specs_inquiry' },

  // 9. PRICING & COST INQUIRIES
  { text: 'how much is the alpinedome tent', intent: 'pricing_inquiry' },
  { text: 'what is the price of the rain jacket', intent: 'pricing_inquiry' },
  { text: 'cost of hiking boots', intent: 'pricing_inquiry' },
  { text: 'how much does the sleeping bag cost', intent: 'pricing_inquiry' },
  { text: 'price check for backpack', intent: 'pricing_inquiry' },
  { text: 'how much do your products cost', intent: 'pricing_inquiry' },

  // 10. STORE INFO & CONTACT
  { text: 'what is your customer support email', intent: 'store_info_contact' },
  { text: 'what are your store hours', intent: 'store_info_contact' },
  { text: 'where are you located', intent: 'store_info_contact' },
  { text: 'how do i contact north star outdoor co', intent: 'store_info_contact' },
  { text: 'support email and phone number', intent: 'store_info_contact' },
  { text: 'customer service hours', intent: 'store_info_contact' },

  // 11. WARRANTY & GUARANTEE
  { text: 'what is your warranty policy', intent: 'warranty_inquiry' },
  { text: "what's the warrenty", intent: 'warranty_inquiry' },
  { text: 'what is the warrenty', intent: 'warranty_inquiry' },
  { text: 'what is the warranty', intent: 'warranty_inquiry' },
  { text: 'do you offer warranty on gear', intent: 'warranty_inquiry' },
  { text: 'lifetime craftsmanship guarantee', intent: 'warranty_inquiry' },
  { text: 'is there a warranty for damaged items', intent: 'warranty_inquiry' },
  { text: 'guarantee policy details', intent: 'warranty_inquiry' },

  // 12. SHIPPING INFORMATION
  { text: 'how long does shipping take', intent: 'shipping_info' },
  { text: 'shipping speeds and delivery times', intent: 'shipping_info' },
  { text: 'how fast is standard shipping', intent: 'shipping_info' },
  { text: 'how fast is expedited shipping', intent: 'shipping_info' },
  { text: 'delivery transit time', intent: 'shipping_info' },
  { text: 'when do orders dispatch', intent: 'shipping_info' },
  { text: 'shipping options and rates', intent: 'shipping_info' },

  // 13. HUMAN HANDOFF
  { text: 'i need to speak with a live agent', intent: 'human_handoff' },
  { text: 'talk to a real human person', intent: 'human_handoff' },
  { text: 'connect me with customer support representative', intent: 'human_handoff' },
  { text: 'transfer me to manager specialist', intent: 'human_handoff' },
  { text: 'human assistance needed', intent: 'human_handoff' },
  { text: 'escalate this conversation to an agent', intent: 'human_handoff' },
  { text: 'speak with someone on your team', intent: 'human_handoff' },
  { text: 'live chat with support specialist', intent: 'human_handoff' },

  // 14. GRATITUDE & FAREWELLS
  { text: 'thank you', intent: 'gratitude_farewell' },
  { text: 'thanks', intent: 'gratitude_farewell' },
  { text: 'thank you so much', intent: 'gratitude_farewell' },
  { text: 'thanks a lot', intent: 'gratitude_farewell' },
  { text: 'thanks for the help', intent: 'gratitude_farewell' },
  { text: 'appreciate your help', intent: 'gratitude_farewell' },
  { text: 'appreciate it', intent: 'gratitude_farewell' },
  { text: 'ty', intent: 'gratitude_farewell' },
  { text: 'thx', intent: 'gratitude_farewell' },
  { text: 'thank u', intent: 'gratitude_farewell' },
  { text: 'perfect thank you', intent: 'gratitude_farewell' },
  { text: 'great thanks', intent: 'gratitude_farewell' },
  { text: 'awesome thank you', intent: 'gratitude_farewell' },
  { text: 'goodbye', intent: 'gratitude_farewell' },
  { text: 'bye', intent: 'gratitude_farewell' },
  { text: 'have a great day', intent: 'gratitude_farewell' },
  { text: 'have a good day', intent: 'gratitude_farewell' },
  { text: 'take care', intent: 'gratitude_farewell' },
  { text: 'see you later', intent: 'gratitude_farewell' },
  { text: 'bye bye', intent: 'gratitude_farewell' },

  // 15. OUT OF SCOPE / FALLBACK
  { text: 'tell me a joke about airplanes', intent: 'out_of_scope' },
  { text: 'write a python function to sort an array', intent: 'out_of_scope' },
  { text: 'who won the super bowl last year', intent: 'out_of_scope' },
  { text: 'what is the capital of france', intent: 'out_of_scope' },
  { text: 'tell me about quantum computing', intent: 'out_of_scope' },
  { text: 'sing a song for me', intent: 'out_of_scope' },
  { text: 'solve this math problem', intent: 'out_of_scope' }
];

export class IntentClassifier {
  private vocabulary: Set<string> = new Set();
  private classDocCounts: Record<IntentType, number> = {} as Record<IntentType, number>;
  private classWordCounts: Record<IntentType, Record<string, number>> = {} as Record<IntentType, Record<string, number>>;
  private classTotalWords: Record<IntentType, number> = {} as Record<IntentType, number>;
  private totalDocs = 0;
  private allIntents: IntentType[] = [
    'main_menu',
    'order_tracking',
    'return_exchange',
    'order_cancellation',
    'order_issue_clarification',
    'defect_replacement',
    'product_recommendation',
    'product_specs_inquiry',
    'pricing_inquiry',
    'store_info_contact',
    'warranty_inquiry',
    'shipping_info',
    'human_handoff',
    'gratitude_farewell',
    'out_of_scope'
  ];

  constructor() {
    this.train();
    semanticVectorizer.initialize(TRAINING_DATASET);
  }

  /**
   * Trains Naive Bayes probabilities with Laplace smoothing.
   */
  private train(): void {
    for (const intent of this.allIntents) {
      this.classDocCounts[intent] = 0;
      this.classWordCounts[intent] = {};
      this.classTotalWords[intent] = 0;
    }

    for (const doc of TRAINING_DATASET) {
      this.totalDocs++;
      this.classDocCounts[doc.intent] = (this.classDocCounts[doc.intent] || 0) + 1;

      const tokens = this.tokenize(doc.text);
      for (const token of tokens) {
        this.vocabulary.add(token);
        this.classWordCounts[doc.intent][token] = (this.classWordCounts[doc.intent][token] || 0) + 1;
        this.classTotalWords[doc.intent] = (this.classTotalWords[doc.intent] || 0) + 1;
      }
    }
  }

  /**
   * Tokenizes text into unigrams and lemmatized tokens.
   */
  private tokenize(text: string): string[] {
    const clean = text
      .toLowerCase()
      .replace(/[^a-z0-9\s#]/g, ' ')
      .trim();

    const raw = clean.split(/\s+/).filter(w => Boolean(w) && !STOP_WORDS.has(w));
    const lemmatized = synsetLemmatizer.lemmatizeTokens(raw);
    return [...raw, ...lemmatized];
  }

  /**
   * Main classification method using multi-strategy ensemble scoring.
   */
  public classify(text: string, context?: DialogueContext): ClassificationResult {
    const raw = text.trim();
    if (!raw) {
      return {
        intent: 'main_menu',
        confidence: 1.0,
        scores: { main_menu: 1.0 },
        method: 'deterministic_pattern',
        isAmbiguous: false,
        rawInput: text
      };
    }

    // 1. Check if user is in an active Live Agent session
    if (context?.isLiveAgentState) {
      const lower = raw.toLowerCase();
      if (
        lower === 'menu' ||
        lower === 'main menu' ||
        lower.includes('return to main menu') ||
        lower.includes('back to bot') ||
        lower.includes('exit agent')
      ) {
        return {
          intent: 'main_menu',
          confidence: 1.0,
          scores: { main_menu: 1.0 },
          method: 'deterministic_pattern',
          isAmbiguous: false,
          rawInput: text
        };
      }

      return {
        intent: 'live_agent_chat',
        confidence: 1.0,
        scores: { live_agent_chat: 1.0 },
        method: 'context_override',
        isAmbiguous: false,
        rawInput: text
      };
    }

    // 2. High-precision deterministic patterns
    const deterministicIntent = this.checkDeterministicPatterns(raw);
    if (deterministicIntent) {
      return {
        intent: deterministicIntent,
        confidence: 1.0,
        scores: { [deterministicIntent]: 1.0 },
        method: 'deterministic_pattern',
        isAmbiguous: false,
        rawInput: text
      };
    }

    // 3. Semantic Vectorizer (TF-IDF Cosine Similarity)
    const vectorResult = semanticVectorizer.classify(raw);
    if (vectorResult.maxSimilarity >= 0.55 && vectorResult.bestIntent !== 'out_of_scope') {
      return {
        intent: vectorResult.bestIntent,
        confidence: vectorResult.maxSimilarity,
        scores: vectorResult.scores,
        method: 'semantic_vectorizer',
        isAmbiguous: false,
        rawInput: text
      };
    }

    // 4. Statistical Naive Bayes Classifier
    const tokens = this.tokenize(raw);
    const vocabSize = this.vocabulary.size;
    const logPosteriors: Record<IntentType, number> = {} as Record<IntentType, number>;

    for (const intent of this.allIntents) {
      const prior = Math.log((this.classDocCounts[intent] + 1) / (this.totalDocs + this.allIntents.length));
      let logLikelihood = 0;
      const totalWordsInClass = this.classTotalWords[intent];

      for (const token of tokens) {
        const count = this.classWordCounts[intent]?.[token] || 0;
        const prob = (count + 1) / (totalWordsInClass + vocabSize);
        logLikelihood += Math.log(prob);
      }

      logPosteriors[intent] = prior + logLikelihood;
    }

    // Convert log-posteriors to normalized probabilities (Softmax)
    const maxLog = Math.max(...Object.values(logPosteriors));
    const expScores: Record<string, number> = {};
    let sumExp = 0;

    for (const [intent, score] of Object.entries(logPosteriors)) {
      const expVal = Math.exp(score - maxLog);
      expScores[intent] = expVal;
      sumExp += expVal;
    }

    const probabilities: Record<string, number> = {};
    for (const [intent, expVal] of Object.entries(expScores)) {
      probabilities[intent] = Math.round((expVal / sumExp) * 1000) / 1000;
    }

    // Rank intents by probability
    const sorted = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
    const [topIntent, topProb] = sorted[0];
    const secondProb = sorted[1] ? sorted[1][1] : 0;

    const isAmbiguous = topProb - secondProb < 0.15 && topProb < 0.45;
    const finalIntent: IntentType =
      topIntent === 'out_of_scope' || topProb < 0.25
        ? 'fallback_scenario'
        : (topIntent as IntentType);

    return {
      intent: finalIntent,
      confidence: topProb,
      scores: probabilities,
      method: 'naive_bayes_classifier',
      isAmbiguous,
      rawInput: text
    };
  }

  /**
   * High-precision deterministic pattern matchers for instant identification.
   */
  private checkDeterministicPatterns(text: string): IntentType | null {
    const l = text.toLowerCase().trim();

    // 1. Isolated order numbers (e.g., "111", "#111", "order 222")
    if (/^(?:#\s*|\b)?\d{3}\b$/i.test(l) || /^(?:order|package|ordr)\s*#?\s*\d{3}$/i.test(l)) {
      return 'order_disambiguation';
    }

    // 2. Gratitude & Farewells (includes unambiguous conversational closers)
    if (
      l === 'thank you' ||
      l === 'thanks' ||
      l === 'thx' ||
      l === 'ty' ||
      l === 'thank u' ||
      l.includes('thank you') ||
      l.includes('thanks') ||
      l.includes('thank u') ||
      l.includes('appreciate it') ||
      l.includes('appreciate your help') ||
      l === 'goodbye' ||
      l === 'bye' ||
      l === 'bye bye' ||
      l.includes('goodbye') ||
      l.includes('have a great day') ||
      l.includes('have a good day') ||
      l.includes('take care') ||
      l.includes('see you later') ||
      l === 'im good' ||
      l === "i'm good" ||
      l === 'all good' ||
      l === "that's all" ||
      l === 'thats all' ||
      l === "that's it" ||
      l === 'thats it' ||
      l === 'nothing else' ||
      l === 'no thanks' ||
      l === 'no thank you' ||
      l === 'nope all good' ||
      l === 'nope thanks' ||
      l === 'no im good' ||
      l === "no i'm good"
    ) {
      return 'gratitude_farewell';
    }

    // 3. Main menu / greetings / navigation back / help
    if (
      l === 'menu' ||
      l === 'main menu' ||
      localFuzzyMatcher.hasFuzzyCategory(l, 'menu') ||
      l.includes('return to main menu') ||
      l.includes('start over') ||
      l.includes('restart') ||
      l === 'home' ||
      /^h+i+$/i.test(l) ||
      /^he+l+o+$/i.test(l) ||
      /^he+y+$/i.test(l) ||
      l === 'hey there' ||
      l === 'yo' ||
      l === 'sup' ||
      l === 'wassup' ||
      l === "what's up" ||
      l === 'whats up' ||
      l === 'good morning' ||
      l === 'good afternoon' ||
      l === 'good evening' ||
      l === 'howdy' ||
      l.includes('how are you') ||
      l === 'go back' ||
      l === 'back' ||
      l === 'never mind' ||
      l === 'nevermind' ||
      l === 'i changed my mind' ||
      l === 'cancel that' ||
      l === 'forget it' ||
      l === 'forget that' ||
      l === 'help' ||
      l === 'help me' ||
      l === 'options' ||
      l === 'what can you do' ||
      l === 'what do you do' ||
      l === 'what can you help with' ||
      l === 'show me what you can do' ||
      l === 'what are your features'
    ) {
      return 'main_menu';
    }

    // 4. Explicit human handoff (includes frustration, complaints, and complex issues)
    if (
      localFuzzyMatcher.hasFuzzyCategory(l, 'agent') ||
      l.includes('live agent') ||
      l.includes('speak with someone') ||
      l.includes('talk to someone') ||
      l.includes('real person') ||
      l.includes('human agent') ||
      l.includes('talk to a human') ||
      l.includes('speak to human') ||
      l.includes('customer care representative') ||
      l.includes('connect with live agent') ||
      l.includes('file a complaint') ||
      l.includes('make a complaint') ||
      l.includes('charged twice') ||
      l.includes('double charged') ||
      l.includes('billing error') ||
      l.includes('payment issue') ||
      l.includes('wrong address') ||
      l.includes('change my address') ||
      l.includes('change address') ||
      l.includes('package stolen') ||
      l.includes('package was stolen') ||
      l.includes('never received') ||
      l.includes('this is urgent') ||
      l.includes('urgent matter') ||
      l.includes('frustrated') ||
      l.includes('frustrating') ||
      l.includes('not helpful') ||
      l.includes('not helping') ||
      l.includes('useless') ||
      l.includes('terrible') ||
      l.includes('worst') ||
      l.includes("you don't understand") ||
      l.includes('you dont understand') ||
      l.includes("doesn't work") ||
      l.includes('doesnt work') ||
      l.includes("can't help") ||
      l.includes('cant help')
    ) {
      return 'human_handoff';
    }

    // 5. Defect Replacement & Malfunction (Specific Defect)
    if (
      l.includes('damaged') ||
      l.includes('broken') ||
      l.includes('malfunction') ||
      l.includes('malfunctioning') ||
      l.includes('defect') ||
      l.includes('defective') ||
      l.includes('faulty') ||
      l.includes('torn') ||
      l.includes('ripped') ||
      l.includes('leaking') ||
      l.includes('not working') ||
      l.includes('replace item') ||
      l.includes('replace damaged')
    ) {
      return 'defect_replacement';
    }

    // 6. Broad Order Issue Clarification
    if (
      (l.includes('facing a problem') ||
        l.includes('problem with') ||
        l.includes('issue with') ||
        l.includes('trouble with') ||
        l.includes('wrong with') ||
        l.includes('help with my order')) &&
      (l.includes('order') || l.includes('package') || l.includes('shipment')) &&
      !l.includes('track') &&
      !l.includes('malfunction')
    ) {
      return 'order_issue_clarification';
    }

    // 7. Product Specs Inquiry
    if (
      l.includes('waterproof rating') ||
      l.includes('waterproofing') ||
      l.includes('how much does') && l.includes('weigh') ||
      l.includes('weight of') ||
      l.includes('how heavy') ||
      l.includes('temperature rating') ||
      l.includes('specs of') ||
      l.includes('specifications') ||
      l.includes('what fabric') ||
      l.includes('what material')
    ) {
      return 'product_specs_inquiry';
    }

    // 8. Pricing & Cost Inquiry
    if (
      (l.includes('how much is') ||
        l.includes('how much does') ||
        l.includes('price of') ||
        l.includes('cost of') ||
        l.includes('pricing for')) &&
      !l.includes('shipping')
    ) {
      return 'pricing_inquiry';
    }

    // 9. Store Info & Contact
    if (
      l.includes('support email') ||
      l.includes('customer service email') ||
      l.includes('store hours') ||
      l.includes('business hours') ||
      l.includes('opening hours') ||
      l.includes('where are you located') ||
      l.includes('headquarters') ||
      l.includes('contact north star')
    ) {
      return 'store_info_contact';
    }

    // 10. Warranty & Guarantee
    if (
      localFuzzyMatcher.hasFuzzyCategory(l, 'warranty') ||
      synsetLemmatizer.hasSynset(l, 'warranty') ||
      l.includes('warranty') ||
      l.includes('warrenty') ||
      l.includes('waranty') ||
      l.includes('warenty') ||
      l.includes('guarantee') ||
      l.includes('guaranty') ||
      l.includes('garantee') ||
      l.includes('craftsmanship')
    ) {
      return 'warranty_inquiry';
    }

    // 11. Order tracking explicit (including contractions)
    if (
      l.includes('track') ||
      localFuzzyMatcher.hasFuzzyCategory(l, 'track') ||
      l.includes('where is my order') ||
      l.includes('where is order') ||
      l.includes('where is my package') ||
      l.includes("where's my order") ||
      l.includes("where's my package") ||
      l.includes('wheres my order') ||
      l.includes('wheres my package') ||
      l.includes('status of order') ||
      l.includes('status of my order') ||
      l.includes('order status') ||
      l.includes('has order') ||
      l.includes('has my order') ||
      l.includes('track my package') ||
      l.includes('check on my order') ||
      l.includes('check my order')
    ) {
      return 'order_tracking';
    }

    // 12. Cancellation explicit
    if (
      localFuzzyMatcher.hasFuzzyCategory(l, 'cancel') ||
      l.includes('cancel my order') ||
      l.includes('cancel order') ||
      l.includes('cancellation') ||
      l.includes('stop order') ||
      l.includes('change the size') ||
      l.includes('change size') ||
      l.includes('size change') ||
      l.includes("don't want it") ||
      l.includes('dont want it') ||
      l.includes("don't want this") ||
      l.includes('dont want this') ||
      l.includes("don't need it") ||
      l.includes('dont need it')
    ) {
      return 'order_cancellation';
    }

    // 13. Returns & exchanges explicit
    if (
      localFuzzyMatcher.hasFuzzyCategory(l, 'return') ||
      l.includes('return policy') ||
      l.includes('returns link') ||
      l.includes('returns and exchanges') ||
      l.includes('start a return') ||
      l.includes('how do i return') ||
      l.includes('30-day return') ||
      l.includes('30 day return') ||
      l.includes('return portal') ||
      l.includes('exchange') ||
      l.includes('exchanges') ||
      l.includes('swap') ||
      (l.includes('change') && l.includes('size') && !l.includes('cancel')) ||
      (l.includes('different size') && !l.includes('cancel'))
    ) {
      return 'return_exchange';
    }

    // 14. Shipping info explicit (general or personalized with order number)
    if (
      (localFuzzyMatcher.hasFuzzyCategory(l, 'shipping') ||
        l.includes('shipping speed') ||
        l.includes('shipping speeds') ||
        l.includes('how long does shipping take') ||
        l.includes('how fast is shipping') ||
        l.includes('how fast will') ||
        l.includes('how fast does') ||
        l.includes('delivery time') ||
        l.includes('standard shipping') ||
        l.includes('expedited shipping')) &&
      !l.includes('where is') &&
      !l.includes('status of')
    ) {
      return 'shipping_info';
    }

    // 15. Product recommendation explicit
    if (
      localFuzzyMatcher.hasFuzzyCategory(l, 'recommend') ||
      l.includes('gear recommendations') ||
      l.includes('gear finder') ||
      l.includes('recommend some outdoor gear') ||
      l.includes('what gear do you recommend') ||
      l.includes('recommend gear') ||
      l.includes('rainy & wet') ||
      l.includes('cold weather & winter') ||
      l.includes('weekend overnight camping') ||
      l.includes('multi-day backpacking') ||
      l.includes('rocky alpine footwear') ||
      l.includes('explore another activity') ||
      l.includes('explore another') ||
      l.includes('show me more gear') ||
      l.includes('other gear') ||
      l.includes('more recommendations') ||
      l.includes('rainy trail hiking') ||
      l.includes('cold weather layering') ||
      l.includes('alpine footwear')
    ) {
      return 'product_recommendation';
    }

    return null;
  }
}

export const intentClassifier = new IntentClassifier();
