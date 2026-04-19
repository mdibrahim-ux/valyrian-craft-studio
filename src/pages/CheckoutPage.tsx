import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, ShieldCheck, Truck, CreditCard, Smartphone, Building2, Banknote, Lock } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod';

const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: React.ElementType; desc: string }[] = [
  { id: 'upi', name: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm, BHIM' },
  { id: 'card', name: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay, Amex' },
  { id: 'netbanking', name: 'Net Banking', icon: Building2, desc: 'All major Indian banks supported' },
  { id: 'cod', name: 'Cash on Delivery', icon: Banknote, desc: 'Pay in cash on delivery (₹100 fee)' },
];

const CheckoutPage: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'address' | 'payment'>('address');

  const [address, setAddress] = useState({
    name: '', phone: '', email: '', line1: '', city: '', state: '', pincode: '',
  });

  // Payment field state
  const [upiId, setUpiId] = useState('');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [bank, setBank] = useState('');

  const gst = total * 0.18;
  const codFee = method === 'cod' ? 100 : 0;
  const grandTotal = total + gst + codFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button asChild variant="premium"><Link to="/catalog">Browse Catalog</Link></Button>
        </div>
      </div>
    );
  }

  const isAddressValid = address.name && address.phone.length >= 10 && address.line1 && address.city && address.state && address.pincode.length === 6;

  const handleProceed = () => {
    if (!isAddressValid) {
      toast({ title: 'Incomplete address', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    setStep('payment');
  };

  const handlePay = () => {
    // Validate payment fields
    if (method === 'upi' && !/^[\w.\-]+@[\w]+$/.test(upiId)) {
      toast({ title: 'Invalid UPI ID', description: 'Enter a valid UPI ID (e.g. name@bank).', variant: 'destructive' });
      return;
    }
    if (method === 'card' && (card.number.replace(/\s/g, '').length < 12 || !card.name || !card.expiry || card.cvv.length < 3)) {
      toast({ title: 'Invalid card details', variant: 'destructive' });
      return;
    }
    if (method === 'netbanking' && !bank) {
      toast({ title: 'Select your bank', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      const orderId = 'VC' + Date.now().toString().slice(-8);
      clearCart();
      toast({ title: 'Order placed successfully!', description: `Order #${orderId} — ${formatINR(grandTotal)}` });
      setProcessing(false);
      navigate('/');
    }, 1800);
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <Link to="/cart" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Cart
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Secure Checkout</h1>
          <div className="flex items-center gap-1 text-xs text-primary"><Lock size={12} /> 256-bit SSL</div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { id: 'address', label: '1. Shipping' },
            { id: 'payment', label: '2. Payment' },
          ].map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                step === s.id ? 'bg-primary text-primary-foreground border-primary' :
                (step === 'payment' && s.id === 'address') ? 'bg-primary/10 text-primary border-primary/30' :
                'bg-secondary text-muted-foreground border-border'
              }`}>
                {(step === 'payment' && s.id === 'address') ? <span className="flex items-center gap-1"><Check size={12} /> {s.label}</span> : s.label}
              </div>
              {i === 0 && <div className="flex-1 max-w-12 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'address' && (
              <div className="glass-card rounded-lg p-6">
                <h2 className="font-heading text-xl font-bold text-foreground mb-4">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name *" value={address.name} onChange={v => setAddress({ ...address, name: v })} />
                  <Field label="Phone *" value={address.phone} onChange={v => setAddress({ ...address, phone: v.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit mobile" />
                  <Field label="Email" value={address.email} onChange={v => setAddress({ ...address, email: v })} type="email" full />
                  <Field label="Address *" value={address.line1} onChange={v => setAddress({ ...address, line1: v })} placeholder="House no, street, locality" full />
                  <Field label="City *" value={address.city} onChange={v => setAddress({ ...address, city: v })} />
                  <Field label="State *" value={address.state} onChange={v => setAddress({ ...address, state: v })} />
                  <Field label="PIN Code *" value={address.pincode} onChange={v => setAddress({ ...address, pincode: v.replace(/\D/g, '').slice(0, 6) })} placeholder="6-digit PIN" />
                </div>

                <Button variant="premium" size="lg" className="w-full mt-6" onClick={handleProceed}>
                  Continue to Payment
                </Button>
              </div>
            )}

            {step === 'payment' && (
              <>
                <div className="glass-card rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading text-xl font-bold text-foreground">Payment Method</h2>
                    <button onClick={() => setStep('address')} className="text-xs text-muted-foreground hover:text-primary">Edit address</button>
                  </div>

                  <div className="space-y-2">
                    {PAYMENT_METHODS.map(pm => {
                      const Icon = pm.icon;
                      const selected = method === pm.id;
                      return (
                        <button
                          key={pm.id}
                          onClick={() => setMethod(pm.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                            selected ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30 hover:border-primary/40'
                          }`}
                        >
                          <div className={`p-2 rounded-md ${selected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                            <Icon size={20} />
                          </div>
                          <div className="text-left flex-1">
                            <p className="text-sm font-medium text-foreground">{pm.name}</p>
                            <p className="text-xs text-muted-foreground">{pm.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${selected ? 'border-primary bg-primary' : 'border-border'}`}>
                            {selected && <Check size={12} className="text-primary-foreground" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment-specific fields */}
                <div className="glass-card rounded-lg p-6">
                  {method === 'upi' && (
                    <>
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Enter UPI ID</h3>
                      <Field label="UPI ID" value={upiId} onChange={setUpiId} placeholder="yourname@okhdfcbank" />
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                          <span key={app} className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground">{app}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {method === 'card' && (
                    <>
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Card Details</h3>
                      <div className="space-y-3">
                        <Field label="Card Number" value={card.number} onChange={v => {
                          const digits = v.replace(/\D/g, '').slice(0, 16);
                          setCard({ ...card, number: digits.replace(/(\d{4})(?=\d)/g, '$1 ') });
                        }} placeholder="1234 5678 9012 3456" />
                        <Field label="Cardholder Name" value={card.name} onChange={v => setCard({ ...card, name: v })} />
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Expiry (MM/YY)" value={card.expiry} onChange={v => {
                            let val = v.replace(/\D/g, '').slice(0, 4);
                            if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                            setCard({ ...card, expiry: val });
                          }} placeholder="12/28" />
                          <Field label="CVV" value={card.cvv} onChange={v => setCard({ ...card, cvv: v.replace(/\D/g, '').slice(0, 4) })} placeholder="•••" type="password" />
                        </div>
                      </div>
                    </>
                  )}

                  {method === 'netbanking' && (
                    <>
                      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Select Your Bank</h3>
                      <select
                        value={bank}
                        onChange={e => setBank(e.target.value)}
                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="">Choose a bank...</option>
                        {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Yes Bank', 'Punjab National Bank', 'Bank of Baroda'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </>
                  )}

                  {method === 'cod' && (
                    <div className="text-center py-4">
                      <Banknote size={36} className="mx-auto text-primary mb-3" />
                      <p className="text-sm text-foreground font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground mt-1">Pay {formatINR(grandTotal)} in cash when your order arrives.</p>
                      <p className="text-[11px] text-primary mt-2">Note: ₹100 COD handling fee applies.</p>
                    </div>
                  )}
                </div>

                <Button variant="premium" size="lg" className="w-full" onClick={handlePay} disabled={processing}>
                  {processing ? 'Processing...' : `Pay ${formatINR(grandTotal)}`}
                </Button>
              </>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-lg p-5 sticky top-24">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Order Summary</h3>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image} alt={item.productName} className="w-14 h-14 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.productName}</p>
                      <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-xs text-primary mt-0.5">{formatINR(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-xs">
                <Row label="Subtotal" value={formatINR(total)} />
                <Row label="GST (18%)" value={formatINR(gst)} />
                {codFee > 0 && <Row label="COD Fee" value={formatINR(codFee)} />}
                <Row label="Shipping" value={<span className="text-primary">Free</span>} />
              </div>
              <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                <span className="text-foreground font-semibold">Total</span>
                <span className="text-xl font-bold text-gradient-gold">{formatINR(grandTotal)}</span>
              </div>

              <div className="mt-5 space-y-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-primary" /> Secure encrypted payment</div>
                <div className="flex items-center gap-2"><Truck size={14} className="text-primary" /> Free delivery within 7-10 days</div>
                <div className="flex items-center gap-2"><Check size={14} className="text-primary" /> 30-day return policy</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; full?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', full }) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
    />
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
);

export default CheckoutPage;
