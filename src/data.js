// Seeds = real plants. The description hints at care but does not reveal the name.
// plantName is revealed only on the final screen.

export const SEEDS = [
  {
    id: 'radish',
    plantName: 'Radish',
    facts: [
      'One of the fastest crops — radishes can sprout in just 3–5 days.',
      'Ancient Egyptian pyramid builders were fed radishes for energy.',
    ],
    description: 'Round and quick. Loves the cool and hates drought. Grows fastest of all.',
    growthDays: 15,
    growthSpeed: 1.0,
    idealTemp: 'cold',
    waterNeed: 'mid',
    flowerColor: '#e53935',
    leafColor: '#43a047',
    // icon — seed icon cropped to its edges; iconSize — longest side in px.
    // PNGs are cropped to content, so iconSize = the real visible size.
    // Reflects the real seed size: basil small, radish/tomato medium, sunflower large.
    seed: { icon: 'icons/seeds/radish.png', iconSize: 50 },
  },
  {
    id: 'basil',
    plantName: 'Basil',
    facts: [
      'Basil belongs to the mint family and has over 60 varieties.',
      'Pinch off the flower buds and it stays leafy and fragrant for longer.',
    ],
    description: 'A tiny dark grain with a spicy streak. Adores warmth and sunshine.',
    growthDays: 30,
    growthSpeed: 1.0,
    idealTemp: 'warm',
    waterNeed: 'mid',
    flowerColor: '#ffffff',
    leafColor: '#2e7d32',
    seed: { icon: 'icons/seeds/basil.png', iconSize: 30 },
  },
  {
    id: 'tomato',
    plantName: 'Tomato',
    facts: [
      'Botanically a tomato is a fruit — a berry, to be exact.',
      'There are over 10,000 varieties, from tiny currants to giant beefsteaks.',
    ],
    description: 'A flat, pale seed. Needs warmth and regular watering. It will test your patience.',
    growthDays: 45,
    growthSpeed: 1.0,
    idealTemp: 'warm',
    waterNeed: 'high',
    flowerColor: '#ffb300',
    leafColor: '#558b2f',
    seed: { icon: 'icons/seeds/tomato.png', iconSize: 52 },
  },
  {
    id: 'sunflower',
    plantName: 'Sunflower',
    facts: [
      'Young sunflowers turn to follow the sun across the sky.',
      'A single head can hold up to 2,000 seeds in a Fibonacci spiral.',
    ],
    description: 'A large striped seed. Reaches for the sun and shrugs off the heat. Slow to grow, but majestic.',
    growthDays: 60,
    growthSpeed: 1.0,
    idealTemp: 'warm',
    waterNeed: 'low',
    flowerColor: '#fdd835',
    leafColor: '#558b2f',
    seed: { icon: 'icons/seeds/sunflower.png', iconSize: 92 },
  },
];

// Pots: affect how fast the soil dries out (decayFactor).
export const POTS = [
  {
    id: 'terracotta',
    name: 'Terracotta',
    color: '#c96f4a',
    rim: '#b05c39',
    decayFactor: 1.2,
    description: 'Classic clay. It breathes, but lets water go faster.',
    icon: 'icons/pots/terracotta.png',
  },
  {
    id: 'ceramic',
    name: 'Ceramic',
    color: '#3f7cac',
    rim: '#2f6190',
    decayFactor: 0.8,
    description: 'The glaze holds moisture noticeably longer.',
    icon: 'icons/pots/ceramic.png',
  },
  {
    id: 'wood',
    name: 'Wooden',
    color: '#9c7a52',
    rim: '#82643f',
    decayFactor: 1.0,
    description: 'Natural wood — everything in moderation.',
    icon: 'icons/pots/wood.png',
  },
  {
    id: 'plastic',
    name: 'Plastic',
    color: '#cfd3d6',
    rim: '#a9adb0',
    decayFactor: 0.9,
    description: 'Light, and keeps moisture pretty well.',
    icon: 'icons/pots/plastic.png',
  },
];

export const WATER_NEED = {
  high: { decay: 1.3, minWater: 30 },
  mid:  { decay: 1.0, minWater: 20 },
  low:  { decay: 0.7, minWater: 12 },
};

export function getSeed(id) {
  return SEEDS.find((s) => s.id === id) || null;
}

export function getPot(id) {
  return POTS.find((p) => p.id === id) || null;
}
