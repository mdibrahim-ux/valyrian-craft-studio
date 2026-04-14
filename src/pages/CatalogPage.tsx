import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { products, CATEGORIES, type Category } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { Search } from 'lucide-react';

const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') as Category | null;
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) list = list.filter(p => p.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.includes(q))
      );
    }
    return list;
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Collection</h1>
        <p className="text-muted-foreground mb-8">Select a piece to begin customizing</p>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search furniture..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setSearchParams({})}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !activeCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({products.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ category: cat.id })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;
