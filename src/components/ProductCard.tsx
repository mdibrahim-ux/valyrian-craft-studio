import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/data/products';
import { formatINR } from '@/lib/currency';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <Link
      to={`/customize/${product.id}`}
      className="group glass-card overflow-hidden hover-lift cursor-pointer block"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="glass-pill px-3 py-1 text-[10px] text-foreground/90 font-medium uppercase tracking-[0.15em]">
            {product.category}
          </span>
        </div>
      </div>
      <div className="p-5 relative z-10">
        <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-gradient-aurora transition-all">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-gradient-aurora font-semibold">
            From {formatINR(product.basePrice)}
          </span>
          <span className="text-xs text-foreground/80 glass-pill px-3 py-1 group-hover:bg-white/20 transition-all">
            Customize →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
