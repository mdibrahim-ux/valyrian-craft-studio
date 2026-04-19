import React, { useState, useMemo, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, WOOD_TYPES, MATERIALS, FINISHES, THEME_PACKS } from '@/data/products';
import { useCart, type CustomConfig } from '@/contexts/CartContext';
import CustomizationPanel from '@/components/CustomizationPanel';
import PreviewPanel from '@/components/PreviewPanel';
import ProductViewer3D from '@/components/ProductViewer3D';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft, Check, Box, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatINR } from '@/lib/currency';

function calculatePrice(basePrice: number, config: CustomConfig, components: { id: string; priceModifier: number }[]): number {
  const wood = WOOD_TYPES.find(w => w.id === config.woodType);
  const mat = MATERIALS.find(m => m.id === config.material);
  const fin = FINISHES.find(f => f.id === config.finish);
  const theme = config.themePack ? THEME_PACKS.find(t => t.id === config.themePack) : null;

  let price = basePrice;
  price *= wood?.priceMultiplier ?? 1;
  price *= mat?.priceMultiplier ?? 1;
  price *= fin?.priceMultiplier ?? 1;

  const sizeMultiplier = ((config.width + config.height + config.depth) / 3) / 100;
  price *= Math.max(0.7, Math.min(sizeMultiplier, 2.0));

  const compCost = components
    .filter(c => config.components.includes(c.id))
    .reduce((sum, c) => sum + c.priceModifier, 0);
  price += compCost;

  if (theme) price *= theme.priceMultiplier;
  return Math.round(price);
}

const CustomizePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const product = getProductById(id || '');

  const [config, setConfig] = useState<CustomConfig>({
    style: 'modern',
    woodType: 'oak',
    material: 'solid-wood',
    finish: 'matte',
    width: 100,
    height: 80,
    depth: 60,
    components: product?.components.filter(c => c.included).map(c => c.id) || [],
    themePack: null,
  });

  const [added, setAdded] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'photo'>('3d');

  const price = useMemo(() => {
    if (!product) return 0;
    return calculatePrice(product.basePrice, config, product.components);
  }, [product, config]);

  // Determine subtype from product tags (skip the style tag — first tag is style)
  const subtype = useMemo(() => product?.tags[1], [product]);

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Button variant="ghost-gold" onClick={() => navigate('/catalog')}>Back to Catalog</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      image: product.image,
      config,
      price,
      quantity: 1,
    });
    setAdded(true);
    toast({
      title: 'Added to cart',
      description: `${product.name} — ${formatINR(price)}`,
    });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Preview */}
          <div className="space-y-4">
            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === '3d'
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <Box size={14} /> 3D View
              </button>
              <button
                onClick={() => setViewMode('photo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'photo'
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <Image size={14} /> Photo
              </button>
              <span className="text-[10px] text-muted-foreground ml-2">
                {viewMode === '3d' ? 'Drag to rotate · Scroll to zoom' : ''}
              </span>
            </div>

            {viewMode === '3d' ? (
              <Suspense fallback={
                <div className="w-full aspect-[4/3] rounded-lg bg-secondary/20 border border-border/30 flex items-center justify-center">
                  <div className="text-center">
                    <Box size={32} className="mx-auto text-muted-foreground mb-2 animate-pulse" />
                    <p className="text-xs text-muted-foreground">Loading 3D preview...</p>
                  </div>
                </div>
              }>
                <ProductViewer3D config={config} category={product.category} subtype={subtype} />
              </Suspense>
            ) : (
              <PreviewPanel image={product.image} productName={product.name} config={config} />
            )}

            {/* Product name & dimensions below preview */}
            {viewMode === '3d' && (
              <div className="glass-card rounded-lg p-4">
                <h2 className="font-heading text-xl font-bold text-foreground">{product.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.width}cm × {config.height}cm × {config.depth}cm
                </p>
              </div>
            )}

            <Button
              onClick={handleAddToCart}
              variant="premium"
              size="lg"
              className="w-full"
              disabled={added}
            >
              {added ? (
                <><Check size={18} /> Added to Cart</>
              ) : (
                <><ShoppingCart size={18} /> Add to Cart — {formatINR(price)}</>
              )}
            </Button>
          </div>

          {/* Right: Customization */}
          <CustomizationPanel product={product} config={config} onChange={setConfig} price={price} />
        </div>
      </div>
    </div>
  );
};

export default CustomizePage;
