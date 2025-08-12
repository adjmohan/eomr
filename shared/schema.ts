import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json, boolean, numeric, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // user, admin, teacher
  createdAt: timestamp("created_at").defaultNow(),
});

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  batchCode: text("batch_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  totalSheets: integer("total_sheets").default(0),
  processedSheets: integer("processed_sheets").default(0),
  averageScore: numeric("average_score", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const omrSheets = pgTable("omr_sheets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: uuid("batch_id").notNull().references(() => batches.id),
  studentId: text("student_id").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  status: text("status").notNull().default("pending"), // pending, processed, failed, review_needed
  overallScore: numeric("overall_score", { precision: 3, scale: 2 }),
  confidence: numeric("confidence", { precision: 5, scale: 4 }),
  processingTime: integer("processing_time"), // in milliseconds
  responses: json("responses"), // Array of question responses
  metadata: json("metadata"), // Additional processing metadata
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const feedbackQuestions = pgTable("feedback_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: uuid("template_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // rating, multiple_choice, yes_no
  order: integer("order").notNull(),
  maxScore: integer("max_score").default(5),
  isRequired: boolean("is_required").default(true),
});

export const omrTemplates = pgTable("omr_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: text("version").notNull(),
  isActive: boolean("is_active").default(true),
  configuration: json("configuration"), // Template configuration for OMR detection
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  batches: many(batches),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [batches.createdBy],
    references: [users.id],
  }),
  omrSheets: many(omrSheets),
}));

export const omrSheetsRelations = relations(omrSheets, ({ one }) => ({
  batch: one(batches, {
    fields: [omrSheets.batchId],
    references: [batches.id],
  }),
}));

export const feedbackQuestionsRelations = relations(feedbackQuestions, ({ one }) => ({
  template: one(omrTemplates, {
    fields: [feedbackQuestions.templateId],
    references: [omrTemplates.id],
  }),
}));

export const omrTemplatesRelations = relations(omrTemplates, ({ many }) => ({
  questions: many(feedbackQuestions),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertOmrSheetSchema = createInsertSchema(omrSheets).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertFeedbackQuestionSchema = createInsertSchema(feedbackQuestions).omit({
  id: true,
});

export const insertOmrTemplateSchema = createInsertSchema(omrTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type OmrSheet = typeof omrSheets.$inferSelect;
export type InsertOmrSheet = z.infer<typeof insertOmrSheetSchema>;

export type FeedbackQuestion = typeof feedbackQuestions.$inferSelect;
export type InsertFeedbackQuestion = z.infer<typeof insertFeedbackQuestionSchema>;

export type OmrTemplate = typeof omrTemplates.$inferSelect;
export type InsertOmrTemplate = z.infer<typeof insertOmrTemplateSchema>;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
