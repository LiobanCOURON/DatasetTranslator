import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, TranslationJob } from '../store';
import { t } from '../i18n';
import {
  Home,
  Languages,
  ExternalLink,
  Upload,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pause,
  X,
  Database,
} from 'lucide-react';

export function HistoryPage() {
  const { language, jobs, removeJob, updateJob } = useAppStore();
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<TranslationJob | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: any; color: string; bg: string }> = {
      translating: { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
      paused: { icon: Pause, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
      done: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
      error: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
      downloading: { icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
      uploading: { icon: Loader2, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    };
    const config = configs[status] || configs.paused;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className={`w-3 h-3 ${status === 'translating' || status === 'downloading' || status === 'uploading' ? 'animate-spin' : ''}`} />
        {t(language, `history.status.${status === 'downloading' || status === 'uploading' ? 'translating' : status}`)}
      </span>
    );
  };

  const handleViewDetails = (job: TranslationJob) => {
    setSelectedJob(job);
    setShowDetail(true);
  };

  const handleResume = (job: TranslationJob) => {
    updateJob(job.id, { status: 'translating' });
    setShowDetail(false);
    navigate('/translator');
  };

  const handleUpload = (job: TranslationJob) => {
    updateJob(job.id, { status: 'uploading' });
    setTimeout(() => {
      updateJob(job.id, {
        status: 'done',
        hfUrl: `https://huggingface.co/datasets/${job.userName}/${job.outputName}`,
      });
      if (selectedJob?.id === job.id) {
        setSelectedJob({ ...job, status: 'done', hfUrl: `https://huggingface.co/datasets/${job.userName}/${job.outputName}` });
      }
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="glass-pill rounded-full p-2 hover:bg-white/60 dark:hover:bg-white/20 transition-all">
          <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 bg-clip-text text-transparent">
          {t(language, 'history.title')}
        </h1>
        <button onClick={() => navigate('/translator')} className="ml-auto glass-pill rounded-full p-2 hover:bg-white/60 dark:hover:bg-white/20 transition-all">
          <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Job List */}
      {jobs.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {t(language, 'history.empty')}
          </p>
          <button
            onClick={() => navigate('/translator')}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:scale-105 transition-all"
          >
            {t(language, 'main.goTranslator')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="glass-card rounded-2xl p-5 hover:scale-[1.01] transition-all duration-300 cursor-pointer group"
              onClick={() => handleViewDetails(job)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {job.outputName}
                    </h3>
                    {getStatusBadge(job.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t(language, 'history.originalDataset')}:</span>
                      <span className="ml-1 text-gray-700 dark:text-gray-200 font-medium">{job.datasetName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t(language, 'history.targetLanguage')}:</span>
                      <span className="ml-1 text-gray-700 dark:text-gray-200 font-medium uppercase">{job.targetLang}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">{t(language, 'history.progress')}:</span>
                      <span className="ml-1 text-gray-700 dark:text-gray-200 font-medium">{job.progress}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        job.status === 'done'
                          ? 'bg-gradient-to-r from-green-400 to-green-500'
                          : job.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-blue-400 to-blue-500'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {job.status === 'done' && job.hfUrl && (
                    <a
                      href={job.hfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/20 transition-all"
                      title="Open on Hugging Face"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                    </a>
                  )}
                  {(job.status === 'paused' || job.status === 'error') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleResume(job); }}
                      className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/20 transition-all"
                      title={t(language, 'history.resume')}
                    >
                      <Play className="w-4 h-4 text-green-500" />
                    </button>
                  )}
                  {job.status === 'done' && !job.hfUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpload(job); }}
                      className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/20 transition-all"
                      title={t(language, 'history.upload')}
                    >
                      <Upload className="w-4 h-4 text-purple-500" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                    title={t(language, 'history.delete')}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(job.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <div
            className="glass-card rounded-3xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {t(language, 'history.viewDetails')}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  {getStatusBadge(selectedJob.status)}
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedJob.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${selectedJob.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedJob.translatedRows.toLocaleString()} / {selectedJob.totalRows.toLocaleString()} {t(language, 'translator.rows')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t(language, 'history.originalDataset')}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{selectedJob.datasetName}</p>
                </div>
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t(language, 'history.targetLanguage')}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 uppercase">{selectedJob.targetLang}</p>
                </div>
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t(language, 'history.outputDataset')}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{selectedJob.outputName}</p>
                </div>
                <div className="glass-card rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Method</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize">{selectedJob.method}</p>
                </div>
              </div>

              {selectedJob.hfUrl && (
                <div className="glass-card rounded-xl p-3 bg-green-50/50 dark:bg-green-900/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t(language, 'history.outputDataset')} (HF)</p>
                  <a
                    href={selectedJob.hfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all flex items-center gap-1"
                  >
                    {selectedJob.hfUrl}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {(selectedJob.status === 'paused' || selectedJob.status === 'error') && (
                  <button
                    onClick={() => handleResume(selectedJob)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium hover:scale-[1.02] transition-all"
                  >
                    <Play className="w-4 h-4" />
                    {t(language, 'history.resume')}
                  </button>
                )}
                {selectedJob.status === 'done' && !selectedJob.hfUrl && (
                  <button
                    onClick={() => handleUpload(selectedJob)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:scale-[1.02] transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    {t(language, 'history.upload')}
                  </button>
                )}
                {selectedJob.status === 'done' && selectedJob.hfUrl && (
                  <a
                    href={selectedJob.hfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-medium hover:scale-[1.02] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open on Hugging Face
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
