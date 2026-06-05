import { Router } from "express";
import { db } from "@workspace/db";
import { payslipsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import { createUpload, uploadsBase, fileToUrl } from "../lib/uploads";
import { logger } from "../lib/logger";

const router = Router();
const upload = createUpload("payslips");

router.get("/employees/:id/payslips", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { year } = req.query as { year?: string };
    let rows = await db.select().from(payslipsTable).where(eq(payslipsTable.employeeId, id));
    if (year) rows = rows.filter((p) => p.year === parseInt(year));
    res.json(rows.map(toDto));
  } catch (err) {
    logger.error({ err }, "List payslips error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/employees/:id/payslips", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    if (!req.file) {
      res.status(400).json({ error: "File richiesto" });
      return;
    }
    const { year, month } = req.body;
    const fileUrl = fileToUrl(req.file.path);
    const [row] = await db
      .insert(payslipsTable)
      .values({
        employeeId,
        year: parseInt(year),
        month: parseInt(month),
        fileUrl,
        fileName: req.file.originalname,
      })
      .returning();
    await logActivity("UPLOAD_PAYSLIP", "payslip", row.id, `Busta paga ${month}/${year}`);
    res.status(201).json(toDto(row));
  } catch (err) {
    logger.error({ err }, "Upload payslip error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/payslips/:payslipId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.payslipId);
    const [row] = await db.delete(payslipsTable).where(eq(payslipsTable.id, id)).returning();
    if (!row) {
      res.status(404).json({ error: "Busta paga non trovata" });
      return;
    }
    await logActivity("DELETE_PAYSLIP", "payslip", id, "Eliminata busta paga");
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Delete payslip error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/payslips/:payslipId/download", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.payslipId);
    const [row] = await db.select().from(payslipsTable).where(eq(payslipsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Busta paga non trovata" });
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
    logger.error({ err }, "Download payslip error");
    res.status(500).json({ error: "Errore interno" });
  }
});

function toDto(p: typeof payslipsTable.$inferSelect) {
  return {
    id: p.id,
    employeeId: p.employeeId,
    year: p.year,
    month: p.month,
    fileUrl: p.fileUrl,
    fileName: p.fileName,
    uploadedAt: p.uploadedAt.toISOString(),
  };
}

export default router;
