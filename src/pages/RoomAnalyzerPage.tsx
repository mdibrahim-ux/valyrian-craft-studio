import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Loader2, Sparkles, Camera, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatINR } from '@/lib/currency';

type Recommendation = {
  piece: string;
  category: string;
  reason: string;
  suggestedWood: string;
  suggestedStyle: string;
  estimatedPriceINR: number;
  placement: string;
};
type Analysis = {
  roomType: string;
  styleDetected: string;
  colorPalette: string[];
  overallAssessment: string;
  recommendations: Recommendation[];
  designTips: string[];
};

const RoomAnalyzerPage: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [redesignedImage, setRedesignedImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image under 8MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setImageBase64(data);
      setImageUrl(data);
      setAnalysis(null);
      setRedesignedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setAnalysis(null);
    setRedesignedImage(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-room', {
        body: { imageBase64, notes },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      if (data.redesignedImage) setRedesignedImage(data.redesignedImage);
      toast({ title: 'Redesign ready', description: 'See your room with the new furniture below.' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Analysis failed', description: e?.message || 'Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-3">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary tracking-wider uppercase">AI Room Analyzer</span>
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
            Snap Your Room — <span className="text-gradient-gold">Get Design Magic</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Upload a photo of your room, hall or office. Our AI will suggest furniture pieces, layouts and styles tailored to your space.
          </p>
        </div>

        {/* Upload */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => fileRef.current?.click()}
              className="aspect-video rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center bg-secondary/20 overflow-hidden"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Your room" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <Camera size={36} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-foreground font-medium">Click to upload room photo</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG/PNG · max 8MB</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-foreground uppercase tracking-wider">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={300}
                placeholder="e.g. Budget around ₹50,000, prefer warm wood tones, family of 4..."
                className="flex-1 min-h-[120px] bg-background/50 border border-border/40 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <Button
                onClick={analyze}
                disabled={!imageBase64 || loading}
                variant="premium"
                size="lg"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><Sparkles size={18} /> Analyze Room</>}
              </Button>
              {imageUrl && !loading && (
                <button onClick={() => fileRef.current?.click()} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 justify-center">
                  <Upload size={12} /> Choose different photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Redesigned room photo */}
        {redesignedImage && (
          <div className="glass-card rounded-xl p-4 mb-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-heading font-bold text-foreground">Your Room, Reimagined</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Before</p>
                <img src={imageUrl!} alt="Original room" className="w-full rounded-lg border border-border/30" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-primary mb-1.5">After (AI generated)</p>
                <img src={redesignedImage} alt="Room with recommended furniture" className="w-full rounded-lg border border-primary/40" />
              </div>
            </div>
            <a href={redesignedImage} download="redesigned-room.png" className="inline-block mt-3 text-xs text-primary hover:underline">
              Download redesigned photo →
            </a>
          </div>
        )}

        {/* Analysis result */}
        {analysis && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground">{analysis.roomType}</h2>
                  <p className="text-sm text-primary mt-1">Detected style: {analysis.styleDetected}</p>
                </div>
                <div className="flex gap-1.5">
                  {analysis.colorPalette.slice(0, 6).map((c, i) => (
                    <span key={i} className="px-2 py-1 text-[10px] rounded-full bg-secondary/40 border border-border/30 text-foreground">{c}</span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis.overallAssessment}</p>
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Recommended Furniture
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.recommendations.map((r, i) => (
                  <div key={i} className="glass-card rounded-xl p-5 hover-lift">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h4 className="font-heading font-bold text-foreground">{r.piece}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 capitalize">{r.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{r.reason}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div><span className="text-muted-foreground">Wood:</span> <span className="text-foreground">{r.suggestedWood}</span></div>
                      <div><span className="text-muted-foreground">Style:</span> <span className="text-foreground">{r.suggestedStyle}</span></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3"><span className="text-foreground">Placement:</span> {r.placement}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <span className="text-sm font-bold text-gradient-gold">{formatINR(r.estimatedPriceINR)}</span>
                      <Link to={`/catalog?category=${r.category}`} className="text-xs text-primary hover:underline">Browse →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {analysis.designTips.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-heading text-lg font-bold text-foreground mb-3">Design Tips</h3>
                <ul className="space-y-2">
                  {analysis.designTips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check size={14} className="text-primary mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomAnalyzerPage;
