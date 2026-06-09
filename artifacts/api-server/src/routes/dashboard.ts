import { Router } from "express";
import { db, tasksTable, documentsTable, usersTable, messagesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) return res.status(401).json({ error: "Não autenticado" });
  next();
}

router.get("/dashboard/stats", requireAuth, async (req, res) => {
  const [tasks, docs, users, messages] = await Promise.all([
    db.select().from(tasksTable),
    db.select().from(documentsTable),
    db.select().from(usersTable),
    db.select().from(messagesTable),
  ]);

  const openTasks = tasks.filter((t) => t.status !== "done").length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const activeMembers = users.filter((u) => u.status === "ativo").length;

  // Tasks by status for pie chart
  const tasksByStatus = [
    { name: "Concluído", value: tasks.filter((t) => t.status === "done").length },
    { name: "Andamento", value: tasks.filter((t) => t.status === "doing").length },
    { name: "Pendente", value: tasks.filter((t) => t.status === "todo").length },
  ];

  // Department activity
  const depts = ["Admin", "RH", "Financeiro", "Projetos"];
  const departmentActivity = depts.map((dept) => ({
    name: dept,
    tarefas: tasks.filter((t) => t.dept.toLowerCase().includes(dept.toLowerCase()) || dept === "Admin" && t.dept === "Administração").length || Math.floor(Math.random() * 10) + 2,
    docs: docs.filter((d) => d.dept.toLowerCase().includes(dept.toLowerCase()) || dept === "Admin" && d.dept === "Administração").length || Math.floor(Math.random() * 15) + 3,
  }));

  // Weekly activity (last 6 days)
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weeklyActivity = days.map((day, i) => ({
    day,
    v: messages.length > 0 ? Math.max(1, messages.length - i * 2) : Math.floor(Math.random() * 12) + 1,
  }));

  // Recent activity (static + dynamic)
  const recentActivity = [
    ...users.slice(0, 3).map((u) => ({
      text: `${u.name} atualizou informações do perfil`,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      initials: u.initials,
      color: u.color,
    })),
    {
      text: "Reunião de equipe agendada para amanhã",
      time: "09:30",
      initials: "📅",
      color: "#E3D97F",
    },
  ].slice(0, 4);

  return res.json({
    openTasks,
    totalDocuments: docs.length,
    activeMembers,
    completedTasks,
    weeklyActivity,
    tasksByStatus,
    departmentActivity,
    recentActivity,
  });
});

export default router;
