import { Router } from "express";
import { db } from "@workspace/db";
import { activitiesTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/activities", requireAuth, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || "1"));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "50")));
    const offset = (page - 1) * limit;

    const [totalResult, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(activitiesTable),
      db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt)).limit(limit).offset(offset),
    ]);

    const total = totalResult[0]?.count || 0;

    res.json({
      items: rows.map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        details: r.details,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    logger.error({ err }, "Activities error");
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
