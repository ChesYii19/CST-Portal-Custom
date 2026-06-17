import { useGetMe, useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Briefcase, Save, CheckCircle } from "lucide-react";
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
  const updateMe = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name,   setName]   = useState("");
  const [dept,   setDept]   = useState("");
  const [color,  setColor]  = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) { setName(me.name); setDept(me.dept); setColor(me.color); }
  }, [me]);

  const isDirty = me && (name !== me.name || dept !== me.dept || color !== me.color);

  const handleSave = () => {
    if (!me || !isDirty) return;
    setSaving(true);
    const updates: any = {};
    if (name !== me.name) updates.name = name;
    if (dept !== me.dept) updates.dept = dept;
    if (color !== me.color) updates.color = color;
    updateMe.mutate({ id: me.id, data: updates }, {
      onSuccess: () => {
        toast({ description: "Perfil atualizado com sucesso" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setSaving(false);
      },
      onError: () => {
        toast({ variant: "destructive", description: "Erro ao atualizar perfil" });
        setSaving(false);
      }
    });
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
        {/* Banner com faixa de cores do brand guide */}
        <div className="h-28 relative" style={{ backgroundColor: CST.azul }}>
          <div className="absolute inset-0 opacity-10"
            style={{ background: `radial-gradient(circle at 80% 50%, ${CST.agua} 0%, transparent 60%)` }} />
          {/* Faixa de cores no topo */}
          <div className="absolute top-0 left-0 right-0 flex h-1">
            {PALETTE.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
          </div>
        </div>

        {/* Avatar overlapping */}
        <div className="relative px-8 pb-6">
          <div className="flex items-end gap-5 -mt-11 mb-5">
            <div className="w-[88px] h-[88px] rounded-2xl border-4 border-card flex items-center justify-center font-black text-3xl text-white shadow-lg transition-all duration-300 shrink-0"
              style={{ background: color || CST.azul }}>
              {me.initials}
            </div>
            <div className="pb-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-foreground m-0">{me.name}</h2>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white`}
                  style={{ backgroundColor: me.status === 'ativo' ? CST.mata : '#EF4444' }}>
                  {me.status === 'ativo' ? '● ATIVO' : '● INATIVO'}
                </span>
              </div>
              <p className="text-muted-foreground text-sm m-0">{ROLE_LABELS[me.role] || me.role} · {me.dept}</p>
            </div>
          </div>

          {/* Linha de stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'E-mail', value: me.email, small: true },
              { label: 'Função', value: ROLE_LABELS[me.role] || me.role },
              { label: 'ID', value: `#${me.id}` },
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

        {/* Seletor de cor do avatar — cores do brand guide */}
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
          {color && (
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              Selecionada: {COLOR_LABELS[color] || color}
            </p>
          )}
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
    </div>
  );
}
