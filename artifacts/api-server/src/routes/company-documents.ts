import { Router } from "express";
import { db } from "@workspace/db";
import { companyDocumentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import { createUpload, uploadsBase, fileToUrl } from "../lib/uploads";
import { logger } from "../lib/logger";

const router = Router();
const upload = createUpload("company");

router.get("/company-documents", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { category, search } = req.query as { category?: string; search?: string };
    let rows = await db.select().from(companyDocumentsTable);
    if (category) rows = rows.filter((d) => d.category === category);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((d) => d.name.toLowerCase().includes(s));
    }
    res.json(rows.map(toDto));
  } catch (err) {
    logger.error({ err }, "List company docs error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/company-documents", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "File richiesto" });
      return;
    }
    const { name, category, notes } = req.body;
    const fileUrl = fileToUrl(req.file.path);
    const [row] = await db
      .insert(companyDocumentsTable)
      .values({
        name: name || req.file.originalname,
        category: category || "Altro",
        notes: notes || null,
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      })
      .returning();
    await logActivity("UPLOAD_COMPANY_DOCUMENT", "company_document", row.id, `Caricato: ${row.name}`);
    res.status(201).json(toDto(row));
  } catch (err) {
    logger.error({ err }, "Upload company doc error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/company-documents/:docId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.docId);
    const [row] = await db.delete(companyDocumentsTable).where(eq(companyDocumentsTable.id, id)).returning();
    if (!row) {
      res.status(404).json({ error: "Documento non trovato" });
      return;
    }
    await logActivity("DELETE_COMPANY_DOCUMENT", "company_document", id, `Eliminato: ${row.name}`);
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Delete company doc error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/company-documents/:docId/download", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.docId);
    const [row] = await db.select().from(companyDocumentsTable).where(eq(companyDocumentsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Documento non trovato" });
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
    logger.error({ err }, "Download company doc error");
    res.status(500).json({ error: "Errore interno" });
  }
});

function toDto(d: typeof companyDocumentsTable.$inferSelect) {
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    notes: d.notes,
    fileUrl: d.fileUrl,
    fileName: d.fileName,
    fileSize: d.fileSize ? Number(d.fileSize) : null,
    uploadedAt: d.uploadedAt.toISOString(),
  };
}

export default router;
