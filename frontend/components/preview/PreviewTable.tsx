'use client';
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './PreviewTable.module.css';

interface Props {
  headers: string[];
  rows: Record<string, string>[];
  maxHeight?: number;
}

export default function PreviewTable({ headers, rows, maxHeight = 420 }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  return (
    <div className={styles.container}>
      {/* Scrollable area */}
      <div
        ref={parentRef}
        className={styles.scrollArea}
        style={{ maxHeight }}
      >
        <table className={`data-table ${styles.table}`}>
          <thead>
            <tr>
              <th className={styles.rowNum}>#</th>
              {headers.map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map(vRow => {
              const row = rows[vRow.index];
              return (
                <tr
                  key={vRow.index}
                  style={{
                    position: 'absolute',
                    top: vRow.start,
                    left: 0,
                    width: '100%',
                    height: vRow.size,
                  }}
                >
                  <td className={styles.rowNum}>{vRow.index + 1}</td>
                  {headers.map(h => (
                    <td key={h} title={row[h]}>{row[h] || <span className={styles.empty}>—</span>}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
