import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, WOOD_TYPES, MATERIALS, FINISHES, THEME_PACKS } from '@/data/products';
import { useCart, type CustomConfig } from '@/contexts/CartContext';
import CustomizationPanel from '@/components/CustomizationPanel';
import PreviewPanel from '@/components/PreviewPanel';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function calculatePrice(basePrice: number, config: CustomConfig, components: { id: string; priceModifier: number }[]): number {
  const wood = WOOD_TYPES.find(w => w.id === config.woodType);
  const mat = MATERIALS.find(m => m.id === config.material);
  const fin = FINISHES.find(f => f.id === config.finish);
  const theme = config.themePack ? THEME_PACKS.find(t => t.id === config.themePack) : null;

  let price = basePrice;
  price *= wood?.priceMultiplier ?? 1;
  price *= mat?.priceMultiplier ?? 1;
  price *= fin?.priceMultiplier ?? 1;

  // Size modifier (relative to 100cm baseline)
  const sizeMultiplier = ((config.width + config.height + config.depth) / 3) / 100;
  price *= Math.max(0.7, Math.min(sizeMultiplier, 2.0));

  // Components
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

  const price = useMemo(() => {
    if (!product) return 0;
    return calculatePrice(product.basePrice, config, product.components);
  }, [product, config]);

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
      description: `${product.name} — $${price.toLocaleString()}`,
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
            <PreviewPanel image={product.image} productName={product.name} config={config} />
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
                <><ShoppingCart size={18} /> Add to Cart — ${price.toLocaleString()}</>
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
