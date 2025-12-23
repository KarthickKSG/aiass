/// <reference types="vite/client" />

/**
 * Augment the NodeJS namespace to add custom environment variables to process.env.
 * This approach prevents conflicts with existing global 'process' declarations
 * and resolves the "identical modifiers" and "cannot redeclare" errors.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
  }
}

interface Window {
  /**
   * Methods injected by the AI Studio environment for API key management.
   */
  aistudio?: {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  };
  /**
   * Webkit prefix support for the Audio API.
   */
  webkitAudioContext: typeof AudioContext;
}
