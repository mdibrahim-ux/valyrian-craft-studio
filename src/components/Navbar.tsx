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
    { to: '/cart', label: 'Cart' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-heading font-bold text-gradient-gold tracking-wider">
            VALYRIAN CRAFT
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                location.pathname === l.to ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors">
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-gold text-primary-foreground text-xs flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-card border-t border-border/30 animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-medium ${
                  location.pathname === l.to ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
