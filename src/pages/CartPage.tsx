import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STYLES, WOOD_TYPES, MATERIALS, FINISHES } from '@/data/products';

const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Start customizing furniture to add items</p>
          <Button asChild variant="premium">
            <Link to="/catalog">Browse Catalog</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <Link to="/catalog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Your Cart</h1>

        <div className="space-y-4 mb-8">
          {items.map(item => {
            const style = STYLES.find(s => s.id === item.config.style)?.name;
            const wood = WOOD_TYPES.find(w => w.id === item.config.woodType)?.name;
            return (
              <div key={item.id} className="glass-card rounded-lg p-4 flex gap-4">
                <img src={item.image} alt={item.productName} className="w-24 h-24 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-foreground">{item.productName}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {style} · {wood} · {item.config.width}×{item.config.height}×{item.config.depth}cm
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded bg-secondary text-foreground hover:bg-muted">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium text-foreground w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded bg-secondary text-foreground hover:bg-muted">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <p className="text-primary font-semibold">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="glass-card rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground font-semibold">${total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-primary text-sm">Free</span>
          </div>
          <div className="border-t border-border pt-4 flex justify-between items-center mb-6">
            <span className="text-foreground font-semibold">Total</span>
            <span className="text-2xl font-bold text-gradient-gold">${total.toLocaleString()}</span>
          </div>
          <Button variant="premium" size="lg" className="w-full">
            Proceed to Checkout
          </Button>
          <button onClick={clearCart} className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors">
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
