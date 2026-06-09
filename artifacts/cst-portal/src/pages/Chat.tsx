import { useState } from "react";
import { useGetChannels, useGetMessages, useCreateMessage, useGetMe, getGetMessagesQueryKey } from "@workspace/api-client-react";
import { Hash, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Chat() {
  const { data: user } = useGetMe();
  const { data: channels } = useGetChannels();
  const [activeChannel, setActiveChannel] = useState("geral");
  const [text, setText] = useState("");
  
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useGetMessages(
    { channelId: activeChannel },
    { query: { enabled: !!activeChannel, queryKey: getGetMessagesQueryKey({ channelId: activeChannel }) } }
  );

  const createMsg = useCreateMessage();

  const handleSend = () => {
    if (!text.trim() || !activeChannel) return;
    createMsg.mutate({ data: { channelId: activeChannel, text } }, {
      onSuccess: () => {
        setText("");
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey({ channelId: activeChannel }) });
      }
    });
  };

  return (
    <div className="h-[calc(100vh-100px)] flex border border-border rounded-xl overflow-hidden bg-card shadow-sm max-w-5xl mx-auto">
      <div className="w-64 border-r border-border bg-background/50 flex flex-col">
        <div className="p-4 border-b border-border font-bold text-sm text-primary">Canais</div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {channels?.map(c => (
            <button 
              key={c.id} 
              onClick={() => setActiveChannel(c.id)}
              className={`w-full text-left p-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeChannel === c.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Hash size={16} />
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-card">
        <div className="p-4 border-b border-border flex items-center gap-2 font-bold text-sm text-foreground">
          <Hash size={18} className="text-muted-foreground" />
          {channels?.find(c => c.id === activeChannel)?.name || "Chat"}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Carregando mensagens...</div>
          ) : messages?.length === 0 ? (
            <div className="text-muted-foreground text-sm">Nenhuma mensagem neste canal ainda.</div>
          ) : (
            messages?.map(msg => (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.userId === user?.id ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0" style={{ background: msg.userColor }}>
                  {msg.userInitials}
                </div>
                <div className={`flex flex-col gap-1 ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-[13px] text-foreground">{msg.userName}</span>
                    <span className="text-[11px] text-muted-foreground">{msg.createdAt}</span>
                  </div>
                  <div className={`p-2.5 px-3.5 rounded-2xl text-[13px] leading-relaxed ${msg.userId === user?.id ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..." 
              className="flex-1 p-2.5 px-4 rounded-full border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={createMsg.isPending || !text.trim()}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer border-none hover:opacity-90 disabled:opacity-50 shrink-0"
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}