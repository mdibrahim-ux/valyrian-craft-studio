import React, { useMemo } from 'react';
import {
  WOOD_TYPES, MATERIALS, FINISHES, STYLES, THEME_PACKS,
  type Product, type ProductComponent,
} from '@/data/products';
import type { CustomConfig } from '@/contexts/CartContext';

interface Props {
  product: Product;
  config: CustomConfig;
  onChange: (config: CustomConfig) => void;
  price: number;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{title}</h3>
    {children}
  </div>
);

const OptionGrid: React.FC<{
  options: { id: string; name: string; icon?: string }[];
  selected: string;
  onSelect: (id: string) => void;
}> = ({ options, selected, onSelect }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {options.map(o => (
      <button
        key={o.id}
        onClick={() => onSelect(o.id)}
        className={`p-2.5 rounded-md text-xs font-medium transition-all duration-200 border ${
          selected === o.id
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground'
        }`}
      >
        {o.icon && <span className="mr-1">{o.icon}</span>}
        {o.name}
      </button>
    ))}
  </div>
);

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, unit, onChange }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-primary font-medium">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
        [&::-webkit-slider-thumb]:shadow-[0_0_10px_hsl(var(--gold)/0.5)]"
    />
  </div>
);

const CustomizationPanel: React.FC<Props> = ({ product, config, onChange, price }) => {
  const update = (partial: Partial<CustomConfig>) => onChange({ ...config, ...partial });

  const toggleComponent = (compId: string) => {
    const has = config.components.includes(compId);
    update({
      components: has
        ? config.components.filter(c => c !== compId)
        : [...config.components, compId],
    });
  };

  const selectedWood = WOOD_TYPES.find(w => w.id === config.woodType);

  return (
    <div className="glass-card rounded-lg p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">Customize</h2>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Price</p>
          <p className="text-2xl font-bold text-gradient-gold">${price.toLocaleString()}</p>
        </div>
      </div>

      <Section title="Style">
        <OptionGrid options={STYLES} selected={config.style} onSelect={id => update({ style: id })} />
      </Section>

      <Section title="Wood Type">
        <OptionGrid options={WOOD_TYPES} selected={config.woodType} onSelect={id => update({ woodType: id })} />
        {selectedWood && (
          <div className="mt-2 p-2 rounded bg-secondary/50 text-xs text-muted-foreground">
            <span className="text-foreground">{selectedWood.texture}</span> · Durability: {selectedWood.durability}/100
          </div>
        )}
      </Section>

      <Section title="Material">
        <OptionGrid options={MATERIALS} selected={config.material} onSelect={id => update({ material: id })} />
      </Section>

      <Section title="Finish">
        <OptionGrid options={FINISHES} selected={config.finish} onSelect={id => update({ finish: id })} />
      </Section>

      <Section title="Dimensions">
        <Slider label="Width" value={config.width} min={30} max={300} unit="cm" onChange={v => update({ width: v })} />
        <Slider label="Height" value={config.height} min={30} max={250} unit="cm" onChange={v => update({ height: v })} />
        <Slider label="Depth" value={config.depth} min={20} max={200} unit="cm" onChange={v => update({ depth: v })} />
      </Section>

      <Section title="Components">
        <div className="space-y-2">
          {product.components.map(comp => (
            <label
              key={comp.id}
              className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-all ${
                config.components.includes(comp.id)
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/30 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.components.includes(comp.id)}
                  onChange={() => toggleComponent(comp.id)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{comp.name}</span>
              </div>
              {comp.priceModifier > 0 && (
                <span className="text-xs text-primary">+${comp.priceModifier}</span>
              )}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Theme Pack">
        <div className="space-y-2">
          {THEME_PACKS.map(tp => (
            <button
              key={tp.id}
              onClick={() => update({ themePack: config.themePack === tp.id ? null : tp.id })}
              className={`w-full text-left p-3 rounded-md border transition-all ${
                config.themePack === tp.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/30 hover:border-primary/40'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{tp.name}</p>
              <p className="text-xs text-muted-foreground">{tp.description}</p>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default CustomizationPanel;
