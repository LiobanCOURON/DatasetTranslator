import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { t } from '../i18n';
import {
  Languages,
  History,
  ArrowRight,
  Database,
  Globe2,
  Cpu,
  Upload,
  Sparkles,
} from 'lucide-react';

export function MainPage() {
  const { language } = useAppStore();
  const navigate = useNavigate();

  const steps = [
    { icon: Database, text: t(language, 'main.tutorial.step1') },
    { icon: Globe2, text: t(language, 'main.tutorial.step2') },
    { icon: Cpu, text: t(language, 'main.tutorial.step3') },
    { icon: Upload, text: t(language, 'main.tutorial.step4') },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section */}
      <section className="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 glass-pill rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Open Source Dataset Translation</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-blue-500 to-green-500 dark:from-blue-400 dark:via-blue-300 dark:to-green-400 bg-clip-text text-transparent">
            {t(language, 'main.title')}
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            {t(language, 'main.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/translator')}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105"
            >
              <Languages className="w-5 h-5" />
              {t(language, 'main.goTranslator')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => navigate('/history')}
              className="group flex items-center gap-2 px-6 py-3 glass-card hover:bg-white/60 dark:hover:bg-white/20 rounded-xl font-medium text-gray-700 dark:text-gray-200 transition-all duration-300"
            >
              <History className="w-5 h-5" />
              {t(language, 'main.goHistory')}
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="glass-card rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          {t(language, 'main.tutorial')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(({ icon: Icon, text }, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-5 hover:scale-105 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-green-500/20 dark:from-blue-500/30 dark:to-green-500/30 flex items-center justify-center mb-3 group-hover:from-blue-500/30 group-hover:to-green-500/30 transition-all">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xs font-bold text-blue-500 mb-1">Step {index + 1}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="glass-card rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-green-500" />
          {t(language, 'main.about')}
        </h2>
        
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p className="leading-relaxed">
            {t(language, 'main.about.text1')}
          </p>
          <p className="leading-relaxed">
            {t(language, 'main.about.text2')}
          </p>
          <p className="leading-relaxed">
            {t(language, 'main.about.text3')}
          </p>
          <div className="glass-card rounded-2xl p-5 bg-gradient-to-r from-blue-500/5 to-green-500/5 border-l-4 border-blue-500">
            <p className="leading-relaxed font-medium text-gray-700 dark:text-gray-200">
              {t(language, 'main.about.text4')}
            </p>
          </div>
          <p className="leading-relaxed">
            {t(language, 'main.about.text5')}
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Stream Processing</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Datasets are streamed to avoid overloading your memory. Process datasets of any size efficiently.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-green-500/25">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Multiple Methods</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose from API translation, small local models, best quality models, or LLM-based translation.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Auto Push to HF</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically push translated datasets to your Hugging Face account when translation is complete.
          </p>
        </div>
      </section>
    </div>
  );
}
