import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type FieldProps = {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Span the full width of a grid parent. */
  full?: boolean;
  className?: string;
};

export default function Field({ label, children, hint, error, full, className }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-sm', full && 'col-span-2', className)}>
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      {children}
      {error ? (
        <span className="text-xs font-medium text-red-500">{error}</span>
      ) : hint ? (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</span>
      ) : null}
    </label>
  );
}
