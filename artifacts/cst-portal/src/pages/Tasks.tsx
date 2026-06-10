import { useState } from "react";
import { useGetTasks, useUpdateTask, useCreateTask, useDeleteTask, getGetTasksQueryKey } from "@workspace/api-client-react";
import { Plus, GripVertical, Trash2, Edit2, X, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const PRIORITIES = ['alta', 'media', 'baixa'];
const DEPTS = ['Administração', 'RH', 'Financeiro', 'Projetos', 'TI', 'Jurídico', 'Geral'];

export default function Tasks() {
  const { data: groupedTasks, isLoading } = useGetTasks();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', dept: '', priority: 'media' });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', dept: DEPTS[0], priority: 'media', status: 'todo' });
  const [loading, setLoading] = useState(false);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'todo' | 'doing' | 'done') => {
    e.preventDefault();
    if (!draggingId) return;
    updateTask.mutate({ id: draggingId, data: { status: targetStatus } }, {
      onSuccess: () => {
        toast({ description: "Tarefa movida" });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
      }
    });
    setDraggingId(null);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Excluir esta tarefa?')) return;
    deleteTask.mutate({ id }, {
      onSuccess: () => {
        toast({ description: "Tarefa excluída" });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
      }
    });
  };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setEditForm({ title: task.title, dept: task.dept, priority: task.priority });
  };

  const handleEditSave = (id: number) => {
    updateTask.mutate({ id, data: { ...editForm, priority: editForm.priority as 'alta' | 'media' | 'baixa' } }, {
      onSuccess: () => {
        toast({ description: "Tarefa atualizada" });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        setEditingId(null);
      }
    });
  };

  const handleCreate = () => {
    if (!createForm.title.trim()) return;
    setLoading(true);
    createTask.mutate({ data: { ...createForm, priority: createForm.priority as 'alta' | 'media' | 'baixa', status: createForm.status as 'todo' | 'doing' | 'done' } }, {
      onSuccess: () => {
        toast({ description: "Tarefa criada" });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        setShowCreate(false);
        setCreateForm({ title: '', dept: DEPTS[0], priority: 'media', status: 'todo' });
        setLoading(false);
      },
      onError: () => {
        setLoading(false);
      }
    });
  };

  const cols = [
    { id: 'todo', title: 'A Fazer', color: '#EC9AB9' },
    { id: 'doing', title: 'Em Andamento', color: '#FFED00' },
    { id: 'done', title: 'Concluído', color: '#5A8B7D' }
  ] as const;

  if (isLoading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-primary m-0">Tarefas</h1>
          <p className="text-muted-foreground text-sm">Kanban de projetos e atividades</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2">
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {cols.map(col => (
          <div key={col.id} className="flex-1 bg-card rounded-xl border border-border shadow-sm flex flex-col min-h-[400px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
            <div className="p-4 border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <div className="font-bold text-sm text-foreground">{col.title}</div>
              <div className="ml-auto bg-muted text-muted-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {groupedTasks?.[col.id]?.length || 0}
              </div>
            </div>
            
            <div className="p-3 space-y-3 flex-1 bg-background/30 rounded-b-xl">
              {groupedTasks?.[col.id]?.map(task => (
                <div key={task.id} draggable={editingId !== task.id} onDragStart={(e) => handleDragStart(e, task.id)} className={`bg-card p-3.5 rounded-lg border border-border shadow-sm hover:border-primary/50 transition-colors group ${draggingId === task.id ? 'opacity-50' : ''} ${editingId === task.id ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}>
                  <div className="flex gap-2">
                    <GripVertical size={16} className="text-muted-foreground/30 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      {editingId === task.id ? (
                        <div className="space-y-2">
                          <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full p-1.5 rounded border border-border bg-background text-sm outline-none focus:border-primary" />
                          <div className="flex gap-2">
                            <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="text-xs p-1 rounded border border-border bg-background">
                              {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                            </select>
                            <select value={editForm.dept} onChange={e => setEditForm({ ...editForm, dept: e.target.value })} className="text-xs p-1 rounded border border-border bg-background flex-1">
                              {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-muted cursor-pointer border-none bg-transparent text-muted-foreground"><X size={14} /></button>
                            <button onClick={() => handleEditSave(task.id)} className="p-1 rounded hover:bg-primary/10 cursor-pointer border-none bg-transparent text-primary"><Save size={14} /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2 mb-2 items-start justify-between">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              task.priority === 'alta' ? 'bg-destructive/10 text-destructive' :
                              task.priority === 'media' ? 'bg-[#FFED00]20 text-[#A68877]' :
                              'bg-[#5A8B7D]20 text-[#5A8B7D]'
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(task)} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded cursor-pointer border-none bg-transparent">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDelete(task.id)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer border-none bg-transparent">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="font-bold text-sm text-foreground leading-tight mb-3">{task.title}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{task.dept}</span>
                            {task.assigneeInitials && (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] text-white" style={{ background: task.assigneeColor || '#A68877' }}>
                                {task.assigneeInitials}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Tarefa */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-foreground">Nova Tarefa</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-muted cursor-pointer border-none bg-transparent text-muted-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Título</label>
                <input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary" placeholder="Descrição da tarefa..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Departamento</label>
                  <select value={createForm.dept} onChange={e => setCreateForm({ ...createForm, dept: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary">
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Prioridade</label>
                  <select value={createForm.priority} onChange={e => setCreateForm({ ...createForm, priority: e.target.value })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Coluna</label>
                <select value={createForm.status} onChange={e => setCreateForm({ ...createForm, status: e.target.value as any })} className="w-full p-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary">
                  <option value="todo">A Fazer</option>
                  <option value="doing">Em Andamento</option>
                  <option value="done">Concluído</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm font-bold border border-border bg-transparent cursor-pointer hover:bg-muted">Cancelar</button>
              <button onClick={handleCreate} disabled={loading || !createForm.title.trim()} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground border-none cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                <Save size={16} /> {loading ? 'Salvando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
