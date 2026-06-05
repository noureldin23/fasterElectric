import { Router } from "express";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { requireAuth, signToken, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import { logger } from "../lib/logger";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username e password richiesti" });
      return;
    }
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
    if (!admin) {
      res.status(401).json({ error: "Credenziali non valide" });
      return;
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Credenziali non valide" });
      return;
    }
    const token = signToken(admin.id, admin.username);
    await logActivity("LOGIN", "admin", admin.id, `Accesso di ${admin.username}`);
    res.json({ token, admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/auth/logout", requireAuth, async (req: AuthRequest, res) => {
  await logActivity("LOGOUT", "admin", req.adminId, `Disconnessione di ${req.adminUsername}`);
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  res.json({ id: req.adminId, username: req.adminUsername });
});

router.post("/auth/change-password", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, req.adminId!));
    if (!admin) {
      res.status(404).json({ error: "Admin non trovato" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Password attuale non corretta" });
      return;
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(adminsTable).set({ passwordHash: hash }).where(eq(adminsTable.id, admin.id));
    await logActivity("CHANGE_PASSWORD", "admin", admin.id, "Password cambiata");
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Change password error");
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
