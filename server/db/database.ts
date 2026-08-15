import { EXACT_ORDERS, PRODUCT_CATALOG, RETURN_POLICY, SHIPPING_POLICY } from './mockData.js';
import { Order, Product, ReturnPolicyInfo, ShippingPolicyInfo, SupportTicket } from '../types.js';

class NorthStarDatabase {
  private tickets: Map<string, SupportTicket> = new Map();

  public getOrder(orderId: string): Order | null {
    const cleanId = orderId.replace(/[^0-9]/g, '');
    return EXACT_ORDERS[cleanId] || null;
  }

  public getAllOrders(): Order[] {
    return Object.values(EXACT_ORDERS);
  }

  public getReturnPolicy(): ReturnPolicyInfo {
    return RETURN_POLICY;
  }

  public getShippingPolicy(): ShippingPolicyInfo {
    return SHIPPING_POLICY;
  }

  public getAllProducts(): Product[] {
    return PRODUCT_CATALOG;
  }

  public getProductsByCategory(category: string): Product[] {
    const clean = category.toLowerCase();
    return PRODUCT_CATALOG.filter(p => p.category.toLowerCase().includes(clean));
  }

  public createLiveAgentHandoff(summary: string): SupportTicket {
    const ticketId = `NS-AGENT-${Math.floor(100 + Math.random() * 900)}`;
    const agents = ['Alex', 'Jordan', 'Taylor', 'Sam'];
    const assignedAgent = agents[Math.floor(Math.random() * agents.length)];

    const ticket: SupportTicket = {
      ticketId,
      agentName: `${assignedAgent} (North Star Gear Specialist)`,
      summary,
      status: 'Connected to Live Agent',
      createdAt: new Date().toISOString(),
    };

    this.tickets.set(ticketId, ticket);
    return ticket;
  }

  public getAllTickets(): SupportTicket[] {
    return Array.from(this.tickets.values());
  }

  public reset(): void {
    this.tickets.clear();
  }
}

export const db = new NorthStarDatabase();
