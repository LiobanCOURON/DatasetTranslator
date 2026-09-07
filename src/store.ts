import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from './i18n';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type TranslationStatus = 'idle' | 'downloading' | 'translating' | 'uploading' | 'done' | 'error' | 'paused';

export type TranslationMethod = 'api' | 'small' | 'best' | 'llm';

export interface TranslationJob {
  id: string;
  datasetName: string;
  targetLang: string;
  userName: string;
  outputName: string;
  method: TranslationMethod;
  status: TranslationStatus;
  progress: number;
  totalRows: number;
  translatedRows: number;
  createdAt: string;
  updatedAt: string;
  fields: string[];
  hfUrl?: string;
  error?: string;
  llmConfig?: {
    endpoint: string;
    model: string;
    rpm: number;
    concurrency: number;
  };
}

interface AppState {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  
  // Translation jobs
  jobs: TranslationJob[];
  addJob: (job: TranslationJob) => void;
  updateJob: (id: string, updates: Partial<TranslationJob>) => void;
  removeJob: (id: string) => void;
  
  // Current translation
  currentJob: TranslationJob | null;
  setCurrentJob: (job: TranslationJob | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      
      theme: 'auto',
      setTheme: (theme) => set({ theme }),
      
      jobs: [],
      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
      updateJob: (id, updates) =>
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j
          ),
          currentJob: state.currentJob?.id === id ? { ...state.currentJob, ...updates, updatedAt: new Date().toISOString() } : state.currentJob,
        })),
      removeJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
          currentJob: state.currentJob?.id === id ? null : state.currentJob,
        })),
      
      currentJob: null,
      setCurrentJob: (job) => set({ currentJob: job }),
    }),
    {
      name: 'dataset-translator-storage',
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        jobs: state.jobs,
      }),
    }
  )
);
