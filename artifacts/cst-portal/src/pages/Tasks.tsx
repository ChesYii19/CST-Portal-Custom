import { useState } from "react";
import { useGetTasks, useUpdateTask, useCreateTask, useDeleteTask, getGetTasksQueryKey } from "@workspace/api-client-react";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const { data: groupedTasks, isLoading } = useGetTasks();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [draggingId, setDraggingId] = useState<number | null>(null);

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
    
    // Optimistic update
    updateTask.mutate({ id: draggingId, data: { status: targetStatus } }, {
      onSuccess: () => {
        toast({ description: "Tarefa movida" });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
      }
    });
    setDraggingId(null);
  };

  const handleDelete = (id: number) => {
    deleteTask.mutate({ id }, {
      onSuccess: () => {
        toast({ description: "Tarefa excluída" });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
      }
    });
  };

  const handleCreate = () => {
    createTask.mutate({ data: { title: "Nova tarefa", dept: "Geral", priority: "media", status: "todo" } }, {
      onSuccess: () => {
        toast({ description: "Tarefa criada" });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
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
        <button onClick={handleCreate} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2">
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {cols.map(col => (
          <div 
            key={col.id} 
            className="flex-1 bg-card rounded-xl border border-border shadow-sm flex flex-col min-h-[400px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="p-4 border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <div className="font-bold text-sm text-foreground">{col.title}</div>
              <div className="ml-auto bg-muted text-muted-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {groupedTasks?.[col.id]?.length || 0}
              </div>
            </div>
            
            <div className="p-3 space-y-3 flex-1 bg-background/30 rounded-b-xl">
              {groupedTasks?.[col.id]?.map(task => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className={`bg-card p-3.5 rounded-lg border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors group ${draggingId === task.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex gap-2">
                    <GripVertical size={16} className="text-muted-foreground/30 mt-0.5 cursor-grab shrink-0" />
                    <div className="flex-1">
                      <div className="flex gap-2 mb-2 items-start justify-between">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          task.priority === 'alta' ? 'bg-destructive/10 text-destructive' :
                          task.priority === 'media' ? 'bg-[#FFED00]20 text-[#A68877]' :
                          'bg-[#5A8B7D]20 text-[#5A8B7D]'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all cursor-pointer">
                          <Trash2 size={14} />
                        </button>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}