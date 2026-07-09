'use client';
import { useState } from 'react';
import { CRMRecord, ImportResult, CRM_STATUS_MAP } from '@/lib/types';
import styles from './ResultsTable.module.css';

const CRM_COLS: { key: keyof CRMRecord; label: string }[] = [
  { key: 'name',                        label: 'Name' },
  { key: 'email',                       label: 'Email' },
  { key: 'country_code',                label: 'CC' },
  { key: 'mobile_without_country_code', label: 'Mobile' },
  { key: 'company',                     label: 'Company' },
  { key: 'city',                        label: 'City' },
  { key: 'state',                       label: 'State' },
  { key: 'country',                     label: 'Country' },
  { key: 'crm_status',                  label: 'Status' },
  { key: 'data_source',                 label: 'Source' },
  { key: 'lead_owner',                  label: 'Owner' },
  { key: 'created_at',                  label: 'Created At' },
  { key: 'crm_note',                    label: 'Notes' },
  { key: 'possession_time',             label: 'Possession' },
  { key: 'description',                 label: 'Description' },
];

interface Props { result: ImportResult; onReset: () => void; }

export default function ResultsTable({ result, onReset }: Props) {
  const [tab, setTab] = useState<'imported' | 'errors'>('imported');
  const { imported, totalImported, totalSkipped, totalProcessed, batchErrors } = result;

  const downloadCSV = () => {
    const headers = CRM_COLS.map(c => c.key).join(',');
    const rows = imported.map(r =>
      CRM_COLS.map(c => {
        const v = r[c.key] || '';
        return v.includes(',') || v.includes('"') || v.includes('\n')
          ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'groweasy_crm_import.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.wrapper + ' fade-up'}>
      {/* Summary bar */}
      <div className={styles.summary}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{totalProcessed}</span>
          <span className={styles.statLabel}>Total Rows</span>
        </div>
        <div className={`${styles.stat} ${styles.statSuccess}`}>
          <span className={styles.statValue}>{totalImported}</span>
          <span className={styles.statLabel}>Imported</span>
        </div>
        <div className={`${styles.stat} ${styles.statWarn}`}>
          <span className={styles.statValue}>{totalSkipped}</span>
          <span className={styles.statLabel}>Skipped</span>
        </div>
        {batchErrors.length > 0 && (
          <div className={`${styles.stat} ${styles.statDanger}`}>
            <span className={styles.statValue}>{batchErrors.length}</span>
            <span className={styles.statLabel}>Batch Errors</span>
          </div>
        )}
      </div>

      {/* Tabs + actions */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'imported' ? styles.tabActive : ''}`}
            onClick={() => setTab('imported')}
          >
            ✓ Imported ({totalImported})
          </button>
          {batchErrors.length > 0 && (
            <button
              className={`${styles.tab} ${tab === 'errors' ? styles.tabActive : ''}`}
              onClick={() => setTab('errors')}
            >
              ⚠ Errors ({batchErrors.length})
            </button>
          )}
        </div>
        <div className={styles.actions}>
          <button className="btn btn-secondary btn-sm" onClick={onReset}>← New Import</button>
          {imported.length > 0 && (
            <button className="btn btn-primary btn-sm" onClick={downloadCSV}>↓ Export CSV</button>
          )}
        </div>
      </div>

      {tab === 'imported' ? (
        imported.length === 0 ? (
          <div className="alert alert-info" style={{ marginTop: 16 }}>
            No records were imported. All rows were skipped (missing email and mobile number).
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  {CRM_COLS.map(c => <th key={c.key}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {imported.map((rec, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                    {CRM_COLS.map(c => (
                      <td key={c.key} title={rec[c.key]}>
                        {c.key === 'crm_status' && rec.crm_status ? (
                          <span className={`badge ${CRM_STATUS_MAP[rec.crm_status]?.cls || 'badge-muted'}`}>
                            {CRM_STATUS_MAP[rec.crm_status]?.label || rec.crm_status}
                          </span>
                        ) : c.key === 'data_source' && rec.data_source ? (
                          <span className="badge badge-purple">{rec.data_source.replace(/_/g, ' ')}</span>
                        ) : rec[c.key] ? (
                          <span>{rec[c.key]}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className={styles.errorList}>
          {batchErrors.map((e, i) => (
            <div key={i} className="alert alert-error" style={{ marginTop: 8 }}>
              <span>⚠</span> {e}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
