import { Router } from "express";
import { db } from "@workspace/db";
import { employeeDocumentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import { createUpload, uploadsBase, fileToUrl } from "../lib/uploads";
import { logger } from "../lib/logger";

const router = Router();
const upload = createUpload("employees");

router.get("/employees/:id/documents", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { category } = req.query as { category?: string };
    let docs = await db.select().from(employeeDocumentsTable).where(eq(employeeDocumentsTable.employeeId, id));
    if (category) docs = docs.filter((d) => d.category === category);
    res.json(docs.map(toDocDto));
  } catch (err) {
    logger.error({ err }, "List documents error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/employees/:id/documents", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    if (!req.file) {
      res.status(400).json({ error: "File richiesto" });
      return;
    }
    const { name, category, startDate, endDate, notes } = req.body;
    const fileUrl = fileToUrl(req.file.path);
    const [doc] = await db
      .insert(employeeDocumentsTable)
      .values({
        employeeId,
        name: name || req.file.originalname,
        category: category || "Altro",
        startDate: startDate || null,
        endDate: endDate || null,
        notes: notes || null,
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      })
      .returning();
    await logActivity("UPLOAD_DOCUMENT", "employee_document", doc.id, `Caricato: ${doc.name}`);
    res.status(201).json(toDocDto(doc));
  } catch (err) {
    logger.error({ err }, "Upload document error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.patch("/documents/:docId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const docId = parseInt(req.params.docId);
    const { name, category, startDate, endDate, notes } = req.body;
    const [doc] = await db
      .update(employeeDocumentsTable)
      .set({
        ...(name && { name }),
        ...(category && { category }),
        startDate: startDate || null,
        endDate: endDate || null,
        notes: notes || null,
      })
      .where(eq(employeeDocumentsTable.id, docId))
      .returning();
    if (!doc) {
      res.status(404).json({ error: "Documento non trovato" });
      return;
    }
    await logActivity("UPDATE_DOCUMENT", "employee_document", docId, `Aggiornato: ${doc.name}`);
    res.json(toDocDto(doc));
  } catch (err) {
    logger.error({ err }, "Update document error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/documents/:docId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const docId = parseInt(req.params.docId);
    const [doc] = await db.delete(employeeDocumentsTable).where(eq(employeeDocumentsTable.id, docId)).returning();
    if (!doc) {
      res.status(404).json({ error: "Documento non trovato" });
      return;
    }
    await logActivity("DELETE_DOCUMENT", "employee_document", docId, `Eliminato: ${doc.name}`);
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Delete document error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/documents/:docId/download", requireAuth, async (req: AuthRequest, res) => {
  try {
    const docId = parseInt(req.params.docId);
    const [doc] = await db.select().from(employeeDocumentsTable).where(eq(employeeDocumentsTable.id, docId));
    if (!doc) {
      res.status(404).json({ error: "Documento non trovato" });
      return;
    }
    const rel = doc.fileUrl.replace("/api/uploads/", "");
    const filePath = path.resolve(uploadsBase, rel);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File non trovato" });
      return;
    }
    res.download(filePath, doc.fileName);
  } catch (err) {
    logger.error({ err }, "Download document error");
    res.status(500).json({ error: "Errore interno" });
  }
});

function toDocDto(d: typeof employeeDocumentsTable.$inferSelect) {
  return {
    id: d.id,
    employeeId: d.employeeId,
    name: d.name,
    category: d.category,
    startDate: d.startDate,
    endDate: d.endDate,
    notes: d.notes,
    fileUrl: d.fileUrl,
    fileName: d.fileName,
    fileSize: d.fileSize ? Number(d.fileSize) : null,
    uploadedAt: d.uploadedAt.toISOString(),
  };
}

export default router;
