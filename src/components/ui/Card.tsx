import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Remove default inner padding (e.g. when the card wraps its own layout). */
  flush?: boolean;
};

export default function Card({ flush = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
        !flush && 'p-6',
        className
      )}
      {...props}
    />
  );
}
