import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Moon, Sun, Shield, KeyRound, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CST, PALETTE } from "@/lib/brand";

const CREDENTIALS = [
  { email: 'admin@cst.org.br',  password: 'Admin@2026',  role: 'Administrador', color: CST.azul },
  { email: 'gestor@cst.org.br', password: 'Gestor@2026', role: 'Gestor',         color: CST.agua },
  { email: 'colab@cst.org.br',  password: 'Colab@2026',  role: 'Colaborador',    color: CST.mata },
];

type Step = 'login' | 'verify2fa' | 'changePassword';

export default function Login() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [dark, setDark]         = useState(false);

  // Multi-step state
  const [step, setStep]           = useState<Step>('login');
  const [totpCode, setTotpCode]   = useState("");
  const [totp2FAing, set2FAing]   = useState(false);

  // Force-change-password state
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [changingPw, setChangingPw]   = useState(false);

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
        if (data.requires2fa) {
          setStep('verify2fa');
          toast({ description: "Digite o código do seu aplicativo autenticador." });
          return;
        }
        if (data.requiresPasswordChange) {
          setCurrentPw(password); // pre-fill so user doesn't need to re-enter the temp password
          setStep('changePassword');
          toast({ description: "Bem-vinda! Por favor, crie uma nova senha antes de continuar.", variant: "default" });
          return;
        }
        toast({ description: `Bem-vinda, ${data.name}!` });
        setLocation("/dashboard");
      },
      onError: (err) => {
        const msg = (err as any)?.data?.error || "Credenciais inválidas";
        toast({ variant: "destructive", description: msg });
      }
    });
  };

  const handle2FAVerify = () => {
    if (!totpCode.trim()) return;
    set2FAing(true);
    fetch('/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: totpCode.trim() }),
    })
      .then(r => r.json())
      .then((data: any) => {
        set2FAing(false);
        if (data.error) {
          toast({ variant: "destructive", description: data.error });
          return;
        }
        if (data.requiresPasswordChange) {
          setCurrentPw(password);
          setStep('changePassword');
          toast({ description: "Código verificado! Agora crie uma nova senha." });
          return;
        }
        toast({ description: `Bem-vinda, ${data.name}!` });
        setLocation("/dashboard");
      })
      .catch(() => { set2FAing(false); toast({ variant: "destructive", description: "Erro de conexão" }); });
  };

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) {
      toast({ variant: "destructive", description: "As senhas não coincidem" });
      return;
    }
    setChangingPw(true);
    fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    })
      .then(r => r.json())
      .then((data: any) => {
        setChangingPw(false);
        if (data.error) {
          toast({ variant: "destructive", description: data.error });
          return;
        }
        toast({ description: "Senha alterada com sucesso! Bem-vinda ao portal." });
        setLocation("/dashboard");
      })
      .catch(() => { setChangingPw(false); toast({ variant: "destructive", description: "Erro de conexão" }); });
  };

  const fillCredential = (cred: typeof CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  // ─── Left panel (shared across steps) ────────────────────────────────────────
  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden" style={{ backgroundColor: CST.azul }}>
      <div className="flex h-1 absolute top-0 left-0 right-0">
        {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
      </div>
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: CST.agua }} />
      <div className="absolute bottom-20 -left-16 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: CST.rosa }} />
      <div className="absolute top-1/2 right-10 w-24 h-24 rounded-full opacity-15" style={{ backgroundColor: CST.amarelo }} />
      <div className="flex flex-col justify-center flex-1 px-14 py-20 relative z-10">
        <div className="mb-12">
          <img src="/logo-negativo.png" alt="Casa Santa Teresinha" className="h-16 w-auto object-contain mb-4" />
          <div className="text-white/50 text-xs font-bold tracking-widest uppercase">Portal Interno</div>
        </div>
        <div className="mb-12">
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Portal de gestão interna para comunicação, documentos e organização da equipe da ONG.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Acolher',      desc: 'Cuidado com cada pessoa da equipe' },
            { label: 'Cuidar',       desc: 'Gestão eficiente e colaborativa' },
            { label: 'Transformar',  desc: 'Impacto real na comunidade' },
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
      <div className="px-14 py-6 border-t border-white/10 flex items-center gap-2 relative z-10">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CST.agua }} />
        <span className="text-white/40 text-xs font-medium">Conexão segura · Sessão criptografada</span>
      </div>
    </div>
  );

  // ─── Step: Login ──────────────────────────────────────────────────────────────
  if (step === 'login') return (
    <div className="min-h-screen flex font-sans">
      <LeftPanel />
      <div className="flex-1 flex flex-col bg-background relative">
        <div className="flex justify-between items-center p-6">
          <button onClick={() => setLocation("/")} className="text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1.5">
            ← Voltar ao site
          </button>
          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted transition-colors border-none bg-transparent cursor-pointer text-muted-foreground">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-10">
          <div className="w-full max-w-[380px]">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <img src="/logo-primario.png" alt="Casa Santa Teresinha" className="h-10 w-auto object-contain" />
            </div>
            <div className="mb-8">
              <h2 className="text-2xl font-black text-foreground m-0 mb-1">Bem-vinda de volta</h2>
              <p className="text-muted-foreground text-sm">Acesse sua conta para continuar</p>
            </div>
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
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors disabled:opacity-50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPass ? "text" : "password"} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    disabled={loginMutation.isPending}
                    className="w-full pl-9 pr-11 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors disabled:opacity-50" />
                  <button onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-0.5">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <button onClick={handleLogin} disabled={loginMutation.isPending || !email || !password}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-lg"
              style={{ backgroundColor: CST.azul }}>
              {loginMutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Entrando...</>
              ) : (
                <>Entrar <ArrowRight size={16} /></>
              )}
            </button>

            {/* Link para resetar senha */}
            <div className="mt-4 text-center">
              <button onClick={() => setLocation("/reset-password")} className="text-xs text-muted-foreground hover:text-primary border-none bg-transparent cursor-pointer transition-colors">
                Esqueceu sua senha? Usar token de redefinição
              </button>
            </div>
          </div>
        </div>
        <div className="flex h-1">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>
      </div>
    </div>
  );

  // ─── Step: 2FA Verification ───────────────────────────────────────────────────
  if (step === 'verify2fa') return (
    <div className="min-h-screen flex font-sans">
      <LeftPanel />
      <div className="flex-1 flex flex-col bg-background relative">
        <div className="flex justify-between items-center p-6">
          <button onClick={() => setStep('login')} className="text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors border-none bg-transparent cursor-pointer">
            ← Voltar
          </button>
          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted transition-colors border-none bg-transparent cursor-pointer text-muted-foreground">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-10">
          <div className="w-full max-w-[380px]">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: `${CST.agua}20`, border: `2px solid ${CST.agua}40` }}>
                <Shield size={28} style={{ color: CST.agua }} />
              </div>
              <h2 className="text-2xl font-black text-foreground m-0 mb-1">Verificação em 2 etapas</h2>
              <p className="text-muted-foreground text-sm text-center">Digite o código de 6 dígitos do seu aplicativo autenticador (Google Authenticator, Authy, etc.)</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Código de autenticação</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handle2FAVerify()}
                  autoFocus
                  className="w-full p-4 rounded-xl border border-border bg-background text-2xl font-mono text-center outline-none focus:border-primary transition-colors tracking-[0.5em]"
                />
              </div>
            </div>

            <button onClick={handle2FAVerify} disabled={totp2FAing || totpCode.length < 6}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-lg"
              style={{ backgroundColor: CST.agua }}>
              {totp2FAing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</>
              ) : (
                <><CheckCircle size={16} /> Verificar código</>
              )}
            </button>
          </div>
        </div>
        <div className="flex h-1">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>
      </div>
    </div>
  );

  // ─── Step: Force Password Change ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex font-sans">
      <LeftPanel />
      <div className="flex-1 flex flex-col bg-background relative">
        <div className="flex justify-end items-center p-6">
          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted transition-colors border-none bg-transparent cursor-pointer text-muted-foreground">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-10">
          <div className="w-full max-w-[400px]">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: `${CST.amarelo}30`, border: `2px solid ${CST.amarelo}60` }}>
                <KeyRound size={28} style={{ color: '#9a7c00' }} />
              </div>
              <h2 className="text-2xl font-black text-foreground m-0 mb-1">Crie sua senha</h2>
              <p className="text-muted-foreground text-sm text-center max-w-xs">
                Sua conta foi criada com uma senha temporária. Por segurança, crie uma senha pessoal agora.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                ⚠️ Requisitos: mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um número.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Senha temporária atual</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showCurrent ? "text" : "password"} value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
                  <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-0.5">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Nova senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showNew ? "text" : "password"} value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
                  <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-0.5">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Confirmar nova senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-sm outline-none transition-colors ${confirmPw && newPw !== confirmPw ? 'border-destructive' : 'border-border focus:border-primary'}`} />
                </div>
                {confirmPw && newPw !== confirmPw && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">As senhas não coincidem</p>
                )}
              </div>
            </div>

            <button onClick={handleChangePassword}
              disabled={changingPw || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-lg"
              style={{ backgroundColor: CST.azul }}>
              {changingPw ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
              ) : (
                <><CheckCircle size={16} /> Definir nova senha e entrar</>
              )}
            </button>
          </div>
        </div>
        <div className="flex h-1">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>
      </div>
    </div>
  );
}
