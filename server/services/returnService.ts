import { db } from '../db/database.js';
import { RichCardData } from '../types.js';

export class ReturnService {
  public getReturnPolicyResponse(): {
    message: string;
    card: RichCardData;
    quickReplies: string[];
  } {
    const policy = db.getReturnPolicy();

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
      ]
    };
  }

  public getShippingInfoResponse(): {
    message: string;
    card: RichCardData;
    quickReplies: string[];
  } {
    const shipping = db.getShippingPolicy();

    const message = `### Shipping Speeds & Delivery Information

Here are our available shipping options for North Star gear:

• **Standard Shipping**: **3–5 business days**
• **Expedited Shipping**: **1–2 business days**

All orders receive real-time tracking details as soon as they dispatch from our warehouse.`;

    return {
      message,
      card: {
        type: 'shipping_info',
        shippingPolicy: shipping,
        title: 'Shipping Options'
      },
      quickReplies: [
        'Track an Order',
        'Check Return Policy',
        'Gear Recommendations',
        'Return to Main Menu'
      ]
    };
  }
}

export const returnService = new ReturnService();
