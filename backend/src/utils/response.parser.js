const { ALLOWED_CRM_STATUS, ALLOWED_DATA_SOURCES } = require('./prompt.builder');

const REQUIRED_FIELDS = [
  'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
  'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
  'crm_note', 'data_source', 'possession_time', 'description',
];

/**
 * Parse and validate AI response text into an array of CRM records.
 *
 * @param {string} responseText - Raw text from the AI model
 * @param {number} expectedCount - Number of rows submitted
 * @returns {{ records: (CRMRecord|null)[], parseErrors: string[] }}
 */
function parseAIResponse(responseText, expectedCount) {
  const parseErrors = [];
  let parsed;

  // Strip markdown code fences if the model ignored instructions
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

  // Extract JSON array from response
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    parseErrors.push('AI response did not contain a JSON array.');
    return { records: new Array(expectedCount).fill(null), parseErrors };
  }

  try {
    parsed = JSON.parse(arrayMatch[0]);
  } catch (e) {
    parseErrors.push(`JSON parse error: ${e.message}`);
    return { records: new Array(expectedCount).fill(null), parseErrors };
  }

  if (!Array.isArray(parsed)) {
    parseErrors.push('AI response is not a JSON array.');
    return { records: new Array(expectedCount).fill(null), parseErrors };
  }

  // Validate and sanitize each record
  const records = parsed.map((item, idx) => {
    if (item === null || item === undefined) return null;

    if (typeof item !== 'object') {
      parseErrors.push(`Record ${idx}: not an object, skipping.`);
      return null;
    }

    const record = {};

    // Ensure all required fields exist
    for (const field of REQUIRED_FIELDS) {
      record[field] = typeof item[field] === 'string' ? item[field].trim() : '';
    }

    // Validate crm_status
    if (record.crm_status && !ALLOWED_CRM_STATUS.includes(record.crm_status)) {
      parseErrors.push(`Record ${idx}: invalid crm_status "${record.crm_status}", clearing.`);
      record.crm_status = '';
    }

    // Validate data_source
    if (record.data_source && !ALLOWED_DATA_SOURCES.includes(record.data_source)) {
      parseErrors.push(`Record ${idx}: invalid data_source "${record.data_source}", clearing.`);
      record.data_source = '';
    }

    // Apply skip rule: must have email OR mobile
    const hasEmail = record.email && record.email.includes('@');
    const hasMobile = record.mobile_without_country_code && record.mobile_without_country_code.length >= 5;
    if (!hasEmail && !hasMobile) {
      return null;
    }

    return record;
  });

  return { records, parseErrors };
}

module.exports = { parseAIResponse, REQUIRED_FIELDS };
