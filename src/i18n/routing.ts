import { defineRouting } from 'next-intl/routing';

// Supported locales: English + Traditional Chinese. Metric-first, English default.
export const routing = defineRouting({
  locales: ['en', 'zh-Hant'],
  defaultLocale: 'en'
});

export type Locale = (typeof routing.locales)[number];
