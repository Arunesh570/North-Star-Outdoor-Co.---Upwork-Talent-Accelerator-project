import { db } from '../../db/database.js';
import {
  IntentType,
  ExtractedEntities,
  DialogueContext,
  TemplateRenderResult
} from './types.js';
import { RichCardData, Order, Product, ReturnPolicyInfo, ShippingPolicyInfo, SupportTicket } from '../../types.js';

export class ResponseMatrix {
  /**
   * Main dispatch entry point for deterministic template rendering.
   */
  public renderResponse(
    intent: IntentType,
    entities: ExtractedEntities,
    context: DialogueContext,
    userText: string
  ): TemplateRenderResult {
    // 1. Check if user is currently inside a Live Agent session
    if (context.isLiveAgentState) {
      const lowerText = userText.toLowerCase().trim();
      const EXPLICIT_EXIT_PHRASES = [
        'menu', 'main menu', 'return to main menu', 'back to bot',
        'exit agent', 'exit', 'leave', 'go back', 'back to menu'
      ];
      const isExplicitExit = EXPLICIT_EXIT_PHRASES.some(
        phrase => lowerText === phrase || lowerText.includes(phrase)
      );
      if (!isExplicitExit) {
        return this.renderLiveAgentChat(userText);
      }
    }

    // 2. Route to specialized deterministic template handlers
    switch (intent) {
      case 'main_menu':
        return this.renderMainMenu();

      case 'order_tracking':
        return this.renderOrderTracking(entities, context);

      case 'return_exchange':
        return this.renderReturnPolicy(entities, context, userText);

      case 'order_cancellation':
        return this.renderCancellationFlow(entities, context, userText);

      case 'product_recommendation':
        return this.renderProductRecommendation(entities, context, userText);

      case 'shipping_info':
        return this.renderShippingInfo(entities, context, userText);

      case 'human_handoff':
        return this.renderHumanHandoff(userText);

      case 'order_disambiguation':
        return this.renderOrderDisambiguation(entities);

      case 'order_issue_clarification':
        return this.renderOrderIssueClarification(entities, context, userText);

      case 'defect_replacement':
        return this.renderDefectReplacement(entities, context, userText);

      case 'product_specs_inquiry':
        return this.renderProductSpecsInquiry(entities, context, userText);

      case 'pricing_inquiry':
        return this.renderPricingInquiry(entities, context, userText);

      case 'store_info_contact':
        return this.renderStoreInfoContact();

      case 'warranty_inquiry':
        return this.renderWarrantyInquiry();

      case 'gratitude_farewell':
        return this.renderGratitudeFarewell(userText);

      case 'out_of_scope':
      case 'fallback_scenario':
      default:
        return this.renderFallback(userText);
    }
  }

  /**
   * Deterministic Template: Main Menu / Welcome Greeting
   */
  public renderMainMenu(): TemplateRenderResult {
    const message = `Hello! I'm the **North Star Support Bot**, your friendly guide for **North Star Outdoor Co.**

I can help you right away with:
• **Order Tracking**: Check real-time shipping on orders (e.g., **#111**, **#222**, **#333**)
• **Returns & Exchanges**: 30-day return policy & self-service return link
• **Product Recommendations**: Tailored outdoor apparel & camping gear
• **Shipping Speeds**: Standard (3-5 days) and Expedited (1-2 days)

How can I help you on your trail today?`;

    return {
      message,
      quickReplies: [
        'Track an Order',
        'Return Policy & Link',
        'Gear Recommendations',
        'Shipping Speeds',
        'Return to Main Menu'
      ],
      newContext: {
        isLiveAgentState: false
      }
    };
  }

  /**
   * Deterministic Template: Order Tracking
   */
  public renderOrderTracking(entities: ExtractedEntities, context: DialogueContext): TemplateRenderResult {
    const orderId = entities.orderId || context.orderId;

    if (!orderId) {
      if (context.pendingQuestion === 'order_number') {
        return {
          message: "I didn't recognize a valid order number in that. Our order numbers are 3 digits — for example **#111**, **#222**, or **#333**. Could you try again?",
          quickReplies: ['Order #111', 'Order #222', 'Order #333', 'Return to Main Menu'],
          newContext: {
            pendingQuestion: 'order_number'
          }
        };
      }
      return {
        message: 'What is your **order number**? (e.g. **#111**, **#222**, or **#333**)',
        quickReplies: ['Order #111', 'Order #222', 'Order #333', 'Return to Main Menu'],
        newContext: {
          pendingQuestion: 'order_number'
        }
      };
    }

    const order = db.getOrder(orderId);

    if (order) {
      if (order.id === '111') {
        return {
          message: 'Here is the tracking status for **Order #111**:',
          card: {
            type: 'order_status',
            order,
            title: 'Order Status: #111'
          },
          quickReplies: ['Track Order #222', 'Track Order #333', 'Check Return Policy', 'Return to Main Menu'],
          newContext: {
            orderId: '111'
          }
        };
      }

      if (order.id === '222') {
        return {
          message: 'Here is the current status for **Order #222**:',
          card: {
            type: 'order_status',
            order,
            title: 'Order Status: #222'
          },
          quickReplies: ['Track Order #111', 'Track Order #333', 'Shipping Speeds', 'Return to Main Menu'],
          newContext: {
            orderId: '222'
          }
        };
      }

      if (order.id === '333') {
        return {
          message: 'Here is the delivery summary for **Order #333**:\n\nDid everything arrive in great shape, or would you like help with sizing, exchanges, or returns?',
          card: {
            type: 'order_status',
            order,
            title: 'Order Status: #333'
          },
          quickReplies: ['Help with Sizing / Exchange', 'Check Return Policy', 'Track another order', 'Return to Main Menu'],
          newContext: {
            orderId: '333',
            pendingQuestion: 'delivered_order_action'
          }
        };
      }
    }

    // Invalid Order
    return {
      message: `I couldn't find an order matching **#${orderId}** in our system. Please double-check your order number and try again. You can find it in your order confirmation email.`,
      card: {
        type: 'order_invalid',
        title: 'Order Not Found',
        content: `No active order was found for #${orderId}.`
      },
      quickReplies: ['Try Order #111', 'Try Order #222', 'Try Order #333', 'Return Policy & Link', 'Return to Main Menu'],
      newContext: {}
    };
  }

  /**
   * Deterministic Template: Return & Exchange Policy
   */
  public renderReturnPolicy(
    entities?: ExtractedEntities,
    context?: DialogueContext,
    userText?: string
  ): TemplateRenderResult {
    const orderId = entities?.orderId || context?.orderId;
    const lower = userText?.toLowerCase() || '';

    // If an order ID is present and user requested a return/exchange for that order
    if (orderId) {
      const order = db.getOrder(orderId);
      if (!order) {
        return {
          message: `I couldn't find an order matching **#${orderId}** in our system. Please double-check your order number and try again. You can find it in your order confirmation email.`,
          card: {
            type: 'order_invalid',
            title: 'Order Not Found',
            content: `No active order was found for #${orderId}.`
          },
          quickReplies: ['Try Order #111', 'Try Order #222', 'Try Order #333', 'Return to Main Menu'],
          newContext: {}
        };
      }
      if (order) {
        // If user already specified an explicit reason / action:
        const isExplicitDefect =
          lower.includes('damaged') ||
          lower.includes('broken') ||
          lower.includes('defective') ||
          lower.includes('defect') ||
          lower.includes('faulty') ||
          lower.includes('torn') ||
          lower.includes('ripped') ||
          lower.includes('malfunction') ||
          (context?.pendingQuestion === 'delivered_order_action' && lower.includes('replace'));

        if (isExplicitDefect) {
          return {
            message: `Your replacement has been scheduled for **Order #${order.id}**!\n\n• **Reason**: Damaged / Defective Item\n• **Pickup**: Your current item will be picked up by our courier within **1 to 2 business days**.\n• **Express Dispatch**: The brand new replacement product will arrive by **express delivery** as soon as possible to you.\n\nWe sincerely apologize for the inconvenience caused! Is there anything else you need help with?`,
            quickReplies: ['Track an Order', 'Shipping Speeds', 'Return to Main Menu'],
            newContext: {}
          };
        }

        const isExplicitSize =
          lower.includes('wrong size') ||
          lower.includes('size swap') ||
          lower.includes('sizing') ||
          lower.includes('larger size') ||
          lower.includes('smaller size') ||
          lower.includes('different size') ||
          (context?.pendingQuestion === 'delivered_order_action' && lower.includes('swap'));

        if (isExplicitSize) {
          return {
            message: `Your exchange request has been scheduled for **Order #${order.id}**!\n\n• **Reason**: Sizing Exchange\n• **Pickup**: Our courier will pick up your item in its original packaging within **1 to 2 business days**.\n• **Express Dispatch**: Your replacement size will be dispatched via **express delivery** once pickup is verified.`,
            quickReplies: ['Track an Order', 'Shipping Speeds', 'Return to Main Menu'],
            newContext: {}
          };
        }

        const isExplicitRefund =
          lower.includes('refund') ||
          lower.includes('send back for refund') ||
          lower.includes('money back') ||
          (context?.pendingQuestion === 'delivered_order_action' && lower.includes('return')) ||
          (context?.pendingQuestion === 'delivered_order_action' && (
            lower.includes("don't want") ||
            lower.includes('dont want') ||
            lower.includes("don't need") ||
            lower.includes('dont need') ||
            lower.includes("don't like") ||
            lower.includes('dont like') ||
            lower.includes('not satisfied') ||
            lower.includes('not happy') ||
            lower.includes('not what i') ||
            lower.includes('by mistake') ||
            lower.includes('ordered wrong') ||
            lower.includes('changed my mind') ||
            lower.includes('change my mind')
          ));

        if (isExplicitRefund) {
          return {
            message: `Your return request has been scheduled for **Order #${order.id}**.\n\n• **Pickup**: Your order will be picked up by our courier within **1 to 2 business days**.\n• **Refund**: Once the package reaches our origin warehouse and passes inspection, your payment will be refunded 100% to your original payment mode within 3–5 business days.`,
            quickReplies: ['Track an Order', 'Return Policy & Link', 'Return to Main Menu'],
            newContext: {}
          };
        }

        // If already asked and user gave unrecognized reason, default to return
        if (context?.pendingQuestion === 'delivered_order_action') {
          return {
            message: `Your return request has been scheduled for **Order #${order.id}**.\n\n• **Reason**: ${userText}\n• **Pickup**: Your order will be picked up by our courier within **1 to 2 business days**.\n• **Refund**: Once the package reaches our origin warehouse and passes inspection, your payment will be refunded 100% to your original payment mode within 3–5 business days.`,
            quickReplies: ['Track an Order', 'Return Policy & Link', 'Return to Main Menu'],
            newContext: {}
          };
        }

        // First time: show Order Card + ask user for action/reason
        return {
          message: `I found **Order #${order.id}** (${order.status}). What is the reason for your replacement or return?`,
          card: {
            type: 'order_status',
            order,
            title: `Order #${order.id}`
          },
          quickReplies: [
            '🛠️ Replace Damaged Item',
            '🔄 Sizing Swap',
            '📦 Return for Refund',
            'Return to Main Menu'
          ],
          newContext: {
            orderId: order.id,
            pendingQuestion: 'delivered_order_action'
          }
        };
      }
    }

    const policy: ReturnPolicyInfo = db.getReturnPolicy();

    const message = `### North Star Return & Exchange Policy

We want you to love your gear out on the trail! Here is our simple return policy:

• **30-Day Window**: Returns and exchanges are accepted within **30 days** of delivery.
• **Condition**: Items must be **unused** and in brand-new condition.
• **Packaging**: **Original packaging** and hangtags are required.

You can start an exchange or download your return label online directly at [northstaroutdoor.com/returns](${policy.returnsUrl}).`;

    return {
      message,
      card: {
        type: 'return_policy',
        returnPolicy: policy,
        title: '30-Day Return Policy & Portal'
      },
      quickReplies: [
        'Track Order #333',
        'Shipping Speeds',
        'Gear Recommendations',
        'Return to Main Menu'
      ],
      newContext: {}
    };
  }

  /**
   * Deterministic Template: Shipping Speeds & Policies (Personalized by active order / courier)
   */
  public renderShippingInfo(
    entities?: ExtractedEntities,
    context?: DialogueContext,
    userText?: string
  ): TemplateRenderResult {
    const shipping: ShippingPolicyInfo = db.getShippingPolicy();
    const orderId = entities?.orderId || context?.orderId;
    const order = orderId ? db.getOrder(orderId) : null;

    if (order) {
      const message = `### Shipping Transit: Order #${order.id}

Your order is currently **${order.status}** with **${order.carrier}** and estimated to arrive **${order.estimatedDelivery}**.`;

      return {
        message,
        card: {
          type: 'shipping_info',
          order,
          shippingPolicy: shipping,
          title: `Shipping: Order #${order.id}`
        },
        quickReplies: [
          `Track Order #${order.id}`,
          'Check Return Policy',
          'Gear Recommendations',
          'Return to Main Menu'
        ],
        newContext: {
          orderId: order.id
        }
      };
    }

    const message = `### Shipping Speeds & Delivery Options

Here are our available shipping transit options for North Star gear:

• **Standard Ground**: **3–5 business days**
• **Expedited Air**: **1–2 business days**

Enter your **Order Number** (e.g. **#111**, **#222**, or **#333**) to check the exact courier transit for your parcel.`;

    return {
      message,
      card: {
        type: 'shipping_info',
        shippingPolicy: shipping,
        title: 'Shipping Options'
      },
      quickReplies: [
        'Track Order #111',
        'Track Order #222',
        'Track Order #333',
        'Check Return Policy',
        'Return to Main Menu'
      ],
      newContext: {}
    };
  }

  /**
   * Deterministic Template: Product Recommendations (2-Step Guided Flow)
   */
  public renderProductRecommendation(
    entities: ExtractedEntities,
    context: DialogueContext,
    userText: string
  ): TemplateRenderResult {
    const lower = userText.toLowerCase();

    // Check for single product spotlight inquiry (e.g. "Tell me more about North Star StormShield 3L Rain Jacket")
    if (lower.includes('tell me more about') || lower.includes('more about') || lower.startsWith('tell me about')) {
      const allProducts = db.getAllProducts();
      let matchedProd = entities.matchedProduct;

      if (!matchedProd) {
        for (const p of allProducts) {
          if (lower.includes(p.name.toLowerCase()) || lower.includes(p.name.split(' ')[2]?.toLowerCase() || '')) {
            matchedProd = p;
            break;
          }
        }
      }

      if (matchedProd) {
        const message = `### Product Spotlight: ${matchedProd.name}

Here are the verified specifications and overview for the **${matchedProd.name}**:`;

        return {
          message,
          card: {
            type: 'product_recommendations',
            products: [matchedProd],
            recommendedCategory: matchedProd.category,
            title: `Product Spotlight: ${matchedProd.name}`
          },
          quickReplies: [
            'Shipping Speeds',
            'Return Policy & Link',
            'Explore Another Activity',
            'Return to Main Menu'
          ],
          newContext: {}
        };
      }
    }

    const hasSpecificCondition =
      context.pendingQuestion === 'recommendation_activity' ||
      entities.categoryTerm !== undefined ||
      lower.includes('rain') ||
      lower.includes('wet') ||
      lower.includes('cold') ||
      lower.includes('winter') ||
      lower.includes('fleece') ||
      lower.includes('camp') ||
      lower.includes('tent') ||
      lower.includes('pack') ||
      lower.includes('boot') ||
      lower.includes('footwear');

    // Step 2: Specific condition / activity is specified -> return tailored recommendation
    if (hasSpecificCondition && (context.pendingQuestion === 'recommendation_activity' || entities.categoryTerm || lower.includes('for a') || lower.includes('for rainy') || lower.includes('for cold') || lower.includes('for camp') || lower.includes('for trek'))) {

      // Validate activity input when in recommendation flow — reject gibberish
      if (context.pendingQuestion === 'recommendation_activity') {
        const RECOGNIZED_ACTIVITY_KEYWORDS = [
          'rain', 'wet', 'storm', 'jacket', 'cold', 'winter', 'fleece', 'layer',
          'camp', 'tent', 'overnight', 'shelter', 'backpack', 'pack', 'multi-day',
          'trek', 'boot', 'shoe', 'foot', 'rocky', 'hike', 'hiking', 'trail',
          'snow', 'ice', 'mountain', 'alpine', 'climb', 'gear', 'outdoor',
          'adventure', 'weather', 'sleep', 'bag', 'warm', 'waterproof', 'dry'
        ];
        const hasRecognizedKeyword = RECOGNIZED_ACTIVITY_KEYWORDS.some(kw => lower.includes(kw));

        if (!hasRecognizedKeyword) {
          return {
            message: `I didn't quite catch that — could you tell me what kind of adventure or weather conditions you're planning for?\n\nFor example: *rainy trail hiking*, *cold weather layering*, *overnight camping*, *multi-day backpacking*, or *rocky alpine footwear*.`,
            quickReplies: [
              'Rainy & Wet Trail Hiking',
              'Cold Weather & Winter Layering',
              'Weekend Overnight Camping',
              'Multi-Day Backpacking Trek',
              'Rocky Alpine Footwear'
            ],
            newContext: {
              pendingQuestion: 'recommendation_activity'
            }
          };
        }
      }

      let categoryName = 'Apparel';
      let products: Product[] = [];
      let advice = '';

      if (lower.includes('rain') || lower.includes('wet') || lower.includes('storm') || lower.includes('jacket')) {
        categoryName = 'Waterproof Apparel';
        products = db.getProductsByCategory('Apparel').filter(p => p.name.includes('StormShield'));
        advice = 'For wet and rainy conditions, staying dry without overheating is key. Our 3-layer technical storm shell features fully taped seams and pit zips for active ventilation.';
      } else if (lower.includes('cold') || lower.includes('winter') || lower.includes('fleece') || lower.includes('layer')) {
        categoryName = 'Thermal Midlayers';
        products = db.getProductsByCategory('Apparel').filter(p => p.name.includes('Fleece'));
        advice = 'For crisp mornings and winter layering, breathable grid fleece provides exceptional warmth-to-weight while wicking away active moisture.';
      } else if (lower.includes('camp') || lower.includes('tent') || lower.includes('overnight') || lower.includes('shelter')) {
        categoryName = 'Tents & Sleep Systems';
        products = [
          ...db.getProductsByCategory('Tents'),
          ...db.getProductsByCategory('Sleep Systems')
        ];
        advice = 'For overnight camping trips, a reliable 3-season freestanding tent and a hydrophobic 20°F down sleeping bag make for a cozy, stormproof camp.';
      } else if (lower.includes('backpack') || lower.includes('pack') || lower.includes('multi-day') || lower.includes('trek')) {
        categoryName = 'Technical Packs';
        products = db.getProductsByCategory('Packs');
        advice = 'For multi-day excursions, an ergonomic internal-frame pack with integrated rain protection and lumbar balance keeps heavy gear feeling light.';
      } else if (lower.includes('boot') || lower.includes('shoe') || lower.includes('foot') || lower.includes('rocky')) {
        categoryName = 'Trail Footwear';
        products = db.getProductsByCategory('Footwear');
        advice = 'For rocky trails and muddy ascents, waterproof Vibram-soled hiking boots provide essential ankle support and rock-solid traction.';
      } else {
        categoryName = 'Essential Trail Gear';
        products = db.getAllProducts().slice(0, 3);
        advice = 'Here are our top customer-rated pieces of gear for North American trail adventures:';
      }

      const message = `### Recommended: ${categoryName}

${advice}

Here are our top recommended gear choices:`;

      return {
        message,
        card: {
          type: 'product_recommendations',
          products,
          recommendedCategory: categoryName,
          title: `Top Recommendations: ${categoryName}`
        },
        quickReplies: [
          'Explore Another Activity',
          'Shipping Speeds',
          'Return Policy',
          'Return to Main Menu'
        ],
        newContext: {}
      };
    }

    // Step 1: Clarifying Question
    return {
      message: `I'd love to help you find the right setup! To give you the best recommendation, **what kind of adventure or weather conditions are you planning for?**

Choose an activity below or tell me a bit about your upcoming trip:`,
      card: {
        type: 'recommendation_quiz',
        title: 'Gear Matcher: Step 1 of 2',
        content: 'Select your primary adventure type or weather condition to get tailored gear recommendations from our shop.'
      },
      quickReplies: [
        'Rainy & Wet Trail Hiking',
        'Cold Weather & Winter Layering',
        'Weekend Overnight Camping',
        'Multi-Day Backpacking Trek',
        'Rocky Alpine Footwear'
      ],
      newContext: {
        pendingQuestion: 'recommendation_activity'
      }
    };
  }

  /**
   * Deterministic Template: Order Cancellation & Size Change Multi-Step Flow
   */
  public renderCancellationFlow(
    entities: ExtractedEntities,
    context: DialogueContext,
    userText: string
  ): TemplateRenderResult {
    const lower = userText.toLowerCase();
    const orderId = entities.orderId || context.orderId;

    // If order is delivered (#333), size change is an immediate delivered exchange scheduling
    if (orderId === '333' && (lower.includes('size') || lower.includes('swap') || lower.includes('exchange'))) {
      return {
        message: `Your exchange request has been scheduled for **Order #${orderId}**!\n\n• **Pickup**: Our courier will pick up your item in its original packaging within **1 to 2 business days**.\n• **Express Dispatch**: Your replacement size will be dispatched via **express delivery** once pickup is verified.`,
        quickReplies: ['Track an Order', 'Shipping Speeds', 'Return to Main Menu'],
        newContext: {}
      };
    }

    // Sub-step A: Email submission for replacement
    if (context.pendingQuestion === 'cancel_replacement_email' || (entities.email && context.pendingQuestion === 'cancel_policy_choice')) {
      if (!entities.email) {
        return {
          message: 'Please drop a valid email address (e.g. **name@example.com**) so our representative can reach you directly.',
          newContext: {
            orderId,
            pendingQuestion: 'cancel_replacement_email'
          }
        };
      }

      return {
        message: `Thank you, sir! I have recorded your email (**${entities.email}**) and forwarded your ticket for **Order #${orderId || '111'}** to our customer support team.\n\nOur representative will contact you via email within **5 to 7 hours** to help you select your exact product and arrange your 100% full-value replacement with zero deductions.\n\nHave a wonderful day, and safe trails!`,
        quickReplies: ['Track an Order', 'Return Policy & Link', 'Gear Recommendations', 'Return to Main Menu'],
        newContext: {}
      };
    }

    // Sub-step B: Responding to policy choice ("Yes, Contact Human Support", direct cancellation, or keep)
    if (context.pendingQuestion === 'cancel_policy_choice' || context.pendingQuestion === 'confirm_cancel') {
      if (
        lower.includes('contact human support') ||
        lower.includes('contact human') ||
        lower.includes('human support') ||
        lower.includes('human') ||
        lower.includes('yes') ||
        lower.includes('representative') ||
        lower.includes('associate') ||
        lower.includes('support')
      ) {
        return {
          message: 'I apologize, we currently don\'t have live customer support, but our representative will contact you as soon as possible, estimated within **5 to 7 hours**.\n\nYou can drop your email here. He will be contacting you on that email.',
          newContext: {
            orderId,
            pendingQuestion: 'cancel_replacement_email'
          }
        };
      }

      if (entities.confirmation === 'keep' || lower.includes('keep') || lower.includes('no') || lower.includes('nevermind')) {
        return {
          message: `Understood! We will keep **Order #${orderId || '111'}** active and on its way for delivery as scheduled.`,
          quickReplies: [`Track Order #${orderId || '111'}`, 'Return to Main Menu'],
          newContext: {}
        };
      }

      if (lower.includes('confirm') || lower.includes('proceed') || lower.includes('cancel')) {
        return {
          message: `Your cancellation request for **Order #${orderId || '111'}** has been confirmed. A partial refund (after deducting shipping charges and payment gateway fees) will be refunded to your original payment mode within 3-5 business days.`,
          quickReplies: ['Track another order', 'Return to Main Menu'],
          newContext: {}
        };
      }
    }

    // Sub-step C: Reason selection or direct statement (e.g. "I ordered wrong item", "wrong size", "I want to cancel this")
    if (
      context.pendingQuestion === 'cancel_reason' ||
      entities.cancelAction !== undefined ||
      lower.includes('wrong item') ||
      lower.includes('wrong product') ||
      lower.includes('wrong size') ||
      lower.includes('size') ||
      lower.includes('siz') ||
      lower.includes('dont want') ||
      lower.includes("don't want") ||
      lower.includes('cancel')
    ) {
      // Check if user clicked "Yes, Contact Human Support" directly:
      if (
        lower.includes('contact human support') ||
        lower.includes('human support') ||
        lower.includes('contact support') ||
        lower.includes('yes, contact')
      ) {
        return {
          message: 'I apologize, we currently don\'t have live customer support, but our representative will contact you as soon as possible, estimated within **5 to 7 hours**.\n\nYou can drop your email here. He will be contacting you on that email.',
          newContext: {
            orderId,
            pendingQuestion: 'cancel_replacement_email'
          }
        };
      }

      // Check if user already provided email in the same message
      if (entities.email) {
        return {
          message: `Thank you, sir! I have recorded your email (**${entities.email}**) and forwarded your ticket for **Order #${orderId || '111'}** to our customer support team.\n\nOur representative will contact you via email within **5 to 7 hours** to help you select your exact product and arrange your 100% full-value replacement with zero deductions.\n\nHave a wonderful day, and safe trails!`,
          quickReplies: ['Track an Order', 'Return Policy & Link', 'Gear Recommendations', 'Return to Main Menu'],
          newContext: {}
        };
      }

      // Full disclosure: partial refund policy + 100% full money value exchange offer
      const message = `To cancel your order, after being processed and shipped, you will get a partial refund, from which shipping charges and the payment gateway fees would be deducted. The rest of the amount will be refunded to your original payment mode.

Additionally, a customer associate would like to contact you, and he can guide you further. If you don't want to lose your loss on partial refunds, you can get your **full money value** with your exact product you want. If any of the sum is remaining, it will be refunded without any charges to your original payment instrument.`;

      return {
        message,
        quickReplies: [
          'Yes, Contact Human Support',
          'Confirm Cancellation',
          'Keep My Order',
          'Return to Main Menu'
        ],
        newContext: {
          orderId,
          pendingQuestion: 'cancel_policy_choice'
        }
      };
    }

    // Sub-step D: Initial inquiry without order ID
    if (!orderId) {
      return {
        message: 'I can help you with your cancellation or product exchange. What is your **order number**? (e.g. **#111**, **#222**, or **#333**)',
        quickReplies: ['Order #111', 'Order #222', 'Order #333', 'Return to Main Menu'],
        newContext: {
          pendingQuestion: 'cancel_order_number'
        }
      };
    }

    // Order ID known -> Present choices
    return {
      message: `Anything wrong, sir? What would you like to do with **Order #${orderId}**?`,
      quickReplies: [
        "I just want to cancel and don't want it anymore",
        'I ordered wrong item / wrong size',
        'Return to Main Menu'
      ],
      newContext: {
        orderId,
        pendingQuestion: 'cancel_reason'
      }
    };
  }

  /**
   * Deterministic Template: Isolated Number Disambiguation
   */
  public renderOrderDisambiguation(entities: ExtractedEntities): TemplateRenderResult {
    const orderId = entities.orderId || '111';
    const order = db.getOrder(orderId);

    if (order) {
      return {
        message: `I found **Order #${orderId}** in our system! What would you like help with regarding this order?`,
        quickReplies: [
          `Track Order #${orderId}`,
          `Cancel Order #${orderId}`,
          `Start Return for #${orderId}`,
          'Return to Main Menu'
        ],
        newContext: {
          orderId
        }
      };
    }

    return {
      message: `I couldn't find an order matching **#${orderId}** in our system. Please double-check your order number and try again. You can find it in your order confirmation email.`,
      card: {
        type: 'order_invalid',
        title: 'Order Not Found',
        content: `No active order was found for #${orderId}.`
      },
      quickReplies: ['Try Order #111', 'Try Order #222', 'Try Order #333', 'Return to Main Menu'],
      newContext: {}
    };
  }

  /**
   * Deterministic Template: Human Handoff (Never a dead end)
   */
  public renderHumanHandoff(userQuery: string): TemplateRenderResult {
    const ticket: SupportTicket = db.createLiveAgentHandoff(userQuery);

    const message = `### Connecting you to a Live Agent...

You have been transitioned to our **Simulated Live Agent** channel.

• **Assigned Specialist**: **${ticket.agentName}**
• **Session Reference**: \`#${ticket.ticketId}\`
• **Status**: 🟢 **Connected**

*"Hi there! This is ${ticket.agentName.split(' ')[0]} from North Star customer care. I have your conversation history right in front of me. How can I help you today?"*

You can chat here with our team, or click **Return to Main Menu** below at any time to resume using the automated North Star Support Bot.`;

    return {
      message,
      card: {
        type: 'human_handoff',
        ticket,
        title: `Live Agent Session: #${ticket.ticketId}`
      },
      quickReplies: [
        '↩️ Return to Main Menu',
        'I have a billing question',
        'I need help with a return',
        'My issue is resolved'
      ],
      newContext: {
        isLiveAgentState: true
      },
      isLiveAgentState: true
    };
  }

  /**
   * Deterministic Template: Broad Order Issue Clarification
   */
  public renderOrderIssueClarification(
    entities: ExtractedEntities,
    context: DialogueContext,
    userText: string
  ): TemplateRenderResult {
    const orderId = entities.orderId || context.orderId;
    const orderPrefix = orderId ? ` for **Order #${orderId}**` : '';

    const message = `I'm sorry to hear you're experiencing an issue${orderPrefix}! I want to make sure you get taken care of right away.

What kind of problem are you having with your order?
• **Shipping & Delivery Delay**: Check carrier status and transit ETA
• **Returns & Size Exchanges**: 30-day self-service returns portal
• **Defective or Damaged Item**: Free replacement under our 30-day warranty`;

    return {
      message,
      quickReplies: [
        'Track Delayed Shipment',
        'Start Return / Sizing Exchange',
        'Replace Malfunctioning / Defective Item',
        'Return to Main Menu'
      ],
      newContext: {
        orderId
      }
    };
  }

  /**
   * Deterministic Template: Defect, Malfunction & Exchange Reason Flow
   */
  public renderDefectReplacement(
    entities: ExtractedEntities,
    context: DialogueContext,
    userText: string
  ): TemplateRenderResult {
    const lower = userText.toLowerCase();
    const orderId = entities.orderId || context.orderId;

    // Sub-step 1: If order ID is NOT yet known -> prompt for order number
    if (!orderId) {
      return {
        message: "Happy to help with your replacement or return! What is your **order number** (e.g. **#111**, **#222**, or **#333**)?",
        quickReplies: ['Order #111', 'Order #222', 'Order #333', 'Return to Main Menu'],
        newContext: {
          pendingQuestion: 'defect_order_number'
        }
      };
    }

    // Sub-step 2: Action Execution when Reason is explicitly provided:
    // (Either when responding to reason prompt 'delivered_order_action', or when text contains explicit reason)

    // A. Explicit Damaged / Defect Reason
    const isExplicitDefect =
      lower.includes('damaged') ||
      lower.includes('broken') ||
      lower.includes('defective') ||
      lower.includes('defect') ||
      lower.includes('faulty') ||
      lower.includes('torn') ||
      lower.includes('ripped') ||
      lower.includes('malfunction') ||
      (context.pendingQuestion === 'delivered_order_action' && lower.includes('replace'));

    if (isExplicitDefect) {
      return {
        message: `Your replacement has been scheduled for **Order #${orderId}**!\n\n• **Reason**: Damaged / Defective Item\n• **Pickup**: Your current item will be picked up by our courier within **1 to 2 business days**.\n• **Express Dispatch**: The brand new replacement product will arrive by **express delivery** as soon as possible to you.\n\nWe sincerely apologize for the inconvenience caused! Is there anything else you need help with?`,
        quickReplies: ['Track an Order', 'Shipping Speeds', 'Return to Main Menu'],
        newContext: {}
      };
    }

    // B. Explicit Sizing Swap Reason
    const isExplicitSize =
      lower.includes('size') ||
      lower.includes('sizing') ||
      lower.includes('fits') ||
      lower.includes('fitting') ||
      lower.includes('larger') ||
      lower.includes('smaller') ||
      (context.pendingQuestion === 'delivered_order_action' && lower.includes('swap'));

    if (isExplicitSize) {
      return {
        message: `Your exchange request has been scheduled for **Order #${orderId}**!\n\n• **Reason**: Sizing Exchange\n• **Pickup**: Our courier will pick up your item in its original packaging within **1 to 2 business days**.\n• **Express Dispatch**: Your replacement size will be dispatched via **express delivery** once pickup is verified.\n\nIs there anything else you need assistance with?`,
        quickReplies: ['Track an Order', 'Shipping Speeds', 'Return to Main Menu'],
        newContext: {}
      };
    }

    // C. Explicit Return for Refund Reason (includes "don't want it", "changed my mind", etc.)
    const isExplicitRefund =
      lower.includes('refund') ||
      lower.includes('send back') ||
      lower.includes('money back') ||
      (context.pendingQuestion === 'delivered_order_action' && lower.includes('return')) ||
      (context.pendingQuestion === 'delivered_order_action' && (
        lower.includes("don't want") ||
        lower.includes('dont want') ||
        lower.includes("don't need") ||
        lower.includes('dont need') ||
        lower.includes("don't like") ||
        lower.includes('dont like') ||
        lower.includes('not satisfied') ||
        lower.includes('not happy') ||
        lower.includes('not what i') ||
        lower.includes('by mistake') ||
        lower.includes('ordered wrong') ||
        lower.includes('changed my mind') ||
        lower.includes('change my mind')
      ));

    if (isExplicitRefund) {
      return {
        message: `Your return request has been scheduled for **Order #${orderId}**.\n\n• **Pickup**: Your order will be picked up by our courier within **1 to 2 business days**.\n• **Refund**: Once the package reaches our origin warehouse and passes inspection, your payment will be refunded 100% to your original payment mode within 3–5 business days.`,
        quickReplies: ['Track an Order', 'Return Policy & Link', 'Return to Main Menu'],
        newContext: {}
      };
    }

    // If we're ALREADY in delivered_order_action and nothing matched above,
    // the user gave a reason we don't specifically categorize — default to return/refund
    if (context.pendingQuestion === 'delivered_order_action') {
      return {
        message: `Your return request has been scheduled for **Order #${orderId}**.\n\n• **Reason**: ${userText}\n• **Pickup**: Your order will be picked up by our courier within **1 to 2 business days**.\n• **Refund**: Once the package reaches our origin warehouse and passes inspection, your payment will be refunded 100% to your original payment mode within 3–5 business days.`,
        quickReplies: ['Track an Order', 'Return Policy & Link', 'Return to Main Menu'],
        newContext: {}
      };
    }

    // Sub-step 3: Order ID is known, but reason is NOT yet selected -> Ask for reason & show Order Card
    const order = db.getOrder(orderId);
    if (order) {
      return {
        message: `I see **Order #${order.id}** (${order.status}). What is the reason for your replacement or exchange?`,
        card: {
          type: 'order_status',
          order,
          title: `Order Status: #${order.id}`
        },
        quickReplies: [
          '🛠️ Replace Damaged Item',
          '🔄 Sizing Swap',
          '📦 Return for Refund',
          'Return to Main Menu'
        ],
        newContext: {
          orderId: order.id,
          pendingQuestion: 'delivered_order_action'
        }
      };
    }

    return {
      message: "Happy to help with your replacement. What is your **order number** (e.g. **#111**, **#222**, or **#333**)?",
      quickReplies: ['Order #111', 'Order #222', 'Order #333', 'Return to Main Menu'],
      newContext: {
        pendingQuestion: 'defect_order_number'
      }
    };
  }

  /**
   * Deterministic Template: Product Technical Specifications Deep Dive
   */
  public renderProductSpecsInquiry(
    entities: ExtractedEntities,
    context: DialogueContext,
    userText: string
  ): TemplateRenderResult {
    const allProducts = db.getAllProducts();
    const lower = userText.toLowerCase();

    let targetProduct = entities.matchedProduct;
    if (!targetProduct) {
      if (lower.includes('rain') || lower.includes('storm') || lower.includes('jacket')) {
        targetProduct = allProducts.find(p => p.name.includes('StormShield'));
      } else if (lower.includes('tent') || lower.includes('alpine') || lower.includes('dome')) {
        targetProduct = allProducts.find(p => p.name.includes('AlpineDome'));
      } else if (lower.includes('fleece') || lower.includes('grid')) {
        targetProduct = allProducts.find(p => p.name.includes('Fleece'));
      } else if (lower.includes('sleep') || lower.includes('aurora') || lower.includes('bag')) {
        targetProduct = allProducts.find(p => p.name.includes('Aurora'));
      } else if (lower.includes('pack') || lower.includes('trailblaze') || lower.includes('backpack')) {
        targetProduct = allProducts.find(p => p.name.includes('TrailBlaze'));
      } else if (lower.includes('boot') || lower.includes('shoe') || lower.includes('peakgrip') || lower.includes('footwear')) {
        targetProduct = allProducts.find(p => p.name.includes('PeakGrip'));
      }
    }

    if (!targetProduct) {
      targetProduct = allProducts[0];
    }

    const message = `### Technical Specifications: ${targetProduct.name}

• **Key Specs**: *${targetProduct.specs}*
• **Best Suited For**: ${targetProduct.bestFor}
• **Category**: ${targetProduct.category}
• **Price**: **$${targetProduct.price.toFixed(2)} USD**
• **Customer Rating**: ⭐ **${targetProduct.rating} / 5.0**

${targetProduct.description}

Would you like details on another product, or help with shipping times?`;

    return {
      message,
      card: {
        type: 'product_recommendations',
        products: [targetProduct],
        recommendedCategory: targetProduct.category,
        title: `Specs: ${targetProduct.name}`
      },
      quickReplies: [
        'Shipping Speeds',
        'Return Policy & Link',
        'Explore Another Activity',
        'Return to Main Menu'
      ],
      newContext: {}
    };
  }

  /**
   * Deterministic Template: Pricing & Cost Inquiry
   */
  public renderPricingInquiry(
    entities: ExtractedEntities,
    context: DialogueContext,
    userText: string
  ): TemplateRenderResult {
    const allProducts = db.getAllProducts();
    const lower = userText.toLowerCase();

    let targetProduct = entities.matchedProduct;
    if (!targetProduct) {
      for (const p of allProducts) {
        if (lower.includes(p.name.toLowerCase()) || lower.includes(p.name.split(' ')[2]?.toLowerCase() || '')) {
          targetProduct = p;
          break;
        }
      }
    }

    if (targetProduct) {
      const message = `### Pricing: ${targetProduct.name}

The **${targetProduct.name}** is currently priced at **$${targetProduct.price.toFixed(2)} USD** *(In Stock)*.

• **Specifications**: *${targetProduct.specs}*
• **Shipping**: Standard (3-5 business days) or Expedited (1-2 business days)
• **Returns**: Covered by our 30-day return & exchange guarantee`;

      return {
        message,
        card: {
          type: 'product_recommendations',
          products: [targetProduct],
          recommendedCategory: targetProduct.category,
          title: `Price: ${targetProduct.name}`
        },
        quickReplies: [
          'Shipping Speeds',
          'Return Policy & Link',
          'Explore Another Activity',
          'Return to Main Menu'
        ],
        newContext: {}
      };
    }

    const summary = allProducts
      .map(p => `• **${p.name}**: **$${p.price.toFixed(2)}** (*${p.category}*)`)
      .join('\n');

    const message = `### North Star Product Pricing

${summary}

All items are backed by our **30-day return policy** and fast standard/expedited shipping!`;

    return {
      message,
      card: {
        type: 'product_recommendations',
        products: allProducts.slice(0, 3),
        recommendedCategory: 'Catalog Highlights',
        title: 'North Star Outdoor Gear Pricing'
      },
      quickReplies: [
        'Gear Recommendations',
        'Shipping Speeds',
        'Return Policy & Link',
        'Return to Main Menu'
      ],
      newContext: {}
    };
  }

  /**
   * Deterministic Template: Store Info & Support Contact
   */
  public renderStoreInfoContact(): TemplateRenderResult {
    const message = `### North Star Outdoor Co. — Support & Store Info

• **Customer Support Email**: \`support@northstaroutdoor.com\`
• **Operating Hours**: Monday – Saturday, **8:00 AM – 6:00 PM MST** (Closed Sundays for trail maintenance)
• **Headquarters**: Boulder, Colorado, USA
• **Response Time SLA**: Inquiries via live chat are answered immediately; emails are answered within **2–4 business hours**.

How can we assist you with your gear or order today?`;

    return {
      message,
      quickReplies: [
        'Track an Order',
        'Return Policy & Link',
        'Gear Recommendations',
        'Shipping Speeds',
        'Return to Main Menu'
      ],
      newContext: {}
    };
  }

  /**
   * Deterministic Template: Warranty & Craftsmanship Guarantee
   */
  public renderWarrantyInquiry(): TemplateRenderResult {
    const message = `### North Star Craftsmanship Guarantee & Warranty

We build outdoor gear engineered to endure rugged backcountry conditions.

• **Lifetime Craftsmanship Guarantee**: Covers manufacturer defects in stitching, seams, zipper construction, and hardware for the practical lifespan of the product.
• **30-Day Hassle-Free Returns**: If you're not completely satisfied with fit or performance, return any unused item in original packaging within **30 days** for a full refund.
• **Defect Replacements**: If your gear arrives malfunctioning or damaged, we replace it at zero shipping cost to you.

Do you have a specific item or order you need warranty assistance with?`;

    return {
      message,
      quickReplies: [
        'Replace Malfunctioning / Defective Item',
        'Start Return / Exchange',
        'Return to Main Menu'
      ],
      newContext: {}
    };
  }

  /**
   * Deterministic Template: Active Live Agent Channel
   */
  public renderLiveAgentChat(userText: string): TemplateRenderResult {
    const message = `*(Live Specialist Channel)*

"Thanks for your message! I'm currently reviewing your notes on **\"${userText}\"**. A member of our small shop team in Colorado is handling this directly.

Feel free to leave any extra details, or click **Return to Main Menu** below to continue using the automated North Star Bot anytime."`;

    return {
      message,
      quickReplies: [
        '↩️ Return to Main Menu',
        'My issue is resolved',
        'I have another question'
      ],
      newContext: {
        isLiveAgentState: true
      },
      isLiveAgentState: true
    };
  }

  /**
   * Deterministic Template: Gratitude & Farewells
   */
  public renderGratitudeFarewell(userText: string): TemplateRenderResult {
    const lower = userText.toLowerCase();
    const isFarewell =
      lower.includes('bye') ||
      lower.includes('goodbye') ||
      lower.includes('see you') ||
      lower.includes('take care');

    const message = isFarewell
      ? `Goodbye for now! Thank you for stopping by **North Star Outdoor Co.** 🌲\n\nWhenever you're planning your next expedition or need help with an order, we're right here. Safe travels and happy trails!`
      : `You're very welcome! It's our absolute pleasure helping fellow outdoor enthusiasts get equipped for the trail. 🏔️\n\nIs there anything else I can help you with today?`;

    return {
      message,
      quickReplies: [
        'Track an Order',
        'Gear Recommendations',
        'Return Policy & Link',
        'Shipping Speeds',
        'Return to Main Menu'
      ],
      newContext: {}
    };
  }

  /**
   * Deterministic Template: Polite Fallback (Clear explanation + options)
   */
  public renderFallback(userQuery: string): TemplateRenderResult {
    const message = `I'm sorry, I didn't quite understand that question. 

As the **North Star Support Bot**, I have verified facts on:
• **Order Tracking** (Try entering order numbers like **#111**, **#222**, or **#333**)
• **Returns & Exchanges** (Our 30-day policy & returns portal)
• **Product Recommendations** (Finding the right outdoor apparel and camping gear)
• **Shipping Information** (Standard & expedited delivery times)

Would you like to try one of these topics?`;

    return {
      message,
      card: {
        type: 'fallback_help',
        fallbackQuery: userQuery,
        title: "I Didn't Catch That",
        content: 'I specialize in order tracking, return policies, product recommendations, and shipping information.'
      },
      quickReplies: [
        'Track an Order',
        'Return Policy & Link',
        'Gear Recommendations',
        'Shipping Speeds',
        'Return to Main Menu'
      ],
      newContext: {}
    };
  }
}

export const responseMatrix = new ResponseMatrix();
