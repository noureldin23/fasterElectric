import { Router } from "express";
import { db } from "@workspace/db";
import {
  employeesTable,
  employeeDocumentsTable,
  payslipsTable,
  cudsTable,
  activitiesTable,
  companyDocumentsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

const EXPIRY_CATEGORIES = ["Contratto", "Permesso di soggiorno", "Patente", "Corso sicurezza", "Visita medica", "Certificazione", "Attestato"];

router.get("/dashboard/stats", requireAuth, async (_req: AuthRequest, res) => {
  try {
    const [employees, docs, payslips, cuds] = await Promise.all([
      db.select().from(employeesTable),
      db.select().from(employeeDocumentsTable),
      db.select({ id: payslipsTable.id }).from(payslipsTable),
      db.select({ id: cudsTable.id }).from(cudsTable),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const monitoredDocs = docs.filter((d) => EXPIRY_CATEGORIES.includes(d.category) && d.endDate);
    const expired = monitoredDocs.filter((d) => d.endDate! < today).length;
    const expiringSoon = monitoredDocs.filter((d) => d.endDate! >= today && d.endDate! <= in30).length;

    res.json({
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === "active").length,
      totalDocuments: docs.length,
      expiringDocuments: expiringSoon,
      expiredDocuments: expired,
      totalPayslips: payslips.length,
      totalCuds: cuds.length,
    });
  } catch (err) {
    logger.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/dashboard/documents-by-month", requireAuth, async (_req: AuthRequest, res) => {
  try {
    const [empDocs, compDocs] = await Promise.all([
      db.select({ uploadedAt: employeeDocumentsTable.uploadedAt }).from(employeeDocumentsTable),
      db.select({ uploadedAt: companyDocumentsTable.uploadedAt }).from(companyDocumentsTable),
    ]);

    const now = new Date();
    const counts: Record<string, number> = {};

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      counts[key] = 0;
    }

    const allDates = [
      ...empDocs.map((d) => d.uploadedAt),
      ...compDocs.map((d) => d.uploadedAt),
    ];

    for (const date of allDates) {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (key in counts) counts[key]++;
    }

    const monthNames = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
    const result = Object.entries(counts).map(([key, count]) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month, label: `${monthNames[month - 1]} ${String(year).slice(2)}`, count };
    });

    res.json(result);
  } catch (err) {
    logger.error({ err }, "Documents by month error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/dashboard/recent-activities", requireAuth, async (_req: AuthRequest, res) => {
  try {
    const rows = await db.select().from(activitiesTable).orderBy(desc(activitiesTable.createdAt)).limit(10);
    res.json(rows.map((r) => ({
      id: r.id,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "Recent activities error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/dashboard/recent-documents", requireAuth, async (_req: AuthRequest, res) => {
  try {
    const docs = await db
      .select({
        id: employeeDocumentsTable.id,
        name: employeeDocumentsTable.name,
        category: employeeDocumentsTable.category,
        uploadedAt: employeeDocumentsTable.uploadedAt,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
      })
      .from(employeeDocumentsTable)
      .leftJoin(employeesTable, eq(employeeDocumentsTable.employeeId, employeesTable.id))
      .orderBy(desc(employeeDocumentsTable.uploadedAt))
      .limit(10);

    res.json(docs.map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      uploadedAt: d.uploadedAt.toISOString(),
      employeeName: d.firstName ? `${d.firstName} ${d.lastName}` : "N/D",
      type: "employee_document",
    })));
  } catch (err) {
    logger.error({ err }, "Recent documents error");
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
