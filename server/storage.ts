import { 
  users, 
  batches, 
  omrSheets, 
  feedbackQuestions, 
  omrTemplates, 
  systemSettings,
  type User, 
  type InsertUser,
  type Batch,
  type InsertBatch,
  type OmrSheet,
  type InsertOmrSheet,
  type OmrTemplate,
  type InsertOmrTemplate,
  type SystemSetting,
  type InsertSystemSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Batch methods
  createBatch(batch: InsertBatch): Promise<Batch>;
  getBatch(id: string): Promise<Batch | undefined>;
  getBatchByCode(batchCode: string): Promise<Batch | undefined>;
  getAllBatches(): Promise<Batch[]>;
  updateBatch(id: string, updates: Partial<Batch>): Promise<Batch | undefined>;

  // OMR Sheet methods
  createOmrSheet(omrSheet: InsertOmrSheet): Promise<OmrSheet>;
  getOmrSheet(id: string): Promise<OmrSheet | undefined>;
  getOmrSheetsByBatch(batchId: string): Promise<OmrSheet[]>;
  updateOmrSheet(id: string, updates: Partial<OmrSheet>): Promise<OmrSheet | undefined>;

  // Template methods
  getActiveTemplate(): Promise<OmrTemplate | undefined>;
  getAllTemplates(): Promise<OmrTemplate[]>;
  createTemplate(template: InsertOmrTemplate): Promise<OmrTemplate>;

  // System settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;

  // Analytics
  getSystemStats(): Promise<{
    totalSheets: number;
    processedSheets: number;
    averageScore: number;
    processingRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createBatch(insertBatch: InsertBatch): Promise<Batch> {
    const [batch] = await db
      .insert(batches)
      .values(insertBatch)
      .returning();
    return batch;
  }

  async getBatch(id: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch || undefined;
  }

  async getBatchByCode(batchCode: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.batchCode, batchCode));
    return batch || undefined;
  }

  async getAllBatches(): Promise<Batch[]> {
    return await db.select().from(batches).orderBy(desc(batches.createdAt));
  }

  async updateBatch(id: string, updates: Partial<Batch>): Promise<Batch | undefined> {
    const [batch] = await db
      .update(batches)
      .set({ ...updates, completedAt: updates.status === 'completed' ? new Date() : undefined })
      .where(eq(batches.id, id))
      .returning();
    return batch || undefined;
  }

  async createOmrSheet(insertOmrSheet: InsertOmrSheet): Promise<OmrSheet> {
    const [omrSheet] = await db
      .insert(omrSheets)
      .values(insertOmrSheet)
      .returning();
    return omrSheet;
  }

  async getOmrSheet(id: string): Promise<OmrSheet | undefined> {
    const [omrSheet] = await db.select().from(omrSheets).where(eq(omrSheets.id, id));
    return omrSheet || undefined;
  }

  async getOmrSheetsByBatch(batchId: string): Promise<OmrSheet[]> {
    return await db.select().from(omrSheets).where(eq(omrSheets.batchId, batchId));
  }

  async updateOmrSheet(id: string, updates: Partial<OmrSheet>): Promise<OmrSheet | undefined> {
    const [omrSheet] = await db
      .update(omrSheets)
      .set({ ...updates, processedAt: updates.status === 'processed' ? new Date() : undefined })
      .where(eq(omrSheets.id, id))
      .returning();
    return omrSheet || undefined;
  }

  async getActiveTemplate(): Promise<OmrTemplate | undefined> {
    const [template] = await db
      .select()
      .from(omrTemplates)
      .where(eq(omrTemplates.isActive, true))
      .orderBy(desc(omrTemplates.createdAt));
    return template || undefined;
  }

  async getAllTemplates(): Promise<OmrTemplate[]> {
    return await db.select().from(omrTemplates).orderBy(desc(omrTemplates.createdAt));
  }

  async createTemplate(insertTemplate: InsertOmrTemplate): Promise<OmrTemplate> {
    const [template] = await db
      .insert(omrTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async setSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values(insertSetting)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: insertSetting.value, updatedAt: new Date() }
      })
      .returning();
    return setting;
  }

  async getSystemStats(): Promise<{
    totalSheets: number;
    processedSheets: number;
    averageScore: number;
    processingRate: number;
  }> {
    const [totalStats] = await db
      .select({
        totalSheets: count(),
        processedSheets: sql<number>`count(*) filter (where status = 'processed')`,
        averageScore: sql<number>`avg(overall_score)`,
      })
      .from(omrSheets);

    const processingRate = totalStats.totalSheets > 0 
      ? (totalStats.processedSheets / totalStats.totalSheets) * 100 
      : 0;

    return {
      totalSheets: totalStats.totalSheets || 0,
      processedSheets: totalStats.processedSheets || 0,
      averageScore: Number(totalStats.averageScore) || 0,
      processingRate: Math.round(processingRate * 100) / 100,
    };
  }
}

export const storage = new DatabaseStorage();
