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
  Lock,
  Eye,
  ArrowRight,
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
  const [hfKey, setHfKey] = useState(() => {
    return localStorage.getItem('hf_token') || '';
  });
  const [isTokenSaved, setIsTokenSaved] = useState(() => {
    return !!localStorage.getItem('hf_token');
  });
  const [targetLang, setTargetLang] = useState('fr');
  const [userName, setUserName] = useState(() => localStorage.getItem('hf_username') || '');
  const [outputName, setOutputName] = useState('');
  const [method, setMethod] = useState<TranslationMethod>('api');
  const [autoUpload, setAutoUpload] = useState(true);
  const [fields, setFields] = useState<string[]>([]);
  const [showFields, setShowFields] = useState(false);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [isDetectingColumns, setIsDetectingColumns] = useState(false);
  
  // Save HF token to localStorage
  useEffect(() => {
    if (hfKey) {
      localStorage.setItem('hf_token', hfKey);
      setIsTokenSaved(true);
    }
  }, [hfKey]);

  // Save HF username to localStorage
  useEffect(() => {
    if (userName) {
      localStorage.setItem('hf_username', userName);
    }
  }, [userName]);

  const handleClearToken = () => {
    localStorage.removeItem('hf_token');
    setHfKey('');
    setIsTokenSaved(false);
  };

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

  // Detect columns from dataset - defined early to be used in useEffect
  const detectColumns = async (datasetId: string) => {
    console.log('Detecting columns for dataset:', datasetId);
    setIsDetectingColumns(true);
    setDetectedColumns([]);
    try {
      // Get dataset info to extract column names directly from features
      const infoResponse = await fetch(
        `https://datasets-server.huggingface.co/info?dataset=${encodeURIComponent(datasetId)}`
      );
      
      console.log('Info response status:', infoResponse.status);
      
      if (infoResponse.ok) {
        const data = await infoResponse.json();
        console.log('Info response data:', data);
        
        if (data.dataset_info && Object.keys(data.dataset_info).length > 0) {
          // Get first available config
          const configName = Object.keys(data.dataset_info)[0];
          const configInfo = data.dataset_info[configName];
          
          console.log('Config name:', configName, 'Config info:', configInfo);
          
          // Extract column names from features
          if (configInfo && configInfo.features) {
            const columns = Object.keys(configInfo.features);
            console.log('Detected columns:', columns);
            setDetectedColumns(columns);
            // Select all columns by default
            setFields(columns);
            setShowFields(true);
            setIsDetectingColumns(false);
            return;
          }
        }
      }
      
      console.log('Info endpoint failed, trying fallback...');
      
      // Fallback: try to get splits first to find valid config/split
      const splitsResponse = await fetch(
        `https://datasets-server.huggingface.co/splits?dataset=${encodeURIComponent(datasetId)}`
      );
      
      let configName = 'default';
      let splitName = 'train';
      
      if (splitsResponse.ok) {
        const splitsData = await splitsResponse.json();
        if (splitsData.splits && splitsData.splits.length > 0) {
          configName = splitsData.splits[0].config;
          splitName = splitsData.splits[0].split;
          console.log('Found config/split from splits endpoint:', configName, splitName);
        }
      }
      
      // Now try to get first rows with the correct config/split
      const response = await fetch(
        `https://datasets-server.huggingface.co/first-rows?dataset=${encodeURIComponent(datasetId)}&config=${encodeURIComponent(configName)}&split=${encodeURIComponent(splitName)}`
      );
      
      console.log('First rows response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('First rows data:', data);
        
        if (data.first_rows && data.first_rows.length > 0) {
          const columns = Object.keys(data.first_rows[0].row || data.first_rows[0]);
          console.log('Detected columns from first rows:', columns);
          setDetectedColumns(columns);
          setFields(columns);
          setShowFields(true);
        }
      }
    } catch (error) {
      console.error('Failed to detect columns:', error);
    } finally {
      setIsDetectingColumns(false);
    }
  };

  // Auto-detect columns when dataset name changes (manual input)
  useEffect(() => {
    if (datasetName && datasetName.includes('/') && !selectedDataset) {
      const timeout = setTimeout(() => {
        detectColumns(datasetName);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [datasetName, selectedDataset]);

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
    console.log('Selected dataset:', dataset.id);
    setSelectedDataset(dataset);
    setDatasetName(dataset.id);
    setSearchQuery(dataset.id);
    setShowDropdown(false);
    // Detect columns automatically
    detectColumns(dataset.id);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedDataset(null);
    setDatasetName('');
    setSearchQuery('');
    setSearchResults([]);
    setDetectedColumns([]);
    setFields([]);
  };

  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedRows, setTranslatedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(100);
  const [status, setStatus] = useState<string>('idle');
  
  // Live preview state
  const [previewData, setPreviewData] = useState<Array<{original: string, translated: string, field: string}>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [translatedData, setTranslatedData] = useState<any[]>([]);

  const handleStart = useCallback(() => {
    if (!datasetName || !userName) {
      alert('Please fill in the dataset name and username');
      return;
    }
    
    if (fields.length === 0) {
      if (detectedColumns.length === 0) {
        alert('No columns detected. Please select a valid dataset first.');
      } else {
        alert('Please select at least one field to translate');
      }
      return;
    }

    console.log('✅ Starting translation...');
    console.log('Dataset:', datasetName);
    console.log('Username:', userName);
    console.log('Fields:', fields);
    console.log('Method:', method);
    console.log('Target language:', targetLang);
    console.log('Total rows:', totalRows);

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
  }, [datasetName, hfKey, targetLang, userName, outputName, method, autoUpload, fields, llmEndpoint, llmModel, llmRpm, llmConcurrency, totalRows, llmApiKey]);

  const simulateTranslation = async (jobId: string) => {
    console.log('🚀 Starting translation for dataset:', datasetName);
    console.log('Method:', method);
    console.log('Target language:', targetLang);
    console.log('Fields to translate:', fields);
    setShowPreview(true);
    
    try {
      // Phase 1: Download dataset from Hugging Face
      console.log('Phase 1: Downloading dataset...');
      updateJob(jobId, { status: 'downloading' });
      setStatus('downloading');
      
      // Get dataset info to find config and split
      const infoResponse = await fetch(
        `https://datasets-server.huggingface.co/info?dataset=${encodeURIComponent(datasetName)}`
      );
      
      if (!infoResponse.ok) {
        throw new Error('Failed to get dataset info');
      }
      
      const infoData = await infoResponse.json();
      console.log('Dataset info:', infoData);
      
      if (!infoData.dataset_info || Object.keys(infoData.dataset_info).length === 0) {
        throw new Error('No dataset info available');
      }
      
      const configName = Object.keys(infoData.dataset_info)[0];
      const configInfo = infoData.dataset_info[configName];
      const splitName = configInfo.splits ? Object.keys(configInfo.splits)[0] : 'train';
      const totalRowsInDataset = configInfo.splits?.[splitName]?.num_examples || 100;
      
      console.log(`Config: ${configName}, Split: ${splitName}, Rows: ${totalRowsInDataset}`);
      
      // Update total rows
      setTotalRows(totalRowsInDataset);
      
      // Phase 2: Parallel streaming with producer-consumer pattern
      console.log('Phase 2: Starting parallel streaming...');
      updateJob(jobId, { status: 'translating', totalRows: totalRowsInDataset });
      setStatus('translating');
      setProgress(0);
      
      const translatedRows: any[] = [];
      const previewEntries: Array<{original: string, translated: string, field: string}> = [];
      const batchSize = 100; // API limit per request
      const BUFFER_SIZE = 5; // Keep 5 batches in buffer (500 rows max)
      
      // Buffer for downloaded batches (producer-consumer pattern)
      interface BatchData {
        offset: number;
        rows: any[];
      }
      const downloadBuffer: BatchData[] = [];
      let downloadComplete = false;
      let globalRowIndex = 0;
      
      // PRODUCER: Download batches in parallel
      const downloadBatches = async () => {
        let offset = 0;
        while (offset < totalRowsInDataset) {
          // Wait if buffer is full
          while (downloadBuffer.length >= BUFFER_SIZE) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          const currentBatchSize = Math.min(batchSize, totalRowsInDataset - offset);
          
          try {
            const rowsResponse = await fetch(
              `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(datasetName)}&config=${encodeURIComponent(configName)}&split=${encodeURIComponent(splitName)}&offset=${offset}&length=${currentBatchSize}`
            );
            
            if (!rowsResponse.ok) {
              throw new Error(`Failed to download dataset rows at offset ${offset}`);
            }
            
            const rowsData = await rowsResponse.json();
            const batchRows = rowsData.rows || [];
            
            if (batchRows.length === 0) {
              break;
            }
            
            // Add to buffer
            downloadBuffer.push({ offset, rows: batchRows });
            console.log(`📥 Downloaded batch ${offset/100 + 1}. Buffer size: ${downloadBuffer.length}/${BUFFER_SIZE}`);
            
            offset += batchRows.length;
          } catch (error) {
            console.error('Download error:', error);
            throw error;
          }
        }
        downloadComplete = true;
        console.log('✅ All batches downloaded');
      };
      
      // CONSUMER: Translate batches as they become available
      const translateBatches = async () => {
        while (!downloadComplete || downloadBuffer.length > 0) {
          // Wait for a batch to be available
          if (downloadBuffer.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }
          
          // Get next batch from buffer
          const batch = downloadBuffer.shift()!;
          console.log(`🔄 Translating batch at offset ${batch.offset}. Buffer size: ${downloadBuffer.length}/${BUFFER_SIZE}`);
          
          // Translate this batch
          for (let i = 0; i < batch.rows.length; i++) {
            const row = batch.rows[i];
            const translatedRow = { ...row.row };
          
          // Translate each selected field
          for (const field of fields) {
            if (row.row[field] && typeof row.row[field] === 'string') {
              const originalText = row.row[field];
              
              // Optimization: Skip translation for single-element cells (1 word or less)
              const wordCount = originalText.trim().split(/\s+/).length;
              if (wordCount <= 1) {
                console.log(`Skipping translation for single-element cell: "${originalText}"`);
                translatedRow[field] = originalText;
                continue;
              }
              
              // Use translation method
              let translatedText = originalText; // Default to original text
              
              if (method === 'api') {
                // API translation via MyMemory API (free, no key needed)
                try {
                  // Truncate long texts to avoid API limits
                  const textToTranslate = originalText.length > 500 ? originalText.substring(0, 500) : originalText;
                  const response = await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${targetLang}`
                  );
                  
                  if (response.status === 429) {
                    console.warn('Rate limit exceeded, waiting 5 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    // Retry once after waiting
                    const retryResponse = await fetch(
                      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${targetLang}`
                    );
                    if (retryResponse.ok) {
                      const retryData = await retryResponse.json();
                      if (retryData.responseStatus === 200 && retryData.responseData?.translatedText) {
                        translatedText = retryData.responseData.translatedText;
                      } else {
                        translatedText = originalText;
                      }
                    } else {
                      translatedText = originalText;
                    }
                  } else if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                  } else {
                    const data = await response.json();
                    
                    if (data.responseStatus === 200 && data.responseData?.translatedText) {
                      translatedText = data.responseData.translatedText;
                    } else {
                      console.warn('Translation failed for row', globalRowIndex + i, 'field', field, ':', data.responseDetails);
                      translatedText = originalText;
                    }
                  }
                } catch (error) {
                  console.error('Translation error for row', globalRowIndex + i, 'field', field, ':', error);
                  translatedText = originalText;
                }
              } else if (method === 'llm') {
                // LLM translation
                try {
                  const response = await fetch(`${llmEndpoint}/chat/completions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${llmApiKey}`,
                    },
                    body: JSON.stringify({
                      model: llmModel,
                      messages: [
                        { role: 'system', content: `You are a translator. Translate the following text to ${targetLang}. Only output the translation, nothing else.` },
                        { role: 'user', content: originalText }
                      ],
                    }),
                  });
                  const data = await response.json();
                  translatedText = data.choices?.[0]?.message?.content || originalText;
                } catch (error) {
                  console.error('LLM translation error:', error);
                  translatedText = originalText;
                }
              } else {
                // Local models - for now just copy the text
                translatedText = originalText;
              }
              
              translatedRow[field] = translatedText;
              
              // Add to preview (keep only first 20 translations)
              if (previewEntries.length < 20) {
                previewEntries.push({
                  original: originalText.substring(0, 100),
                  translated: translatedText.substring(0, 100),
                  field: field,
                });
              }
            }
          }
          
          translatedRows.push(translatedRow);
          
          // Update progress
          const progress = Math.round(((globalRowIndex + i + 1) / totalRowsInDataset) * 100);
          setProgress(progress);
          setTranslatedRows(globalRowIndex + i + 1);
          setPreviewData(previewEntries.slice(0, 20));
          updateJob(jobId, { translatedRows: globalRowIndex + i + 1, progress });
          
          // Delay to avoid rate limiting (MyMemory allows ~10 req/sec for anonymous users)
          if (method === 'api') {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        globalRowIndex += batch.rows.length;
        console.log(`✅ Batch translated. Progress: ${globalRowIndex}/${totalRowsInDataset}`);
      }
      
      console.log('✅ All batches translated');
    };
    
    // Run producer and consumer in parallel
    await Promise.all([
      downloadBatches(),
      translateBatches()
    ]);
    
    console.log(`✅ Translated all ${translatedRows.length} rows (parallel streaming)`);
      
      // Store translated data
      setTranslatedData(translatedRows);
      
      // Phase 3: Upload (if enabled)
      if (autoUpload && hfKey) {
        console.log('Phase 3: Uploading to Hugging Face...');
        updateJob(jobId, { status: 'uploading', progress: 100 });
        setStatus('uploading');
        
        const datasetId = `${userName}/${outputName || `${datasetName.split('/').pop()}-translated-${targetLang}`}`;
        const hfUrl = `https://huggingface.co/datasets/${datasetId}`;
        
        try {
          // Step 1: Check if dataset exists
          console.log('Checking if dataset exists...');
          const checkResponse = await fetch(`https://huggingface.co/api/datasets/${datasetId}`, {
            headers: {
              'Authorization': `Bearer ${hfKey}`,
            },
          });
          
          // Step 2: Create the dataset repository if it doesn't exist
          if (checkResponse.status === 404) {
            console.log('Creating dataset repository...');
            const createResponse = await fetch(`https://huggingface.co/api/datasets`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hfKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'dataset',
                name: datasetId.split('/').pop(),
                private: false,
              }),
            });
            
            if (!createResponse.ok) {
              const errorData = await createResponse.json();
              throw new Error(`Failed to create dataset: ${errorData.error || createResponse.statusText}`);
            }
            
            console.log('Dataset repository created');
          } else if (!checkResponse.ok) {
            throw new Error(`Failed to check dataset: ${checkResponse.statusText}`);
          } else {
            console.log('Dataset already exists');
          }
          
          // Step 3: Upload the data as JSON using preupload endpoint
          console.log('Uploading translated data...');
          const jsonData = JSON.stringify(translatedRows, null, 2);
          
          // Create a FormData object for file upload
          const formData = new FormData();
          const blob = new Blob([jsonData], { type: 'application/json' });
          formData.append('file', blob, 'data/train.json');
          
          const uploadResponse = await fetch(
            `https://huggingface.co/api/datasets/${datasetId}/upload/main/data/train.json`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${hfKey}`,
              },
              body: blob,
            }
          );
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(`Failed to upload data: ${errorData.error || uploadResponse.statusText}`);
          }
          
          console.log('✅ Data uploaded successfully!');
          
          updateJob(jobId, { status: 'done', hfUrl });
          setStatus('done');
          setIsRunning(false);
          console.log('Translation completed and uploaded!');
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          // Still mark as done but without upload
          updateJob(jobId, { status: 'done', progress: 100 });
          setStatus('done');
          setIsRunning(false);
          alert(`Translation completed but upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}\n\nYou can download the translated dataset manually.`);
        }
      } else {
        updateJob(jobId, { status: 'done', progress: 100 });
        setStatus('done');
        setIsRunning(false);
        console.log('Translation completed (no upload)');
      }
      
    } catch (error) {
      console.error('❌ Translation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateJob(jobId, { status: 'error' });
      setStatus('error');
      setIsRunning(false);
      alert(`Translation failed: ${errorMessage}\n\nCheck the browser console (F12) for more details.`);
    }
  };

  const handleStop = () => {
    console.log('🛑 Stopping translation...');
    setIsRunning(false);
    if (currentJob) {
      updateJob(currentJob.id, { status: 'paused' });
    }
    setStatus('idle');
    alert('Translation stopped. You can resume later from the History page.');
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
                  <span className="flex items-center gap-1.5">
                    {t(language, 'translator.hfKey')}
                    {isTokenSaved && (
                      <span className="flex items-center gap-1 text-xs text-green-500 font-normal">
                        <Lock className="w-3 h-3" />
                        {t(language, 'translator.hfKey.saved')}
                      </span>
                    )}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={hfKey}
                    onChange={(e) => setHfKey(e.target.value)}
                    placeholder={t(language, 'translator.hfKey.placeholder')}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all pr-20"
                  />
                  {hfKey && (
                    <button
                      type="button"
                      onClick={handleClearToken}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={t(language, 'translator.hfKey.clear')}
                    >
                      {t(language, 'translator.hfKey.clear')}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t(language, 'translator.hfKey.hint')}
                </p>
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
                  <span className="flex items-center gap-1.5">
                    {t(language, 'translator.userName')} *
                    {userName && (
                      <span className="flex items-center gap-1 text-xs text-green-500 font-normal">
                        <Lock className="w-3 h-3" />
                        {t(language, 'translator.userName.saved')}
                      </span>
                    )}
                  </span>
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
                {showFields || detectedColumns.length > 0 || isDetectingColumns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {t(language, 'translator.fields')}
                {detectedColumns.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                    {fields.length}/{detectedColumns.length}
                  </span>
                )}
                {isDetectingColumns && (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                )}
              </button>
              {(showFields || detectedColumns.length > 0 || isDetectingColumns) && (
                <div className="mt-2 p-3 glass-card rounded-xl">
                  {isDetectingColumns ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {t(language, 'translator.fields.detecting')}
                      </span>
                    </div>
                  ) : detectedColumns.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t(language, 'translator.fields.help')}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFields([...detectedColumns])}
                            className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                          >
                            {t(language, 'translator.fields.selectAll')}
                          </button>
                          <button
                            onClick={() => setFields([])}
                            className="text-xs text-red-500 hover:text-red-600 transition-colors"
                          >
                            {t(language, 'translator.fields.deselectAll')}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {detectedColumns.map((field) => (
                          <label
                            key={field}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/40 dark:bg-white/10 cursor-pointer hover:bg-white/60 dark:hover:bg-white/20 transition-all"
                          >
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
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {datasetName ? t(language, 'translator.fields.detectionFailed') : t(language, 'translator.fields.noDataset')}
                      </p>
                      {datasetName && (
                        <button
                          onClick={() => detectColumns(datasetName)}
                          className="text-xs text-blue-500 hover:text-blue-600 transition-colors underline"
                        >
                          {t(language, 'translator.fields.retry')}
                        </button>
                      )}
                    </div>
                  )}
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
                <p className="text-xs text-blue-500 dark:text-blue-400 italic">
                  Status: {status} - Check browser console (F12) for detailed logs
                </p>
              </div>
            )}

            {/* Error message */}
            {status === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  ❌ Translation failed
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Check the browser console (F12) for error details
                </p>
              </div>
            )}

            {/* Live Preview */}
            {showPreview && previewData.length > 0 && (isRunning || status === 'done') && (
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                    {t(language, 'translator.preview.title')}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      LIVE
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {previewData.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/10 space-y-2"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-mono">
                          {item.field}
                        </span>
                        <span>#{translatedRows - index}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Original:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {item.original}
                          </p>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                              {t(language, 'translator.preview.translated')} ({targetLang.toUpperCase()}):
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400 leading-relaxed font-medium">
                              {item.translated}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
            {status === 'done' && translatedData.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-2">
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                  ✅ Translation complete! {translatedData.length} rows translated.
                </p>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(translatedData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${outputName || `${datasetName}-translated-${targetLang}`}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg text-sm font-medium hover:scale-[1.02] transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Translated Dataset (JSON)
                </button>
                {currentJob?.hfUrl && (
                  <a
                    href={currentJob.hfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 dark:text-blue-400 hover:underline break-all text-center"
                  >
                    📦 {currentJob.hfUrl}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
