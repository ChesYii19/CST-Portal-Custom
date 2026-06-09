import { Request, Response, NextFunction } from "express";
import { db, sessionsTable } from "@workspace/db";
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

  (req as any).authUserId = userId;
  next();
}
