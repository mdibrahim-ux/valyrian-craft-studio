import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Palette } from 'lucide-react';
import { getFeaturedProducts, CATEGORIES } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';

const HeroSection = () => (
  <section className="relative min-h-[88vh] flex items-center overflow-hidden">
    {/* Floating orbs */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="orb orb-blue w-[420px] h-[420px] -top-32 -left-20" />
      <div className="orb orb-violet w-[500px] h-[500px] top-20 -right-32" />
      <div className="orb orb-cyan w-[360px] h-[360px] bottom-0 left-1/3" />
    </div>

    {/* Background image with heavy treatment */}
    <div className="absolute inset-0 -z-10">
      <img
        src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&h=1080&fit=crop"
        alt="Luxury interior"
        className="w-full h-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
    </div>

    <div className="container mx-auto px-4 relative z-10 pt-12">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 mb-6 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse" />
          <span className="text-xs text-foreground/80 font-medium tracking-[0.2em] uppercase">Next-Gen Furniture Design</span>
        </div>
        <h1 className="font-heading text-5xl md:text-7xl font-bold text-foreground leading-[1.05] mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          Craft Your
          <span className="block text-gradient-aurora">Perfect Space</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Experience furniture customization like never before. Choose materials, dimensions, and style — see changes in real-time.
        </p>
        <div className="flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Button asChild variant="premium" size="lg">
            <Link to="/catalog">
              Explore Collection <ArrowRight size={18} />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/catalog">
              Start Customizing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);


const FeaturesBar = () => (
  <section className="py-10">
    <div className="container mx-auto px-4">
      <div className="glass-surface rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Palette, title: 'Infinite Combinations', desc: 'Mix materials, styles and dimensions freely' },
          { icon: Sparkles, title: 'Real-Time Preview', desc: 'See every change instantly as you design' },
          { icon: Shield, title: 'Premium Quality', desc: 'Handcrafted with the finest materials' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4 group">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-white/15 backdrop-blur-xl group-hover:from-primary/30 group-hover:to-accent/25 transition-all duration-500">
              <Icon size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CategoriesSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground text-center mb-3">
        Browse by <span className="text-gradient-aurora">Category</span>
      </h2>
      <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">
        From seating to storage — every piece fully customizable
      </p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {CATEGORIES.map((cat, i) => (
          <Link
            key={cat.id}
            to={`/catalog?category=${cat.id}`}
            className="glass-card p-6 text-center hover-lift group animate-fade-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className="text-3xl mb-3 block transition-transform duration-500 group-hover:scale-125 group-hover:-translate-y-1 inline-block">{cat.icon}</span>
            <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{cat.count} items</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
);


const FeaturedSection = () => {
  const featured = getFeaturedProducts();
  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              Featured Pieces
            </h2>
            <p className="text-muted-foreground mt-2">Curated selections from our master craftsmen</p>
          </div>
          <Link to="/catalog" className="text-primary text-sm font-medium hover:underline hidden md:block">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featured.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="py-24 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
    <div className="container mx-auto px-4 text-center relative z-10">
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4">
        Ready to Design Your <span className="text-gradient-gold">Masterpiece</span>?
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        Start with any piece, customize every detail, and bring your vision to life.
      </p>
      <Button asChild variant="premium" size="lg">
        <Link to="/catalog">
          Start Creating <ArrowRight size={18} />
        </Link>
      </Button>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-border/30 py-12 bg-card/30">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-heading text-lg font-bold text-gradient-gold tracking-wider">VALYRIAN CRAFT</span>
        <p className="text-xs text-muted-foreground">© 2026 Valyrian Craft. Designed for distinction.</p>
      </div>
    </div>
  </footer>
);

const Index: React.FC = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesBar />
      <CategoriesSection />
      <FeaturedSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
