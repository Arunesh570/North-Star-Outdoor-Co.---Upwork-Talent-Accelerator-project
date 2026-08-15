import { db } from '../db/database.js';
import { RichCardData } from '../types.js';
import { extractFuzzyOrderNumber } from './nlp/fuzzyMatcher.js';

export class OrderService {
  public extractOrderNumber(text: string): string | null {
    return extractFuzzyOrderNumber(text);
  }

  public handleOrderQuery(text: string): {
    message: string;
    card?: RichCardData;
    quickReplies?: string[];
  } {
    const orderNum = this.extractOrderNumber(text);

    // If user asked to track but provided no number
    if (!orderNum) {
      return {
        message: "What is your **order number**? (e.g. **#111**, **#222**, or **#333**)",
        quickReplies: [
          'Order #111',
          'Order #222',
          'Order #333',
          'Return to Main Menu'
        ]
      };
    }

    const order = db.getOrder(orderNum);

    // If order exists in mock data
    if (order) {
      if (order.id === '111') {
        return {
          message: `Here is the tracking status for **Order #111**:`,
          card: {
            type: 'order_status',
            order,
            title: 'Order Status: #111'
          },
          quickReplies: [
            'Track Order #222',
            'Track Order #333',
            'Check Return Policy',
            'Return to Main Menu'
          ]
        };
      }

      if (order.id === '222') {
        return {
          message: `Here is the current status for **Order #222**:`,
          card: {
            type: 'order_status',
            order,
            title: 'Order Status: #222'
          },
          quickReplies: [
            'Track Order #111',
            'Track Order #333',
            'Shipping Speeds',
            'Return to Main Menu'
          ]
        };
      }

      if (order.id === '333') {
        return {
          message: `Here is the delivery summary for **Order #333**:`,
          card: {
            type: 'order_status',
            order,
            title: 'Order Status: #333'
          },
          quickReplies: [
            'Help with Sizing / Exchange',
            'Check Return Policy',
            'Track another order',
            'Return to Main Menu'
          ]
        };
      }
    }

    // Invalid Order
    return {
      message: `I couldn't find an order matching **#${orderNum}** in our system. Please double-check your order number and try again. You can find it in your order confirmation email.`,
      card: {
        type: 'order_invalid',
        title: 'Order Not Found',
        content: `No active order was found for #${orderNum}.`
      },
      quickReplies: [
        'Try Order #111',
        'Try Order #222',
        'Try Order #333',
        'Speak with Live Agent',
        'Return to Main Menu'
      ]
    };
  }
}

export const orderService = new OrderService();
