import { Router } from "express";
import { db } from "@workspace/db";
import { employeesTable, employeeDocumentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/search", requireAuth, async (req: AuthRequest, res) => {
  try {
    const q = ((req.query.q as string) || "").toLowerCase().trim();
    if (!q) {
      res.json({ employees: [], documents: [] });
      return;
    }

    const [allEmployees, allDocs] = await Promise.all([
      db.select().from(employeesTable),
      db.select().from(employeeDocumentsTable),
    ]);

    const employees = allEmployees.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        (e.fiscalCode || "").toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        (e.phone || "").includes(q) ||
        (e.email || "").toLowerCase().includes(q)
    );

    const docs = allDocs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );

    const empMap = new Map(allEmployees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));

    res.json({
      employees: employees.slice(0, 20).map((e) => ({
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
      })),
      documents: docs.slice(0, 20).map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        employeeId: d.employeeId,
        employeeName: empMap.get(d.employeeId) || "N/D",
        type: "employee_document",
      })),
    });
  } catch (err) {
    logger.error({ err }, "Search error");
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
