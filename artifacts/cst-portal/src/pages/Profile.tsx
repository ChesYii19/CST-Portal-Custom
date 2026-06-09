import { useGetMe, useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Briefcase, Hash, Palette } from "lucide-react";

const PALETTE = ['#2E5A6A','#EC9AB9','#FFED00','#3ECCD0','#A68877','#5A8B7D','#E3D97F','#8AC4E3'];
const DEPTS = ['Administração', 'RH', 'Financeiro', 'Projetos', 'TI', 'Jurídico', 'Marketing'];

export default function Profile() {
  const { data: me, isLoading } = useGetMe();
  const updateMe = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [color, setColor] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name);
      setDept(me.dept);
      setColor(me.color);
    }
  }, [me]);

  const handleSave = () => {
    if (!me) return;
    setSaving(true);
    const updates: any = {};
    if (name !== me.name) updates.name = name;
    if (dept !== me.dept) updates.dept = dept;
    if (color !== me.color) updates.color = color;

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return;
    }

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

  if (isLoading || !me) return <div className="p-8">Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-primary m-0">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm">Gerencie suas informações pessoais</p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#2E5A6A] to-[#1a3a47] h-32 relative">
          <div className="absolute -bottom-10 left-8 w-24 h-24 rounded-full border-4 border-card flex items-center justify-center font-black text-3xl text-white shadow-sm transition-colors duration-300" style={{ background: color }}>
            {me.initials}
          </div>
        </div>
        
        <div className="pt-14 px-8 pb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground m-0">{me.name}</h2>
            <p className="text-muted-foreground">{me.role === 'admin' ? 'Administrador' : me.role === 'sector_manager' ? 'Gestor' : 'Colaborador'}</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-bold text-muted-foreground block mb-2">Nome Completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 pl-9 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-bold text-muted-foreground block mb-2">E-mail Corporativo</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={me.email} disabled className="w-full p-2.5 pl-9 rounded-lg border border-border bg-muted text-muted-foreground text-sm outline-none cursor-not-allowed opacity-70" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-bold text-muted-foreground block mb-2">Departamento</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full p-2.5 pl-9 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors appearance-none"
                  >
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-bold text-muted-foreground block mb-2">ID do Usuário</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={me.id} disabled className="w-full p-2.5 pl-9 rounded-lg border border-border bg-muted text-muted-foreground text-sm outline-none cursor-not-allowed opacity-70" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[13px] font-bold text-muted-foreground block mb-2">
                <Palette size={14} className="inline mr-1" /> Cor do Avatar
              </label>
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setColor(c)} className={`w-9 h-9 rounded-full border-2 cursor-pointer transition-transform ${color === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: c }} />
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Status: <span className={`font-bold ${me.status === 'ativo' ? 'text-[#5A8B7D]' : 'text-destructive'}`}>{me.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving || (name === me.name && dept === me.dept && color === me.color)}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
