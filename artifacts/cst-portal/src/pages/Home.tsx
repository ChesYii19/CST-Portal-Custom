import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Moon, Sun, LayoutDashboard, MessageSquare, FileText, CheckSquare, Settings } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

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
      {/* Header — Azul Guardiã */}
      <div style={{ backgroundColor: CST.azul }} className="px-10 py-3.5 flex justify-between items-center">
        <img
          src="/logo-negativo.png"
          alt="Casa Santa Teresinha"
          className="h-9 w-auto object-contain"
        />
        <div className="flex gap-3 items-center">
          <button onClick={toggleDark} className="bg-white/15 border-none rounded-lg px-3.5 py-2 cursor-pointer text-white">
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {/* Amarelo como acento (10%) */}
          <button onClick={handleLogin} className="border-none rounded-lg px-6 py-2 cursor-pointer font-bold text-sm transition-opacity hover:opacity-90" style={{ backgroundColor: CST.amarelo, color: CST.azul }}>
            {user ? 'Dashboard' : 'Fazer Login'}
          </button>
        </div>
      </div>

      {/* Hero — Azul Guardiã + acento Amarelo */}
      <div className="pt-20 px-10 pb-16 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${CST.azul} 0%, #1a3a47 100%)` }}>
        <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full opacity-15" style={{ backgroundColor: CST.agua }} />
        <div className="absolute -bottom-10 left-16 w-36 h-36 rounded-full opacity-20" style={{ backgroundColor: CST.rosa }} />
        <div className="absolute top-10 -left-5 w-24 h-24 rounded-full opacity-15" style={{ backgroundColor: CST.amarelo }} />

        <img
          src="/logo-negativo.png"
          alt="Casa Santa Teresinha"
          className="h-20 w-auto object-contain mx-auto mb-7"
        />
        <h1 className="text-white text-4xl font-black m-0 mb-4 tracking-widest">CASA SANTA TERESINHA</h1>
        <p className="text-xl m-0 mb-7 tracking-[0.25em] font-bold flex items-center justify-center gap-3">
          <span style={{ color: CST.amarelo }}>ACOLHER</span>
          <span className="text-white/30">•</span>
          <span style={{ color: CST.rosa }}>CUIDAR</span>
          <span className="text-white/30">•</span>
          <span style={{ color: CST.agua }}>TRANSFORMAR</span>
        </p>
        <p className="text-white/65 text-[15px] max-w-lg mx-auto mb-10 leading-relaxed">
          Portal interno de gestão para comunicação, documentos e organização da equipe da ONG.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={handleLogin} className="border-none rounded-xl px-8 py-3.5 cursor-pointer font-bold text-base transition-transform hover:scale-105 active:scale-95 shadow-lg" style={{ backgroundColor: CST.amarelo, color: CST.azul }}>
            {user ? 'Ir ao Dashboard' : 'Fazer Login'}
          </button>
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="border-2 border-white/30 rounded-xl px-8 py-3.5 cursor-pointer font-bold text-base text-white bg-transparent hover:bg-white/10 transition-colors">
            Saiba Mais
          </button>
        </div>

        {/* Barra de cores brand guide */}
        <div className="absolute bottom-0 left-0 right-0 flex h-1">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>
      </div>

      {/* Funcionalidades */}
      <div id="features" className="bg-background px-10 py-16">
        <h2 className="text-center font-black text-3xl mb-2" style={{ color: CST.azul }}>Funcionalidades</h2>
        <p className="text-center text-muted-foreground mb-12 text-sm">Tudo que a equipe precisa, em um só lugar</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', desc: 'Métricas e gráficos em tempo real', color: CST.agua },
            { icon: MessageSquare, label: 'Chat', desc: 'Canais por departamento com mensagens diretas', color: CST.rosa },
            { icon: FileText, label: 'Documentos', desc: 'Repositório central de arquivos institucionais', color: CST.champanhe },
            { icon: CheckSquare, label: 'Tarefas', desc: 'Kanban colaborativo com drag-and-drop', color: CST.mata },
            { icon: Settings, label: 'Administração', desc: 'Gestão de usuários e configurações', color: CST.amarelo },
            { icon: Sun, label: 'Personalização', desc: 'Tema, cores e aparência do portal', color: CST.ceu },
          ].map((f, i) => (
            <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group" onClick={handleLogin}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${f.color}22`, color: f.color }}>
                <f.icon size={24} />
              </div>
              <h3 className="font-bold text-base mb-1.5" style={{ color: CST.azul }}>{f.label}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 text-center border-t border-border">
        {/* Barra de cores */}
        <div className="flex h-0.5 max-w-sm mx-auto mb-4">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>
        <p className="text-muted-foreground text-xs font-medium">
          © {new Date().getFullYear()} Casa Santa Teresinha · Portal Interno
        </p>
      </div>
    </div>
  );
}
