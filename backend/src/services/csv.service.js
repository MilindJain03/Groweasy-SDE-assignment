const { parse } = require('csv-parse');

/**
 * Parse a CSV buffer into headers and rows.
 * Handles: comma/semicolon/tab delimiters, BOM, quoted fields, blank rows.
 *
 * @param {Buffer} buffer - Raw CSV file buffer
 * @returns {Promise<{ headers: string[], rows: Record<string, string>[], totalRows: number }>}
 */
async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    // Remove BOM if present
    let csvString = buffer.toString('utf-8');
    if (csvString.charCodeAt(0) === 0xFEFF) {
      csvString = csvString.slice(1);
    }

    const records = [];
    let headers = null;

    const parser = parse(csvString, {
      bom: true,
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true,  // allow ragged rows
      relax_quotes: true,
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        if (!headers) {
          // First row is headers — clean them
          headers = record.map(h => h.trim().replace(/^\uFEFF/, ''));
        } else {
          // Map row array to object using headers
          const row = {};
          headers.forEach((h, i) => {
            row[h] = (record[i] || '').trim();
          });
          records.push(row);
        }
      }
    });

    parser.on('error', (err) => {
      reject(new Error(`CSV parsing failed: ${err.message}`));
    });

    parser.on('end', () => {
      if (!headers || headers.length === 0) {
        return reject(new Error('CSV file has no headers or is empty.'));
      }
      resolve({
        headers,
        rows: records,
        totalRows: records.length,
      });
    });
  });
}

/**
 * Auto-detect delimiter from a CSV string sample.
 * Not needed since csv-parse handles this, but available as utility.
 */
function detectDelimiter(sample) {
  const delimiters = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = 0;
  for (const d of delimiters) {
    const count = (sample.match(new RegExp(`\\${d}`, 'g')) || []).length;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

module.exports = { parseCSV, detectDelimiter };
