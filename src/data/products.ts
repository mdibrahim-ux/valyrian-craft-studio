export type Category = 'seating' | 'tables' | 'beds' | 'storage' | 'office';

export interface ProductComponent {
  id: string;
  name: string;
  priceModifier: number;
  included: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  basePrice: number;
  description: string;
  image: string;
  featured?: boolean;
  components: ProductComponent[];
  tags: string[];
}

export const CATEGORIES: { id: Category; name: string; icon: string; count: number }[] = [
  { id: 'seating', name: 'Seating', icon: '🪑', count: 8 },
  { id: 'tables', name: 'Tables', icon: '🪵', count: 7 },
  { id: 'beds', name: 'Beds & Bedroom', icon: '🛏️', count: 5 },
  { id: 'storage', name: 'Storage', icon: '🗄️', count: 5 },
  { id: 'office', name: 'Office', icon: '💼', count: 5 },
];

export const WOOD_TYPES = [
  { id: 'teak', name: 'Teak', priceMultiplier: 1.4, durability: 95, texture: 'Rich golden-brown' },
  { id: 'sheesham', name: 'Sheesham', priceMultiplier: 1.2, durability: 88, texture: 'Dark reddish-brown' },
  { id: 'oak', name: 'Oak', priceMultiplier: 1.3, durability: 90, texture: 'Light honey grain' },
  { id: 'walnut', name: 'Walnut', priceMultiplier: 1.5, durability: 85, texture: 'Deep chocolate swirl' },
  { id: 'pine', name: 'Pine', priceMultiplier: 0.8, durability: 65, texture: 'Pale knotted grain' },
  { id: 'mahogany', name: 'Mahogany', priceMultiplier: 1.6, durability: 92, texture: 'Reddish lustre' },
];

export const MATERIALS = [
  { id: 'solid-wood', name: 'Solid Wood', priceMultiplier: 1.3 },
  { id: 'engineered', name: 'Engineered Wood', priceMultiplier: 0.7 },
  { id: 'metal', name: 'Metal Frame', priceMultiplier: 1.1 },
  { id: 'glass', name: 'Glass', priceMultiplier: 1.2 },
  { id: 'upholstery', name: 'Premium Upholstery', priceMultiplier: 1.15 },
];

export const FINISHES = [
  { id: 'matte', name: 'Matte', priceMultiplier: 1.0 },
  { id: 'glossy', name: 'Glossy', priceMultiplier: 1.1 },
  { id: 'natural', name: 'Natural', priceMultiplier: 0.95 },
  { id: 'laminated', name: 'Laminated', priceMultiplier: 0.85 },
  { id: 'polished', name: 'Hand Polished', priceMultiplier: 1.25 },
];

export const STYLES = [
  { id: 'modern', name: 'Modern', icon: '◻️' },
  { id: 'rustic', name: 'Rustic', icon: '🏡' },
  { id: 'industrial', name: 'Industrial', icon: '⚙️' },
  { id: 'scandinavian', name: 'Scandinavian', icon: '❄️' },
  { id: 'vintage', name: 'Vintage', icon: '🕰️' },
  { id: 'luxury', name: 'Luxury', icon: '👑' },
];

export const THEME_PACKS = [
  { id: 'luxury', name: 'Luxury Pack', priceMultiplier: 1.3, description: 'Premium materials, gold accents' },
  { id: 'eco', name: 'Eco Pack', priceMultiplier: 0.9, description: 'Sustainable materials, natural finish' },
  { id: 'vintage', name: 'Vintage Pack', priceMultiplier: 1.15, description: 'Classic charm, antique tones' },
  { id: 'futuristic', name: 'Futuristic Pack', priceMultiplier: 1.25, description: 'Sleek lines, metallic finishes' },
];

const FURNITURE_IMAGES = {
  seating: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  ],
  tables: [
    'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&h=400&fit=crop',
  ],
  beds: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
  ],
  storage: [
    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1597072689227-8882273e8f6a?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=400&fit=crop',
  ],
  office: [
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1526040652367-ac003a0475fe?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=600&h=400&fit=crop',
  ],
};

function createProducts(): Product[] {
  const products: Product[] = [];
  
  const seatingItems = [
    { name: 'Aether Lounge Chair', base: 899, desc: 'Sculptural comfort meets modern design', tags: ['modern', 'lounge'], featured: true },
    { name: 'Nordic Armchair', base: 749, desc: 'Clean Scandinavian lines with plush cushioning', tags: ['scandinavian', 'armchair'] },
    { name: 'Titan Recliner', base: 1299, desc: 'Power recliner with memory foam and heating', tags: ['luxury', 'recliner'], featured: true },
    { name: 'Meridian Sofa', base: 2499, desc: 'Three-seater sofa with modular configuration', tags: ['modern', 'sofa'], featured: true },
    { name: 'Zenith Bar Stool', base: 349, desc: 'Adjustable height with swivel base', tags: ['industrial', 'stool'] },
    { name: 'Cascade Bench', base: 599, desc: 'Upholstered bench with solid wood frame', tags: ['rustic', 'bench'] },
    { name: 'Vortex Accent Chair', base: 649, desc: 'Statement piece with curved silhouette', tags: ['vintage', 'accent'] },
    { name: 'Nexus Sectional', base: 3499, desc: 'L-shaped modular sectional for large spaces', tags: ['modern', 'sectional'] },
  ];

  seatingItems.forEach((item, i) => {
    products.push({
      id: `seat-${i + 1}`,
      name: item.name,
      category: 'seating',
      basePrice: item.base,
      description: item.desc,
      image: FURNITURE_IMAGES.seating[i],
      featured: item.featured,
      tags: item.tags,
      components: [
        { id: 'legs', name: 'Legs', priceModifier: 0, included: true },
        { id: 'cushion', name: 'Premium Cushion', priceModifier: 150, included: true },
        { id: 'armrest', name: 'Armrests', priceModifier: 200, included: i < 4 },
        { id: 'headrest', name: 'Headrest', priceModifier: 120, included: false },
        { id: 'lumbar', name: 'Lumbar Support', priceModifier: 80, included: false },
      ],
    });
  });

  const tableItems = [
    { name: 'Monolith Dining Table', base: 1899, desc: 'Live-edge dining table for 8', tags: ['rustic', 'dining'], featured: true },
    { name: 'Prism Coffee Table', base: 699, desc: 'Geometric base with tempered glass top', tags: ['modern', 'coffee'] },
    { name: 'Apex Executive Desk', base: 1599, desc: 'Spacious desk with cable management', tags: ['office', 'desk'], featured: true },
    { name: 'Halo Side Table', base: 399, desc: 'Circular marble-top side table', tags: ['luxury', 'side'] },
    { name: 'Terra Console', base: 899, desc: 'Narrow console with storage drawers', tags: ['modern', 'console'] },
    { name: 'Forge Workbench', base: 1199, desc: 'Industrial-style standing desk', tags: ['industrial', 'desk'] },
    { name: 'Eclipse Nesting Tables', base: 549, desc: 'Set of 3 nesting tables', tags: ['scandinavian', 'nesting'] },
  ];

  tableItems.forEach((item, i) => {
    products.push({
      id: `table-${i + 1}`,
      name: item.name,
      category: 'tables',
      basePrice: item.base,
      description: item.desc,
      image: FURNITURE_IMAGES.tables[i],
      featured: item.featured,
      tags: item.tags,
      components: [
        { id: 'legs', name: 'Table Legs', priceModifier: 0, included: true },
        { id: 'top', name: 'Table Top', priceModifier: 0, included: true },
        { id: 'drawers', name: 'Storage Drawers', priceModifier: 250, included: false },
        { id: 'extension', name: 'Extension Leaf', priceModifier: 350, included: false },
        { id: 'glass-top', name: 'Glass Top Insert', priceModifier: 180, included: false },
      ],
    });
  });

  const bedItems = [
    { name: 'Sovereign King Bed', base: 2999, desc: 'Upholstered king bed with tufted headboard', tags: ['luxury', 'king'], featured: true },
    { name: 'Aurora Platform Bed', base: 1899, desc: 'Low-profile platform with LED ambiance', tags: ['modern', 'platform'] },
    { name: 'Haven Canopy Bed', base: 3499, desc: 'Four-poster canopy with draping', tags: ['vintage', 'canopy'] },
    { name: 'Drift Storage Bed', base: 2199, desc: 'Hydraulic lift storage underneath', tags: ['modern', 'storage'] },
    { name: 'Ember Nightstand', base: 449, desc: 'Bedside table with wireless charging', tags: ['modern', 'nightstand'] },
  ];

  bedItems.forEach((item, i) => {
    products.push({
      id: `bed-${i + 1}`,
      name: item.name,
      category: 'beds',
      basePrice: item.base,
      description: item.desc,
      image: FURNITURE_IMAGES.beds[i],
      featured: item.featured,
      tags: item.tags,
      components: [
        { id: 'frame', name: 'Bed Frame', priceModifier: 0, included: true },
        { id: 'headboard', name: 'Headboard', priceModifier: 0, included: true },
        { id: 'storage', name: 'Under-bed Storage', priceModifier: 400, included: false },
        { id: 'led', name: 'LED Ambient Lighting', priceModifier: 200, included: false },
        { id: 'slats', name: 'Premium Slat System', priceModifier: 150, included: true },
      ],
    });
  });

  const storageItems = [
    { name: 'Vault Wardrobe', base: 2499, desc: 'Triple-door wardrobe with mirror', tags: ['modern', 'wardrobe'] },
    { name: 'Archive Bookshelf', base: 899, desc: 'Tall bookshelf with adjustable shelves', tags: ['industrial', 'bookshelf'], featured: true },
    { name: 'Cellar Wine Cabinet', base: 1699, desc: 'Temperature-controlled wine storage', tags: ['luxury', 'wine'] },
    { name: 'Lattice TV Unit', base: 799, desc: 'Entertainment center with cable routing', tags: ['modern', 'tv-unit'] },
    { name: 'Nomad Dresser', base: 1299, desc: '6-drawer dresser with soft-close', tags: ['scandinavian', 'dresser'] },
  ];

  storageItems.forEach((item, i) => {
    products.push({
      id: `storage-${i + 1}`,
      name: item.name,
      category: 'storage',
      basePrice: item.base,
      description: item.desc,
      image: FURNITURE_IMAGES.storage[i],
      featured: item.featured,
      tags: item.tags,
      components: [
        { id: 'body', name: 'Cabinet Body', priceModifier: 0, included: true },
        { id: 'doors', name: 'Doors/Panels', priceModifier: 0, included: true },
        { id: 'handles', name: 'Premium Handles', priceModifier: 80, included: false },
        { id: 'mirror', name: 'Mirror Panel', priceModifier: 200, included: false },
        { id: 'lighting', name: 'Interior Lighting', priceModifier: 150, included: false },
      ],
    });
  });

  const officeItems = [
    { name: 'Command Ergonomic Chair', base: 1199, desc: 'Full ergonomic with mesh back', tags: ['modern', 'ergonomic'], featured: true },
    { name: 'Summit Standing Desk', base: 1499, desc: 'Motorized sit-stand desk', tags: ['modern', 'standing'] },
    { name: 'Matrix Filing Cabinet', base: 549, desc: '4-drawer lateral filing', tags: ['industrial', 'filing'] },
    { name: 'Harbor Credenza', base: 1899, desc: 'Executive storage credenza', tags: ['luxury', 'credenza'] },
    { name: 'Link Conference Table', base: 2999, desc: '12-person conference table', tags: ['modern', 'conference'] },
  ];

  officeItems.forEach((item, i) => {
    products.push({
      id: `office-${i + 1}`,
      name: item.name,
      category: 'office',
      basePrice: item.base,
      description: item.desc,
      image: FURNITURE_IMAGES.office[i],
      featured: item.featured,
      tags: item.tags,
      components: [
        { id: 'base', name: 'Base/Frame', priceModifier: 0, included: true },
        { id: 'surface', name: 'Work Surface', priceModifier: 0, included: true },
        { id: 'cable-mgmt', name: 'Cable Management', priceModifier: 120, included: false },
        { id: 'monitor-arm', name: 'Monitor Arm Mount', priceModifier: 180, included: false },
        { id: 'keyboard-tray', name: 'Keyboard Tray', priceModifier: 90, included: false },
      ],
    });
  });

  return products;
}

export const products = createProducts();

export const getFeaturedProducts = () => products.filter(p => p.featured);
export const getProductsByCategory = (cat: Category) => products.filter(p => p.category === cat);
export const getProductById = (id: string) => products.find(p => p.id === id);
