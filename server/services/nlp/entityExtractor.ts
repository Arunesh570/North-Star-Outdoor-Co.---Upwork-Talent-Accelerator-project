import { ExtractedEntities, DialogueContext, CancelChoice } from './types.js';

export class EntityExtractor {
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  /**
   * Extracts structured entities from user input, taking into account the active dialogue context.
   */
  public extract(text: string, context?: DialogueContext): ExtractedEntities {
    const raw = text.trim();
    const lower = raw.toLowerCase();
    const tokens = lower.split(/[\s,?.!#/:;]+/).filter(Boolean);

    const orderId = this.extractOrderId(raw, context);
    const email = this.extractEmail(raw);
    const cancelAction = this.extractCancelAction(lower);
    const confirmation = this.extractConfirmation(lower);
    const { productTerm, categoryTerm } = this.extractProductAndCategoryTerms(lower);
    const defectIssue = this.extractDefectIssue(lower);
    const specQuery = this.extractSpecQuery(lower);
    const priceQuery = this.extractPriceQuery(lower);
    const isDirectNumberOnly = this.checkIsDirectNumberOnly(raw);

    return {
      orderId: orderId || undefined,
      email: email || undefined,
      productTerm: productTerm || undefined,
      categoryTerm: categoryTerm || undefined,
      cancelAction,
      confirmation,
      defectIssue,
      specQuery,
      priceQuery,
      isDirectNumberOnly,
      cleanedText: raw,
      tokens
    };
  }

  /**
   * Extracts Order Number from digits, prefixed tokens, or written word numbers.
   */
  public extractOrderId(text: string, context?: DialogueContext): string | null {
    // 1. Direct regex match: e.g. "#111", "order 222", "333", "ORD-111"
    const digitMatch = text.match(/(?:#|order\s*#?|package\s*#?|ordr\s*#?)?\s*(\d{3})\b/i);
    if (digitMatch && digitMatch[1]) {
      return digitMatch[1];
    }

    // 2. Spelled-out numbers
    const lower = text.toLowerCase();
    if (lower.includes('one one one') || lower.includes('triple one') || lower.includes('111')) return '111';
    if (lower.includes('two two two') || lower.includes('triple two') || lower.includes('222')) return '222';
    if (lower.includes('three three three') || lower.includes('triple three') || lower.includes('333')) return '333';

    // 3. Fallback to existing orderId stored in conversation context
    if (context?.orderId) {
      return context.orderId;
    }

    return null;
  }

  /**
   * Extracts valid email address format.
   */
  public extractEmail(text: string): string | null {
    const match = text.match(this.emailRegex);
    return match ? match[0] : null;
  }

  /**
   * Extracts cancellation choice and size swap intents.
   */
  public extractCancelAction(lowerText: string): CancelChoice | undefined {
    if (
      lowerText.includes('size') ||
      lowerText.includes('siz') ||
      lowerText.includes('change') ||
      lowerText.includes('swap') ||
      lowerText.includes('replace') ||
      lowerText.includes('wrong size') ||
      lowerText.includes('wrong item') ||
      lowerText.includes('wrong product') ||
      lowerText.includes('ordered wrong') ||
      lowerText.includes('different size')
    ) {
      return 'size_change';
    }

    if (
      lowerText.includes('dont want') ||
      lowerText.includes("don't want") ||
      lowerText.includes('not anymore') ||
      lowerText.includes('just cancel') ||
      lowerText.includes('cancel entirely')
    ) {
      return 'cancel_entirely';
    }

    if (lowerText.includes('keep') || lowerText.includes('nevermind') || lowerText.includes('do not cancel')) {
      return 'keep_order';
    }

    if (lowerText.includes('confirm') || lowerText.includes('yes cancel') || lowerText.includes('proceed with cancel')) {
      return 'confirm_cancel';
    }

    return undefined;
  }

  /**
   * Extracts confirmation / abortion indicators.
   */
  public extractConfirmation(lowerText: string): 'confirm' | 'cancel' | 'keep' | 'abort' | undefined {
    if (lowerText.includes('keep') || lowerText.includes('keep my order') || lowerText.includes('no keep')) {
      return 'keep';
    }
    if (lowerText.includes('confirm') || lowerText.includes('yes') || lowerText.includes('proceed')) {
      return 'confirm';
    }
    if (lowerText.includes('cancel') || lowerText.includes('abort') || lowerText.includes('no')) {
      return 'abort';
    }
    return undefined;
  }

  /**
   * Extracts defect, malfunction, or damage description words.
   */
  public extractDefectIssue(lowerText: string): string | undefined {
    const defectTerms = [
      'malfunctioning', 'malfunction', 'broken', 'damaged', 'defect',
      'defective', 'faulty', 'torn', 'ripped', 'leaking', 'not working'
    ];
    for (const term of defectTerms) {
      if (lowerText.includes(term)) return term;
    }
    return undefined;
  }

  /**
   * Extracts technical specification inquiry terms.
   */
  public extractSpecQuery(lowerText: string): string | undefined {
    if (lowerText.includes('waterproof') || lowerText.includes('waterproofing') || lowerText.includes('rain rating')) return 'waterproof_rating';
    if (lowerText.includes('weight') || lowerText.includes('weigh') || lowerText.includes('heavy') || lowerText.includes('light')) return 'weight';
    if (lowerText.includes('temperature') || lowerText.includes('warmth') || lowerText.includes('degree') || lowerText.includes('limit')) return 'temperature_rating';
    if (lowerText.includes('material') || lowerText.includes('fabric') || lowerText.includes('down') || lowerText.includes('fleece')) return 'materials';
    if (lowerText.includes('poles') || lowerText.includes('frame') || lowerText.includes('vestibule')) return 'construction';
    if (lowerText.includes('specs') || lowerText.includes('specification') || lowerText.includes('features')) return 'general_specs';
    return undefined;
  }

  /**
   * Extracts pricing inquiry terms.
   */
  public extractPriceQuery(lowerText: string): string | undefined {
    if (
      lowerText.includes('how much') ||
      lowerText.includes('price') ||
      lowerText.includes('cost') ||
      lowerText.includes('pricing') ||
      lowerText.includes('dollars') ||
      lowerText.includes('how expensive')
    ) {
      return 'price';
    }
    return undefined;
  }

  /**
   * Extracts outdoor gear and category terms.
   */
  public extractProductAndCategoryTerms(lowerText: string): { productTerm?: string; categoryTerm?: string } {
    let categoryTerm: string | undefined;
    let productTerm: string | undefined;

    if (lowerText.includes('rain') || lowerText.includes('wet') || lowerText.includes('storm') || lowerText.includes('jacket') || lowerText.includes('shell')) {
      categoryTerm = 'Apparel';
      productTerm = 'North Star StormShield 3L Rain Jacket';
    } else if (lowerText.includes('cold') || lowerText.includes('winter') || lowerText.includes('fleece') || lowerText.includes('layer') || lowerText.includes('midlayer')) {
      categoryTerm = 'Apparel';
      productTerm = 'North Star Grid-Fleece Thermal Midlayer';
    } else if (lowerText.includes('tent') || lowerText.includes('shelter') || lowerText.includes('camp') || lowerText.includes('overnight') || lowerText.includes('domedome')) {
      categoryTerm = 'Tents';
      productTerm = 'North Star AlpineDome 2-Person 3-Season Tent';
    } else if (lowerText.includes('sleep') || lowerText.includes('sleeping bag') || lowerText.includes('aurora') || lowerText.includes('down')) {
      categoryTerm = 'Sleep Systems';
      productTerm = 'North Star Aurora 20°F Down Sleeping Bag';
    } else if (lowerText.includes('backpack') || lowerText.includes('pack') || lowerText.includes('trailblaze') || lowerText.includes('trek')) {
      categoryTerm = 'Packs';
      productTerm = 'North Star TrailBlaze 45L Technical Pack';
    } else if (lowerText.includes('boot') || lowerText.includes('boots') || lowerText.includes('shoe') || lowerText.includes('footwear') || lowerText.includes('foot') || lowerText.includes('peakgrip')) {
      categoryTerm = 'Footwear';
      productTerm = 'North Star PeakGrip Waterproof Hiking Boots';
    }

    return { productTerm, categoryTerm };
  }

  /**
   * Checks if input is an isolated number with no additional request words.
   */
  private checkIsDirectNumberOnly(text: string): boolean {
    const clean = text.trim();
    return /^(?:#\s*)?\d{3}$/.test(clean) || /^(?:order|package)\s*#?\s*\d{3}$/i.test(clean);
  }
}

export const entityExtractor = new EntityExtractor();
