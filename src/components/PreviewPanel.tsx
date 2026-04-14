import React from 'react';
import { CustomConfig } from '@/contexts/CartContext';
import { WOOD_TYPES, MATERIALS, FINISHES, STYLES } from '@/data/products';
import { RotateCw } from 'lucide-react';

interface Props {
  image: string;
  productName: string;
  config: CustomConfig;
}

const PreviewPanel: React.FC<Props> = ({ image, productName, config }) => {
  const style = STYLES.find(s => s.id === config.style);
  const wood = WOOD_TYPES.find(w => w.id === config.woodType);
  const material = MATERIALS.find(m => m.id === config.material);
  const finish = FINISHES.find(f => f.id === config.finish);

  // Generate a color overlay based on wood type for visual feedback
  const woodOverlays: Record<string, string> = {
    teak: 'sepia(30%) saturate(120%)',
    sheesham: 'sepia(50%) saturate(80%) hue-rotate(-10deg)',
    oak: 'sepia(20%) saturate(110%) brightness(110%)',
    walnut: 'sepia(60%) saturate(70%) brightness(80%)',
    pine: 'sepia(10%) saturate(90%) brightness(120%)',
    mahogany: 'sepia(50%) saturate(100%) hue-rotate(-20deg) brightness(85%)',
  };

  const finishOverlays: Record<string, string> = {
    matte: 'contrast(95%)',
    glossy: 'contrast(110%) brightness(105%)',
    natural: '',
    laminated: 'brightness(105%) saturate(90%)',
    polished: 'contrast(115%) brightness(108%)',
  };

  const filter = [
    woodOverlays[config.woodType] || '',
    finishOverlays[config.finish] || '',
  ].filter(Boolean).join(' ');

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="relative aspect-[4/3] bg-secondary/30">
        <img
          src={image}
          alt={productName}
          className="w-full h-full object-cover transition-all duration-700"
          style={{ filter: filter || undefined }}
        />
        {/* Overlay with configuration info */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="glass-surface px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-muted-foreground">
            <RotateCw size={12} />
            <span>360° Preview</span>
          </div>
        </div>

        {/* Dimension overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground mb-1">{productName}</h2>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{config.width}cm × {config.height}cm × {config.depth}cm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Config summary bar */}
      <div className="p-4 grid grid-cols-4 gap-3">
        {[
          { label: 'Style', value: style?.name },
          { label: 'Wood', value: wood?.name },
          { label: 'Material', value: material?.name },
          { label: 'Finish', value: finish?.name },
        ].map(item => (
          <div key={item.label} className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewPanel;
