# GrowEasy CSV Importer 🚀

An AI-powered CSV importer that intelligently extracts CRM lead information from **any valid CSV format** using Google Gemini.

## ✨ Features

- **Drag & Drop** file upload with instant validation
- **Virtualized preview table** — handles 10k+ row CSVs without lag
- **Batched AI extraction** (20 rows/batch) with exponential backoff retry
- **Progress indicator** showing real-time batch count during AI processing
- **Smart field mapping** — works with Facebook Leads, Google Ads, Excel exports, custom sheets
- **Status badge UI** with color-coded CRM statuses
- **CSV export** of extracted records
- **Dark mode** premium UI

---

## 🏗 Project Structure

```
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/import.routes.js
│   │   ├── services/
│   │   │   ├── csv.service.js    # CSV parsing
│   │   │   └── ai.service.js     # Gemini AI + batching + retry
│   │   ├── utils/
│   │   │   ├── prompt.builder.js  # AI prompt engineering
│   │   │   └── response.parser.js # Response validation
│   │   └── middleware/error.middleware.js
│   └── .env
│
└── frontend/         # Next.js 14 App Router + TypeScript
    ├── app/
    │   ├── page.tsx        # Main 4-step orchestrator
    │   └── globals.css     # Design system
    ├── components/
    │   ├── upload/DropZone.tsx
    │   ├── preview/PreviewTable.tsx (virtualized)
    │   ├── results/ResultsTable.tsx
    │   └── ui/{Stepper, ProgressBar}.tsx
    └── lib/{api.ts, types.ts}
```

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free)

### 1. Backend

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY

npm install
npm run dev     # Runs on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev     # Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/import/upload` | Upload CSV → returns preview (no AI) |
| POST | `/api/import/process` | Run AI extraction → returns CRM records |
| GET | `/api/import/fields` | Returns CRM field definitions |

### Upload request
```
POST /api/import/upload
Content-Type: multipart/form-data
Body: file (CSV file)
```

### Process request
```
POST /api/import/process
Content-Type: application/json
Body: { "headers": [...], "rows": [{...}, ...] }
```

---

## 🤖 AI Prompt Strategy

The system prompt instructs Gemini to:

1. **Semantic field matching** — `"Full Name"`, `"Contact Name"`, `"First Name + Last Name"` → `name`
2. **Status mapping** — `"Interested"` → `GOOD_LEAD_FOLLOW_UP`, `"Closed Won"` → `SALE_DONE`
3. **Phone parsing** — strips country codes, handles `+919876543210` format
4. **Multi-value handling** — extra emails/phones appended to `crm_note`
5. **Skip validation** — records with no email AND no mobile → skipped
6. **Strict enums** — only allowed values for `crm_status` and `data_source`

---

## 📋 CRM Fields Extracted

| Field | Description |
|-------|-------------|
| `created_at` | Lead creation date |
| `name` | Full name |
| `email` | Primary email |
| `country_code` | Phone country code (e.g. +91) |
| `mobile_without_country_code` | Mobile digits only |
| `company` | Company name |
| `city` / `state` / `country` | Location |
| `lead_owner` | Assigned agent |
| `crm_status` | `GOOD_LEAD_FOLLOW_UP` \| `DID_NOT_CONNECT` \| `BAD_LEAD` \| `SALE_DONE` |
| `crm_note` | Notes + extra contact info |
| `data_source` | One of 5 allowed sources |
| `possession_time` | Property timeline |
| `description` | Additional details |

---

## 🧪 Test CSVs

The importer handles varied formats:

```
# Facebook style
Full Name, Email Address, Phone Number, Campaign Name

# Google Ads style
Lead Name, Contact Email, Mobile, Ad Source, Notes

# Real Estate
Client, Email, WhatsApp, Project Interest, Status, Remarks

# Manual sheet
first_name, last_name, mail, cell, company_name, city_name
```
