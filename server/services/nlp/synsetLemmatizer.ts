/**
 * Synset Lemmatizer & Morphological Expander
 * Normalizes colloquial words, inflectional suffixes, and synonyms to canonical domain lemmas.
 */

const SYNSET_MAP: Record<string, string> = {
  // Defect / Malfunction / Damage
  malfunctioning: 'defect',
  malfunction: 'defect',
  malfunctions: 'defect',
  defective: 'defect',
  defect: 'defect',
  defects: 'defect',
  broken: 'defect',
  damaged: 'defect',
  damage: 'defect',
  faulty: 'defect',
  torn: 'defect',
  ripped: 'defect',
  leaking: 'defect',
  snapped: 'defect',

  // Problem / Issue
  problem: 'problem',
  problems: 'problem',
  issue: 'problem',
  issues: 'problem',
  trouble: 'problem',
  complication: 'problem',
  wrong: 'problem',
  error: 'problem',

  // Replace / Exchange
  replace: 'replace',
  replacement: 'replace',
  replacing: 'replace',
  exchange: 'replace',
  exchanging: 'replace',
  exchanges: 'replace',
  swap: 'replace',
  swapping: 'replace',

  // Specs / Details
  specs: 'specs',
  specifications: 'specs',
  specification: 'specs',
  waterproof: 'specs',
  waterproofing: 'specs',
  weight: 'specs',
  weigh: 'specs',
  weighs: 'specs',
  dimensions: 'specs',
  size: 'specs',
  sizes: 'specs',
  material: 'specs',
  materials: 'specs',
  fabric: 'specs',
  temperature: 'specs',
  rating: 'specs',
  insulation: 'specs',

  // Pricing / Cost
  price: 'price',
  prices: 'price',
  pricing: 'price',
  cost: 'price',
  costs: 'price',
  costing: 'price',
  expensive: 'price',
  cheap: 'price',
  affordable: 'price',
  dollars: 'price',
  dollar: 'price',

  // Store Info / Hours / Contact
  hours: 'store_info',
  operating: 'store_info',
  open: 'store_info',
  opening: 'store_info',
  close: 'store_info',
  closing: 'store_info',
  contact: 'store_info',
  email: 'store_info',
  phone: 'store_info',
  location: 'store_info',
  located: 'store_info',
  headquarters: 'store_info',
  address: 'store_info',

  // Warranty
  warranty: 'warranty',
  warrenty: 'warranty',
  waranty: 'warranty',
  warenty: 'warranty',
  guarantee: 'warranty',
  guaranty: 'warranty',
  garantee: 'warranty',
  guaranteed: 'warranty',
  craftsmanship: 'warranty',
  durability: 'warranty',

  // Tracking
  track: 'track',
  tracking: 'track',
  trak: 'track',
  locate: 'track',
  status: 'track',
  transit: 'track',
  courier: 'track',
  carrier: 'track',

  // Shipping
  shipping: 'shipping',
  delivery: 'shipping',
  deliver: 'shipping',
  speeds: 'shipping',
  speed: 'shipping',
  expedited: 'shipping',
  standard: 'shipping',

  // Cancellation
  cancel: 'cancel',
  canceling: 'cancel',
  cancelling: 'cancel',
  cancellation: 'cancel',
  cancl: 'cancel',
  abort: 'cancel'
};

export class SynsetLemmatizer {
  /**
   * Normalizes a single token to its canonical synset lemma if registered.
   */
  public lemmatize(word: string): string {
    const clean = word.toLowerCase().trim();
    if (SYNSET_MAP[clean]) {
      return SYNSET_MAP[clean];
    }

    // Common English regular suffix stemming
    if (clean.endsWith('ing') && clean.length > 5) {
      const stem = clean.slice(0, -3);
      if (SYNSET_MAP[stem]) return SYNSET_MAP[stem];
    }
    if (clean.endsWith('ed') && clean.length > 4) {
      const stem = clean.slice(0, -2);
      if (SYNSET_MAP[stem]) return SYNSET_MAP[stem];
    }
    if (clean.endsWith('s') && clean.length > 3) {
      const stem = clean.slice(0, -1);
      if (SYNSET_MAP[stem]) return SYNSET_MAP[stem];
    }

    return clean;
  }

  /**
   * Lemmatizes a list of tokens into canonical lemmas.
   */
  public lemmatizeTokens(tokens: string[]): string[] {
    return tokens.map(t => this.lemmatize(t));
  }

  /**
   * Returns true if input contains terms belonging to a target synset.
   */
  public hasSynset(text: string, synset: string): boolean {
    const lower = text.toLowerCase();
    const words = lower.split(/[\s,?.!#/:;]+/).filter(Boolean);

    for (const word of words) {
      if (this.lemmatize(word) === synset) {
        return true;
      }
    }
    return false;
  }
}

export const synsetLemmatizer = new SynsetLemmatizer();
