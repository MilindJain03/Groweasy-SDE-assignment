'use client';
import { useCallback, useState } from 'react';
import styles from './DropZone.module.css';

interface Props {
  onFile: (file: File) => void;
  loading?: boolean;
}

export default function DropZone({ onFile, loading }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const validate = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv') && file.type !== 'text/plain') {
      setError('Please upload a valid CSV file.');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validate(file)) onFile(file);
  }, [onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className={styles.wrapper}>
      <label
        className={`${styles.zone} ${dragging ? styles.dragging : ''} ${loading ? styles.disabled : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        htmlFor="csv-upload"
      >
        <div className={styles.icon}>
          {loading ? (
            <div className={styles.spinner} />
          ) : (
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3"/>
              <path d="M24 32V20M24 20L19 25M24 20L29 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="34" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>
            </svg>
          )}
        </div>
        <div className={styles.text}>
          <span className={styles.primary}>
            {loading ? 'Uploading…' : 'Drop your CSV here'}
          </span>
          <span className={styles.secondary}>
            {loading ? 'Please wait' : 'or click to browse · Max 10MB'}
          </span>
        </div>
        <div className={styles.formats}>
          <span>Facebook Leads</span>
          <span>Google Ads</span>
          <span>Excel Export</span>
          <span>Real Estate CRM</span>
          <span>Custom CSV</span>
        </div>
        <input
          id="csv-upload"
          type="file"
          accept=".csv,text/csv,text/plain"
          className={styles.input}
          onChange={onInputChange}
          disabled={loading}
        />
      </label>
      {error && (
        <div className="alert alert-error" style={{ marginTop: 12 }}>
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  );
}
