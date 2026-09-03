import { db, usersTable, channelsTable, messagesTable, documentsTable, tasksTable, notificationsTable, themeSettingsTable } from "@workspace/db";
import type { User } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const requiredPassword = (name: string): string => {
    const password = process.env[name];
    if (!password) throw new Error(`${name} must be set for local seed`);
    return password;
  };

  // Users
  const users = await db.select().from(usersTable);
  if (users.length === 0) {
    const adminHash = await bcrypt.hash(requiredPassword("DEV_ADMIN_PASSWORD"), 10);
    const gestorHash = await bcrypt.hash(requiredPassword("DEV_MANAGER_PASSWORD"), 10);
    const colaborHash = await bcrypt.hash(requiredPassword("DEV_EMPLOYEE_PASSWORD"), 10);
    const joaoHash = await bcrypt.hash(requiredPassword("DEV_INACTIVE_PASSWORD"), 10);

    await db.insert(usersTable).values([
      { name: "Ana Beatriz", email: "admin@cst.org.br", passwordHash: adminHash, role: "admin", dept: "Administração", initials: "AB", color: "#2E5A6A", status: "ativo", loginAttempts: 0 },
      { name: "Carlos Eduardo", email: "gestor@cst.org.br", passwordHash: gestorHash, role: "sector_manager", dept: "RH", initials: "CE", color: "#3ECCD0", status: "ativo", loginAttempts: 0 },
      { name: "Maria Silva", email: "colab@cst.org.br", passwordHash: colaborHash, role: "employee", dept: "Financeiro", initials: "MS", color: "#EC9AB9", status: "ativo", loginAttempts: 0 },
      { name: "João Santos", email: "joao@cst.org.br", passwordHash: joaoHash, role: "employee", dept: "Projetos", initials: "JS", color: "#A68877", status: "inativo", loginAttempts: 0 },
    ]);
    console.log("Users seeded.");
  }

  // Channels
  const channels = await db.select().from(channelsTable);
  if (channels.length === 0) {
    await db.insert(channelsTable).values([
      { id: "geral", name: "Geral", isPublic: true },
      { id: "administrativo", name: "Administrativo", isPublic: false },
      { id: "rh", name: "RH", isPublic: false },
      { id: "projetos", name: "Projetos", isPublic: true },
      { id: "financeiro", name: "Financeiro", isPublic: false },
    ]);
    console.log("Channels seeded.");
  }

  // Messages
  const messages = await db.select().from(messagesTable);
  if (messages.length === 0) {
    const seedUsers = await db.select().from(usersTable);
    const admin = seedUsers.find((u: User) => u.role === "admin");
    const gestor = seedUsers.find((u: User) => u.role === "sector_manager");
    const colab = seedUsers.find((u: User) => u.dept === "Financeiro");

    if (admin && gestor && colab) {
      await db.insert(messagesTable).values([
        { channelId: "geral", userId: admin.id, userName: admin.name, userRole: "Administrador", userInitials: admin.initials, userColor: admin.color, text: "Bom dia! Reunião às 14h na sala 2." },
        { channelId: "geral", userId: gestor.id, userName: gestor.name, userRole: "Gestor de Setor", userInitials: gestor.initials, userColor: gestor.color, text: "Confirmado! Preparo o relatório." },
        { channelId: "geral", userId: colab.id, userName: colab.name, userRole: "Colaborador", userInitials: colab.initials, userColor: colab.color, text: "Planilha de gastos atualizada!" },
        { channelId: "rh", userId: gestor.id, userName: gestor.name, userRole: "Gestor de Setor", userInitials: gestor.initials, userColor: gestor.color, text: "Novos voluntários chegam semana que vem." },
        { channelId: "financeiro", userId: colab.id, userName: colab.name, userRole: "Colaborador", userInitials: colab.initials, userColor: colab.color, text: "Relatório de maio enviado." },
        { channelId: "administrativo", userId: admin.id, userName: admin.name, userRole: "Administrador", userInitials: admin.initials, userColor: admin.color, text: "Orçamento Q3 aprovado." },
      ]);
      console.log("Messages seeded.");
    }
  }

  // Documents
  const docs = await db.select().from(documentsTable);
  if (docs.length === 0) {
    await db.insert(documentsTable).values([
      { name: "Relatório Mensal - Maio 2026", dept: "Financeiro", size: "2.4 MB", ext: "PDF" },
      { name: "Manual do Voluntário", dept: "RH", size: "1.1 MB", ext: "DOC" },
      { name: "Ata de Reunião - Q2", dept: "Administração", size: "340 KB", ext: "DOC" },
      { name: "Orçamento 2026", dept: "Financeiro", size: "890 KB", ext: "XLS" },
      { name: "Política de Privacidade", dept: "Administração", size: "520 KB", ext: "PDF" },
      { name: "Escala de Voluntários", dept: "RH", size: "210 KB", ext: "XLS" },
      { name: "Relatório de Projetos Q1", dept: "Projetos", size: "1.7 MB", ext: "PDF" },
      { name: "Formulário de Admissão", dept: "RH", size: "150 KB", ext: "DOC" },
    ]);
    console.log("Documents seeded.");
  }

  // Tasks
  const tasks = await db.select().from(tasksTable);
  if (tasks.length === 0) {
    await db.insert(tasksTable).values([
      { title: "Revisar política de voluntariado", dept: "RH", priority: "alta", status: "todo", assigneeInitials: "CE", assigneeColor: "#3ECCD0" },
      { title: "Atualizar site institucional", dept: "Administração", priority: "media", status: "todo", assigneeInitials: "AB", assigneeColor: "#2E5A6A" },
      { title: "Relatório financeiro Q3", dept: "Financeiro", priority: "alta", status: "todo", assigneeInitials: "MS", assigneeColor: "#EC9AB9" },
      { title: "Treinamento novos voluntários", dept: "RH", priority: "media", status: "doing", assigneeInitials: "CE", assigneeColor: "#3ECCD0" },
      { title: "Planilha de custos operacionais", dept: "Financeiro", priority: "alta", status: "doing", assigneeInitials: "MS", assigneeColor: "#EC9AB9" },
      { title: "Ata reunião — Maio/2026", dept: "Administração", priority: "baixa", status: "done", assigneeInitials: "AB", assigneeColor: "#2E5A6A" },
      { title: "Escala de voluntários — Junho", dept: "RH", priority: "media", status: "done", assigneeInitials: "CE", assigneeColor: "#3ECCD0" },
    ]);
    console.log("Tasks seeded.");
  }

  // Notifications (for each user)
  const notifs = await db.select().from(notificationsTable);
  if (notifs.length === 0) {
    const seedUsers = await db.select().from(usersTable);
    const notifData = seedUsers.flatMap((u: User) => [
      { userId: u.id, text: "Reunião às 14h — Sala 2", time: "08:30", read: false },
      { userId: u.id, text: "Carlos enviou novo documento", time: "09:15", read: false },
      { userId: u.id, text: "Tarefa \"Relatório Q3\" atualizada", time: "10:00", read: true },
    ]);
    await db.insert(notificationsTable).values(notifData);
    console.log("Notifications seeded.");
  }

  // Theme settings
  const theme = await db.select().from(themeSettingsTable);
  if (theme.length === 0) {
    await db.insert(themeSettingsTable).values({});
    console.log("Theme settings seeded.");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
