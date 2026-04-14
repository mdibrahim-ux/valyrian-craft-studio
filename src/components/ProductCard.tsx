import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/data/products';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <Link
      to={`/customize/${product.id}`}
      className="group glass-card rounded-lg overflow-hidden hover-lift cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
            {product.category}
          </p>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-primary font-semibold">
            From ${product.basePrice.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
            Customize →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
