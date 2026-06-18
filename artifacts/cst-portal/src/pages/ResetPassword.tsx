import { useState } from "react";
import { useLocation } from "wouter";
import { Lock, Mail, KeyRound, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CST, PALETTE } from "@/lib/brand";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email,   setEmail]   = useState("");
  const [token,   setToken]   = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleReset = () => {
    if (!email || !token || !newPw || !confirm) return;
    if (newPw !== confirm) {
      toast({ variant: "destructive", description: "As senhas não coincidem" }); return;
    }
    setLoading(true);
    fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, token, newPassword: newPw }),
    })
      .then(r => r.json())
      .then((data: any) => {
        setLoading(false);
        if (data.error) {
          toast({ variant: "destructive", description: data.error }); return;
        }
        setDone(true);
        toast({ description: "Senha redefinida com sucesso!" });
      })
      .catch(() => { setLoading(false); toast({ variant: "destructive", description: "Erro de conexão" }); });
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: `${CST.mata}20` }}>
          <CheckCircle size={32} style={{ color: CST.mata }} />
        </div>
        <h2 className="text-xl font-black text-foreground">Senha redefinida!</h2>
        <p className="text-muted-foreground text-sm">Sua senha foi alterada com sucesso. Você já pode fazer login.</p>
        <button onClick={() => setLocation("/login")}
          className="w-full py-3 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: CST.azul }}>
          Ir para o login <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden" style={{ backgroundColor: CST.azul }}>
        <div className="flex h-1 absolute top-0 left-0 right-0">
          {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>
        <div className="flex flex-col justify-center flex-1 px-14 py-20 relative z-10">
          <div className="mb-12">
            <img src="/logo-negativo.png" alt="Casa Santa Teresinha" className="h-16 w-auto object-contain mb-4" />
            <div className="text-white/50 text-xs font-bold tracking-widest uppercase">Portal Interno</div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-4">Redefinir senha</h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Peça ao administrador da sua organização para gerar um token de redefinição de senha. O token expira em 24 horas.
            </p>
          </div>
        </div>
        <div className="px-14 py-6 border-t border-white/10 flex items-center gap-2 relative z-10">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CST.agua }} />
          <span className="text-white/40 text-xs font-medium">Token de redefinição · Válido por 24h</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-background relative">
        <div className="flex justify-start items-center p-6">
          <button onClick={() => setLocation("/login")} className="text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors border-none bg-transparent cursor-pointer">
            ← Voltar ao login
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-10">
          <div className="w-full max-w-[380px]">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: `${CST.amarelo}30`, border: `2px solid ${CST.amarelo}60` }}>
                <KeyRound size={28} style={{ color: '#9a7c00' }} />
              </div>
              <h2 className="text-2xl font-black text-foreground m-0 mb-1">Redefinir senha</h2>
              <p className="text-muted-foreground text-sm text-center">Insira o token fornecido pelo administrador</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">E-mail da conta</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Token de redefinição</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Token gerado pelo admin" value={token} onChange={e => setToken(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Nova senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPw ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={newPw} onChange={e => setNewPw(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground p-0.5 transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Confirmar senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" placeholder="Repita a nova senha" value={confirm} onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-sm outline-none transition-colors ${confirm && newPw !== confirm ? 'border-destructive' : 'border-border focus:border-primary'}`} />
                </div>
                {confirm && newPw !== confirm && <p className="text-[11px] text-destructive mt-1 font-medium">As senhas não coincidem</p>}
              </div>
            </div>

            <button onClick={handleReset} disabled={loading || !email || !token || !newPw || !confirm || newPw !== confirm}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-lg"
              style={{ backgroundColor: CST.azul }}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redefinindo...</>
              ) : (
                <>Redefinir senha <ArrowRight size={16} /></>
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
