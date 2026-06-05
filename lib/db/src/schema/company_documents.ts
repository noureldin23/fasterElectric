import { pgTable, serial, text, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companyDocumentsTable = pgTable("company_documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  notes: text("notes"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCompanyDocumentSchema = createInsertSchema(companyDocumentsTable).omit({ id: true, uploadedAt: true });
export type InsertCompanyDocument = z.infer<typeof insertCompanyDocumentSchema>;
export type CompanyDocument = typeof companyDocumentsTable.$inferSelect;
