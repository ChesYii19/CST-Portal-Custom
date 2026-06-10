import { useGetDashboardStats } from "@workspace/api-client-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { LayoutDashboard, FileText, Users, CheckSquare } from "lucide-react";

const CST = {
  azul:      '#2E5665',
  rosa:      '#FC9BB3',
  amarelo:   '#FEDC05',
  agua:      '#00C1D4',
  terracota: '#A58877',
  mata:      '#486F5C',
  champanhe: '#E3DC97',
  ceu:       '#88CAE3',
};

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!stats) return <div className="p-8">Erro ao carregar dados do dashboard</div>;

  const PIE_COLORS = [CST.mata, CST.amarelo, CST.agua];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-black text-primary m-0">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Resumo e métricas gerais do portal</p>
      </div>

      {/* Cards de resumo — proporção brand guide: azul + acento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tarefas Abertas',    value: stats.openTasks,       icon: LayoutDashboard, bg: CST.azul,      fg: '#fff' },
          { label: 'Documentos',         value: stats.totalDocuments,  icon: FileText,        bg: CST.agua,      fg: '#fff' },
          { label: 'Membros Ativos',     value: stats.activeMembers,   icon: Users,           bg: CST.rosa,      fg: '#fff' },
          { label: 'Tarefas Concluídas', value: stats.completedTasks,  icon: CheckSquare,     bg: CST.mata,      fg: '#fff' },
        ].map((s, i) => (
          <div key={i} className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
              <s.icon size={22} color={s.fg} />
            </div>
            <div>
              <div className="text-3xl font-black leading-none mb-1" style={{ color: s.bg }}>{s.value}</div>
              <div className="text-xs font-semibold text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-bold text-sm text-muted-foreground mb-1">Atividade Semanal</h3>
          <p className="text-xs text-muted-foreground mb-4">Ações realizadas por dia</p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)', fontFamily: 'Montserrat' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'Montserrat', fontSize: 12 }} />
                <Line type="monotone" dataKey="v" stroke={CST.agua} strokeWidth={3} dot={{ r: 4, fill: CST.agua, strokeWidth: 0 }} activeDot={{ r: 6, fill: CST.azul }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-bold text-sm text-muted-foreground mb-1">Status de Tarefas</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribuição por estado</p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.tasksByStatus} innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                  {stats.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'Montserrat', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground font-semibold">
            {stats.tasksByStatus.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                {s.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm lg:col-span-2">
          <h3 className="font-bold text-sm text-muted-foreground mb-1">Atividade por Departamento</h3>
          <p className="text-xs text-muted-foreground mb-4">Tarefas e documentos por setor</p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={14} barGap={3}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)', fontFamily: 'Montserrat' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <Tooltip cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }} contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontFamily: 'Montserrat', fontSize: 12 }} />
                <Bar dataKey="tarefas" name="Tarefas"    fill={CST.azul}     radius={[4,4,0,0]} />
                <Bar dataKey="docs"    name="Documentos" fill={CST.champanhe} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda */}
          <div className="flex justify-end gap-4 text-xs text-muted-foreground font-semibold mt-2">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CST.azul }} />Tarefas</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CST.champanhe }} />Documentos</div>
          </div>
        </div>
      </div>
    </div>
  );
}
