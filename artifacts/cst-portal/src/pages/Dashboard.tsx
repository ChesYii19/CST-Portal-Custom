import { useGetDashboardStats } from "@workspace/api-client-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { LayoutDashboard, FileText, Users, CheckSquare } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) return <div className="p-8">Carregando...</div>;
  if (!stats) return <div className="p-8">Erro ao carregar dados do dashboard</div>;

  const COLORS = ['#5A8B7D', '#E3D97F', '#A68877'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-black text-primary m-0">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Resumo e métricas gerais do portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tarefas Abertas', value: stats.openTasks, icon: LayoutDashboard, color: '#2E5A6A' },
          { label: 'Documentos', value: stats.totalDocuments, icon: FileText, color: '#3ECCD0' },
          { label: 'Membros Ativos', value: stats.activeMembers, icon: Users, color: '#EC9AB9' },
          { label: 'Tarefas Concluídas', value: stats.completedTasks, icon: CheckSquare, color: '#5A8B7D' }
        ].map((s, i) => (
          <div key={i} className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
              <s.icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground leading-none mb-1">{s.value}</div>
              <div className="text-xs font-bold text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-bold text-sm text-muted-foreground mb-4">Atividade Semanal</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)' }} />
                <Line type="monotone" dataKey="v" stroke="#3ECCD0" strokeWidth={3} dot={{ r: 4, fill: '#3ECCD0', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-bold text-sm text-muted-foreground mb-4">Status de Tarefas</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.tasksByStatus} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                  {stats.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm lg:col-span-2">
          <h3 className="font-bold text-sm text-muted-foreground mb-4">Atividade por Departamento</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={16}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                <Tooltip cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }} contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)' }} />
                <Bar dataKey="tarefas" name="Tarefas" fill="#2E5A6A" radius={[4,4,0,0]} />
                <Bar dataKey="docs" name="Documentos" fill="#EC9AB9" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
        <h3 className="font-bold text-sm text-muted-foreground mb-4">Atividade Recente</h3>
        <div className="space-y-4">
          {stats.recentActivity.map((act, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0" style={{ background: act.color }}>
                {act.initials}
              </div>
              <div className="flex-1">
                <div className="text-sm text-foreground">{act.text}</div>
                <div className="text-xs text-muted-foreground">{act.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}