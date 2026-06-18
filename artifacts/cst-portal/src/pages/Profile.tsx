import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Briefcase, Save, CheckCircle, Shield, Lock, Eye, EyeOff, Smartphone, QrCode } from "lucide-react";
import { CST, PALETTE } from "@/lib/brand";

const DEPTS = ['Administração', 'RH', 'Financeiro', 'Projetos', 'TI', 'Jurídico', 'Marketing'];

const ROLE_LABELS: Record<string, string> = {
  admin:          'Administrador',
  sector_manager: 'Gestor de Setor',
  employee:       'Colaborador',
};

const COLOR_LABELS: Record<string, string> = {
  [CST.azul]:      'Azul Guardiã',
  [CST.rosa]:      'Rosa Amparo',
  [CST.amarelo]:   'Amarelo Esperança',
  [CST.agua]:      'Verde-água Cura',
  [CST.terracota]: 'Terracota Raiz',
  [CST.mata]:      'Verde Mata',
  [CST.champanhe]: 'Champanhe',
  [CST.ceu]:       'Azul Céu',
};

export default function Profile() {
  const { data: me, isLoading } = useGetMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name,   setName]   = useState("");
  const [dept,   setDept]   = useState("");
  const [color,  setColor]  = useState("");
  const [saving, setSaving] = useState(false);

  // Change password state
  const [showChangePw,   setShowChangePw]   = useState(false);
  const [currentPw,      setCurrentPw]      = useState("");
  const [newPw,          setNewPw]          = useState("");
  const [confirmPw,      setConfirmPw]      = useState("");
  const [showCurrentPw,  setShowCurrentPw]  = useState(false);
  const [showNewPw,      setShowNewPw]      = useState(false);
  const [changingPw,     setChangingPw]     = useState(false);

  // 2FA state
  const [twoFAEnabled,  setTwoFAEnabled]  = useState(false);
  const [qrCodeUrl,     setQrCodeUrl]     = useState("");
  const [tfaSecret,     setTfaSecret]     = useState("");
  const [tfaCode,       setTfaCode]       = useState("");
  const [tfaStep,       setTfaStep]       = useState<'idle' | 'setup' | 'disable'>('idle');
  const [tfaLoading,    setTfaLoading]    = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name);
      setDept(me.dept);
      setColor(me.color);
      setTwoFAEnabled((me as any).twoFactorEnabled ?? false);
    }
  }, [me]);

  const isDirty = me && (name !== me.name || dept !== me.dept || color !== me.color);

  const handleSave = () => {
    if (!me || !isDirty) return;
    setSaving(true);
    const updates: Record<string, string> = {};
    if (name !== me.name) updates.name = name;
    if (dept !== me.dept) updates.dept = dept;
    if (color !== me.color) updates.color = color;
    fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        toast({ description: "Perfil atualizado com sucesso" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setSaving(false);
      })
      .catch((err: Error) => {
        toast({ variant: "destructive", description: err.message || "Erro ao atualizar perfil" });
        setSaving(false);
      });
  };

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) { toast({ variant: "destructive", description: "As senhas não coincidem" }); return; }
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
        if (data.error) { toast({ variant: "destructive", description: data.error }); return; }
        toast({ description: "Senha alterada com sucesso!" });
        setShowChangePw(false);
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      })
      .catch(() => { setChangingPw(false); toast({ variant: "destructive", description: "Erro de conexão" }); });
  };

  const handle2FASetup = () => {
    setTfaLoading(true);
    fetch('/api/auth/2fa/setup', { method: 'POST', credentials: 'include' })
      .then(r => r.json())
      .then((data: any) => {
        setTfaLoading(false);
        if (data.error) { toast({ variant: "destructive", description: data.error }); return; }
        setQrCodeUrl(data.qrCodeUrl);
        setTfaSecret(data.secret);
        setTfaStep('setup');
        setTfaCode('');
      })
      .catch(() => { setTfaLoading(false); toast({ variant: "destructive", description: "Erro ao configurar 2FA" }); });
  };

  const handle2FAEnable = () => {
    if (!tfaCode.trim()) return;
    setTfaLoading(true);
    fetch('/api/auth/2fa/enable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: tfaCode.trim() }),
    })
      .then(r => r.json())
      .then((data: any) => {
        setTfaLoading(false);
        if (data.error) { toast({ variant: "destructive", description: data.error }); return; }
        toast({ description: "Autenticação em dois fatores ativada!" });
        setTwoFAEnabled(true);
        setTfaStep('idle');
        setTfaCode('');
      })
      .catch(() => { setTfaLoading(false); toast({ variant: "destructive", description: "Erro ao ativar 2FA" }); });
  };

  const handle2FADisable = () => {
    if (!tfaCode.trim()) return;
    setTfaLoading(true);
    fetch('/api/auth/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: tfaCode.trim() }),
    })
      .then(r => r.json())
      .then((data: any) => {
        setTfaLoading(false);
        if (data.error) { toast({ variant: "destructive", description: data.error }); return; }
        toast({ description: "Autenticação em dois fatores desativada." });
        setTwoFAEnabled(false);
        setTfaStep('idle');
        setTfaCode('');
      })
      .catch(() => { setTfaLoading(false); toast({ variant: "destructive", description: "Erro ao desativar 2FA" }); });
  };

  if (isLoading || !me) return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="h-48 bg-muted rounded-xl animate-pulse" />
      <div className="h-64 bg-muted rounded-xl animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-primary m-0">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm">Gerencie suas informações pessoais</p>
      </div>

      {/* Hero card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="h-28 relative" style={{ backgroundColor: CST.azul }}>
          <div className="absolute inset-0 opacity-10"
            style={{ background: `radial-gradient(circle at 80% 50%, ${CST.agua} 0%, transparent 60%)` }} />
          <div className="absolute top-0 left-0 right-0 flex h-1">
            {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
          </div>
        </div>
        <div className="relative px-8 pb-6">
          <div className="flex items-end gap-5 -mt-11 mb-5">
            <div className="w-[88px] h-[88px] rounded-2xl border-4 border-card flex items-center justify-center font-black text-3xl text-white shadow-lg transition-all duration-300 shrink-0"
              style={{ background: color || CST.azul }}>
              {me.initials}
            </div>
            <div className="pb-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-foreground m-0">{me.name}</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: me.status === 'ativo' ? CST.mata : '#EF4444' }}>
                  {me.status === 'ativo' ? '● ATIVO' : '● INATIVO'}
                </span>
              </div>
              <p className="text-muted-foreground text-sm m-0">{ROLE_LABELS[me.role] || me.role} · {me.dept}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'E-mail',   value: me.email, small: true },
              { label: 'Função',   value: ROLE_LABELS[me.role] || me.role },
              { label: 'ID',       value: `#${me.id}` },
            ].map((s, i) => (
              <div key={i} className="bg-muted/60 rounded-xl p-3 text-center border border-border">
                <div className={`font-bold text-foreground truncate ${s.small ? 'text-[11px]' : 'text-sm'}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulário de edição */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
        <h3 className="font-black text-base text-foreground m-0">Editar Informações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Nome Completo</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">E-mail Corporativo</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="email" value={me.email} disabled
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted text-muted-foreground text-sm outline-none cursor-not-allowed opacity-70" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Departamento</label>
            <div className="relative">
              <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select value={dept} onChange={e => setDept(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors appearance-none">
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wide">Cor do Avatar</label>
          <div className="flex gap-2 flex-wrap">
            {PALETTE.map(c => (
              <button key={c} onClick={() => setColor(c)}
                title={COLOR_LABELS[c] || c}
                className="relative w-10 h-10 rounded-xl border-2 cursor-pointer transition-all hover:scale-110 active:scale-95"
                style={{ background: c, borderColor: color === c ? 'var(--color-foreground)' : 'transparent' }}>
                {color === c && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle size={16} className="text-white drop-shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {color && <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">Selecionada: {COLOR_LABELS[color] || color}</p>}
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <button onClick={handleSave} disabled={saving || !isDirty}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all disabled:opacity-40 shadow-sm"
            style={{ backgroundColor: CST.azul }}>
            <Save size={15} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Segurança — Alterar senha */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={18} style={{ color: CST.azul }} />
            <h3 className="font-black text-base text-foreground m-0">Segurança</h3>
          </div>
        </div>

        {/* Change Password section */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-foreground">Alterar senha</div>
              <div className="text-xs text-muted-foreground">Atualize sua senha de acesso ao portal</div>
            </div>
            <button onClick={() => setShowChangePw(!showChangePw)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted cursor-pointer bg-transparent transition-colors text-foreground">
              {showChangePw ? 'Cancelar' : 'Alterar'}
            </button>
          </div>

          {showChangePw && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Senha atual</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showCurrentPw ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
                  <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground p-0.5 transition-colors">
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Nova senha</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showNewPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
                    className="w-full pl-9 pr-11 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
                  <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground p-0.5 transition-colors">
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Confirmar nova senha</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className={`w-full py-2.5 px-3 rounded-xl border bg-background text-sm outline-none transition-colors ${confirmPw && newPw !== confirmPw ? 'border-destructive' : 'border-border focus:border-primary'}`} />
                {confirmPw && newPw !== confirmPw && <p className="text-[11px] text-destructive mt-1 font-medium">As senhas não coincidem</p>}
              </div>
              <button onClick={handleChangePassword} disabled={changingPw || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all disabled:opacity-40"
                style={{ backgroundColor: CST.azul }}>
                <Save size={14} /> {changingPw ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </div>
          )}
        </div>

        {/* 2FA section */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: twoFAEnabled ? `${CST.mata}20` : `${CST.agua}15` }}>
                <Shield size={16} style={{ color: twoFAEnabled ? CST.mata : CST.agua }} />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  Autenticação em dois fatores
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white`}
                    style={{ backgroundColor: twoFAEnabled ? CST.mata : '#9CA3AF' }}>
                    {twoFAEnabled ? 'ATIVO' : 'INATIVO'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {twoFAEnabled ? 'Sua conta está protegida com TOTP (Google Authenticator, Authy, etc.)' : 'Adicione uma camada extra de segurança com TOTP'}
                </div>
              </div>
            </div>
            {tfaStep === 'idle' && (
              <button
                onClick={twoFAEnabled ? () => { setTfaStep('disable'); setTfaCode(''); } : handle2FASetup}
                disabled={tfaLoading}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all disabled:opacity-50 ${twoFAEnabled ? 'border-destructive/40 text-destructive hover:bg-destructive/5 bg-transparent' : 'border-border hover:bg-muted bg-transparent text-foreground'}`}>
                {tfaLoading ? 'Carregando...' : (twoFAEnabled ? 'Desativar' : 'Ativar 2FA')}
              </button>
            )}
          </div>

          {/* Setup: show QR code */}
          {tfaStep === 'setup' && (
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-muted-foreground text-center">
                  Escaneie o QR code abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc.) e depois insira o código gerado.
                </p>
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code 2FA" className="w-40 h-40 rounded-xl border border-border" />
                )}
                <div className="bg-muted rounded-xl p-3 w-full">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1">Ou insira a chave manualmente</p>
                  <code className="text-xs font-mono text-foreground break-all">{tfaSecret}</code>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Código de verificação</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={tfaCode}
                  onChange={e => setTfaCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handle2FAEnable()}
                  className="w-full p-3 rounded-xl border border-border bg-background text-lg font-mono text-center outline-none focus:border-primary transition-colors tracking-[0.5em]"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setTfaStep('idle'); setTfaCode(''); }}
                  className="flex-1 py-2 rounded-xl text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted transition-colors text-foreground">
                  Cancelar
                </button>
                <button onClick={handle2FAEnable} disabled={tfaLoading || tfaCode.length < 6}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ backgroundColor: CST.mata }}>
                  <Smartphone size={15} /> {tfaLoading ? 'Verificando...' : 'Ativar 2FA'}
                </button>
              </div>
            </div>
          )}

          {/* Disable: confirm with current code */}
          {tfaStep === 'disable' && (
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Para confirmar a desativação, insira um código do seu aplicativo autenticador.
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={tfaCode}
                onChange={e => setTfaCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handle2FADisable()}
                className="w-full p-3 rounded-xl border border-border bg-background text-lg font-mono text-center outline-none focus:border-primary transition-colors tracking-[0.5em]"
              />
              <div className="flex gap-2">
                <button onClick={() => { setTfaStep('idle'); setTfaCode(''); }}
                  className="flex-1 py-2 rounded-xl text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted transition-colors text-foreground">
                  Cancelar
                </button>
                <button onClick={handle2FADisable} disabled={tfaLoading || tfaCode.length < 6}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#EF4444' }}>
                  {tfaLoading ? 'Desativando...' : 'Confirmar desativação'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
