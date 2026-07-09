const express = require('express');
const multer = require('multer');
const { parseCSV } = require('../services/csv.service');
const { extractCRMRecords } = require('../services/ai.service');
const { AppError } = require('../middleware/error.middleware');

const router = express.Router();

// Configure multer — memory storage, max 10MB, CSV only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain', 'text/comma-separated-values'];
    const ext = file.originalname.toLowerCase().endsWith('.csv');
    if (ext || allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only CSV files are allowed.', 400));
    }
  },
});

/**
 * POST /api/import/upload
 * Accepts a CSV file, parses it, returns headers + preview rows.
 * No AI processing at this stage.
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded. Please upload a CSV file.', 400);
    }

    console.log(`\n📁 Received file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    const { headers, rows, totalRows } = await parseCSV(req.file.buffer);

    console.log(`   Parsed: ${totalRows} rows, ${headers.length} columns`);

    res.json({
      success: true,
      data: {
        filename: req.file.originalname,
        fileSize: req.file.size,
        headers,
        rows,
        totalRows,
      },
    });

  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/import/process
 * Accepts pre-parsed headers + rows, runs AI extraction, returns CRM records.
 * Body: { headers: string[], rows: Record<string, string>[] }
 */
router.post('/process', async (req, res, next) => {
  try {
    const { headers, rows } = req.body;

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      throw new AppError('Invalid request: headers array is required.', 400);
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw new AppError('Invalid request: rows array is required and must not be empty.', 400);
    }

    if (rows.length > 5000) {
      throw new AppError('Too many rows. Maximum 5000 rows per import.', 400);
    }

    console.log(`\n🤖 Starting AI extraction for ${rows.length} rows...`);

    const result = await extractCRMRecords(headers, rows);

    res.json({
      success: true,
      data: {
        imported: result.imported,
        skipped: result.skipped,
        totalProcessed: result.totalProcessed,
        totalImported: result.imported.length,
        totalSkipped: result.skipped,
        batchErrors: result.batchErrors,
      },
    });

  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/import/process-stream
 * Streams AI extraction progress via Server-Sent Events (SSE).
 * Uses fetch on the client to read the stream.
 */
router.post('/process-stream', async (req, res, next) => {
  try {
    const { headers, rows } = req.body;

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid request: headers array is required.' });
    }
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid request: rows array is required.' });
    }
    if (rows.length > 5000) {
      return res.status(400).json({ success: false, error: 'Too many rows. Maximum 5000 rows per import.' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush headers immediately

    console.log(`\n🤖 Starting Streaming AI extraction for ${rows.length} rows...`);

    const result = await extractCRMRecords(headers, rows, (batchIndex, totalBatches, batchData) => {
      // Send progress chunk
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        current: batchIndex,
        total: totalBatches,
        newImported: batchData.newImported,
        newSkipped: batchData.newSkipped,
        newErrors: batchData.newErrors,
      })}\n\n`);
    });

    // Send final complete chunk
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      summary: {
        imported: result.imported,
        skipped: result.skipped,
        totalProcessed: result.totalProcessed,
        totalImported: result.imported.length,
        totalSkipped: result.skipped,
        batchErrors: result.batchErrors,
      }
    })}\n\n`);

    res.end();

  } catch (err) {
    // If headers already sent, we just end the stream with an error event
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }
});

/**
 * GET /api/import/fields
 * Returns the GrowEasy CRM field definitions (useful for frontend reference).
 */
router.get('/fields', (req, res) => {
  const { CRM_FIELDS } = require('../utils/prompt.builder');
  res.json({ success: true, data: { fields: CRM_FIELDS } });
});

module.exports = router;
