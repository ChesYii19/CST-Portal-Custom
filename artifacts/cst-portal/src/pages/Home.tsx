import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Moon, Sun, LayoutDashboard, MessageSquare, FileText, CheckSquare, Settings } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

const PALETTE = ['#2E5A6A','#EC9AB9','#FFED00','#3ECCD0','#A68877','#5A8B7D','#E3D97F','#8AC4E3'];

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
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

  const handleLogin = () => {
    if (user) setLocation("/dashboard");
    else setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-all duration-200">
      <div className="bg-[#2E5A6A] px-10 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EC9AB9] to-[#3ECCD0] flex items-center justify-center font-black text-sm text-white">CST</div>
          <span className="text-white font-extrabold text-[15px] tracking-wide">CASA SANTA TERESINHA</span>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={toggleDark} className="bg-white/15 border-none rounded-lg px-3.5 py-2 cursor-pointer text-white">
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={handleLogin} className="bg-[#FFED00] text-[#2E5A6A] border-none rounded-lg px-6 py-2 cursor-pointer font-bold text-sm transition-opacity hover:opacity-90">
            {user ? 'Dashboard' : 'Fazer Login'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#2E5A6A] to-[#1a3a47] pt-20 px-10 pb-16 text-center relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-[#3ECCD0] opacity-15" />
        <div className="absolute -bottom-10 left-16 w-36 h-36 rounded-full bg-[#EC9AB9] opacity-20" />
        <div className="absolute top-10 -left-5 w-24 h-24 rounded-full bg-[#FFED00] opacity-15" />

        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#EC9AB9] to-[#3ECCD0] flex items-center justify-center font-black text-2xl text-white mx-auto mb-7">CST</div>
        <h1 className="text-white text-4xl font-black m-0 mb-4 tracking-widest">CASA SANTA TERESINHA</h1>
        <p className="text-xl m-0 mb-7 tracking-[0.25em] font-bold flex items-center justify-center gap-3">
          <span className="text-[#FFED00]">ACOLHER</span>
          <span className="text-white/30">•</span>
          <span className="text-[#EC9AB9]">CUIDAR</span>
          <span className="text-white/30">•</span>
          <span className="text-[#3ECCD0]">TRANSFORMAR</span>
        </p>
        <p className="text-white/65 text-[15px] max-w-lg mx-auto mb-10 leading-relaxed">
          Portal interno de gestão para comunicação, documentos e organização da equipe da ONG.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={handleLogin} className="bg-[#FFED00] text-[#2E5A6A] border-none rounded-lg px-8 py-3 cursor-pointer font-bold text-[15px] transition-opacity hover:opacity-90">
            {user ? 'Acessar Portal' : 'Fazer Login'}
          </button>
          <button className="bg-transparent text-white border-2 border-white/35 rounded-lg px-8 py-3 cursor-pointer font-bold text-[15px] transition-opacity hover:opacity-90">
            Saiba Mais
          </button>
        </div>
      </div>

      <div className="flex h-2">
        {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
      </div>

      <div className="bg-card py-16 px-10">
        <h2 className="text-center text-[#2E5A6A] dark:text-[#3ECCD0] mb-10 text-[22px] font-extrabold">Funcionalidades</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6 max-w-5xl mx-auto">
          {[
            { icon: LayoutDashboard, title: 'Dashboard', desc: 'Métricas e gráficos em tempo real', color: '#2E5A6A' },
            { icon: MessageSquare, title: 'Chat', desc: 'Canais por departamento', color: '#3ECCD0' },
            { icon: FileText, title: 'Documentos', desc: 'Repositório seguro de arquivos', color: '#5A8B7D' },
            { icon: CheckSquare, title: 'Tarefas', desc: 'Kanban por status e departamento', color: '#A68877' },
            { icon: Settings, title: 'Administração', desc: 'Gestão de usuários e configurações', color: '#8B5CF6' },
          ].map((f, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border shadow-sm text-center" style={{ borderTop: `4px solid ${f.color}` }}>
              <div className="flex justify-center mb-3 text-4xl" style={{ color: f.color }}><f.icon size={36} /></div>
              <h3 className="m-0 mb-2 font-extrabold text-sm" style={{ color: f.color }}>{f.title}</h3>
              <p className="text-muted-foreground text-xs m-0 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#2E5A6A] text-white text-center py-4">
        <p className="m-0 text-xs opacity-60">© 2026 Casa Santa Teresinha · Portal Interno · Todos os direitos reservados</p>
      </div>
    </div>
  );
}