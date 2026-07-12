import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { inputStyles } from './Input';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select ref={ref} className={cn(inputStyles, 'cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  );
});

export default Select;
