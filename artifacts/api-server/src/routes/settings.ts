import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../lib/activity";
import { createUpload, fileToUrl } from "../lib/uploads";
import { logger } from "../lib/logger";

const router = Router();
const upload = createUpload("settings");

async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(settingsTable).values({ siteName: "Faster Manager" }).returning();
  return created;
}

router.get("/settings", requireAuth, async (_req: AuthRequest, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ id: settings.id, siteName: settings.siteName, logoUrl: settings.logoUrl });
  } catch (err) {
    logger.error({ err }, "Get settings error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.patch("/settings", requireAuth, async (req: AuthRequest, res) => {
  try {
    const settings = await getOrCreateSettings();
    const { siteName } = req.body;
    const [updated] = await db
      .update(settingsTable)
      .set({ ...(siteName && { siteName }) })
      .where(eq(settingsTable.id, settings.id))
      .returning();
    await logActivity("UPDATE_SETTINGS", "settings", settings.id, "Impostazioni aggiornate");
    res.json({ id: updated.id, siteName: updated.siteName, logoUrl: updated.logoUrl });
  } catch (err) {
    logger.error({ err }, "Update settings error");
    res.status(500).json({ error: "Errore interno" });
  }
});

router.post("/settings/logo", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "File richiesto" });
      return;
    }
    const settings = await getOrCreateSettings();
    const logoUrl = fileToUrl(req.file.path);
    const [updated] = await db
      .update(settingsTable)
      .set({ logoUrl })
      .where(eq(settingsTable.id, settings.id))
      .returning();
    await logActivity("UPLOAD_LOGO", "settings", settings.id, "Logo aggiornato");
    res.json({ id: updated.id, siteName: updated.siteName, logoUrl: updated.logoUrl });
  } catch (err) {
    logger.error({ err }, "Upload logo error");
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
