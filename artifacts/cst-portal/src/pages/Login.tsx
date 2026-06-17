import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CST, PALETTE } from "@/lib/brand";

const CREDENTIALS = [
  { email: 'admin@cst.org.br',  password: 'Admin@2026',  role: 'Administrador', color: CST.azul },
  { email: 'gestor@cst.org.br', password: 'Gestor@2026', role: 'Gestor',         color: CST.agua },
  { email: 'colab@cst.org.br',  password: 'Colab@2026',  role: 'Colaborador',    color: CST.mata },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [dark, setDark]         = useState(false);

  useEffect(() => {
    if (!isLoading && user) setLocation("/dashboard");
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogin = () => {
    if (!email || !password) return;
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data: any) => {
        if (data.sessionToken) localStorage.setItem("cst_session_token", data.sessionToken);
        toast({ description: `Bem-vinda, ${data.name}!` });
        setLocation("/dashboard");
      },
      onError: (err) => {
        const msg = (err as any)?.data?.error || "Credenciais inválidas";
        toast({ variant: "destructive", description: msg });
      }
    });
  };

  const fillCredential = (cred: typeof CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Painel esquerdo — identidade visual (oculto em mobile) */}
      <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden" style={{ backgroundColor: CST.azul }}>
        {/* Faixa de cores do brand guide */}
        <div className="flex h-1 absolute top-0 left-0 right-0">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>

        {/* Círculos decorativos */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: CST.agua }} />
        <div className="absolute bottom-20 -left-16 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: CST.rosa }} />
        <div className="absolute top-1/2 right-10 w-24 h-24 rounded-full opacity-15" style={{ backgroundColor: CST.amarelo }} />

        <div className="flex flex-col justify-center flex-1 px-14 py-20 relative z-10">
          {/* Logo */}
          <div className="mb-12">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white mb-4 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${CST.rosa}, ${CST.agua})` }}>
              CST
            </div>
            <div className="text-white/50 text-xs font-bold tracking-widest uppercase mb-1">Portal Interno</div>
            <h1 className="text-white text-3xl font-black leading-tight m-0">Casa Santa<br />Teresinha</h1>
          </div>

          {/* Missão */}
          <div className="mb-12">
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Portal de gestão interna para comunicação, documentos e organização da equipe da ONG.
            </p>
          </div>

          {/* Valores — Amarelo como acento */}
          <div className="space-y-4">
            {[
              { label: 'Acolher', desc: 'Cuidado com cada pessoa da equipe' },
              { label: 'Cuidar',  desc: 'Gestão eficiente e colaborativa' },
              { label: 'Transformar', desc: 'Impacto real na comunidade' },
            ].map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CST.amarelo }} />
                <div>
                  <span className="text-white font-bold text-sm">{v.label}</span>
                  <span className="text-white/50 text-sm"> — {v.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé do painel */}
        <div className="px-14 py-6 border-t border-white/10 flex items-center gap-2 relative z-10">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CST.agua }} />
          <span className="text-white/40 text-xs font-medium">Conexão segura · Sessão criptografada</span>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Controles topo */}
        <div className="flex justify-between items-center p-6">
          <button onClick={() => setLocation("/")} className="text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1.5">
            ← Voltar ao site
          </button>
          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted transition-colors border-none bg-transparent cursor-pointer text-muted-foreground">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Form centralizado */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-10">
          <div className="w-full max-w-[380px]">
            {/* Logo mobile */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white"
                style={{ background: `linear-gradient(135deg, ${CST.rosa}, ${CST.agua})` }}>CST</div>
              <div>
                <div className="font-black text-sm text-foreground">Casa Santa Teresinha</div>
                <div className="text-xs text-muted-foreground">Portal Interno</div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-black text-foreground m-0 mb-1">Bem-vinda de volta</h2>
              <p className="text-muted-foreground text-sm">Acesse sua conta para continuar</p>
            </div>

            {/* Contas de acesso rápido */}
            <div className="bg-muted/60 rounded-xl p-4 mb-6 border border-border">
              <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">Acesso rápido — Contas de teste</p>
              <div className="space-y-1.5">
                {CREDENTIALS.map((c) => (
                  <button key={c.email} onClick={() => fillCredential(c)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors cursor-pointer border border-transparent hover:border-border text-left bg-transparent">
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-black text-white" style={{ background: c.color }}>
                      {c.role[0]}
                    </div>
                    <span className="text-xs text-foreground font-semibold flex-1">{c.email}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: c.color }}>{c.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Campos */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    disabled={loginMutation.isPending}
                    className="w-full pl-9 pr-11 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors disabled:opacity-50"
                  />
                  <button onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-0.5">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Botão entrar — Azul Guardiã com Amarelo como hover accent */}
            <button
              onClick={handleLogin}
              disabled={loginMutation.isPending || !email || !password}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-lg"
              style={{ backgroundColor: CST.azul }}
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Faixa de cores no rodapé */}
        <div className="flex h-1">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>
      </div>
    </div>
  );
}
