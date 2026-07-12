import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import Header, { type HeaderProps } from './Header';

const SIZES = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-4xl'
} as const;

export type AppShellProps = {
  children: ReactNode;
  /** Header chrome — `app` (default) or `minimal`. */
  headerVariant?: HeaderProps['variant'];
  /** Content container max width. */
  size?: keyof typeof SIZES;
  /** Extra classes on the <main> content container. */
  contentClassName?: string;
};

/**
 * App-wide layout: sticky <Header> + a centered, max-width content column.
 * No client hooks here, so it composes into both server and client pages.
 */
export default function AppShell({
  children,
  headerVariant = 'app',
  size = 'md',
  contentClassName
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant={headerVariant} />
      <main
        className={cn(
          'mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10',
          SIZES[size],
          contentClassName
        )}
      >
        {children}
      </main>
    </div>
  );
}
