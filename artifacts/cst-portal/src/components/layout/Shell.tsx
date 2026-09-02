import { Link, useLocation } from "wouter";
import { getGetNotificationsQueryKey, useGetMe, useGetNotifications, useLogout, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { LayoutDashboard, MessageSquare, FileText, CheckSquare, Settings, LogOut, Bell, Moon, Sun, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

/* Brand guide exact hex values */
const CST = {
  azul:      '#2E5665',
  rosa:      '#FC9BB3',
  amarelo:   '#FEDC05',
  agua:      '#00C1D4',
  terracota: '#A58877',
  mata:      '#486F5C',
  champanhe: '#E3DC97',
  ceu:       '#88CAE3',
};

const PALETTE = Object.values(CST);

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const { data: notifications, isLoading: notificationsLoading, isError: notificationsError } = useGetNotifications({ query: { enabled: !!user, queryKey: getGetNotificationsQueryKey() } });
  const markAllNotificationsRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();
  const { toast } = useToast();
  const [dark, setDark] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const toggleDark = () => {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  };

  const unreadCount = notifications?.filter(notification => !notification.read).length || 0;

  const handleMarkAllNotificationsRead = () => {
    markAllNotificationsRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetNotificationsQueryKey(), (current: typeof notifications) =>
          current?.map(notification => ({ ...notification, read: true })) || [],
        );
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
        toast({ description: "Notificações marcadas como lidas" });
      },
      onError: () => toast({ variant: "destructive", description: "Erro ao marcar notificações como lidas" }),
    });
  };

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) return null;

  const nav = [
    { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard, path: '/dashboard', accent: CST.agua },
    { id: 'chat',      label: 'Chat',         icon: MessageSquare,   path: '/chat',      accent: CST.rosa },
    { id: 'documents',      label: 'Documentos', icon: FileText,   path: '/documents',      accent: CST.champanhe },
    { id: 'tasks',          label: 'Tarefas',    icon: CheckSquare, path: '/tasks',         accent: CST.mata },
    { id: 'announcements',  label: 'Avisos',     icon: Megaphone,   path: '/announcements', accent: CST.rosa },
    { id: 'customize', label: 'Personalizar', icon: Settings, path: '/customize', accent: CST.ceu },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: Settings, path: '/admin', accent: CST.amarelo }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Sidebar — Azul Guardiã (30% suporte, conforme brand guide) */}
      <div className="w-[220px] text-white flex flex-col min-h-screen relative flex-shrink-0 z-10" style={{ backgroundColor: CST.azul }}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <img
            src="/logo-negativo.png"
            alt="Casa Santa Teresinha"
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Barra de cores brand guide */}
        <div className="flex h-[3px]">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>

        {/* Nav */}
        <div className="flex-1 p-3 space-y-1">
          {nav.map(item => {
            const active = location.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.id} href={item.path}
                className="w-full text-left p-3 rounded-lg flex items-center gap-3 cursor-pointer text-sm font-semibold transition-all"
                style={{
                  background: active ? `${item.accent}22` : 'transparent',
                  border: `1px solid ${active ? `${item.accent}44` : 'transparent'}`,
                  color: active ? item.accent : 'rgba(255,255,255,0.65)',
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t border-white/10 space-y-3 relative">
          <div className="flex gap-2">
            <button onClick={toggleDark} className="flex-1 border-none rounded-lg p-2 cursor-pointer text-white flex items-center justify-center hover:bg-white/15 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setNotificationsOpen(open => !open)} aria-label="Notificações" className="flex-1 border-none rounded-lg p-2 cursor-pointer text-white flex items-center justify-center hover:bg-white/15 transition-colors relative" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400" aria-label={`${unreadCount} não lidas`} />}
            </button>
          </div>

          {notificationsOpen && (
            <div className="absolute bottom-16 left-full ml-2 w-72 max-w-[calc(100vw-2rem)] bg-card text-foreground border border-border rounded-xl shadow-xl z-20 overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between gap-2">
                <span className="text-sm font-bold">Notificações</span>
                <button onClick={handleMarkAllNotificationsRead} disabled={markAllNotificationsRead.isPending || unreadCount === 0}
                  className="text-[10px] font-bold text-primary bg-transparent border-none cursor-pointer disabled:opacity-40">
                  Marcar como lidas
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notificationsLoading ? (
                  <p className="p-4 text-xs text-muted-foreground">Carregando notificações...</p>
                ) : notificationsError ? (
                  <p className="p-4 text-xs text-destructive">Não foi possível carregar as notificações.</p>
                ) : notifications?.length ? (
                  notifications.map(notification => (
                    <div key={notification.id} className={`p-3 border-b border-border last:border-0 ${notification.read ? 'opacity-60' : 'bg-primary/5'}`}>
                      <p className="text-xs font-medium m-0">{notification.text}</p>
                      <span className="text-[10px] text-muted-foreground">{notification.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-xs text-muted-foreground">Nenhuma notificação.</p>
                )}
              </div>
            </div>
          )}
          
          <Link href="/profile" className="flex items-center gap-3 rounded-lg p-2 cursor-pointer hover:bg-white/10 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] text-white shrink-0" style={{ background: user.color || CST.agua }}>
              {user.initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-white/50 truncate">{user.role === 'admin' ? 'Administrador' : user.role === 'sector_manager' ? 'Gestor' : 'Colaborador'}</div>
            </div>
          </Link>
          
          <button 
            onClick={() => {
              logoutMutation.mutate(undefined, {
                onSuccess: () => {
                  localStorage.removeItem("cst_session_token");
                  toast({ description: "Logout realizado com sucesso" });
                  setLocation("/");
                }
              });
            }}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer border-none bg-transparent"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-7 overflow-y-auto max-h-screen">
        {children}
      </div>
    </div>
  );
}
