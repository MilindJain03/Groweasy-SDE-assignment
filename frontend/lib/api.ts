import type { PreviewData, ImportResult, ApiResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Upload a CSV file — returns parsed preview data (no AI).
 */
export async function uploadCSV(file: File): Promise<PreviewData> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${BASE_URL}/api/import/upload`, {
    method: 'POST',
    body: form,
  });

  const json: ApiResponse<PreviewData> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Upload failed');
  }
  return json.data!;
}

/**
 * Send parsed rows to the AI extraction endpoint.
 */
export async function processCSV(
  headers: string[],
  rows: Record<string, string>[]
): Promise<ImportResult> {
  const res = await fetch(`${BASE_URL}/api/import/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headers, rows }),
  });

  const json: ApiResponse<ImportResult> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Processing failed');
  }
  return json.data!;
}

/**
 * Send parsed rows to the AI extraction endpoint and stream the results back using SSE.
 */
export async function processCSVStream(
  headers: string[],
  rows: Record<string, string>[],
  onProgress: (data: any) => void
): Promise<ImportResult> {
  const res = await fetch(`${BASE_URL}/api/import/process-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headers, rows }),
  });

  if (!res.ok) {
    let errMessage = 'Processing failed';
    try {
      const errorJson = await res.json();
      errMessage = errorJson.error || errMessage;
    } catch (e) {}
    throw new Error(errMessage);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('ReadableStream not supported');

  const decoder = new TextDecoder();
  let buffer = '';
  let finalSummary: ImportResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || ''; // Keep the last incomplete part in the buffer

    for (const part of parts) {
      if (part.startsWith('data: ')) {
        const jsonStr = part.slice(6); // remove 'data: '
        try {
          const data = JSON.parse(jsonStr);
          if (data.type === 'error') {
            throw new Error(data.message);
          } else if (data.type === 'complete') {
            finalSummary = data.summary;
          } else if (data.type === 'progress') {
            onProgress(data);
          }
        } catch (err) {
          console.error('Error parsing SSE JSON chunk:', err);
        }
      }
    }
  }

  if (!finalSummary) {
    throw new Error('Stream ended without complete event');
  }

  return finalSummary;
}
