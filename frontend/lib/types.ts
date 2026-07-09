// ─── CRM Record ───────────────────────────────────────────────────────────────
export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

// ─── Upload / Preview ─────────────────────────────────────────────────────────
export interface PreviewData {
  filename: string;
  fileSize: number;
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

// ─── Process Result ───────────────────────────────────────────────────────────
export interface ImportResult {
  imported: CRMRecord[];
  skipped: number;
  totalProcessed: number;
  totalImported: number;
  totalSkipped: number;
  batchErrors: string[];
}

// ─── API Wrapper ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── App Steps ────────────────────────────────────────────────────────────────
export type AppStep = 'upload' | 'preview' | 'processing' | 'results';

export const CRM_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  GOOD_LEAD_FOLLOW_UP: { label: 'Follow Up',      cls: 'badge-success' },
  DID_NOT_CONNECT:     { label: 'No Connect',      cls: 'badge-warning' },
  BAD_LEAD:            { label: 'Bad Lead',         cls: 'badge-danger'  },
  SALE_DONE:           { label: 'Sale Done',        cls: 'badge-info'    },
};
