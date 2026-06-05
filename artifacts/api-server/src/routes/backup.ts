import { Router } from "express";
import path from "path";
import fs from "fs";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import { uploadsBase } from "../lib/uploads";
import { logger } from "../lib/logger";

const router = Router();

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const backupsDir = path.resolve(workspaceRoot, "artifacts/api-server/backups");

function ensureBackupsDir() {
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
}

router.post("/backup/create", requireAuth, async (req: AuthRequest, res) => {
  try {
    ensureBackupsDir();
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${ts}.json`;
    const filePath = path.resolve(backupsDir, filename);

    const info = {
      createdAt: new Date().toISOString(),
      note: "Manual backup — database is managed by Replit PostgreSQL",
      uploadsDir: uploadsBase,
    };
    fs.writeFileSync(filePath, JSON.stringify(info, null, 2));
    await logActivity("BACKUP_CREATE", "backup", undefined, `Backup creato: ${filename}`);
    res.json({ success: true, filename, createdAt: info.createdAt });
  } catch (err) {
    logger.error({ err }, "Backup create error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.get("/backup/list", requireAuth, async (_req: AuthRequest, res) => {
  try {
    ensureBackupsDir();
    const files = fs.readdirSync(backupsDir).filter((f) => f.endsWith(".json"));
    const list = files.map((f) => {
      const stat = fs.statSync(path.resolve(backupsDir, f));
      return { filename: f, createdAt: stat.mtime.toISOString(), size: stat.size };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(list);
  } catch (err) {
    logger.error({ err }, "Backup list error");
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
