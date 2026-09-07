import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { t, languageNames, Language } from '../i18n';
import {
  Home,
  Languages,
  History,
  Sun,
  Moon,
  Monitor,
  Globe,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { language, setLanguage, theme, setTheme } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: t(language, 'nav.main') },
    { path: '/translator', icon: Languages, label: t(language, 'nav.translator') },
    { path: '/history', icon: History, label: t(language, 'nav.history') },
  ];

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: t(language, 'common.light') },
    { value: 'dark' as const, icon: Moon, label: t(language, 'common.dark') },
    { value: 'auto' as const, icon: Monitor, label: t(language, 'common.auto') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-400/20 dark:bg-green-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-300/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="relative z-50">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="glass-card rounded-2xl px-6 py-3 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 bg-clip-text text-transparent">
                DS Translator
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, icon: Icon, label }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    location.pathname === path
                      ? 'bg-gradient-to-r from-blue-500/20 to-green-500/20 dark:from-blue-500/30 dark:to-green-500/30 text-blue-700 dark:text-blue-300 shadow-inner'
                      : 'hover:bg-white/40 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </nav>

            {/* Theme & Language */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <div className="flex items-center gap-1 glass-pill rounded-full p-1">
                {themeOptions.map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`p-1.5 rounded-full transition-all duration-300 ${
                      theme === value
                        ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    title={value}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>

              {/* Language selector */}
              <div className="relative group">
                <button className="glass-pill rounded-full p-2 flex items-center gap-1 hover:bg-white/60 dark:hover:bg-white/20 transition-all">
                  <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="glass-card rounded-xl p-2 min-w-[140px] shadow-xl">
                    {(Object.keys(languageNames) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                          language === lang
                            ? 'bg-gradient-to-r from-blue-500/20 to-green-500/20 text-blue-700 dark:text-blue-300 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10'
                        }`}
                      >
                        {languageNames[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
        <div className="glass-card rounded-full px-2 py-2 flex items-center gap-1 shadow-xl">
          {navItems.map(({ path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`p-3 rounded-full transition-all duration-300 ${
                location.pathname === path
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
