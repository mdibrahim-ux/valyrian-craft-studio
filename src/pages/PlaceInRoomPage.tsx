import React, { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Upload, Loader2, Sparkles, Camera, ArrowLeft, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { products, getProductById, type Product } from '@/data/products';
import { formatINR } from '@/lib/currency';

// Convert remote image URL to base64 data URL (so the edge function can see it)
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

const PlaceInRoomPage: React.FC = () => {
  const [params] = useSearchParams();
  const initialId = params.get('product');
  const [productId, setProductId] = useState<string>(initialId || products[0].id);
  const [roomBase64, setRoomBase64] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<{ x: number; y: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const product: Product | undefined = getProductById(productId);

  const onFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image under 8MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setRoomBase64(data);
      setRoomUrl(data);
      setPlacement(null);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPlacement({ x, y });
  };

  const placeIt = async () => {
    if (!roomBase64 || !product) return;
    setLoading(true);
    setResultImage(null);
    try {
      const productImage = await urlToDataUrl(product.image);
      const { data, error } = await supabase.functions.invoke('place-in-room', {
        body: {
          roomImage: roomBase64,
          productImage,
          productName: product.name,
          placement,
          notes,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResultImage(data.image);
      toast({ title: 'Placed!', description: `${product.name} added to your room.` });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Could not place product', description: e?.message || 'Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} /> Back to catalog
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-3">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary tracking-wider uppercase">Place in My Room</span>
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
            See it <span className="text-gradient-gold">in your space</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Upload a photo of your room, pick where to place the product, and our AI will composite it in photorealistically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product picker */}
          <div className="glass-card rounded-xl p-4 space-y-3 lg:col-span-1">
            <label className="text-xs font-medium text-foreground uppercase tracking-wider">1. Choose product</label>
            <select
              value={productId}
              onChange={e => { setProductId(e.target.value); setResultImage(null); }}
              className="w-full bg-background/50 border border-border/40 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {formatINR(p.basePrice)}</option>
              ))}
            </select>
            {product && (
              <div className="rounded-lg overflow-hidden border border-border/30">
                <img src={product.image} alt={product.name} className="w-full aspect-video object-cover" />
                <div className="p-3">
                  <p className="text-sm font-bold text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                  <p className="text-sm font-bold text-gradient-gold mt-2">{formatINR(product.basePrice)}</p>
                </div>
              </div>
            )}

            <label className="text-xs font-medium text-foreground uppercase tracking-wider pt-2 block">3. Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={200}
              placeholder="e.g. align with the rug, face the window..."
              className="w-full min-h-[70px] bg-background/50 border border-border/40 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />

            <Button onClick={placeIt} disabled={!roomBase64 || !product || loading} variant="premium" size="lg" className="w-full">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Placing (~25s)...</> : <><Sparkles size={18} /> Place in My Room</>}
            </Button>
          </div>

          {/* Room upload + click placement */}
          <div className="glass-card rounded-xl p-4 lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground uppercase tracking-wider">2. Upload room & click placement</label>
              {placement && (
                <span className="text-[11px] text-primary flex items-center gap-1">
                  <MousePointerClick size={12} /> Pin: {placement.x}%, {placement.y}%
                </span>
              )}
            </div>

            {!roomUrl ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="aspect-video rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer flex items-center justify-center bg-secondary/20"
              >
                <div className="text-center p-6">
                  <Camera size={36} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-foreground font-medium">Click to upload room photo</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG/PNG · max 8MB</p>
                </div>
              </div>
            ) : (
              <div
                onClick={handleRoomClick}
                className="relative aspect-video rounded-lg overflow-hidden border border-border/40 cursor-crosshair select-none"
                title="Click anywhere on the photo to choose where to place the furniture"
              >
                <img src={roomUrl} alt="Your room" className="w-full h-full object-cover pointer-events-none" />
                {placement && (
                  <div
                    className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-primary bg-primary/30 backdrop-blur-sm animate-pulse pointer-events-none flex items-center justify-center"
                    style={{ left: `${placement.x}%`, top: `${placement.y}%` }}
                  >
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 text-[11px] text-white bg-black/60 backdrop-blur px-2 py-1 rounded">
                  Click to set placement
                </div>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
            {roomUrl && (
              <button onClick={() => fileRef.current?.click()} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <Upload size={12} /> Choose different photo
              </button>
            )}

            {/* Result */}
            {resultImage && (
              <div className="pt-3 animate-fade-in">
                <p className="text-[11px] uppercase tracking-wider text-primary mb-1.5">After (AI composited)</p>
                <img src={resultImage} alt="Room with product placed" className="w-full rounded-lg border border-primary/40" />
                <a href={resultImage} download="room-with-product.png" className="inline-block mt-2 text-xs text-primary hover:underline">
                  Download photo →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceInRoomPage;
