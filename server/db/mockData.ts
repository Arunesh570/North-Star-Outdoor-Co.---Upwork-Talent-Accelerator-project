import { Order, Product, ReturnPolicyInfo, ShippingPolicyInfo } from '../types.js';

export const EXACT_ORDERS: Record<string, Order> = {
  '111': {
    id: '111',
    status: 'Shipped, arriving tomorrow',
    statusDetail: 'Package is in transit with carrier and scheduled for delivery tomorrow.',
    carrier: 'UPS Ground',
    trackingNumber: '1Z-NORTHSTAR-111',
    estimatedDelivery: 'Tomorrow by 7:00 PM',
    items: [
      {
        sku: 'NS-APP-101',
        name: 'North Star Alpine Ridge Waterproof Shell',
        quantity: 1,
        price: 189.00,
        image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=400&auto=format&fit=crop&q=80',
      }
    ]
  },
  '222': {
    id: '222',
    status: 'Processing, ships in 24 hours',
    statusDetail: 'Our warehouse team is boxing your order. It will dispatch within 24 hours.',
    carrier: 'USPS Priority',
    trackingNumber: '9400-NORTHSTAR-222',
    estimatedDelivery: 'Ships within 24 hours',
    items: [
      {
        sku: 'NS-PCK-202',
        name: 'North Star TrailBlaze 45L Technical Pack',
        quantity: 1,
        price: 149.00,
        image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&auto=format&fit=crop&q=80',
      }
    ]
  },
  '333': {
    id: '333',
    status: 'Delivered',
    statusDetail: 'Package was delivered to your front door / parcel mailbox.',
    carrier: 'FedEx Express',
    trackingNumber: '7829-NORTHSTAR-333',
    estimatedDelivery: 'Delivered yesterday at 2:15 PM',
    followUpPrompt: 'Did everything arrive in great shape, or would you like help with sizing, exchanges, or returns?',
    items: [
      {
        sku: 'NS-FTW-303',
        name: 'North Star Peak Grip Waterproof Hiking Boots',
        quantity: 1,
        price: 165.00,
        image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400&auto=format&fit=crop&q=80',
      }
    ]
  }
};

export const RETURN_POLICY: ReturnPolicyInfo = {
  windowDays: 30,
  condition: 'Items must be unused',
  packaging: 'Original packaging required',
  returnsUrl: 'https://northstaroutdoor.com/returns',
};

export const SHIPPING_POLICY: ShippingPolicyInfo = {
  standard: '3-5 business days',
  expedited: '1-2 business days',
};

export const PRODUCT_CATALOG: Product[] = [
  // Apparel
  {
    id: 'prod-1',
    sku: 'NS-APP-01',
    name: 'North Star StormShield 3L Rain Jacket',
    category: 'Apparel',
    price: 179.00,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80',
    description: '100% waterproof, breathable 3-layer technical shell with fully taped seams.',
    specs: '20,000mm Waterproof / Pit Zips / 380g',
    bestFor: 'Wet, rainy trail hiking and windy mountain ridges'
  },
  {
    id: 'prod-2',
    sku: 'NS-APP-02',
    name: 'North Star Grid-Fleece Thermal Midlayer',
    category: 'Apparel',
    price: 89.00,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&auto=format&fit=crop&q=80',
    description: 'Lightweight breathable grid fleece for cold mornings and active layering.',
    specs: 'Recycled Poly-Grid / High Wicking / Thumb Loops',
    bestFor: 'Cold weather layering and trail running'
  },
  // Tents & Shelter
  {
    id: 'prod-3',
    sku: 'NS-TNT-03',
    name: 'North Star AlpineDome 2-Person 3-Season Tent',
    category: 'Tents',
    price: 249.00,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&auto=format&fit=crop&q=80',
    description: 'Freestanding lightweight backpacking tent with dual vestibules.',
    specs: '2-Person / 1.9kg Packed Weight / DAC Aluminum Poles',
    bestFor: 'Backpacking, weekend camping, and 3-season trail trips'
  },
  // Sleep Systems
  {
    id: 'prod-4',
    sku: 'NS-SLP-04',
    name: 'North Star Aurora 20°F Down Sleeping Bag',
    category: 'Sleep Systems',
    price: 219.00,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format&fit=crop&q=80',
    description: '650-fill hydrophobic duck down with draft collar and compression sack.',
    specs: '20°F (-7°C) Lower Limit / 980g Weight',
    bestFor: 'Cool mountain nights and alpine camping'
  },
  // Packs
  {
    id: 'prod-5',
    sku: 'NS-PCK-05',
    name: 'North Star TrailBlaze 45L Internal Frame Pack',
    category: 'Packs',
    price: 159.00,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80',
    description: 'Ergonomic lumbar suspension pack with integrated rain cover.',
    specs: '45 Liters / 1.4kg / Hydration Sleeve Ready',
    bestFor: '1-3 day backpacking trips and gear-heavy day hikes'
  },
  // Footwear
  {
    id: 'prod-6',
    sku: 'NS-FTW-06',
    name: 'North Star PeakGrip Waterproof Hiking Boots',
    category: 'Footwear',
    price: 165.00,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80',
    description: 'High-traction all-terrain boots with waterproof breathable membrane.',
    specs: 'Vibram Outsole / Waterproof Bootie / Ankle Cushion',
    bestFor: 'Rocky ascents, muddy paths, and multi-mile hikes'
  }
];
