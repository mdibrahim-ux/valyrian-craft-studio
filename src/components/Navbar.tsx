import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

const Navbar: React.FC = () => {
  const { itemCount } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/catalog', label: 'Catalog' },
    { to: '/ai-room', label: 'AI Room' },
    { to: '/place-in-room', label: 'Place in Room' },
  ];

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl">
        <div className="glass-nav rounded-full px-3 sm:px-5 h-14 flex items-center justify-between animate-fade-in">
          <Link to="/" className="flex items-center gap-2 pl-2 pr-3 group">
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-accent shadow-[0_0_12px_hsl(var(--primary))] group-hover:scale-125 transition-transform" />
            <span className="text-sm sm:text-base font-heading font-bold text-gradient-aurora tracking-wider">
              VALYRIAN CRAFT
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative px-4 py-2 text-sm font-medium tracking-wide rounded-full transition-all duration-500 ${
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-[inset_0_1px_0_0_hsl(var(--glass-highlight))]" />
                  )}
                  <span className="relative z-10">{l.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative h-10 w-10 rounded-full flex items-center justify-center text-foreground/90 hover:text-foreground bg-white/5 hover:bg-white/15 backdrop-blur-xl border border-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105"
            >
              <ShoppingCart size={16} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-[0_0_12px_hsl(var(--primary)/0.6)]">
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              className="md:hidden h-10 w-10 rounded-full flex items-center justify-center text-foreground bg-white/5 hover:bg-white/15 backdrop-blur-xl border border-white/15 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden mt-2 glass-surface rounded-3xl animate-scale-in origin-top">
            <div className="px-4 py-4 flex flex-col gap-1">
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-full text-sm font-medium transition-all ${
                    location.pathname === l.to
                      ? 'bg-white/10 text-foreground border border-white/20'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      {/* Spacer */}
      <div className="h-20" />
    </>
  );
};

export default Navbar;
