import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant =
  | 'workout'
  | 'rest'
  | 'active_recovery'
  | 'neutral'
  | 'brand'
  | 'lime';

const VARIANTS: Record<BadgeVariant, string> = {
  // Day types.
  workout: 'bg-brand-tint text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
  rest: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  active_recovery: 'bg-lime-tint text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
  // Generic.
  neutral: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  brand: 'bg-brand-tint text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
  lime: 'bg-lime-tint text-lime-700 dark:bg-lime-900/40 dark:text-lime-300'
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export default function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
