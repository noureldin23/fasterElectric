import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const cudsTable = pgTable("cuds", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCudSchema = createInsertSchema(cudsTable).omit({ id: true, uploadedAt: true });
export type InsertCud = z.infer<typeof insertCudSchema>;
export type Cud = typeof cudsTable.$inferSelect;
