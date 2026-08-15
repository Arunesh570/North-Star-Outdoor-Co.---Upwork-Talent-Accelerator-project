import { db } from '../db/database.js';
import { Product, RichCardData } from '../types.js';

export class CatalogService {
  public askClarifyingQuestion(): {
    message: string;
    card: RichCardData;
    quickReplies: string[];
  } {
    return {
      message: `I'd love to help you find the right setup! To give you the best recommendation, **what kind of adventure or weather conditions are you planning for?**\n\nChoose an activity below or tell me a bit about your upcoming trip:`,
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
      ]
    };
  }

  public getRecommendationsForCategory(activityOrCategory: string): {
    message: string;
    card: RichCardData;
    quickReplies: string[];
  } {
    const text = activityOrCategory.toLowerCase();
    let categoryName = 'Apparel';
    let products: Product[] = [];
    let advice = '';

    if (text.includes('rain') || text.includes('wet') || text.includes('storm') || text.includes('jacket')) {
      categoryName = 'Waterproof Apparel';
      products = db.getProductsByCategory('Apparel').filter(p => p.name.includes('StormShield'));
      advice = 'For wet and rainy conditions, staying dry without overheating is key. Our 3-layer technical storm shell features fully taped seams and pit zips for active ventilation.';
    } else if (text.includes('cold') || text.includes('winter') || text.includes('fleece') || text.includes('layer')) {
      categoryName = 'Thermal Midlayers';
      products = db.getProductsByCategory('Apparel').filter(p => p.name.includes('Fleece'));
      advice = 'For crisp mornings and winter layering, breathable grid fleece provides exceptional warmth-to-weight while wicking away active moisture.';
    } else if (text.includes('camp') || text.includes('tent') || text.includes('overnight') || text.includes('shelter')) {
      categoryName = 'Tents & Sleep Systems';
      products = [
        ...db.getProductsByCategory('Tents'),
        ...db.getProductsByCategory('Sleep Systems')
      ];
      advice = 'For overnight camping trips, a reliable 3-season freestanding tent and a hydrophobic 20°F down sleeping bag make for a cozy, stormproof camp.';
    } else if (text.includes('backpack') || text.includes('pack') || text.includes('multi-day') || text.includes('trek')) {
      categoryName = 'Technical Packs';
      products = db.getProductsByCategory('Packs');
      advice = 'For multi-day excursions, an ergonomic internal-frame pack with integrated rain protection and lumbar balance keeps heavy gear feeling light.';
    } else if (text.includes('boot') || text.includes('shoe') || text.includes('foot') || text.includes('rocky')) {
      categoryName = 'Trail Footwear';
      products = db.getProductsByCategory('Footwear');
      advice = 'For rocky trails and muddy ascents, waterproof Vibram-soled hiking boots provide essential ankle support and rock-solid traction.';
    } else {
      // Default top rated recommendations
      categoryName = 'Essential Trail Gear';
      products = db.getAllProducts().slice(0, 3);
      advice = 'Here are our top customer-rated pieces of gear for North American trail adventures:';
    }

    const itemsSummary = products
      .map(p => `• **${p.name}** — **$${p.price.toFixed(2)}**\n  *${p.specs}*\n  ${p.description}`)
      .join('\n\n');

    const message = `### Recommended: ${categoryName}

${advice}

${itemsSummary}`;

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
      ]
    };
  }
}

export const catalogService = new CatalogService();
