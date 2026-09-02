import { useState } from "react";
import { useGetTasks, useUpdateTask, useCreateTask, useDeleteTask, getGetTasksQueryKey } from "@workspace/api-client-react";
import { Plus, GripVertical, Trash2, Edit2, X, Save, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CST } from "@/lib/brand";

const PRIORITIES = ['alta', 'media', 'baixa'] as const;
const DEPTS = ['Administração', 'RH', 'Financeiro', 'Projetos', 'TI', 'Jurídico', 'Geral'];

const PRIORITY_CONFIG = {
  alta:  { label: 'ALTA',  bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
  media: { label: 'MÉDIA', bg: `${CST.amarelo}28`, text: CST.terracota, dot: CST.amarelo },
  baixa: { label: 'BAIXA', bg: `${CST.mata}20`,    text: CST.mata,      dot: CST.mata },
};

const COL_CONFIG = [
  { id: 'todo',  title: 'A Fazer',      color: CST.rosa,    icon: Clock,         bg: `${CST.rosa}18` },
  { id: 'doing', title: 'Em Andamento', color: CST.amarelo, icon: AlertCircle,   bg: `${CST.amarelo}22` },
  { id: 'done',  title: 'Concluído',    color: CST.mata,    icon: CheckCircle2,  bg: `${CST.mata}20` },
] as const;

export default function Tasks() {
  const { data: groupedTasks, isLoading } = useGetTasks();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [draggingId, setDraggingId]   = useState<number | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [editForm, setEditForm]       = useState({ title: '', dept: '', priority: 'media' });
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState({ title: '', dept: DEPTS[0], priority: 'media', status: 'todo' });
  const [loading, setLoading]         = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });

  const showMutationError = (error: any, fallback: string) => {
    const message = error?.data?.error || error?.message;
    toast({
      variant: "destructive",
      description: error?.status === 403 ? "Você não tem permissão para esta ação" : message || fallback,
    });
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id.toString());
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggingOver(colId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'todo' | 'doing' | 'done') => {
    e.preventDefault();
    setDraggingOver(null);
    if (!draggingId) return;
    updateTask.mutate({ id: draggingId, data: { status: targetStatus } }, {
      onSuccess: () => { toast({ description: "Tarefa movida" }); invalidate(); },
      onError: (error) => showMutationError(error, "Erro ao mover tarefa"),
    });
    setDraggingId(null);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Excluir esta tarefa?')) return;
    deleteTask.mutate({ id }, {
      onSuccess: () => { toast({ description: "Tarefa excluída" }); invalidate(); },
      onError: (error) => showMutationError(error, "Erro ao excluir tarefa"),
    });
  };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setEditForm({ title: task.title, dept: task.dept, priority: task.priority });
  };

  const handleEditSave = (id: number) => {
    updateTask.mutate({ id, data: { ...editForm, priority: editForm.priority as typeof PRIORITIES[number] } }, {
      onSuccess: () => { toast({ description: "Tarefa atualizada" }); invalidate(); setEditingId(null); },
      onError: (error) => showMutationError(error, "Erro ao atualizar tarefa"),
    });
  };

  const handleCreate = () => {
    if (!createForm.title.trim()) return;
    setLoading(true);
    createTask.mutate({ data: { ...createForm, priority: createForm.priority as typeof PRIORITIES[number], status: createForm.status as 'todo' | 'doing' | 'done' } }, {
      onSuccess: () => {
        toast({ description: "Tarefa criada" });
        invalidate();
        setShowCreate(false);
        setCreateForm({ title: '', dept: DEPTS[0], priority: 'media', status: 'todo' });
        setLoading(false);
      },
      onError: (error) => {
        setLoading(false);
        showMutationError(error, "Erro ao criar tarefa");
      },
    });
  };

  const total = COL_CONFIG.reduce((acc, col) => acc + (groupedTasks?.[col.id]?.length || 0), 0);
  const done  = groupedTasks?.done?.length || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  if (isLoading) return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="h-8 bg-muted rounded-lg w-40 animate-pulse" />
      <div className="flex gap-6">
        {[1,2,3].map(i => <div key={i} className="flex-1 h-64 bg-muted rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col space-y-6 pb-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-primary m-0">Tarefas</h1>
          <p className="text-muted-foreground text-sm">Kanban de projetos e atividades da equipe</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 transition-all active:scale-95 shadow-sm"
          style={{ backgroundColor: CST.azul }}>
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1.5">
            <span>Progresso geral</span>
            <span>{done} de {total} tarefas concluídas</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: CST.mata }} />
          </div>
        </div>
        <div className="text-2xl font-black tabular-nums" style={{ color: CST.mata }}>{progress}%</div>
      </div>

      {/* Colunas Kanban */}
      <div className="flex gap-5 items-start">
        {COL_CONFIG.map(col => {
          const Icon = col.icon;
          const tasks = groupedTasks?.[col.id] || [];
          const isOver = draggingOver === col.id;
          return (
            <div key={col.id}
              className={`flex-1 rounded-xl border-2 flex flex-col min-h-[420px] transition-all duration-150 ${isOver ? 'border-dashed scale-[1.01] shadow-lg' : 'border-border bg-card shadow-sm'}`}
              style={isOver ? { borderColor: col.color, backgroundColor: col.bg } : {}}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => setDraggingOver(null)}
              onDrop={e => handleDrop(e, col.id)}>

              {/* Cabeçalho da coluna */}
              <div className="p-4 border-b border-border flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: col.bg }}>
                  <Icon size={15} style={{ color: col.color }} />
                </div>
                <span className="font-bold text-sm text-foreground">{col.title}</span>
                <div className="ml-auto flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black text-white" style={{ backgroundColor: col.color }}>
                  {tasks.length}
                </div>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2.5 flex-1">
                {tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-20 text-muted-foreground/50 text-xs font-medium gap-1">
                    <Icon size={20} />
                    <span>Vazio</span>
                  </div>
                )}
                {tasks.map(task => {
                  const pConf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.media;
                  const isEditing = editingId === task.id;
                  return (
                    <div key={task.id}
                      draggable={!isEditing}
                      onDragStart={e => handleDragStart(e, task.id)}
                      className={`bg-card p-3.5 rounded-xl border shadow-sm transition-all group ${draggingId === task.id ? 'opacity-40 scale-95 rotate-1' : 'hover:shadow-md hover:-translate-y-px'} ${isEditing ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${isOver && draggingId !== task.id ? '' : 'border-border'}`}>

                      {isEditing ? (
                        <div className="space-y-2.5">
                          <input value={editForm.title}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full p-2 rounded-lg border border-primary bg-background text-sm font-semibold outline-none"
                            autoFocus />
                          <div className="flex gap-2">
                            <select value={editForm.priority}
                              onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                              className="text-xs p-1.5 rounded-lg border border-border bg-background flex-1 outline-none">
                              {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                            </select>
                            <select value={editForm.dept}
                              onChange={e => setEditForm({ ...editForm, dept: e.target.value })}
                              className="text-xs p-1.5 rounded-lg border border-border bg-background flex-1 outline-none">
                              {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => setEditingId(null)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:bg-muted cursor-pointer bg-transparent">
                              <X size={12} /> Cancelar
                            </button>
                            <button onClick={() => handleEditSave(task.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white border-none cursor-pointer"
                              style={{ backgroundColor: CST.azul }}>
                              <Save size={12} /> Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2.5 gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: pConf.dot }} />
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md" style={{ background: pConf.bg, color: pConf.text }}>
                                {pConf.label}
                              </span>
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(task)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer border-none bg-transparent transition-colors">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => handleDelete(task.id)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer border-none bg-transparent transition-colors">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 mb-3">
                            <GripVertical size={14} className="text-muted-foreground/25 mt-0.5 shrink-0" />
                            <p className="font-semibold text-[13px] text-foreground leading-snug flex-1 m-0">{task.title}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-muted">{task.dept}</span>
                            {task.assigneeInitials && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] text-white shrink-0"
                                style={{ background: task.assigneeColor || CST.terracota }}>
                                {task.assigneeInitials}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer da coluna — adicionar rápido */}
              <div className="p-3 pt-0">
                <button onClick={() => { setCreateForm(f => ({ ...f, status: col.id as any })); setShowCreate(true); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer border border-dashed border-border bg-transparent">
                  <Plus size={13} /> Adicionar tarefa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal criar tarefa */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-foreground m-0">Nova Tarefa</h3>
                <p className="text-xs text-muted-foreground">Preencha os dados abaixo</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted cursor-pointer border-none bg-transparent text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Título</label>
                <input value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                  placeholder="Descreva a tarefa..." autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Departamento</label>
                  <select value={createForm.dept} onChange={e => setCreateForm({ ...createForm, dept: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors">
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Prioridade</label>
                  <select value={createForm.priority} onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary transition-colors">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5 uppercase tracking-wide">Coluna inicial</label>
                <div className="grid grid-cols-3 gap-2">
                  {COL_CONFIG.map(c => (
                    <button key={c.id}
                      onClick={() => setCreateForm(f => ({ ...f, status: c.id }))}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all"
                      style={createForm.status === c.id
                        ? { borderColor: c.color, backgroundColor: c.bg, color: c.color }
                        : { borderColor: 'var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-muted-foreground)' }}>
                      {c.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted transition-colors text-foreground">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={loading || !createForm.title.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center gap-2 transition-all"
                style={{ backgroundColor: CST.azul }}>
                <Save size={15} /> {loading ? 'Salvando...' : 'Criar Tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
