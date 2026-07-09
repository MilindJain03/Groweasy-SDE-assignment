'use client';
import styles from './ProgressBar.module.css';

interface Props {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className={styles.wrapper}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
        <div className={styles.glow} style={{ left: `${pct}%` }} />
      </div>
      <div className={styles.stats}>
        <span>Batch {current} of {total}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}
