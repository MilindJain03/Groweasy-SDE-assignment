'use client';
import { AppStep } from '@/lib/types';
import styles from './Stepper.module.css';

const STEPS = [
  { id: 'upload',     label: 'Upload',    icon: '↑' },
  { id: 'preview',    label: 'Preview',   icon: '⊞' },
  { id: 'processing', label: 'Processing',icon: '✦' },
  { id: 'results',    label: 'Results',   icon: '✓' },
] as const;

const STEP_ORDER: AppStep[] = ['upload', 'preview', 'processing', 'results'];

interface Props { currentStep: AppStep; }

export default function Stepper({ currentStep }: Props) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  return (
    <div className={styles.stepper}>
      {STEPS.map((step, idx) => {
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        return (
          <div key={step.id} className={styles.stepWrapper}>
            <div className={`${styles.step} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
              <div className={styles.icon}>{done ? '✓' : step.icon}</div>
              <span className={styles.label}>{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`${styles.connector} ${done ? styles.connDone : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
