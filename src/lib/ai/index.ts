// Provider registry (docs/Project/src/structure.md §5.1).
// The settings UI renders "how to get your token" steps from here.
// The ai-integration agent owns adapters in ./providers/*.

export type ProviderId = 'gemini' | 'openai' | 'anthropic';

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  freeTier: boolean;
  docsUrl: string;
  tokenHint: string;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    freeTier: true,
    docsUrl: 'https://aistudio.google.com/apikey',
    tokenHint: 'Starts with "AIza…"'
  },
  openai: {
    id: 'openai',
    label: 'OpenAI (ChatGPT)',
    freeTier: false,
    docsUrl: 'https://platform.openai.com/api-keys',
    tokenHint: 'Starts with "sk-…"'
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    freeTier: false,
    docsUrl: 'https://console.anthropic.com/settings/keys',
    tokenHint: 'Starts with "sk-ant-…"'
  }
};

// Adapter contract implemented by ./providers/{gemini,openai,anthropic}.ts
export interface ProviderAdapter {
  generatePlan(prompt: string, token: string): Promise<string>;
}
