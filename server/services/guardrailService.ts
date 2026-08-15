export interface GuardrailCheckResult {
  passed: boolean;
  refusalMessage?: string;
  category?: 'prompt_injection' | 'unauthorized_discount' | 'out_of_scope' | 'offensive_content';
}

export class GuardrailService {
  private injectionPatterns: RegExp[] = [
    /ignore\s+(all\s+)?(previous|prior|system|developer|hidden)\s+(system\s+)?(instructions|rules|prompts|directives)/i,
    /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|rules|prompts)/i,
    /system\s+prompt/i,
    /you\s+are\s+now\s+(unrestricted|in\s+dan\s+mode|a\s+different\s+ai|jailbroken|god\s+mode)/i,
    /reveal\s+(your\s+)?(internal|hidden|secret|system)\s+(instructions|prompts|rules)/i,
    /bypass\s+safety/i,
    /jailbreak/i,
    /<\|im_start\|>/i,
    /\[system\]/i,
  ];

  private discountExploitPatterns: RegExp[] = [
    /give\s+me\s+.*(50%|60%|70%|80%|90%|100%|free|secret).*(discount|coupon|promo\s+code|voucher)/i,
    /override\s+(the\s+)?price\s+to\s+\$0/i,
    /generate\s+(a\s+)?free\s+gift\s+card/i,
    /apply\s+secret\s+admin\s+discount/i,
  ];

  private outOfScopePatterns: RegExp[] = [
    /write\s+(a\s+)?(python|javascript|c\+\+|java|rust|sql)\s+(script|code|program|function)/i,
    /solve\s+(my\s+)?(calculus|algebra|homework|math\s+equation)/i,
    /who\s+won\s+the\s+(super\s*bowl|world\s*cup|presidential\s*election|world\s*series)/i,
    /write\s+(an\s+)?essay\s+about/i,
  ];

  public inspect(input: string): GuardrailCheckResult {
    const text = input.trim();

    // 1. Check for prompt injection / jailbreaks
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(text)) {
        return {
          passed: false,
          category: 'prompt_injection',
          refusalMessage: "I'm the **North Star Support Bot** for **North Star Outdoor Co.** I cannot modify my system instructions, bypass safety guidelines, or reveal internal operational protocols. I'm here to assist you with order tracking, gear recommendations, and returns!"
        };
      }
    }

    // 2. Check for discount manipulation
    for (const pattern of this.discountExploitPatterns) {
      if (pattern.test(text)) {
        return {
          passed: false,
          category: 'unauthorized_discount',
          refusalMessage: "We do not have unlisted promotional codes or custom price overrides. However, **North Star Outdoor Co.** offers standard shipping in 3–5 business days, plus fast expedited delivery!"
        };
      }
    }

    // 3. Check for out of scope queries
    for (const pattern of this.outOfScopePatterns) {
      if (pattern.test(text)) {
        return {
          passed: false,
          category: 'out_of_scope',
          refusalMessage: "I specialize specifically in **North Star Outdoor Co.** outdoor apparel, camping equipment, order tracking, and returns. While I can't assist with general programming, homework, or external trivia, I'd love to help you track an order or find the right gear!"
        };
      }
    }

    return { passed: true };
  }
}

export const guardrailService = new GuardrailService();
