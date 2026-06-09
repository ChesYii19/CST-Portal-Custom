import { useGetMe, useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Briefcase, Hash } from "lucide-react";

export default function Profile() {
  const { data: me, isLoading } = useGetMe();
  const updateMe = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");

  useEffect(() => {
    if (me) setName(me.name);
  }, [me]);

  const handleSave = () => {
    if (!me || !name.trim()) return;
    updateMe.mutate({ id: me.id, data: { name } }, {
      onSuccess: () => {
        toast({ description: "Perfil atualizado com sucesso" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
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
          <div className="absolute -bottom-10 left-8 w-24 h-24 rounded-full border-4 border-card flex items-center justify-center font-black text-3xl text-white shadow-sm" style={{ background: me.color }}>
            {me.initials}
          </div>
        </div>
        
        <div className="pt-14 px-8 pb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground m-0">{me.name}</h2>
            <p className="text-muted-foreground">{me.role === 'admin' ? 'Administrador' : me.role === 'sector_manager' ? 'Gestor' : 'Colaborador'}</p>
          </div>

          <div className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-bold text-muted-foreground block mb-2">E-mail Corporativo</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="email" 
                    value={me.email} 
                    disabled
                    className="w-full p-2.5 pl-9 rounded-lg border border-border bg-muted text-muted-foreground text-sm outline-none cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-bold text-muted-foreground block mb-2">Departamento</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={me.dept} 
                    disabled
                    className="w-full p-2.5 pl-9 rounded-lg border border-border bg-muted text-muted-foreground text-sm outline-none cursor-not-allowed opacity-70"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button 
                onClick={handleSave}
                disabled={updateMe.isPending || name === me.name}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updateMe.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}