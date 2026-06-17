import { Request, Response, NextFunction } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function getUserIdFromBearer(authHeader: string | undefined): Promise<number | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const sessionId = authHeader.slice(7).trim();
  if (!sessionId) return null;
  try {
    const [row] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.sid, sessionId))
      .limit(1);
    if (!row || row.expire < new Date()) return null;
    const data = JSON.parse(row.sess as string);
    return typeof data.userId === "number" ? data.userId : null;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  let userId: number | null = (req.session as any).userId ?? null;

  if (!userId) {
    userId = await getUserIdFromBearer(req.headers.authorization);
    if (userId) {
      (req.session as any).userId = userId;
    }
  }

  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  // Verify the user still exists AND is active.
  // Prevents: deactivated/deleted users from using stale sessions.
  const [user] = await db
    .select({ id: usersTable.id, status: usersTable.status, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.status === "inativo") {
    // Destroy the session so subsequent requests are also blocked
    req.session.destroy(() => {});
    res.status(401).json({ error: "Conta inativa ou não encontrada" });
    return;
  }

  (req as any).authUserId   = userId;
  (req as any).authUserRole = user.role; // Pre-loaded role for authorization checks downstream
  next();
}
