/**
 * Builds the system and user prompts for CRM field extraction.
 */

const CRM_FIELDS = [
  { field: 'created_at', description: 'Lead creation date/timestamp. Convert to a format parseable by JavaScript new Date(). Look for columns like: Date, Created, Timestamp, Submission Date, Lead Date, Date Added, Created At, Time.' },
  { field: 'name', description: 'Full name of the lead. If separate first/last name columns exist, concatenate them. Look for: Name, Full Name, First Name + Last Name, Contact Name, Person, Lead Name, Client Name.' },
  { field: 'email', description: 'Primary email address. If multiple emails exist in one cell or across columns, use the first valid one. Look for: Email, Email Address, E-mail, Contact Email, Work Email, Personal Email.' },
  { field: 'country_code', description: 'Phone country code including + prefix, e.g. +91, +1, +44. Extract from phone fields if embedded. Look for: Country Code, Phone Code, Dial Code, ISD Code.' },
  { field: 'mobile_without_country_code', description: 'Mobile number digits only, without country code. If country code is embedded, strip it. Look for: Mobile, Phone, Contact Number, Phone Number, WhatsApp, Cell.' },
  { field: 'company', description: 'Company or organization name. Look for: Company, Organization, Employer, Business, Firm, Agency, Brand.' },
  { field: 'city', description: 'City of the lead. Look for: City, Town, Location, Metro.' },
  { field: 'state', description: 'State or province. Look for: State, Province, Region, District.' },
  { field: 'country', description: 'Country name. Look for: Country, Nation.' },
  { field: 'lead_owner', description: 'Email or name of the person who owns/manages this lead. Look for: Owner, Assigned To, Lead Owner, Sales Rep, Agent, Responsible.' },
  { field: 'crm_status', description: 'Lead status — MUST be one of the allowed values. Map based on meaning: qualified/interested/hot → GOOD_LEAD_FOLLOW_UP; no answer/busy/unreachable/not picked up → DID_NOT_CONNECT; not interested/wrong number/junk/unqualified → BAD_LEAD; closed/won/converted/deal done/purchased → SALE_DONE. If ambiguous, leave blank.' },
  { field: 'crm_note', description: 'Notes, remarks, comments, follow-up info. Also append: extra email addresses, extra phone numbers, any useful data that does not fit other fields. Look for: Notes, Remarks, Comments, Description, Follow Up, Additional Info.' },
  { field: 'data_source', description: 'Lead source — MUST be one of the allowed values if it matches. Map: "leads on demand" / LOD → leads_on_demand; "meridian tower" → meridian_tower; "eden park" → eden_park; "varah swamy" → varah_swamy; "sarjapur plots" / "sarjapur" → sarjapur_plots. If none match, leave blank.' },
  { field: 'possession_time', description: 'Property possession time or timeline. Look for: Possession, Possession Time, Move In Date, Timeline, When To Move.' },
  { field: 'description', description: 'Additional description or free-text information about the lead not fitting other fields. Look for: Description, About, Details, Property Details, Requirement.' },
];

const ALLOWED_CRM_STATUS = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const ALLOWED_DATA_SOURCES = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];

/**
 * Build the full extraction prompt for a batch of CSV rows.
 *
 * @param {string[]} headers - CSV column headers
 * @param {Record<string, string>[]} rows - Array of row objects
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildExtractionPrompt(headers, rows) {
  const fieldDefs = CRM_FIELDS.map(f => `  - **${f.field}**: ${f.description}`).join('\n');

  const systemPrompt = `You are a precise CRM data extraction specialist for GrowEasy CRM.
Your task: analyze CSV rows with arbitrary column names and extract data into the GrowEasy CRM schema.

## GrowEasy CRM Fields
${fieldDefs}

## Strict Rules

### crm_status (CRITICAL)
Only use EXACTLY one of these values (case-sensitive), or leave blank:
${ALLOWED_CRM_STATUS.map(s => `- ${s}`).join('\n')}
Mapping guide:
- "qualified", "interested", "hot lead", "warm", "follow up", "callback", "prospect" → GOOD_LEAD_FOLLOW_UP
- "no answer", "did not connect", "not reachable", "busy", "not picked up", "voicemail", "ringing" → DID_NOT_CONNECT
- "not interested", "junk", "wrong number", "invalid", "cold", "bad lead", "unqualified", "duplicate" → BAD_LEAD
- "closed", "won", "converted", "sale done", "deal done", "purchased", "booked", "sold" → SALE_DONE

### data_source (CRITICAL)
Only use EXACTLY one of these values, or leave blank if none match confidently:
${ALLOWED_DATA_SOURCES.map(s => `- ${s}`).join('\n')}

### Phone Numbers
- Strip country code from mobile_without_country_code
- If country code is embedded in the number (e.g. "+919876543210"), extract "+91" as country_code and "9876543210" as mobile_without_country_code
- For multiple phone numbers: put first in mobile_without_country_code, append rest to crm_note

### Emails
- For multiple emails: put first in email, append remaining to crm_note (prefix with "Additional emails: ")

### crm_note
Aggregate all useful info that doesn't fit other fields: extra phones, extra emails, remarks, comments.
Do NOT introduce literal newlines inside note values — use \\n escape instead.

### created_at
Must be a date/time string parseable by JavaScript's new Date(). Examples: "2026-05-13 14:20:48", "2026-01-15", "January 15, 2026". If not present, use empty string.

### Skip Rule
If a row has NO valid email AND NO valid mobile number, return null for that record (it will be skipped).

### name
If separate first name and last name columns exist, concatenate them with a space.

## Output Format
Return ONLY a valid JSON array. No markdown, no code fences, no explanation.
Each element is either a CRM record object (all 15 fields present, empty string if not found) or null (to skip).

Example output:
[
  {
    "created_at": "2026-05-13 14:20:48",
    "name": "John Doe",
    "email": "john@example.com",
    "country_code": "+91",
    "mobile_without_country_code": "9876543210",
    "company": "Acme Corp",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "lead_owner": "",
    "crm_status": "GOOD_LEAD_FOLLOW_UP",
    "crm_note": "",
    "data_source": "",
    "possession_time": "",
    "description": ""
  },
  null
]`;

  // Format rows as a compact JSON array for the user prompt
  const rowsJson = JSON.stringify(rows, null, 2);

  const userPrompt = `CSV Headers: ${JSON.stringify(headers)}

CSV Rows (${rows.length} records):
${rowsJson}

Extract these ${rows.length} records into GrowEasy CRM format. Return a JSON array of exactly ${rows.length} elements (CRM objects or null for skipped records).`;

  return { systemPrompt, userPrompt };
}

module.exports = { buildExtractionPrompt, CRM_FIELDS, ALLOWED_CRM_STATUS, ALLOWED_DATA_SOURCES };
