import { useState, useEffect } from "react";
import { X, Megaphone, Calendar, AlertTriangle, Info } from "lucide-react";
import { CST } from "@/lib/brand";

type AnnType = "info" | "event" | "alert";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: AnnType;
  eventDate?: string | null;
  createdByName?: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<AnnType, { icon: typeof Info; bg: string; border: string; text: string; badge: string }> = {
  info:  { icon: Info,          bg: `${CST.agua}12`,      border: `${CST.agua}30`,      text: CST.agua,      badge: 'Aviso' },
  event: { icon: Calendar,      bg: `${CST.rosa}12`,      border: `${CST.rosa}30`,      text: CST.terracota, badge: 'Evento' },
  alert: { icon: AlertTriangle, bg: '#FEF3C720',          border: '#F59E0B40',           text: '#D97706',     badge: 'Urgente' },
};

const SESSION_KEY = "cst_dismissed_announcements";

function getDismissed(): Set<number> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function dismiss(id: number) {
  const set = getDismissed();
  set.add(id);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
}

export function AnnouncementsPopup() {
  const [items, setItems]       = useState<Announcement[]>([]);
  const [visible, setVisible]   = useState<Announcement[]>([]);
  const [current, setCurrent]   = useState(0);
  const [shown, setShown]       = useState(false);

  useEffect(() => {
    fetch('/api/announcements', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((data: Announcement[]) => {
        const dismissed = getDismissed();
        const pending = data.filter(a => !dismissed.has(a.id));
        setItems(pending);
        setVisible(pending);
        if (pending.length > 0) {
          setTimeout(() => setShown(true), 600); // slight delay for UX
        }
      })
      .catch(() => {});
  }, []);

  if (!shown || visible.length === 0) return null;

  const ann = visible[current];
  if (!ann) return null;

  const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  const handleDismiss = (id: number) => {
    dismiss(id);
    const next = visible.filter(a => a.id !== id);
    setVisible(next);
    if (current >= next.length && current > 0) setCurrent(next.length - 1);
    if (next.length === 0) setShown(false);
  };

  const handleDismissAll = () => {
    visible.forEach(a => dismiss(a.id));
    setVisible([]);
    setShown(false);
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-card)', borderColor: cfg.border }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}>
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: cfg.text }} />
            <span className="text-xs font-black uppercase tracking-wide" style={{ color: cfg.text }}>{cfg.badge}</span>
            {visible.length > 1 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: cfg.text }}>
                {current + 1}/{visible.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {visible.length > 1 && (
              <>
                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted border-none bg-transparent cursor-pointer disabled:opacity-30 text-xs font-bold">‹</button>
                <button onClick={() => setCurrent(c => Math.min(visible.length - 1, c + 1))} disabled={current === visible.length - 1}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted border-none bg-transparent cursor-pointer disabled:opacity-30 text-xs font-bold">›</button>
              </>
            )}
            <button onClick={() => handleDismiss(ann.id)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted/60 border-none bg-transparent cursor-pointer transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <h4 className="font-black text-foreground text-sm mb-1 leading-snug">{ann.title}</h4>
          <p className="text-muted-foreground text-xs leading-relaxed mb-3">{ann.content}</p>

          <div className="flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground font-medium">
              {ann.eventDate ? (
                <span className="flex items-center gap-1">
                  <Calendar size={10} /> {formatDate(ann.eventDate)}
                </span>
              ) : (
                formatDate(ann.createdAt)
              )}
              {ann.createdByName && <span> · {ann.createdByName}</span>}
            </div>
            {visible.length > 1 && (
              <button onClick={handleDismissAll} className="text-[10px] text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer underline transition-colors">
                Fechar todos
              </button>
            )}
          </div>
        </div>

        {/* Indicator dots for multiple announcements */}
        {visible.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-3">
            {visible.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="rounded-full border-none cursor-pointer transition-all"
                style={{
                  width: i === current ? 16 : 6,
                  height: 6,
                  backgroundColor: i === current ? cfg.text : 'var(--color-muted-foreground)',
                  opacity: i === current ? 1 : 0.3,
                }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
