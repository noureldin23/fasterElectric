import { db } from "@workspace/db";
import { activitiesTable } from "@workspace/db";
import { logger } from "./logger";

export async function logActivity(
  action: string,
  entity: string,
  entityId?: number,
  details?: string
) {
  try {
    await db.insert(activitiesTable).values({ action, entity, entityId, details });
  } catch (err) {
    logger.error({ err }, "Failed to log activity");
  }
}
