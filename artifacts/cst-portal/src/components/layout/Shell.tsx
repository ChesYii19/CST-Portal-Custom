import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { LayoutDashboard, MessageSquare, FileText, CheckSquare, Settings, LogOut, Bell, Moon, Sun, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PALETTE = ['#2E5A6A','#EC9AB9','#FFED00','#3ECCD0','#A68877','#5A8B7D','#E3D97F','#8AC4E3'];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const logoutMutation = useLogout();
  const { toast } = useToast();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const toggleDark = () => {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  };

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) return null;

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', accent: 'var(--cst-agua)' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat', accent: 'var(--cst-rosa)' },
    { id: 'documents', label: 'Documentos', icon: FileText, path: '/documents', accent: 'var(--cst-champanhe)' },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare, path: '/tasks', accent: 'var(--cst-mata)' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: Settings, path: '/admin', accent: 'var(--cst-amarelo)' }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="w-[220px] bg-[#2E5A6A] text-white flex flex-col min-h-screen relative flex-shrink-0 z-10">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EC9AB9] to-[#3ECCD0] flex items-center justify-center font-black text-sm text-white shrink-0">CST</div>
            <div>
              <div className="font-extrabold text-[13px] leading-[1.2]">Casa Santa</div>
              <div className="text-[11px] text-[#3ECCD0]">Teresinha</div>
            </div>
          </div>
        </div>

        <div className="flex h-1">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>

        <div className="flex-1 p-3 space-y-1">
          {nav.map(item => {
            const active = location.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.id} href={item.path} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 cursor-pointer text-sm font-bold transition-colors ${active ? '' : 'hover:bg-white/5'}`} style={{
                background: active ? `color-mix(in srgb, ${item.accent} 15%, transparent)` : 'transparent',
                border: active ? `1px solid color-mix(in srgb, ${item.accent} 30%, transparent)` : '1px solid transparent',
                color: active ? item.accent : 'rgba(255,255,255,0.7)'
              }}>
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex gap-2">
            <button onClick={toggleDark} className="flex-1 bg-white/10 border-none rounded-lg p-2 cursor-pointer text-white flex items-center justify-center hover:bg-white/20 transition-colors">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="flex-1 bg-white/10 border-none rounded-lg p-2 cursor-pointer text-white flex items-center justify-center hover:bg-white/20 transition-colors relative">
              <Bell size={18} />
            </button>
          </div>
          
          <Link href="/profile" className="flex items-center gap-3 bg-white/5 rounded-lg p-2 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] text-white shrink-0" style={{ background: user.color || '#3ECCD0' }}>
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
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>

      <div className="flex-1 p-7 overflow-y-auto max-h-screen">
        {children}
      </div>
    </div>
  );
}
