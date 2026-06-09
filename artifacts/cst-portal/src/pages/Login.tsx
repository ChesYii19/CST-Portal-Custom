import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PALETTE = ['#2E5A6A','#EC9AB9','#FFED00','#3ECCD0','#A68877','#5A8B7D','#E3D97F','#8AC4E3'];

export default function Login() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

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
    if (!email || !password) return;
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        toast({ description: `Bem-vinda, ${data.name}! 👋` });
        setLocation("/dashboard");
      },
      onError: (err) => {
        const msg = (err as any)?.data?.error || "Credenciais inválidas";
        toast({ variant: "destructive", description: msg });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E5A6A] to-[#1a3a47] flex items-center justify-center font-sans p-5 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 flex flex-col">
        {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
      </div>
      
      <button onClick={toggleDark} className="absolute top-5 right-5 bg-white/15 border-none rounded-lg px-3.5 py-2 cursor-pointer text-white">
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="bg-card rounded-2xl p-10 pb-8 w-full max-w-[420px] shadow-2xl text-foreground border border-border z-10">
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#EC9AB9] to-[#3ECCD0] flex items-center justify-center font-black text-[22px] text-white mx-auto mb-3.5">CST</div>
          <h2 className="m-0 mb-1 text-[#2E5A6A] dark:text-[#3ECCD0] font-black text-2xl">Acesso ao Portal</h2>
          <p className="m-0 text-muted-foreground text-[13px]">Casa Santa Teresinha</p>
        </div>

        <div className="bg-[#f0f9ff] dark:bg-[#1a3040] border-[1.5px] border-[#8AC4E3] rounded-xl p-3 mb-5 text-[12px] leading-[1.9] text-foreground">
          <strong>🔑 Contas de teste:</strong><br />
          <span className="text-[#A68877]">admin@cst.org.br</span> / Admin@2026 → <strong>Admin</strong><br />
          <span className="text-[#A68877]">gestor@cst.org.br</span> / Gestor@2026 → <strong>Gestor</strong><br />
          <span className="text-[#A68877]">colab@cst.org.br</span> / Colab@2026 → <strong>Colaborador</strong>
        </div>

        <div className="mb-4">
          <label className="text-[13px] font-bold text-muted-foreground block mb-1.5">E-mail</label>
          <input 
            type="email" 
            placeholder="seu@email.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            disabled={loginMutation.isPending}
            className="w-full p-2.5 px-3.5 rounded-lg border-[1.5px] border-border text-sm bg-background text-foreground outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>

        <div className="mb-5">
          <label className="text-[13px] font-bold text-muted-foreground block mb-1.5">Senha</label>
          <div className="relative">
            <input 
              type={showPass ? "text" : "password"} 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              disabled={loginMutation.isPending}
              className="w-full p-2.5 pl-3.5 pr-11 rounded-lg border-[1.5px] border-border text-sm bg-background text-foreground outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
            <button 
              onClick={() => setShowPass(!showPass)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button 
          onClick={handleLogin} 
          disabled={loginMutation.isPending}
          className="w-full bg-[#2E5A6A] hover:bg-[#1a3a47] text-white border-none rounded-lg p-3.5 font-bold text-[15px] cursor-pointer transition-colors mt-1 disabled:opacity-50"
        >
          {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="text-center mt-4">
          <button onClick={() => setLocation("/")} className="bg-transparent border-none text-muted-foreground text-[13px] cursor-pointer underline hover:text-foreground">
            ← Voltar ao site
          </button>
        </div>

        <div className="mt-5 p-2.5 bg-background rounded-lg text-[11px] text-muted-foreground text-center leading-[1.7]">
          Conexão segura · Sessão criptografada
        </div>
      </div>
    </div>
  );
}