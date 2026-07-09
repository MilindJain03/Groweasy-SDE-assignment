const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildExtractionPrompt } = require('../utils/prompt.builder');
const { parseAIResponse } = require('../utils/response.parser');

const BATCH_SIZE = 20;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let genAI = null;
let model = null;

const MODELS_TO_TRY = [
  'gemini-2.5-flash',       // Best: latest flash, fast + capable
  'gemini-flash-latest',    // Alias for latest flash
  'gemini-2.0-flash',       // Stable 2.0 flash
  'gemini-2.0-flash-lite',  // Lightweight fallback
];

function getModel(modelName) {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in backend/.env');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      topP: 0.95,
    },
  });
}

/**
 * Sleep utility for retry backoff.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process a single batch with retry logic.
 *
 * @param {string[]} headers
 * @param {Record<string, string>[]} batchRows
 * @param {number} batchIndex
 * @param {number} totalBatches
 * @returns {Promise<{ records: (CRMRecord|null)[], errors: string[] }>}
 */
async function processBatchWithRetry(headers, batchRows, batchIndex, totalBatches) {
  const { systemPrompt, userPrompt } = buildExtractionPrompt(headers, batchRows);
  
  let lastError = null;

  // Try each model in sequence
  for (const modelName of MODELS_TO_TRY) {
    console.log(`  Batch ${batchIndex + 1}/${totalBatches} — trying model: ${modelName}`);
    const m = getModel(modelName);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await m.generateContent([
          { text: systemPrompt },
          { text: userPrompt },
        ]);

        const responseText = result.response.text();
        const { records, parseErrors } = parseAIResponse(responseText, batchRows.length);

        if (parseErrors.length > 0) {
          console.warn(`  Batch ${batchIndex + 1} parse warnings:`, parseErrors);
        }

        return { records, errors: parseErrors };

      } catch (err) {
        lastError = err;
        console.error(`  Batch ${batchIndex + 1} attempt ${attempt} with ${modelName} failed:`, err.message);

        // If it's a 404 (model not found), break out of the retry loop and try the next model
        if (err.message && err.message.includes('404 Not Found')) {
          console.log(`  Model ${modelName} not found, skipping to next model...`);
          break; // move to next modelName
        }

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`  Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }
  }

  // All models and retries exhausted
  console.error(`  Batch ${batchIndex + 1} failed after trying all models.`);
  return {
    records: new Array(batchRows.length).fill(null),
    errors: [`Batch ${batchIndex + 1} failed: ${lastError?.message || 'Unknown error'}`],
  };
}

/**
 * Extract CRM records from all rows using batched AI processing.
 *
 * @param {string[]} headers
 * @param {Record<string, string>[]} rows
 * @param {function} onBatchComplete - Callback(batchIndex, totalBatches) for progress tracking
 * @returns {Promise<{
 *   imported: CRMRecord[],
 *   skipped: number,
 *   totalProcessed: number,
 *   batchErrors: string[]
 * }>}
 */
async function extractCRMRecords(headers, rows, onBatchComplete = null) {
  const batches = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }

  const totalBatches = batches.length;
  console.log(`\n📦 Processing ${rows.length} rows in ${totalBatches} batch(es) of ${BATCH_SIZE}...`);

  const imported = [];
  const allBatchErrors = [];
  let skipped = 0;

  for (let i = 0; i < batches.length; i++) {
    let newSkipped = 0;
    const newImported = [];
    const { records, errors } = await processBatchWithRetry(headers, batches[i], i, totalBatches);

    allBatchErrors.push(...errors);

    for (const record of records) {
      if (record === null) {
        newSkipped++;
        skipped++;
      } else {
        newImported.push(record);
        imported.push(record);
      }
    }

    if (onBatchComplete) {
      onBatchComplete(i + 1, totalBatches, {
        newImported,
        newSkipped,
        newErrors: errors,
      });
    }
  }

  console.log(`\n✅ Extraction complete: ${imported.length} imported, ${skipped} skipped`);

  return {
    imported,
    skipped,
    totalProcessed: rows.length,
    batchErrors: allBatchErrors,
  };
}

module.exports = { extractCRMRecords, BATCH_SIZE };
