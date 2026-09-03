import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/data-library", requireAuth, (_req, res) => {
  res.json({ items: [], total: 0 });
});

export default router;