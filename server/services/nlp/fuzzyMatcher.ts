import { Product } from '../../types.js';
import { PRODUCT_CATALOG } from '../../db/mockData.js';
import { FuzzyMatchResult } from './types.js';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'by',
  'to', 'for', 'of', 'and', 'or', 'my', 'me', 'i', 'you', 'your', 'ur',
  'it', 'its', 'we', 'us', 'our', 'with', 'from', 'as', 'do', 'does',
  'can', 'could', 'would', 'will', 'have', 'has', 'had', 'what', 'wat',
  'how', 'why', 'when', 'which', 'who', 'where', 'please', 'pls', 'tell',
  'about', 'some', 'there', 'find', 'want', 'need', 'give', 'know'
]);

/**
 * Domain vocabulary with common spelling mistakes, abbreviations, and phonetics.
 */
export const VOCABULARY = {
  cancel: [
    'cancel', 'cancelling', 'cancellation', 'cancle', 'cancl', 'cncl',
    'cancell', 'canceld', 'cancld', 'stop order', 'stop shipment', 'abort order'
  ],
  track: [
    'track', 'tracking', 'trak', 'trck', 'trckng', 'traking', 'traack',
    'packge', 'where is my order', 'where is my package', 'where is order',
    'wheres my order', 'wheres my package'
  ],
  order: [
    'order', 'ordr', 'oder', 'odr', 'ordrer', 'oredr', 'ordrs', 'orders',
    'purchase', 'purchased'
  ],
  return: [
    'return', 'returns', 'retun', 'retrn', 'reutrn', 'reurn', 'rtn', 'rtns',
    'refund', 'refnd', 'rfund', 'sendback', 'moneyback',
    'exchange', 'exchang', 'exchenge', 'exchng',
    'replacement', 'replacment'
  ],
  size: [
    'size', 'siz', 'sizing', 'fits', 'fitting', 'fit'
  ],
  shipping: [
    'shipping', 'shippin', 'shiping', 'shping', 'shippng',
    'speed', 'speeds', 'fast', 'faster', 'overnight', 'standard shipping', 'expedited shipping',
    'delivery time', 'delivry'
  ],
  recommend: [
    'recommend', 'recomnd', 'reccomend', 'recomend', 'recomended', 'recommendation', 'recommendations',
    'suggest', 'sugest', 'suggestion', 'suggestions', 'advise', 'advice',
    'jacket', 'jaket', 'jacet', 'jackt', 'coat', 'raincoat', 'shell',
    'tent', 'tents', 'shelter', 'dome',
    'boot', 'boots', 'footwear', 'shoes', 'botes', 'bottes',
    'fleece', 'flece', 'layering', 'midlayer',
    'sleepingbag', 'sleeping bag', 'backpack', 'bckpck', 'pack',
    'hiking', 'hikng', 'camping', 'trail', 'trek', 'alpine'
  ],
  agent: [
    'agent', 'agnt', 'human', 'humn', 'person', 'persn', 'realperson',
    'representative', 'specialist', 'liveagent', 'manager', 'supervisor',
    'live agent', 'real person'
  ],
  menu: [
    'menu', 'mneu', 'start over', 'restart', 'restrt', 'reset', 'main menu'
  ],
  warranty: [
    'warranty', 'warrenty', 'waranty', 'warenty', 'guarantee', 'guaranty',
    'garantee', 'craftsmanship', 'lifetime warranty', 'product warranty', 'defect guarantee'
  ]
};

export class LocalFuzzyMatcher {
  /**
   * Levenshtein edit distance between string a and string b.
   */
  public levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Damerau-Levenshtein distance (accounts for adjacent character transpositions).
   */
  public damerauLevenshtein(a: string, b: string): number {
    const la = a.length;
    const lb = b.length;
    if (la === 0) return lb;
    if (lb === 0) return la;

    const d: number[][] = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));

    for (let i = 0; i <= la; i++) d[i][0] = i;
    for (let j = 0; j <= lb; j++) d[0][j] = j;

    for (let i = 1; i <= la; i++) {
      for (let j = 1; j <= lb; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1,      // deletion
          d[i][j - 1] + 1,      // insertion
          d[i - 1][j - 1] + cost // substitution
        );

        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost); // transposition
        }
      }
    }

    return d[la][lb];
  }

  /**
   * Jaro-Winkler string similarity (favors common prefix matching).
   */
  public jaroWinkler(s1: string, s2: string): number {
    const a = s1.toLowerCase().trim();
    const b = s2.toLowerCase().trim();
    if (a === b) return 1.0;
    if (!a.length || !b.length) return 0.0;

    const matchWindow = Math.floor(Math.max(a.length, b.length) / 2) - 1;
    const aMatches = new Array(a.length).fill(false);
    const bMatches = new Array(b.length).fill(false);

    let matches = 0;
    for (let i = 0; i < a.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, b.length);
      for (let j = start; j < end; j++) {
        if (!bMatches[j] && a[i] === b[j]) {
          aMatches[i] = true;
          bMatches[j] = true;
          matches++;
          break;
        }
      }
    }

    if (matches === 0) return 0.0;

    let k = 0;
    let transpositions = 0;
    for (let i = 0; i < a.length; i++) {
      if (aMatches[i]) {
        while (!bMatches[k]) k++;
        if (a[i] !== b[k]) transpositions++;
        k++;
      }
    }

    const jaro = (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;

    // Winkler prefix bonus (up to 4 chars)
    let prefix = 0;
    for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
      if (a[i] === b[i]) prefix++;
      else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
  }

  /**
   * Normalized hybrid string similarity score between 0.0 (completely different) and 1.0 (exact match).
   */
  public stringSimilarity(a: string, b: string): number {
    const cleanA = a.toLowerCase().trim();
    const cleanB = b.toLowerCase().trim();

    if (cleanA === cleanB) return 1.0;
    const maxLen = Math.max(cleanA.length, cleanB.length);
    if (maxLen === 0) return 1.0;

    const editSim = Math.max(0, 1 - this.damerauLevenshtein(cleanA, cleanB) / maxLen);
    const jwSim = this.jaroWinkler(cleanA, cleanB);

    return Math.max(editSim, jwSim);
  }

  /**
   * Checks if single word matches target within strict similarity threshold.
   */
  public isFuzzyMatch(word: string, target: string): boolean {
    if (word === target) return true;
    if (word.length < 3 || target.length < 3) return false;

    // For short words (<= 4 chars), require exact match to prevent false positives like "some" -> "home"
    if (word.length <= 4 && target.length <= 4) {
      return word === target;
    }

    const maxLen = Math.max(word.length, target.length);
    const dist = this.damerauLevenshtein(word, target);
    const similarity = 1 - dist / maxLen;

    // Medium words (5-7 chars) allow 1 edit if similarity >= 0.80
    if (maxLen <= 7) {
      return dist <= 1 && similarity >= 0.80;
    }

    // Long words (8+ chars) allow 2 edits if similarity >= 0.75
    return dist <= 2 && similarity >= 0.75;
  }

  /**
   * Checks if text contains any word matching a domain vocabulary category with fuzzy tolerance.
   */
  public hasFuzzyCategory(text: string, category: keyof typeof VOCABULARY): boolean {
    const lower = text.toLowerCase();
    const rawTokens = lower.split(/[\s,?.!#/:;]+/).filter(Boolean);
    const tokens = rawTokens.filter(t => !STOP_WORDS.has(t));

    const targets = VOCABULARY[category];
    if (!targets) return false;

    // Check individual token similarity
    for (const token of tokens) {
      for (const target of targets) {
        if (this.isFuzzyMatch(token, target)) return true;
      }
    }

    // Check multi-word phrase containment
    for (const target of targets) {
      if (target.includes(' ') && lower.includes(target)) return true;
    }

    return false;
  }

  /**
   * Matches a user query against the static product catalog to correct typos (e.g. "lether botes" -> Hiking Boots).
   */
  public matchProduct(query: string, products: Product[] = PRODUCT_CATALOG, threshold = 0.45): FuzzyMatchResult<Product> {
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
    const queryTokens = cleanQuery.split(/\s+/).filter(t => !STOP_WORDS.has(t));

    let bestProduct: Product | null = null;
    let highestScore = 0;
    let matchedName = '';

    for (const product of products) {
      const prodName = product.name.toLowerCase();
      const prodTokens = prodName.split(/\s+/).filter(t => !STOP_WORDS.has(t));

      // Token overlap score with aliases
      let matchedTokenCount = 0;
      for (const qToken of queryTokens) {
        for (const pToken of prodTokens) {
          const sim = this.stringSimilarity(qToken, pToken);
          const isBootAlias = (qToken === 'botes' || qToken === 'boot' || qToken === 'boots' || qToken === 'shoes' || qToken === 'lether') && (pToken.includes('boot') || pToken.includes('peakgrip'));
          const isJacketAlias = (qToken === 'jaket' || qToken === 'jacket' || qToken === 'coat' || qToken === 'shell') && (pToken.includes('jacket') || pToken.includes('stormshield'));
          const isTentAlias = (qToken === 'tent' || qToken === 'tents' || qToken === 'shelter') && (pToken.includes('tent') || pToken.includes('alpinedome'));
          const isFleeceAlias = (qToken === 'flece' || qToken === 'fleece') && (pToken.includes('fleece') || pToken.includes('grid'));
          const isSleepAlias = (qToken === 'sleep' || qToken === 'sleeping' || qToken === 'aurora') && (pToken.includes('aurora') || pToken.includes('sleeping'));
          const isPackAlias = (qToken === 'pack' || qToken === 'backpack' || qToken === 'trailblaze') && (pToken.includes('trailblaze') || pToken.includes('pack'));

          if (sim >= 0.75 || isBootAlias || isJacketAlias || isTentAlias || isFleeceAlias || isSleepAlias || isPackAlias) {
            matchedTokenCount++;
            break;
          }
        }
      }

      if (queryTokens.length > 0) {
        const tokenScore = matchedTokenCount / queryTokens.length;
        if (tokenScore > highestScore) {
          highestScore = tokenScore;
          bestProduct = product;
          matchedName = product.name;
        }
      }
    }

    const isMatch = highestScore >= threshold && bestProduct !== null;

    return {
      original: query,
      matched: matchedName,
      similarity: Math.round(highestScore * 100) / 100,
      distance: isMatch ? 0 : 99,
      item: isMatch && bestProduct ? bestProduct : undefined,
      isMatch
    };
  }

  /**
   * Extracts digits or spelled out numbers from noisy strings.
   */
  public extractFuzzyOrderNumber(text: string): string | null {
    const digitMatch = text.match(/(?:#|\b)?\s*(\d{3})\b/);
    if (digitMatch) return digitMatch[1];

    const lower = text.toLowerCase();
    if (lower.includes('111') || lower.includes('one one one') || lower.includes('triple one')) return '111';
    if (lower.includes('222') || lower.includes('two two two') || lower.includes('triple two')) return '222';
    if (lower.includes('333') || lower.includes('three three three') || lower.includes('triple three')) return '333';

    return null;
  }
}

export const localFuzzyMatcher = new LocalFuzzyMatcher();

// Export convenience functions
export const levenshtein = (a: string, b: string) => localFuzzyMatcher.levenshtein(a, b);
export const isFuzzyMatch = (w: string, t: string) => localFuzzyMatcher.isFuzzyMatch(w, t);
export const hasFuzzyCategory = (txt: string, cat: keyof typeof VOCABULARY) => localFuzzyMatcher.hasFuzzyCategory(txt, cat);
export const extractFuzzyOrderNumber = (txt: string) => localFuzzyMatcher.extractFuzzyOrderNumber(txt);
