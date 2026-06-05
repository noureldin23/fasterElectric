import { Router } from "express";
import { db } from "@workspace/db";
import {
  employeesTable,
  employeeDocumentsTable,
  payslipsTable,
  cudsTable,
} from "@workspace/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import path from "path";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import { createUpload, uploadsBase, fileToUrl } from "../lib/uploads";
import { logger } from "../lib/logger";

const router = Router();
const upload = createUpload("employees");

function nextEmployeeCode(id: number): string {
  return `EMP${String(id).padStart(4, "0")}`;
}

router.get("/employees", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { search, status, mansione } = req.query as Record<string, string>;
    let rows = await db.select().from(employeesTable).orderBy(desc(employeesTable.createdAt));
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.firstName.toLowerCase().includes(s) ||
          e.lastName.toLowerCase().includes(s) ||
          (e.fiscalCode || "").toLowerCase().includes(s) ||
          e.employeeCode.toLowerCase().includes(s)
      );
    }
    if (status && status !== "all") {
      rows = rows.filter((e) => e.status === status);
    }
    if (mansione && mansione !== "all") {
      rows = rows.filter((e) => e.mansione === mansione);
    }
    res.json(rows.map(toEmployeeDto));
  } catch (err) {
    logger.error({ err }, "List employees error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/employees", requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const [inserted] = await db
      .insert(employeesTable)
      .values({
        employeeCode: data.employeeCode || "TEMP",
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        email: data.email || null,
        fiscalCode: data.fiscalCode || null,
        iban: data.iban || null,
        birthDate: data.birthDate || null,
        hireDate: data.hireDate || null,
        mansione: data.mansione || null,
        address: data.address || null,
        status: data.status || "active",
        notes: data.notes || null,
      })
      .returning();
    if (!data.employeeCode) {
      const [updated] = await db
        .update(employeesTable)
        .set({ employeeCode: nextEmployeeCode(inserted.id) })
        .where(eq(employeesTable.id, inserted.id))
        .returning();
      await logActivity("CREATE_EMPLOYEE", "employee", updated.id, `Creato: ${updated.firstName} ${updated.lastName}`);
      res.status(201).json(toEmployeeDto(updated));
    } else {
      await logActivity("CREATE_EMPLOYEE", "employee", inserted.id, `Creato: ${inserted.firstName} ${inserted.lastName}`);
      res.status(201).json(toEmployeeDto(inserted));
    }
  } catch (err) {
    logger.error({ err }, "Create employee error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/employees/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
    if (!emp) {
      res.status(404).json({ error: "Dipendente non trovato" });
      return;
    }
    const [documents, payslips, cuds] = await Promise.all([
      db.select().from(employeeDocumentsTable).where(eq(employeeDocumentsTable.employeeId, id)).orderBy(desc(employeeDocumentsTable.uploadedAt)),
      db.select().from(payslipsTable).where(eq(payslipsTable.employeeId, id)).orderBy(desc(payslipsTable.uploadedAt)),
      db.select().from(cudsTable).where(eq(cudsTable.employeeId, id)).orderBy(desc(cudsTable.uploadedAt)),
    ]);
    res.json({
      ...toEmployeeDto(emp),
      documents: documents.map(toDocDto),
      payslips: payslips.map(toPayslipDto),
      cuds: cuds.map(toCudDto),
    });
  } catch (err) {
    logger.error({ err }, "Get employee error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.patch("/employees/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const update: Record<string, unknown> = {};
    const fields = ["employeeCode","firstName","lastName","phone","email","fiscalCode","iban","birthDate","hireDate","mansione","address","status","notes"];
    for (const f of fields) {
      if (f in data) update[f] = data[f] || null;
    }
    if (data.firstName) update.firstName = data.firstName;
    if (data.lastName) update.lastName = data.lastName;
    if (data.status) update.status = data.status;
    const [updated] = await db.update(employeesTable).set(update).where(eq(employeesTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Dipendente non trovato" });
      return;
    }
    await logActivity("UPDATE_EMPLOYEE", "employee", id, `Aggiornato: ${updated.firstName} ${updated.lastName}`);
    res.json(toEmployeeDto(updated));
  } catch (err) {
    logger.error({ err }, "Update employee error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.delete("/employees/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [emp] = await db.delete(employeesTable).where(eq(employeesTable.id, id)).returning();
    if (!emp) {
      res.status(404).json({ error: "Dipendente non trovato" });
      return;
    }
    await logActivity("DELETE_EMPLOYEE", "employee", id, `Eliminato: ${emp.firstName} ${emp.lastName}`);
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Delete employee error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/employees/:id/photo", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!req.file) {
      res.status(400).json({ error: "File richiesto" });
      return;
    }
    const url = fileToUrl(req.file.path);
    await db.update(employeesTable).set({ photoUrl: url }).where(eq(employeesTable.id, id));
    await logActivity("UPLOAD_PHOTO", "employee", id, "Foto aggiornata");
    res.json({ url });
  } catch (err) {
    logger.error({ err }, "Upload photo error");
    res.status(500).json({ error: "Errore interno" });
  }
});

function toEmployeeDto(e: typeof employeesTable.$inferSelect) {
  return {
    id: e.id,
    employeeCode: e.employeeCode,
    firstName: e.firstName,
    lastName: e.lastName,
    phone: e.phone,
    email: e.email,
    fiscalCode: e.fiscalCode,
    iban: e.iban,
    birthDate: e.birthDate,
    hireDate: e.hireDate,
    mansione: e.mansione,
    address: e.address,
    status: e.status,
    notes: e.notes,
    photoUrl: e.photoUrl,
    createdAt: e.createdAt.toISOString(),
  };
}

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

function toPayslipDto(p: typeof payslipsTable.$inferSelect) {
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

function toCudDto(c: typeof cudsTable.$inferSelect) {
  return {
    id: c.id,
    employeeId: c.employeeId,
    year: c.year,
    fileUrl: c.fileUrl,
    fileName: c.fileName,
    uploadedAt: c.uploadedAt.toISOString(),
  };
}

export { toDocDto, toPayslipDto, toCudDto };
export default router;
