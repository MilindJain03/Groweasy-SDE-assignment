'use client';
import { useState } from 'react';
import { uploadCSV, processCSVStream } from '@/lib/api';
import { AppStep, PreviewData, ImportResult } from '@/lib/types';
import Stepper from '@/components/ui/Stepper';
import DropZone from '@/components/upload/DropZone';
import PreviewTable from '@/components/preview/PreviewTable';
import ProgressBar from '@/components/ui/ProgressBar';
import ResultsTable from '@/components/results/ResultsTable';
import styles from './page.module.css';

export default function Home() {
  const [step, setStep]         = useState<AppStep>('upload');
  const [preview, setPreview]   = useState<PreviewData | null>(null);
  const [result, setResult]     = useState<ImportResult | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchInfo, setBatchInfo]   = useState({ current: 0, total: 0 });
  const [error, setError]       = useState('');

  // ── Step 1: Upload ──────────────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const data = await uploadCSV(file);
      setPreview(data);
      setStep('preview');
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Step 3: Confirm & Process ───────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!preview) return;
    setError('');
    setProcessing(true);
    setStep('processing');

    const totalBatches = Math.ceil(preview.rows.length / 20);
    setBatchInfo({ current: 0, total: totalBatches });

    try {
      const data = await processCSVStream(preview.headers, preview.rows, (progressData) => {
        setBatchInfo({
          current: progressData.current,
          total: progressData.total,
        });
      });

      setResult(data);
      setStep('results');
    } catch (e: any) {
      setError(e.message || 'AI processing failed');
      setStep('preview');
    } finally {
      setProcessing(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep('upload');
    setPreview(null);
    setResult(null);
    setError('');
    setBatchInfo({ current: 0, total: 0 });
  };

  return (
    <main className={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className="container">
          <div className={styles.logo}>
            <div className={styles.logoIcon}>G</div>
            <div>
              <div className={styles.logoName}>GrowEasy</div>
              <div className={styles.logoSub}>CSV Importer</div>
            </div>
          </div>
          <div className={styles.badge}>
            <span className={styles.aiDot} />
            AI-Powered
          </div>
        </div>
      </header>

      {/* ── Stepper ────────────────────────────────────────────────────────── */}
      <div className="container">
        <Stepper currentStep={step} />
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="container">
        <div className={styles.content}>

          {/* Error banner */}
          {error && (
            <div className="alert alert-error fade-up" style={{ marginBottom: 24 }}>
              <span>⚠</span>
              <div>
                <strong>Error</strong>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* STEP 1 — Upload */}
          {step === 'upload' && (
            <div className="fade-up">
              <div className={styles.stepHeader}>
                <h1 className={styles.stepTitle}>Upload Your CSV</h1>
                <p className={styles.stepDesc}>
                  Upload any CSV format — Facebook leads, Google Ads, Excel exports, custom sheets.
                  Our AI will intelligently map your columns to GrowEasy CRM fields.
                </p>
              </div>
              <DropZone onFile={handleFile} loading={uploading} />
            </div>
          )}

          {/* STEP 2 — Preview */}
          {step === 'preview' && preview && (
            <div className="fade-up">
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Preview Your Data</h2>
                <p className={styles.stepDesc}>
                  Showing all <strong>{preview.totalRows}</strong> rows from <em>{preview.filename}</em>.
                  Review the data, then confirm to start AI extraction.
                </p>
              </div>

              {/* File meta */}
              <div className={styles.fileMeta}>
                <div className={styles.fileTag}>
                  <span className={styles.fileIcon}>📄</span>
                  <span>{preview.filename}</span>
                </div>
                <span className="badge badge-muted">{preview.totalRows} rows</span>
                <span className="badge badge-purple">{preview.headers.length} columns</span>
                <span className="badge badge-muted">{(preview.fileSize / 1024).toFixed(1)} KB</span>
              </div>

              <PreviewTable headers={preview.headers} rows={preview.rows} maxHeight={420} />

              <div className={styles.previewActions}>
                <button className="btn btn-secondary" onClick={handleReset}>← Upload Different File</button>
                <button className="btn btn-primary btn-lg" onClick={handleConfirm} disabled={processing}>
                  <span>✦</span> Confirm & Extract with AI
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Processing */}
          {step === 'processing' && (
            <div className={`${styles.processingCard} fade-up`}>
              <div className={styles.processingOrb} />
              <div className={styles.processingIcon}>✦</div>
              <h2 className={styles.processingTitle}>AI Extraction in Progress</h2>
              <p className={styles.processingDesc}>
                Gemini is intelligently mapping your CSV columns to GrowEasy CRM fields.
                Processing <strong>{preview?.totalRows}</strong> records in batches.
              </p>
              <div style={{ width: '100%', maxWidth: 480 }}>
                <ProgressBar
                  current={batchInfo.current}
                  total={batchInfo.total || 1}
                  label={batchInfo.total > 0 ? `Processing batch ${batchInfo.current} of ${batchInfo.total}…` : 'Initializing…'}
                />
              </div>
              <div className={styles.processingHints}>
                <span className="badge badge-purple">Field Mapping</span>
                <span className="badge badge-purple">Status Detection</span>
                <span className="badge badge-purple">Phone Parsing</span>
                <span className="badge badge-purple">Skip Validation</span>
              </div>
            </div>
          )}

          {/* STEP 4 — Results */}
          {step === 'results' && result && (
            <div className="fade-up">
              <div className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Import Complete 🎉</h2>
                <p className={styles.stepDesc}>
                  AI successfully extracted CRM records from your CSV. Review the results below.
                </p>
              </div>
              <ResultsTable result={result} onReset={handleReset} />
            </div>
          )}

        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className="container">
          GrowEasy CSV Importer · Powered by Gemini AI
        </div>
      </footer>
    </main>
  );
}
