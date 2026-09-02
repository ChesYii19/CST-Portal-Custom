import { Router } from "express";
import { db, tasksTable, documentsTable, usersTable, messagesTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req, res) => {
  const [tasks, docs, users, messages] = await Promise.all([
    db.select().from(tasksTable),
    db.select().from(documentsTable),
    db.select().from(usersTable),
    db.select().from(messagesTable),
  ]);

  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "concluido").length;
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "concluido").length;
  const activeMembers = users.filter((u) => u.status === "ativo").length;

  const tasksByStatus = [
    { name: "Concluído", value: tasks.filter((t) => t.status === "done" || t.status === "concluido").length },
    { name: "Andamento", value: tasks.filter((t) => t.status === "doing" || t.status === "em_andamento").length },
    { name: "Pendente", value: tasks.filter((t) => t.status === "todo" || t.status === "pendente").length },
  ];

  const depts = ["Admin", "RH", "Financeiro", "Projetos"];
  const departmentActivity = depts.map((dept) => ({
    name: dept,
    tarefas: tasks.filter((t) => t.dept.toLowerCase().includes(dept.toLowerCase()) || (dept === "Admin" && t.dept === "Administração")).length,
    docs: docs.filter((d) => d.dept.toLowerCase().includes(dept.toLowerCase()) || (dept === "Admin" && d.dept === "Administração")).length,
  }));

  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayIndexes: Record<string, number> = { Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6 };
  const weeklyActivity = days.map((day) => ({
    day,
    v: messages.filter((message) => new Date(message.createdAt).getDay() === dayIndexes[day]).length,
  }));

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
