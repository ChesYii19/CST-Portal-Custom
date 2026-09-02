import { useState, useRef, useEffect } from "react";
import { useGetChannels, useGetMessages, useCreateMessage, useGetMe, getGetMessagesQueryKey } from "@workspace/api-client-react";
import { Hash, Send, Pencil, Trash2, Check, X, MoreHorizontal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const CST_AZUL = '#2E5665';

export default function Chat() {
  const { data: user } = useGetMe();
  const { data: channels } = useGetChannels();
  const [activeChannel, setActiveChannel] = useState("geral");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [menuId, setMenuId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const qKey = getGetMessagesQueryKey({ channelId: activeChannel });

  const { data: messages, isLoading } = useGetMessages(
    { channelId: activeChannel },
    { query: { enabled: !!activeChannel, queryKey: qKey, refetchInterval: 4000 } }
  );

  const createMsg = useCreateMessage();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("cst_session_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSend = () => {
    if (!text.trim() || !activeChannel) return;
    createMsg.mutate({ data: { channelId: activeChannel, text } }, {
      onSuccess: () => { setText(""); invalidate(); },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          description: error?.data?.error || error?.message || "Erro ao enviar mensagem",
        });
      },
    });
  };

  const handleEditSave = async (id: number) => {
    if (!editText.trim()) return;
    try {
      const r = await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ text: editText }),
      });
      if (!r.ok) throw new Error();
      toast({ description: "Mensagem editada" });
      setEditingId(null);
      invalidate();
    } catch {
      toast({ variant: "destructive", description: "Erro ao editar" });
    }
  };

  const handleDelete = async (id: number) => {
    setMenuId(null);
    if (!confirm("Excluir esta mensagem?")) return;
    try {
      const r = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
        credentials: 'include',
      });
      if (!r.ok) throw new Error();
      toast({ description: "Mensagem excluída" });
      invalidate();
    } catch {
      toast({ variant: "destructive", description: "Erro ao excluir" });
    }
  };

  const startEdit = (msg: any) => {
    setMenuId(null);
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const canEdit = (msg: any) => user && (msg.userId === user.id || user.role === 'admin');

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex border border-border rounded-xl overflow-hidden bg-card shadow-sm max-w-5xl mx-auto" onClick={() => setMenuId(null)}>
      {/* Sidebar de canais */}
      <div className="w-64 border-r border-border bg-background/50 flex flex-col">
        <div className="p-4 border-b border-border font-bold text-sm text-primary tracking-wide">
          Canais
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Array.isArray(channels) && channels.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.id)}
              className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all cursor-pointer border-none ${
                activeChannel === c.id
                  ? 'text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent'
              }`}
              style={activeChannel === c.id ? { backgroundColor: CST_AZUL } : {}}
            >
              <Hash size={15} />
              {c.name}
              {(c.messageCount ?? 0) > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeChannel === c.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {c.messageCount ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Hash size={18} className="text-muted-foreground" />
          <span className="font-bold text-sm text-foreground">
            {channels?.find(c => c.id === activeChannel)?.name || "Chat"}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            — {channels?.find(c => c.id === activeChannel)?.messageCount || 0} mensagens
          </span>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="text-muted-foreground text-sm text-center py-8">Carregando mensagens...</div>
          ) : messages?.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-8">
              <Hash size={32} className="mx-auto mb-2 opacity-20" />
              Nenhuma mensagem neste canal ainda.
            </div>
          ) : (
            Array.isArray(messages) && messages.map(msg => {
              const isOwn = msg.userId === user?.id;
              const isEditing = editingId === msg.id;

              return (
                <div key={msg.id} className={`flex gap-3 max-w-[85%] group ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 mt-1" style={{ background: msg.userColor }}>
                    {msg.userInitials}
                  </div>

                  <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Nome + hora */}
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-[13px] text-foreground">{msg.userName}</span>
                      <span className="text-[11px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                      {(msg as any).edited && <span className="text-[10px] text-muted-foreground italic">(editado)</span>}
                    </div>

                    {/* Balão */}
                    <div className="relative flex items-center gap-2">
                      {isOwn && !isEditing && (
                        <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'order-first' : 'order-last'}`} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => startEdit(msg)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer border-none transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer border-none transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      {/* Admin pode editar qualquer msg */}
                      {!isOwn && user?.role === 'admin' && !isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setMenuId(menuId === msg.id ? null : msg.id)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer border-none"
                          >
                            <MoreHorizontal size={12} />
                          </button>
                          {menuId === msg.id && (
                            <div className="absolute left-0 top-8 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[130px]">
                              <button onClick={() => startEdit(msg)} className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted flex items-center gap-2 cursor-pointer border-none bg-transparent text-foreground">
                                <Pencil size={12} /> Editar
                              </button>
                              <button onClick={() => handleDelete(msg.id)} className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-destructive/10 flex items-center gap-2 cursor-pointer border-none bg-transparent text-destructive">
                                <Trash2 size={12} /> Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {isEditing ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(msg.id); } if (e.key === 'Escape') setEditingId(null); }}
                            className="p-2 rounded-lg border border-primary bg-background text-sm outline-none resize-none w-full"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:bg-muted border border-border bg-transparent cursor-pointer">
                              <X size={11} /> Cancelar
                            </button>
                            <button onClick={() => handleEditSave(msg.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white border-none cursor-pointer" style={{ backgroundColor: CST_AZUL }}>
                              <Check size={11} /> Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-2.5 px-3.5 rounded-2xl text-[13px] leading-relaxed ${
                          isOwn
                            ? 'text-white rounded-tr-sm'
                            : 'bg-muted text-foreground rounded-tl-sm'
                        }`} style={isOwn ? { backgroundColor: CST_AZUL } : {}}>
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0" style={{ background: user?.color || CST_AZUL }}>
              {user?.initials}
            </div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Mensagem em #${channels?.find(c => c.id === activeChannel)?.name || activeChannel}...`}
              className="flex-1 p-2.5 px-4 rounded-full border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={createMsg.isPending || !text.trim()}
              className="w-10 h-10 rounded-full text-white flex items-center justify-center cursor-pointer border-none hover:opacity-90 disabled:opacity-40 shrink-0 transition-opacity"
              style={{ backgroundColor: CST_AZUL }}
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
