import { useState } from "react";
import { useGetUsers, useDeleteUser, getGetUsersQueryKey, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Trash2, Edit, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { data: me } = useGetMe();
  const { data: users, isLoading } = useGetUsers();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState('usuarios');

  if (me?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Shield size={48} className="mx-auto mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-foreground mb-2">Acesso Negado</h2>
        <p>Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const handleDelete = (id: number) => {
    deleteUser.mutate({ id }, {
      onSuccess: () => {
        toast({ description: "Usuário removido" });
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-primary m-0">Administração</h1>
        <p className="text-muted-foreground text-sm">Gestão de acessos e configurações do portal</p>
      </div>

      <div className="flex border-b border-border mb-6">
        <button 
          onClick={() => setTab('usuarios')} 
          className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer bg-transparent ${tab === 'usuarios' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Usuários
        </button>
        <button 
          onClick={() => setTab('config')} 
          className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer bg-transparent ${tab === 'config' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Configurações do Sistema
        </button>
      </div>

      {tab === 'usuarios' && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-foreground text-sm m-0">Usuários Cadastrados</h3>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity">
              + Novo Usuário
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-bold">
                <tr>
                  <th className="p-3 px-4">Nome</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Setor</th>
                  <th className="p-3">Nível</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Carregando...</td></tr>
                ) : (
                  users?.map(u => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-3 px-4 font-medium text-foreground flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white" style={{ background: u.color }}>
                          {u.initials}
                        </div>
                        {u.name}
                      </td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3 text-muted-foreground">{u.dept}</td>
                      <td className="p-3 text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
                          {u.role === 'admin' ? 'Admin' : u.role === 'sector_manager' ? 'Gestor' : 'Colaborador'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.status === 'ativo' ? 'bg-[#5A8B7D]20 text-[#5A8B7D]' : 'bg-muted text-muted-foreground'}`}>
                          {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 rounded bg-transparent border-none text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors"><Edit size={16} /></button>
                          {u.id !== me.id && (
                            <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded bg-transparent border-none text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm text-center py-12">
          <Settings size={32} className="mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-bold text-foreground text-lg mb-2">Configurações Avançadas</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Integrações, políticas de segurança e backups.
          </p>
          <button className="mt-6 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity">
            Gerenciar Backup
          </button>
        </div>
      )}
    </div>
  );
}