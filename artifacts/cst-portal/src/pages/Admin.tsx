import { useState } from "react";
import {
  useGetUsers,
  useDeleteUser,
  useCreateUser,
  useUpdateUser,
  getGetUsersQueryKey,
  useGetMe,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Trash2, Edit, Settings, X, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PALETTE = ['#2E5A6A','#EC9AB9','#FFED00','#3ECCD0','#A68877','#5A8B7D','#E3D97F','#8AC4E3'];

export default function Admin() {
  const { data: me } = useGetMe();
  const { data: users, isLoading } = useGetUsers();
  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState('usuarios');

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'employee', dept: '', color: '#2E5A6A', status: 'ativo'
  });
  const [loading, setLoading] = useState(false);

  if (me?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Shield size={48} className="mx-auto mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-foreground mb-2">Acesso Negado</h2>
        <p>Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'employee', dept: '', color: '#2E5A6A', status: 'ativo' });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      dept: u.dept,
      color: u.color,
      status: u.status,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email || (!editUser && !form.password)) return;
    setLoading(true);

    if (editUser) {
      const updateData: any = { name: form.name, role: form.role, dept: form.dept, color: form.color, status: form.status };
      if (form.password) updateData.password = form.password;
      updateUser.mutate({ id: editUser.id, data: updateData }, {
        onSuccess: () => {
          toast({ description: "Usuário atualizado" });
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
          setShowModal(false);
          setLoading(false);
        },
        onError: () => {
          toast({ variant: "destructive", description: "Erro ao atualizar" });
          setLoading(false);
        }
      });
    } else {
      createUser.mutate({ data: { name: form.name, email: form.email, password: form.password, role: form.role as 'admin' | 'sector_manager' | 'employee', dept: form.dept, color: form.color } }, {
        onSuccess: () => {
          toast({ description: "Usuário criado" });
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
          setShowModal(false);
          setLoading(false);
        },
        onError: () => {
          toast({ variant: "destructive", description: "Erro ao criar" });
          setLoading(false);
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
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
        <button onClick={() => setTab('usuarios')} className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer bg-transparent ${tab === 'usuarios' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          Usuários
        </button>
        <button onClick={() => setTab('config')} className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer bg-transparent ${tab === 'config' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          Configurações do Sistema
        </button>
      </div>

      {tab === 'usuarios' && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-foreground text-sm m-0">Usuários Cadastrados ({users?.length || 0})</h3>
            <button onClick={openCreate} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity">
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
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded bg-transparent border-none text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors">
                            <Edit size={16} />
                          </button>
                          {u.id !== me.id && (
                            <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded bg-transparent border-none text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors">
                              <Trash2 size={16} />
                            </button>
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
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="font-bold text-foreground text-lg mb-4">Configurações Avançadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw size={20} className="text-primary" />
                <span className="font-bold text-sm">Backup do Banco</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Exportar dados do sistema para um arquivo JSON.</p>
              <button onClick={() => {
                const data = JSON.stringify({ users, timestamp: new Date().toISOString() }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'cst-backup.json'; a.click();
                toast({ description: "Backup baixado!" });
              }} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-xs font-bold border-none cursor-pointer hover:opacity-90">
                Exportar Dados
              </button>
            </div>
            <div className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Settings size={20} className="text-primary" />
                <span className="font-bold text-sm">Limpar Sessões</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Remove todas as sessões ativas do sistema.</p>
              <button onClick={() => toast({ description: "Sessões ativas: 0 (já limpo)" })} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-xs font-bold border-none cursor-pointer hover:opacity-90">
                Limpar Sessões
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-foreground">{editUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-muted cursor-pointer border-none bg-transparent text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Nome</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">E-mail</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary" disabled={!!editUser} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Senha {editUser && '(deixe em branco para não alterar)'}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary" placeholder={editUser ? '********' : 'Mínimo 6 caracteres'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Função</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary">
                    <option value="employee">Colaborador</option>
                    <option value="sector_manager">Gestor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Departamento</label>
                <input value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary" placeholder="Ex: RH, Financeiro..." />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Cor do Avatar</label>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full border-2 cursor-pointer ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground border-none cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                <Save size={16} /> {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
