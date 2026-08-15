import { IntentType } from './types.js';
import { synsetLemmatizer } from './synsetLemmatizer.js';

interface CorpusItem {
  text: string;
  intent: IntentType;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'by',
  'to', 'for', 'of', 'and', 'or', 'my', 'me', 'i', 'you', 'your', 'ur',
  'it', 'its', 'we', 'us', 'our', 'with', 'from', 'as', 'do', 'does',
  'can', 'could', 'would', 'will', 'have', 'has', 'had', 'please', 'pls'
]);

export class SemanticVectorizer {
  private idfMap: Map<string, number> = new Map();
  private intentCentroids: Map<IntentType, Map<string, number>> = new Map();
  private vocabulary: Set<string> = new Set();
  private isInitialized = false;

  /**
   * Initializes TF-IDF model and builds intent vector centroids.
   */
  public initialize(corpus: CorpusItem[]): void {
    const totalDocs = corpus.length;
    const docFrequencies: Map<string, number> = new Map();

    // 1. Compute document frequencies
    for (const doc of corpus) {
      const tokens = new Set(this.extractFeatures(doc.text));
      for (const token of tokens) {
        this.vocabulary.add(token);
        docFrequencies.set(token, (docFrequencies.get(token) || 0) + 1);
      }
    }

    // 2. Compute IDF: log(1 + totalDocs / df)
    for (const [token, df] of docFrequencies.entries()) {
      this.idfMap.set(token, Math.log(1 + totalDocs / df));
    }

    // 3. Compute TF-IDF vectors for each intent centroid
    const intentVectors: Map<IntentType, Map<string, number>[]> = new Map();

    for (const doc of corpus) {
      const vec = this.computeTfidf(doc.text);
      if (!intentVectors.has(doc.intent)) {
        intentVectors.set(doc.intent, []);
      }
      intentVectors.get(doc.intent)!.push(vec);
    }

    // 4. Average vectors to create Intent Centroid
    this.intentCentroids.clear();
    for (const [intent, vectors] of intentVectors.entries()) {
      const centroid: Map<string, number> = new Map();
      const count = vectors.length;

      for (const vec of vectors) {
        for (const [token, weight] of vec.entries()) {
          centroid.set(token, (centroid.get(token) || 0) + weight / count);
        }
      }
      this.intentCentroids.set(intent, this.normalizeVector(centroid));
    }

    this.isInitialized = true;
  }

  /**
   * Extracts unigrams and lemmatized bigrams from raw text.
   */
  public extractFeatures(text: string): string[] {
    const clean = text
      .toLowerCase()
      .replace(/[^a-z0-9\s#]/g, ' ')
      .trim();

    const rawWords = clean.split(/\s+/).filter(w => Boolean(w) && !STOP_WORDS.has(w));
    const lemmatized = synsetLemmatizer.lemmatizeTokens(rawWords);

    const features: string[] = [...lemmatized];

    // Bigrams of canonical lemmas
    for (let i = 0; i < lemmatized.length - 1; i++) {
      features.push(`${lemmatized[i]}_${lemmatized[i + 1]}`);
    }

    return features;
  }

  /**
   * Computes L2-normalized TF-IDF vector for given text.
   */
  public computeTfidf(text: string): Map<string, number> {
    const features = this.extractFeatures(text);
    const termFreqs: Map<string, number> = new Map();

    for (const feat of features) {
      termFreqs.set(feat, (termFreqs.get(feat) || 0) + 1);
    }

    const vector: Map<string, number> = new Map();
    for (const [feat, count] of termFreqs.entries()) {
      const tf = 1 + Math.log(count);
      const idf = this.idfMap.get(feat) || Math.log(1 + 50); // smoothed default IDF
      vector.set(feat, tf * idf);
    }

    return this.normalizeVector(vector);
  }

  /**
   * Computes L2 vector normalization: v / ||v||.
   */
  private normalizeVector(vec: Map<string, number>): Map<string, number> {
    let sumSq = 0;
    for (const val of vec.values()) {
      sumSq += val * val;
    }

    const norm = Math.sqrt(sumSq) || 1;
    const normalized: Map<string, number> = new Map();

    for (const [key, val] of vec.entries()) {
      normalized.set(key, val / norm);
    }

    return normalized;
  }

  /**
   * Computes Cosine Similarity between vector A and vector B (both L2 normalized).
   */
  public cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
    let dotProduct = 0;
    for (const [key, valA] of vecA.entries()) {
      const valB = vecB.get(key);
      if (valB !== undefined) {
        dotProduct += valA * valB;
      }
    }
    return Math.max(0, Math.min(1, dotProduct));
  }

  /**
   * Classifies input text by measuring Cosine Similarity against all intent centroids.
   */
  public classify(text: string): {
    bestIntent: IntentType;
    maxSimilarity: number;
    scores: Record<IntentType, number>;
  } {
    if (!this.isInitialized) {
      return {
        bestIntent: 'fallback_scenario',
        maxSimilarity: 0,
        scores: {} as Record<IntentType, number>
      };
    }

    const inputVec = this.computeTfidf(text);
    const scores: Record<string, number> = {};
    let bestIntent: IntentType = 'fallback_scenario';
    let maxSimilarity = -1;

    for (const [intent, centroid] of this.intentCentroids.entries()) {
      const sim = this.cosineSimilarity(inputVec, centroid);
      scores[intent] = Math.round(sim * 1000) / 1000;

      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        bestIntent = intent;
      }
    }

    return {
      bestIntent,
      maxSimilarity: Math.round(maxSimilarity * 100) / 100,
      scores: scores as Record<IntentType, number>
    };
  }
}

export const semanticVectorizer = new SemanticVectorizer();
