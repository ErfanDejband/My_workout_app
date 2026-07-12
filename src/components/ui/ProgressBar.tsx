import { cn } from '@/lib/cn';

export type ProgressBarProps = {
  done: number;
  total: number;
  className?: string;
};

/**
 * Brand-filled progress track. Turns lime once every item is done — a small
 * positive-state highlight.
 */
export default function ProgressBar({ done, total, className }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done >= total;

  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800',
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          complete ? 'bg-lime-500' : 'bg-brand'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
