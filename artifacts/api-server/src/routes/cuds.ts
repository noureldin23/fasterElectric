import { Router } from "express";
import { db } from "@workspace/db";
import { cudsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import { createUpload, uploadsBase, fileToUrl } from "../lib/uploads";
import { logger } from "../lib/logger";

const router = Router();
const upload = createUpload("cuds");

router.get("/employees/:id/cuds", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(cudsTable).where(eq(cudsTable.employeeId, id));
    res.json(rows.map(toDto));
  } catch (err) {
    logger.error({ err }, "List cuds error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/employees/:id/cuds", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    if (!req.file) {
      res.status(400).json({ error: "File richiesto" });
      return;
    }
    const { year } = req.body;
    const fileUrl = fileToUrl(req.file.path);
    const [row] = await db
      .insert(cudsTable)
      .values({ employeeId, year: parseInt(year), fileUrl, fileName: req.file.originalname })
      .returning();
    await logActivity("UPLOAD_CUD", "cud", row.id, `CUD ${year}`);
    res.status(201).json(toDto(row));
  } catch (err) {
    logger.error({ err }, "Upload cud error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/cuds/:cudId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.cudId);
    const [row] = await db.delete(cudsTable).where(eq(cudsTable.id, id)).returning();
    if (!row) {
      res.status(404).json({ error: "CUD non trovato" });
      return;
    }
    await logActivity("DELETE_CUD", "cud", id, "CUD eliminato");
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Delete cud error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/cuds/:cudId/download", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.cudId);
    const [row] = await db.select().from(cudsTable).where(eq(cudsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "CUD non trovato" });
      return;
    }
    const rel = row.fileUrl.replace("/api/uploads/", "");
    const filePath = path.resolve(uploadsBase, rel);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File non trovato" });
      return;
    }
    res.download(filePath, row.fileName);
  } catch (err) {
    logger.error({ err }, "Download cud error");
    res.status(500).json({ error: "Errore interno" });
  }
});

function toDto(c: typeof cudsTable.$inferSelect) {
  return {
    id: c.id,
    employeeId: c.employeeId,
    year: c.year,
    fileUrl: c.fileUrl,
    fileName: c.fileName,
    uploadedAt: c.uploadedAt.toISOString(),
  };
}

export default router;
