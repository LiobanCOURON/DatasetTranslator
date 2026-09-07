import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, TranslationMethod, TranslationJob } from '../store';
import { t } from '../i18n';
import { v4 as uuidv4 } from 'uuid';
import {
  Home,
  History,
  Play,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Wifi,
  Cpu,
  Award,
  Bot,
  Globe,
  Database,
  Search,
  X,
  ExternalLink,
  Download,
  Users,
  FileText,
} from 'lucide-react';

// Hugging Face Dataset interface
interface HFDataset {
  id: string;
  author: string;
  lastModified: string;
  likes: number;
  trending: number;
  tags: string[];
  downloads: number;
}

const targetLanguages = [
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'uk', name: 'Ukrainian' },
];

const methods = [
  { value: 'api' as TranslationMethod, icon: Wifi, labelKey: 'translator.method.api', desc: 'Fast, requires internet. Uses Google Translate API.' },
  { value: 'small' as TranslationMethod, icon: Cpu, labelKey: 'translator.method.small', desc: 'Runs locally on any device. ~200MB model.' },
  { value: 'best' as TranslationMethod, icon: Award, labelKey: 'translator.method.best', desc: 'Highest quality. Requires good GPU (4GB+ VRAM).' },
  { value: 'llm' as TranslationMethod, icon: Bot, labelKey: 'translator.method.llm', desc: 'Uses any OpenAI-compatible API endpoint.' },
];

export function TranslatorPage() {
  const { language, addJob, updateJob, currentJob, setCurrentJob } = useAppStore();
  const navigate = useNavigate();

  // Form state
  const [datasetName, setDatasetName] = useState('');
  const [hfKey, setHfKey] = useState('');
  const [targetLang, setTargetLang] = useState('fr');
  const [userName, setUserName] = useState('');
  const [outputName, setOutputName] = useState('');
  const [method, setMethod] = useState<TranslationMethod>('api');
  const [autoUpload, setAutoUpload] = useState(true);
  const [fields, setFields] = useState<string[]>(['text']);
  const [showFields, setShowFields] = useState(false);
  
  // LLM config
  const [llmEndpoint, setLlmEndpoint] = useState('https://api.openai.com/v1');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('gpt-4o-mini');
  const [llmRpm, setLlmRpm] = useState(60);
  const [llmConcurrency, setLlmConcurrency] = useState(5);

  // HF Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HFDataset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<HFDataset | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search on Hugging Face
  const searchHuggingFace = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://huggingface.co/api/datasets?search=${encodeURIComponent(query)}&limit=10&sort=downloads&direction=-1`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('HF search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedDataset(null);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchHuggingFace(value);
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // Select a dataset from search results
  const handleSelectDataset = (dataset: HFDataset) => {
    setSelectedDataset(dataset);
    setDatasetName(dataset.id);
    setSearchQuery(dataset.id);
    setShowDropdown(false);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedDataset(null);
    setDatasetName('');
    setSearchQuery('');
    setSearchResults([]);
  };

  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedRows, setTranslatedRows] = useState(0);
  const [totalRows] = useState(10000);
  const [status, setStatus] = useState<string>('idle');

  const handleStart = useCallback(() => {
    if (!datasetName || !userName) return;

    const jobId = uuidv4();
    const job: TranslationJob = {
      id: jobId,
      datasetName,
      targetLang,
      userName,
      outputName: outputName || `${datasetName}-translated-${targetLang}`,
      method,
      status: 'downloading',
      progress: 0,
      totalRows,
      translatedRows: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields,
      llmConfig: method === 'llm' ? { endpoint: llmEndpoint, model: llmModel, rpm: llmRpm, concurrency: llmConcurrency } : undefined,
    };

    addJob(job);
    setCurrentJob(job);
    setIsRunning(true);
    setStatus('downloading');
    setProgress(0);
    setTranslatedRows(0);

    // Simulate translation process
    simulateTranslation(jobId);
  }, [datasetName, hfKey, targetLang, userName, outputName, method, autoUpload, fields, llmEndpoint, llmModel, llmRpm, llmConcurrency, totalRows]);

  const simulateTranslation = (jobId: string) => {
    // Phase 1: Downloading (2 seconds)
    setTimeout(() => {
      updateJob(jobId, { status: 'translating' });
      setStatus('translating');
      
      // Phase 2: Translating (simulate progress)
      let currentRow = 0;
      const interval = setInterval(() => {
        currentRow += Math.floor(Math.random() * 50) + 20;
        if (currentRow >= totalRows) {
          currentRow = totalRows;
          clearInterval(interval);
          
          if (autoUpload) {
            updateJob(jobId, { status: 'uploading', translatedRows: currentRow, progress: 100 });
            setStatus('uploading');
            
            // Phase 3: Upload
            setTimeout(() => {
              updateJob(jobId, {
                status: 'done',
                hfUrl: `https://huggingface.co/datasets/${userName}/${outputName || `${datasetName}-translated-${targetLang}`}`,
              });
              setStatus('done');
              setIsRunning(false);
            }, 3000);
          } else {
            updateJob(jobId, { status: 'done', translatedRows: currentRow, progress: 100 });
            setStatus('done');
            setIsRunning(false);
          }
        } else {
          const pct = Math.round((currentRow / totalRows) * 100);
          setProgress(pct);
          setTranslatedRows(currentRow);
          updateJob(jobId, { translatedRows: currentRow, progress: pct });
        }
      }, 200);
    }, 2000);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (currentJob) {
      updateJob(currentJob.id, { status: 'paused' });
    }
    setStatus('idle');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'downloading':
      case 'translating':
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Database className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="glass-pill rounded-full p-2 hover:bg-white/60 dark:hover:bg-white/20 transition-all">
          <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 bg-clip-text text-transparent">
          {t(language, 'translator.title')}
        </h1>
        <button onClick={() => navigate('/history')} className="ml-auto glass-pill rounded-full p-2 hover:bg-white/60 dark:hover:bg-white/20 transition-all">
          <History className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Dataset Info */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Dataset Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {t(language, 'translator.datasetName')} *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder={t(language, 'translator.datasetName.placeholder')}
                    className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                  )}
                  {selectedDataset && !isSearching && (
                    <button
                      onClick={handleClearSelection}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Selected dataset info */}
                {selectedDataset && (
                  <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-400/30 dark:border-blue-400/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {selectedDataset.id}
                      </span>
                      <a
                        href={`https://huggingface.co/datasets/${selectedDataset.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {selectedDataset.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {selectedDataset.downloads?.toLocaleString() || '0'}
                      </span>
                      <span className="flex items-center gap-1">
                        ❤️ {selectedDataset.likes || 0}
                      </span>
                    </div>
                  </div>
                )}

                {/* Search results dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 max-h-80 overflow-y-auto rounded-xl bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl shadow-black/20">
                    {searchResults.map((dataset) => (
                      <button
                        key={dataset.id}
                        onClick={() => handleSelectDataset(dataset)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                      >
                        <div className="flex items-start gap-2">
                          <Database className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                              {dataset.id}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {dataset.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {dataset.downloads?.toLocaleString() || '0'}
                              </span>
                              <span>❤️ {dataset.likes || 0}</span>
                            </div>
                            {dataset.tags && dataset.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {dataset.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {dataset.tags.length > 3 && (
                                  <span className="text-[10px] text-gray-400">
                                    +{dataset.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {showDropdown && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
                  <div className="absolute z-50 w-full mt-2 rounded-xl bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl p-4 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No datasets found for "{searchQuery}"
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      You can still type the dataset name manually
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {t(language, 'translator.hfKey')}
                </label>
                <input
                  type="password"
                  value={hfKey}
                  onChange={(e) => setHfKey(e.target.value)}
                  placeholder={t(language, 'translator.hfKey.placeholder')}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {t(language, 'translator.targetLang')} *
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                >
                  {targetLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-800">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {t(language, 'translator.userName')} *
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t(language, 'translator.userName.placeholder')}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {t(language, 'translator.outputName')}
                </label>
                <input
                  type="text"
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  placeholder={t(language, 'translator.outputName.placeholder')}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Fields to translate */}
            <div>
              <button
                onClick={() => setShowFields(!showFields)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
              >
                {showFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {t(language, 'translator.fields')}
              </button>
              {showFields && (
                <div className="mt-2 p-3 glass-card rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t(language, 'translator.fields.help')}</p>
                  <div className="flex flex-wrap gap-2">
                    {['text', 'sentence', 'question', 'answer', 'context', 'title', 'summary', 'translation'].map((field) => (
                      <label key={field} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/40 dark:bg-white/10 cursor-pointer hover:bg-white/60 dark:hover:bg-white/20 transition-all">
                        <input
                          type="checkbox"
                          checked={fields.includes(field)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFields([...fields, field]);
                            } else {
                              setFields(fields.filter((f) => f !== field));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Translation Method */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-500" />
              {t(language, 'translator.method')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {methods.map(({ value, icon: Icon, labelKey, desc }) => (
                <button
                  key={value}
                  onClick={() => setMethod(value)}
                  className={`p-4 rounded-xl text-left transition-all duration-300 ${
                    method === value
                      ? 'bg-gradient-to-r from-blue-500/20 to-green-500/20 dark:from-blue-500/30 dark:to-green-500/30 border-2 border-blue-400/50 shadow-lg'
                      : 'glass-card hover:bg-white/60 dark:hover:bg-white/20 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${method === value ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className={`text-sm font-medium ${method === value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {t(language, labelKey)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </button>
              ))}
            </div>

            {/* LLM Config */}
            {method === 'llm' && (
              <div className="glass-card rounded-xl p-4 space-y-3 bg-blue-50/50 dark:bg-blue-900/20">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">LLM Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t(language, 'translator.llm.endpoint')}
                    </label>
                    <input
                      type="text"
                      value={llmEndpoint}
                      onChange={(e) => setLlmEndpoint(e.target.value)}
                      placeholder={t(language, 'translator.llm.endpoint.placeholder')}
                      className="w-full glass-input rounded-lg px-3 py-2 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t(language, 'translator.llm.apiKey')}
                    </label>
                    <input
                      type="password"
                      value={llmApiKey}
                      onChange={(e) => setLlmApiKey(e.target.value)}
                      placeholder={t(language, 'translator.llm.apiKey.placeholder')}
                      className="w-full glass-input rounded-lg px-3 py-2 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t(language, 'translator.llm.model')}
                    </label>
                    <input
                      type="text"
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      placeholder={t(language, 'translator.llm.model.placeholder')}
                      className="w-full glass-input rounded-lg px-3 py-2 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t(language, 'translator.llm.rpm')}
                      </label>
                      <input
                        type="number"
                        value={llmRpm}
                        onChange={(e) => setLlmRpm(Number(e.target.value))}
                        className="w-full glass-input rounded-lg px-3 py-2 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t(language, 'translator.llm.concurrency')}
                      </label>
                      <input
                        type="number"
                        value={llmConcurrency}
                        onChange={(e) => setLlmConcurrency(Number(e.target.value))}
                        className="w-full glass-input rounded-lg px-3 py-2 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Auto Upload */}
          <div className="glass-card rounded-2xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoUpload}
                onChange={(e) => setAutoUpload(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t(language, 'translator.autoUpload')}
              </span>
            </label>
          </div>
        </div>

        {/* Status Panel */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6 sticky top-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              {getStatusIcon()}
              {t(language, `translator.status.${status}`)}
            </h3>

            {/* Progress */}
            {isRunning && (
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">{t(language, 'translator.progress')}</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {translatedRows.toLocaleString()} / {totalRows.toLocaleString()} {t(language, 'translator.rows')}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  disabled={!datasetName || !userName}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4" />
                  {t(language, 'translator.start')}
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 transition-all duration-300"
                >
                  <Square className="w-4 h-4" />
                  {t(language, 'translator.stop')}
                </button>
              )}
            </div>

            {/* Result */}
            {status === 'done' && currentJob?.hfUrl && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">Dataset uploaded!</p>
                <a
                  href={currentJob.hfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {currentJob.hfUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
