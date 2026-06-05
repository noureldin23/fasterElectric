import { Router } from "express";
import { db } from "@workspace/db";
import { employeeDocumentsTable, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

const MONITORED = ["Contratto", "Permesso di soggiorno", "Patente", "Corso sicurezza", "Visita medica", "Certificazione", "Attestato"];

router.get("/expirations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query as { status?: string };
    const today = new Date().toISOString().split("T")[0];
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const docs = await db
      .select({
        id: employeeDocumentsTable.id,
        employeeId: employeeDocumentsTable.employeeId,
        name: employeeDocumentsTable.name,
        category: employeeDocumentsTable.category,
        endDate: employeeDocumentsTable.endDate,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
      })
      .from(employeeDocumentsTable)
      .leftJoin(employeesTable, eq(employeeDocumentsTable.employeeId, employeesTable.id));

    const monitored = docs.filter((d) => MONITORED.includes(d.category) && d.endDate);

    const result = monitored.map((d) => {
      let docStatus: "expired" | "expiring-soon" | "valid";
      let daysLeft: number | null = null;

      if (d.endDate! < today) {
        docStatus = "expired";
        daysLeft = Math.floor((new Date(d.endDate!).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      } else if (d.endDate! <= in30) {
        docStatus = "expiring-soon";
        daysLeft = Math.floor((new Date(d.endDate!).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      } else {
        docStatus = "valid";
      }

      return {
        id: d.id,
        employeeId: d.employeeId,
        employeeName: d.firstName ? `${d.firstName} ${d.lastName}` : "N/D",
        documentName: d.name,
        category: d.category,
        endDate: d.endDate!,
        status: docStatus,
        daysLeft,
      };
    });

    const filtered = status && status !== "all"
      ? result.filter((r) => r.status === status)
      : result;

    filtered.sort((a, b) => {
      const order = { expired: 0, "expiring-soon": 1, valid: 2 };
      return (order[a.status] - order[b.status]) || a.endDate.localeCompare(b.endDate);
    });

    res.json(filtered);
  } catch (err) {
    logger.error({ err }, "Expirations error");
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
