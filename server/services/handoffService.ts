import { db } from '../db/database.js';
import { RichCardData } from '../types.js';

export class HandoffService {
  public triggerLiveAgentHandoff(userQuery: string): {
    message: string;
    card: RichCardData;
    quickReplies: string[];
    isLiveAgentState: boolean;
  } {
    const ticket = db.createLiveAgentHandoff(userQuery);

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
        'Check Order #111',
        'Check Order #222',
        'Check Order #333'
      ],
      isLiveAgentState: true
    };
  }

  public handleFallback(userQuery: string): {
    message: string;
    card: RichCardData;
    quickReplies: string[];
  } {
    const message = `I'm sorry, I didn't quite understand that question. 

As the **North Star Support Bot**, I have verified facts on:
• **Order Tracking** (Try entering order numbers like **#111**, **#222**, or **#333**)
• **Returns & Exchanges** (Our 30-day policy & returns portal)
• **Product Recommendations** (Finding the right outdoor apparel and camping gear)
• **Shipping Information** (Standard & expedited delivery times)

Would you like to try one of these topics, or should I connect you directly to a **Live Agent**?`;

    return {
      message,
      card: {
        type: 'fallback_help',
        fallbackQuery: userQuery,
        title: "I Didn't Catch That",
        content: "I specialize in order tracking, return policies, product recommendations, and shipping information."
      },
      quickReplies: [
        'Track an Order',
        'Return Policy & Link',
        'Gear Recommendations',
        'Connect with Live Agent'
      ]
    };
  }
}

export const handoffService = new HandoffService();
