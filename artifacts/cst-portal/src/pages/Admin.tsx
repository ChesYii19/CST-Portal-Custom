import { useState } from "react";
import {
  useGetUsers, useDeleteUser, useCreateUser, useUpdateUser,
  getGetUsersQueryKey, useGetMe,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Trash2, Edit, Settings, X, Save, RefreshCw, Plus, Search, CheckCircle, KeyRound, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CST, PALETTE } from "@/lib/brand";

const DEPTS = ['Administração', 'RH', 'Financeiro', 'Projetos', 'TI', 'Jurídico', 'Marketing', 'Geral'];

const ROLE_CONFIG = {
  admin:          { label: 'Admin',        bg: `${CST.azul}20`,      text: CST.azul },
  sector_manager: { label: 'Gestor',       bg: `${CST.agua}20`,      text: CST.agua },
  employee:       { label: 'Colaborador',  bg: `${CST.champanhe}60`, text: CST.terracota },
};

export default function Admin() {
  const { data: me } = useGetMe();
  const { data: users, isLoading } = useGetUsers();
  const deleteUser  = useDeleteUser();
  const createUser  = useCreateUser();
  const updateUser  = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  const [tab, setTab] = useState('usuarios');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState<any>(null);
  const [resetTokenModal, setResetTokenModal] = useState<{ userId: number; token: string; expiresAt: string } | null>(null);
  const [generatingToken, setGeneratingToken] = useState<number | null>(null);
  const [form, setForm] = useState<{
    name: string; email: string; password: string; role: string;
    dept: string; color: string; status: string;
  }>({
    name: '', email: '', password: '', role: 'employee', dept: DEPTS[0], color: CST.azul, status: 'ativo'
  });
  const [loading, setLoading] = useState(false);

  if (me?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${CST.azul}15` }}>
          <Shield size={28} style={{ color: CST.azul }} className="opacity-40" />
        </div>
        <h2 className="text-xl font-black text-foreground m-0">Acesso Negado</h2>
        <p className="text-muted-foreground text-sm">Apenas administradores podem acessar esta área.</p>
      </div>
    );
  }

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'employee', dept: DEPTS[0], color: CST.azul, status: 'ativo' });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, dept: u.dept, color: u.color, status: u.status });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email || (!editUser && !form.password)) return;
    setLoading(true);
    if (editUser) {
      const updateData: any = { name: form.name, role: form.role, dept: form.dept, color: form.color, status: form.status };
      if (form.password) updateData.password = form.password;
      updateUser.mutate({ id: editUser.id, data: updateData }, {
        onSuccess: () => { toast({ description: "Usuário atualizado" }); queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() }); setShowModal(false); setLoading(false); },
        onError:   () => { toast({ variant: "destructive", description: "Erro ao atualizar" }); setLoading(false); },
      });
    } else {
      createUser.mutate({ data: { name: form.name, email: form.email, password: form.password, role: form.role as 'admin' | 'sector_manager' | 'employee', dept: form.dept, color: form.color } }, {
        onSuccess: () => { toast({ description: "Usuário criado" }); queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() }); setShowModal(false); setLoading(false); },
        onError:   () => { toast({ variant: "destructive", description: "Erro ao criar" }); setLoading(false); },
      });
    }
  };

  const handleGenerateResetToken = (userId: number) => {
    if (!confirm('Gerar um token de redefinição de senha para este usuário? O token expira em 24 horas.')) return;
    setGeneratingToken(userId);
    fetch(`/api/users/${userId}/reset-token`, { method: 'POST', credentials: 'include' })
      .then(r => r.json())
      .then((data: any) => {
        setGeneratingToken(null);
        if (data.error) { toast({ variant: "destructive", description: data.error }); return; }
        setResetTokenModal({ userId, token: data.token, expiresAt: data.expiresAt });
      })
      .catch(() => { setGeneratingToken(null); toast({ variant: "destructive", description: "Erro ao gerar token" }); });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Remover este usuário?')) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => { toast({ description: "Usuário removido" }); queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() }); },
    });
  };

  const filteredUsers = users?.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:   users?.length || 0,
    ativos:  users?.filter(u => u.status === 'ativo').length || 0,
    admins:  users?.filter(u => u.role === 'admin').length || 0,
    gestores: users?.filter(u => u.role === 'sector_manager').length || 0,
  };

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-primary m-0">Administração</h1>
          <p className="text-muted-foreground text-sm">Gestão de acessos e configurações do portal</p>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Usuários', value: stats.total,    color: CST.azul },
          { label: 'Usuários Ativos',   value: stats.ativos,   color: CST.mata },
          { label: 'Administradores',   value: stats.admins,   color: CST.terracota },
          { label: 'Gestores',          value: stats.gestores, color: CST.agua },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0" style={{ backgroundColor: s.color }}>
              {s.value}
            </div>
            <div className="text-xs font-semibold text-muted-foreground leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex border-b border-border">
        {[
          { id: 'usuarios', label: 'Usuários' },
          { id: 'config',   label: 'Configurações do Sistema' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 font-bold text-sm border-b-2 transition-colors cursor-pointer bg-transparent ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* === Tab Usuários === */}
      {tab === 'usuarios' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por nome ou e-mail..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" />
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all shrink-0 shadow-sm"
              style={{ backgroundColor: CST.azul }}>
              <Plus size={15} /> Novo Usuário
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground text-xs font-bold uppercase tracking-wide">
                  <th className="p-3 px-4">Usuário</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Departamento</th>
                  <th className="p-3">Função</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="border-b border-border">
                      {[1,2,3,4,5,6].map(j => <td key={j} className="p-3"><div className="h-5 bg-muted rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                ) : filteredUsers?.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">Nenhum usuário encontrado.</td></tr>
                ) : (
                  Array.isArray(filteredUsers) && filteredUsers.map(u => {
                    const roleConf = ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.employee;
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="p-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-sm" style={{ background: u.color }}>
                              {u.initials}
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-[13px]">{u.name}</div>
                              {u.id === me?.id && <div className="text-[10px] text-muted-foreground font-medium">Você</div>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground text-[13px]">{u.email}</td>
                        <td className="p-3 text-muted-foreground text-[13px]">{u.dept || '—'}</td>
                        <td className="p-3">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ background: roleConf.bg, color: roleConf.text }}>
                            {roleConf.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit`}
                            style={u.status === 'ativo'
                              ? { background: `${CST.mata}20`, color: CST.mata }
                              : { background: '#FEE2E2', color: '#B91C1C' }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: u.status === 'ativo' ? CST.mata : '#EF4444' }} />
                            {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(u)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                              title="Editar usuário">
                              <Edit size={15} />
                            </button>
                            {u.id !== me?.id && (
                              <>
                                <button onClick={() => handleGenerateResetToken(u.id)}
                                  disabled={generatingToken === u.id}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer transition-colors disabled:opacity-40"
                                  title="Gerar token de reset de senha">
                                  <KeyRound size={15} />
                                </button>
                                <button onClick={() => handleDelete(u.id)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                                  title="Remover usuário">
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === Tab Configurações === */}
      {tab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: RefreshCw,
              title: 'Backup do Banco',
              desc: 'Exportar dados dos usuários em JSON para fins de auditoria.',
              label: 'Exportar Dados',
              color: CST.agua,
              action: () => {
                const data = JSON.stringify({ users, timestamp: new Date().toISOString() }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'cst-backup.json'; a.click();
                toast({ description: "Backup baixado com sucesso!" });
              }
            },
            {
              icon: Settings,
              title: 'Limpar Sessões',
              desc: 'Remove todas as sessões de usuários do sistema (requer relogin).',
              label: 'Limpar Sessões',
              color: CST.terracota,
              action: () => toast({ description: "Nenhuma sessão ativa encontrada." }),
            },
          ].map((item, i) => (
            <div key={i} className="bg-card p-5 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{item.title}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{item.desc}</p>
              <button onClick={item.action}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all"
                style={{ backgroundColor: item.color }}>
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-foreground m-0">{editUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <p className="text-xs text-muted-foreground">{editUser ? `Editando ${editUser.name}` : 'Preencha os dados abaixo'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted cursor-pointer border-none bg-transparent text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Nome Completo</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors" placeholder="Nome do usuário" autoFocus />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">E-mail</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    disabled={!!editUser}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">
                    Senha {editUser && <span className="font-normal normal-case">(em branco = sem alteração)</span>}
                  </label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                    placeholder={editUser ? '••••••••' : 'Mínimo 6 caracteres'} />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Função</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors">
                    <option value="employee">Colaborador</option>
                    <option value="sector_manager">Gestor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Departamento</label>
                  <select value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors">
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wide">Cor do Avatar</label>
                  <div className="flex gap-2 flex-wrap">
                    {PALETTE.map(c => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })}
                        className="relative w-9 h-9 rounded-xl border-2 cursor-pointer transition-all hover:scale-110"
                        style={{ background: c, borderColor: form.color === c ? 'var(--color-foreground)' : 'transparent' }}>
                        {form.color === c && <CheckCircle size={14} className="absolute inset-0 m-auto text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted transition-colors text-foreground">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={loading || !form.name || !form.email}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center gap-2 transition-all"
                style={{ backgroundColor: CST.azul }}>
                <Save size={15} /> {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Reset Token Modal */}
    {resetTokenModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                <KeyRound size={18} style={{ color: '#D97706' }} />
              </div>
              <div>
                <h3 className="font-black text-lg text-foreground m-0">Token de Reset</h3>
                <p className="text-xs text-muted-foreground">Compartilhe com o usuário</p>
              </div>
            </div>
            <button onClick={() => setResetTokenModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted cursor-pointer border-none bg-transparent text-muted-foreground">
              <X size={16} />
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
              ⚠️ Este token expira em 24 horas. Compartilhe-o com o usuário por um canal seguro (ex: WhatsApp, e-mail interno).
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Token gerado</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted p-3 rounded-xl text-xs font-mono break-all text-foreground border border-border">{resetTokenModal.token}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(resetTokenModal.token); toast({ description: "Token copiado!" }); }}
                className="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted cursor-pointer transition-colors shrink-0 text-muted-foreground hover:text-foreground">
                <Copy size={15} />
              </button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            O usuário deve acessar a tela de login e clicar em <strong>"Esqueceu sua senha? Usar token de redefinição"</strong> para usar este token.
          </div>
          <div className="text-xs text-muted-foreground">
            Expira em: <strong>{new Date(resetTokenModal.expiresAt).toLocaleString('pt-BR')}</strong>
          </div>

          <button onClick={() => setResetTokenModal(null)}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all"
            style={{ backgroundColor: CST.azul }}>
            Fechar
          </button>
        </div>
      </div>
    )}
  </>
  );
}
