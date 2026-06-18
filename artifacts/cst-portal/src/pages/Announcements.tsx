import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Plus, X, Megaphone, Calendar, AlertTriangle, Info, Pencil, Trash2, Eye, EyeOff, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CST } from "@/lib/brand";

type AnnType = "info" | "event" | "alert";
interface Announcement {
  id: number;
  title: string;
  content: string;
  type: AnnType;
  eventDate?: string | null;
  isActive: boolean;
  createdByName?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

const TYPE_CONFIG: Record<AnnType, { icon: typeof Info; label: string; color: string }> = {
  info:  { icon: Info,          label: 'Aviso',   color: CST.agua },
  event: { icon: Calendar,      label: 'Evento',  color: CST.terracota },
  alert: { icon: AlertTriangle, label: 'Urgente', color: '#D97706' },
};

const EMPTY_FORM = { title: '', content: '', type: 'info' as AnnType, eventDate: '', expiresAt: '' };

export default function Announcements() {
  const { data: me } = useGetMe();
  const { toast }    = useToast();
  const canManage    = me?.role === 'admin' || me?.role === 'sector_manager';

  const [items,      setItems]      = useState<Announcement[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<Announcement | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [showAll,    setShowAll]    = useState(false);

  const fetchItems = () => {
    const url = canManage ? '/api/announcements/all' : '/api/announcements';
    fetch(url, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setLoading(false); });
  };

  useEffect(() => { if (me !== undefined) fetchItems(); }, [me, canManage]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (ann: Announcement) => {
    setEditing(ann);
    setForm({
      title:     ann.title,
      content:   ann.content,
      type:      ann.type,
      eventDate: ann.eventDate ? ann.eventDate.split('T')[0] : '',
      expiresAt: ann.expiresAt ? ann.expiresAt.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ variant: "destructive", description: "Título e conteúdo são obrigatórios" }); return;
    }
    setSaving(true);
    const body = {
      title:     form.title.trim(),
      content:   form.content.trim(),
      type:      form.type,
      eventDate: form.eventDate || null,
      expiresAt: form.expiresAt || null,
    };

    const method = editing ? 'PATCH' : 'POST';
    const url    = editing ? `/api/announcements/${editing.id}` : '/api/announcements';

    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
      .then(r => r.json())
      .then(data => {
        setSaving(false);
        if (data.error) { toast({ variant: "destructive", description: data.error }); return; }
        toast({ description: editing ? "Aviso atualizado!" : "Aviso criado com sucesso!" });
        setShowModal(false);
        fetchItems();
      })
      .catch(() => { setSaving(false); toast({ variant: "destructive", description: "Erro ao salvar" }); });
  };

  const handleToggle = (ann: Announcement) => {
    fetch(`/api/announcements/${ann.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !ann.isActive }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { toast({ variant: "destructive", description: data.error }); return; }
        toast({ description: ann.isActive ? "Aviso desativado" : "Aviso ativado" });
        fetchItems();
      });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Excluir este aviso permanentemente?')) return;
    fetch(`/api/announcements/${id}`, { method: 'DELETE', credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { toast({ variant: "destructive", description: data.error }); return; }
        toast({ description: "Aviso excluído" });
        fetchItems();
      });
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  };

  const displayed = canManage
    ? (showAll ? items : items.filter(a => a.isActive))
    : items;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-primary m-0">Avisos & Eventos</h1>
          <p className="text-muted-foreground text-sm">Comunicados e eventos da Casa Santa Teresinha</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button onClick={() => setShowAll(p => !p)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted cursor-pointer transition-all">
                {showAll ? <EyeOff size={15} /> : <Eye size={15} />}
                {showAll ? 'Ocultar inativos' : 'Ver todos'}
              </button>
              <button onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all shadow-sm"
                style={{ backgroundColor: CST.azul }}>
                <Plus size={16} /> Novo Aviso
              </button>
            </>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)
      ) : displayed.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 flex flex-col items-center gap-3 text-center">
          <Megaphone size={36} className="text-muted-foreground/30" />
          <p className="text-muted-foreground font-semibold">Nenhum aviso no momento.</p>
          {canManage && (
            <button onClick={openCreate} className="text-xs font-bold text-primary hover:underline border-none bg-transparent cursor-pointer">
              + Criar primeiro aviso
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(ann => {
            const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div key={ann.id}
                className={`bg-card rounded-2xl border p-5 transition-all ${!ann.isActive ? 'opacity-50' : ''}`}
                style={{ borderColor: ann.isActive ? `${cfg.color}30` : 'var(--color-border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cfg.color}15` }}>
                      <Icon size={18} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-black text-foreground text-sm m-0">{ann.title}</h3>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: cfg.color }}>
                          {cfg.label}
                        </span>
                        {!ann.isActive && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inativo</span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed mb-2">{ann.content}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium flex-wrap">
                        <span>{formatDate(ann.createdAt)}</span>
                        {ann.createdByName && <span>· {ann.createdByName}</span>}
                        {ann.eventDate && <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(ann.eventDate)}</span>}
                        {ann.expiresAt && <span>· Expira: {formatDate(ann.expiresAt)}</span>}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleToggle(ann)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                        title={ann.isActive ? 'Desativar' : 'Ativar'}>
                        {ann.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => openEdit(ann)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors hover:bg-muted text-muted-foreground hover:text-primary">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(ann.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-foreground m-0">{editing ? 'Editar Aviso' : 'Novo Aviso'}</h3>
                <p className="text-xs text-muted-foreground">Comunicado para toda a equipe</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted cursor-pointer border-none bg-transparent text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Tipo */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wide">Tipo</label>
                <div className="flex gap-2">
                  {(Object.entries(TYPE_CONFIG) as [AnnType, typeof TYPE_CONFIG[AnnType]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={key} onClick={() => setForm({ ...form, type: key })}
                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold"
                        style={form.type === key
                          ? { borderColor: cfg.color, backgroundColor: `${cfg.color}15`, color: cfg.color }
                          : { borderColor: 'var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)' }}>
                        <Icon size={16} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Título</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Reunião geral do mês de julho"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
              </div>

              {/* Conteúdo */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Mensagem</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={3} placeholder="Detalhes do aviso ou evento..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors resize-none" />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3">
                {form.type === 'event' && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Data do evento</label>
                    <input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
                  </div>
                )}
                <div className={form.type === 'event' ? '' : 'col-span-2'}>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Expirar em (opcional)</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted transition-colors text-foreground">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.content.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center gap-2 transition-all"
                style={{ backgroundColor: CST.azul }}>
                <Save size={15} /> {saving ? 'Salvando...' : (editing ? 'Salvar' : 'Publicar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
