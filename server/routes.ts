import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { z } from "zod";
import type { OmrSheet } from "@shared/schema";
import { ProcessFile } from "multer";
import { insertBatchSchema, insertOmrSheetSchema } from "@shared/schema";
import { processOMRImage } from "./lib/omr-processor";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all batches
  app.get("/api/batches", async (req, res) => {
    try {
      const batches = await storage.getAllBatches();
      res.json(batches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      res.status(500).json({ message: "Failed to fetch batches" });
    }
  });

  // Create new batch
  app.post("/api/batches", async (req, res) => {
    try {
      const batchData = insertBatchSchema.parse({
        ...req.body,
        status: "processing",
        processedSheets: 0,
      });

      // Get admin user for created_by field
      const adminUser = await storage.getUserByUsername('admin');
      if (!adminUser) {
        return res.status(500).json({ message: "Admin user not found" });
      }

      const batch = await storage.createBatch({
        ...batchData,
        createdBy: adminUser.id,
      });

      res.status(201).json(batch);
    } catch (error) {
      console.error('Error creating batch:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid batch data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create batch" });
    }
  });

  // Get batch by code
  app.get("/api/batches/:batchCode", async (req, res) => {
    try {
      const { batchCode } = req.params;
      const batch = await storage.getBatchByCode(batchCode);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }

      const sheets = await storage.getOmrSheetsByBatch(batch.id);
      
      // Calculate batch statistics
      const processedSheets = sheets.filter(sheet => sheet.status === 'processed');
      const averageScore = processedSheets.length > 0
        ? processedSheets.reduce((sum, sheet) => sum + (Number(sheet.overallScore) || 0), 0) / processedSheets.length
        : 0;

      res.json({
        ...batch,
        totalProcessed: processedSheets.length,
        needsReview: sheets.filter(sheet => sheet.status === 'review_needed').length,
        averageScore: Math.round(averageScore * 100) / 100,
        sheets,
      });
    } catch (error) {
      console.error('Error fetching batch:', error);
      res.status(500).json({ message: "Failed to fetch batch" });
    }
  });

  // Upload OMR sheets
  app.post("/api/upload/:batchCode", upload.array('files'), async (req: Request & { files?: Express.Multer.File[] }, res) => {
    try {
      const { batchCode } = req.params;
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      let batch = await storage.getBatchByCode(batchCode);
      
      if (!batch) {
        // Get admin user for created_by field
        const adminUser = await storage.getUserByUsername('admin');
        if (!adminUser) {
          return res.status(500).json({ message: "Admin user not found" });
        }

        // Create new batch if it doesn't exist
        batch = await storage.createBatch({
          batchCode,
          name: `Batch ${batchCode}`,
          description: `Auto-created batch for upload ${batchCode}`,
          createdBy: adminUser.id,
          totalSheets: files.length,
          status: "processing",
          processedSheets: 0,
        });
      }

      const uploadedSheets = [];

      for (const file of files) {
        const studentId = path.parse(file.originalname).name; // Use filename as student ID
        const timestamp = Date.now();
        const filePath = path.join(process.cwd(), 'uploads', `${timestamp}_${file.originalname}`);
        
        const omrSheet = await storage.createOmrSheet({
          batchId: batch.id,
          studentId,
          fileName: file.originalname,
          filePath,
          status: 'pending',
          processingTime: 0,
          responses: {},
          metadata: {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size
          }

        uploadedSheets.push(omrSheet);

        // Start processing asynchronously
        processOMRImage(omrSheet.id, file.path).catch(error => {
          console.error(`Error processing OMR sheet ${omrSheet.id}:`, error);
        });
      }

      res.status(201).json({
        message: "Files uploaded successfully",
        batch,
        sheets: uploadedSheets,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Get processing status
  app.get("/api/processing-status/:batchCode", async (req, res) => {
    try {
      const { batchCode } = req.params;
      const batch = await storage.getBatchByCode(batchCode);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }

      const sheets = await storage.getOmrSheetsByBatch(batch.id);
      
      const statusCounts = sheets.reduce((acc, sheet) => {
        acc[sheet.status] = (acc[sheet.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        batchCode,
        totalSheets: sheets.length,
        statusCounts,
        isComplete: statusCounts.pending === 0,
      });
    } catch (error) {
      console.error('Error fetching processing status:', error);
      res.status(500).json({ message: "Failed to fetch processing status" });
    }
  });

  // Get results for a batch
  app.get("/api/results/:batchCode", async (req, res) => {
    try {
      const { batchCode } = req.params;
      const batch = await storage.getBatchByCode(batchCode);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }

      const sheets = await storage.getOmrSheetsByBatch(batch.id);
      
      // Calculate statistics
      const processedSheets = sheets.filter(sheet => sheet.status === 'processed');
      const averageScore = processedSheets.length > 0 
        ? processedSheets.reduce((sum, sheet) => sum + (Number(sheet.overallScore) || 0), 0) / processedSheets.length
        : 0;

      res.json({
        batchCode,
        totalSheets: sheets.length,
        processedSheets: processedSheets.length,
        needsReview: sheets.filter(sheet => sheet.status === 'review_needed').length,
        averageScore: Math.round(averageScore * 100) / 100,
        sheets: sheets.map(sheet => ({
          id: sheet.id,
          studentId: sheet.studentId,
          fileName: sheet.fileName,
          status: sheet.status,
          overallScore: Number(sheet.overallScore) || 0,
          confidence: Number(sheet.confidence) || 0,
          responses: sheet.responses || {},
          processedAt: sheet.processedAt,
        })),
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  // Get system statistics for dashboard
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Update OMR sheet status (for manual review)
  app.patch("/api/sheets/:sheetId", async (req, res) => {
    try {
      const { sheetId } = req.params;
      const updates = req.body;
      
      const updatedSheet = await storage.updateOmrSheet(sheetId, updates);
      
      if (!updatedSheet) {
        return res.status(404).json({ message: "OMR sheet not found" });
      }

      res.json(updatedSheet);
    } catch (error) {
      console.error('Error updating OMR sheet:', error);
      res.status(500).json({ message: "Failed to update OMR sheet" });
    }
  });

  // Export results as Excel
  app.get("/api/export/excel/:batchCode", async (req, res) => {
    try {
      const { batchCode } = req.params;
      const batch = await storage.getBatchByCode(batchCode);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }

      const sheets = await storage.getOmrSheetsByBatch(batch.id);
      
      // Create CSV content
      const csvHeader = "Student ID,File Name,Status,Overall Score,Confidence,Processed At\n";
      const csvRows = sheets.map(sheet => 
        `${sheet.studentId},${sheet.fileName},${sheet.status},${sheet.overallScore || ''},${sheet.confidence || ''},${sheet.processedAt || ''}`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${batchCode}_results.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting results:', error);
      res.status(500).json({ message: "Failed to export results" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      await storage.getSystemStats();
      res.json({ 
        status: "healthy", 
        database: "connected",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({ 
        status: "unhealthy", 
        database: "disconnected",
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
  