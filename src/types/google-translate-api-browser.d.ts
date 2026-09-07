declare module 'google-translate-api-browser' {
  interface TranslateOptions {
    from?: string;
    to?: string;
    corsUrl?: string;
  }

  interface TranslationResult {
    text: string;
    pronunciation?: string;
    from: {
      language: {
        didYouMean: boolean;
        iso: string;
      };
      text: {
        autoCorrected: boolean;
        value: string;
        didYouMean: string;
      };
    };
    raw?: any;
  }

  export function translate(text: string, options?: TranslateOptions): Promise<TranslationResult>;
  export function isSupported(lang: string): boolean;
}
