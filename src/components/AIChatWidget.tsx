import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/furniture-chat`;

const AIChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm your **Valyrian Craft** design assistant. Ask me about furniture styles, wood types, room layouts, or specific pieces. ✨" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });

      if (resp.status === 429) { toast({ title: 'Rate limit', description: 'Please wait a moment.', variant: 'destructive' }); setLoading(false); return; }
      if (resp.status === 402) { toast({ title: 'AI credits exhausted', description: 'Add credits to your workspace.', variant: 'destructive' }); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error('Stream failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';
      let assistantAdded = false;
      let done = false;

      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, i);
          buf = buf.slice(i + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              if (!assistantAdded) {
                assistantAdded = true;
                setMessages(prev => [...prev, { role: 'assistant', content: acc }]);
              } else {
                setMessages(prev => prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: acc } : m));
              }
            }
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Chat error', description: 'Could not reach AI assistant.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-gold shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Open AI assistant"
      >
        {open ? <X className="text-primary-foreground" size={24} /> : <MessageCircle className="text-primary-foreground" size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-md h-[70vh] max-h-[600px] glass-card rounded-2xl border border-border/40 shadow-2xl flex flex-col animate-fade-in">
          <div className="p-4 border-b border-border/30 flex items-center gap-2">
            <Sparkles className="text-primary" size={18} />
            <div>
              <h3 className="font-heading font-bold text-sm text-foreground">AI Design Assistant</h3>
              <p className="text-[10px] text-muted-foreground">Powered by Valyrian Craft</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary/20 text-foreground border border-primary/30'
                    : 'bg-secondary/40 text-foreground border border-border/30'
                }`}>
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary/40 border border-border/30 rounded-lg px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border/30 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about furniture, styles, layouts..."
              maxLength={500}
              className="flex-1 bg-background/50 border border-border/40 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={loading}
            />
            <Button onClick={send} disabled={loading || !input.trim()} size="icon" variant="premium">
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
