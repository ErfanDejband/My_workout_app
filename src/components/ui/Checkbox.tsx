import type { ChangeEventHandler } from 'react';
import { cn } from '@/lib/cn';

export type CheckboxProps = {
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  /** Accessible label (checkbox is visually a custom box). */
  label?: string;
  className?: string;
};

/**
 * Custom checkbox with a large tap target and a lime check when done. The real
 * <input> is visually hidden but stays in the DOM so keyboard + change
 * semantics behave exactly like a native control.
 */
export default function Checkbox({ checked, onChange, label, className }: CheckboxProps) {
  return (
    <label
      className={cn(
        'relative inline-flex h-11 w-11 flex-none cursor-pointer items-center justify-center',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-neutral-300 bg-white text-transparent transition-colors peer-checked:border-lime-500 peer-checked:bg-lime-400 peer-checked:text-neutral-900 peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:peer-checked:text-neutral-900 dark:peer-focus-visible:ring-offset-neutral-900"
        aria-hidden="true"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            d="M4 10.5l4 4 8-9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}
