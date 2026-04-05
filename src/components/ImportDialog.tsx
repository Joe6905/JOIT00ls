import { useState } from 'react';
import { X, Github, Link, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import useStore from '../store';
import type { JoiApp } from '../types';
import { fetchAllUserRepos, fetchRepoByUrl } from '../api/github';
import { repoToApp, parseManualUrl } from '../utils';

interface ImportDialogProps {
  onClose: () => void;
}

type Tab = 'github' | 'manual' | 'url';

export default function ImportDialog({ onClose }: ImportDialogProps) {
  const [tab, setTab] = useState<Tab>('github');
  const [manualUrl, setManualUrl] = useState('');
  const [deployUrl, setDeployUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const { token, addApp, importGitHubRepos } = useStore();

  async function handleRefreshGitHub() {
    if (!token) return;
    setIsLoading(true);
    setStatus('idle');
    try {
      const repos = await fetchAllUserRepos(token);
      importGitHubRepos(repos);
      setStatus('success');
      setMessage(`Synced ${repos.length} repositories from GitHub`);
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to sync');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImportUrl() {
    if (!manualUrl.trim()) return;
    setIsLoading(true);
    setStatus('idle');
    try {
      const isGitHub = manualUrl.includes('github.com');
      
      if (isGitHub && token) {
        const repo = await fetchRepoByUrl(token, manualUrl);
        if (repo) {
          const app = repoToApp(repo);
          if (deployUrl.trim()) {
            app.deployedUrl = deployUrl.trim();
            app.status = 'deployed';
          }
          addApp(app);
          setStatus('success');
          setMessage(`Imported "${repo.name}" successfully!`);
          setManualUrl('');
          setDeployUrl('');
          return;
        }
      }
      
      // Manual fallback
      const partial = parseManualUrl(manualUrl);
      if (deployUrl.trim()) {
        partial.deployedUrl = deployUrl.trim();
        partial.status = 'deployed';
      }
      addApp(partial as JoiApp);
      setStatus('success');
      setMessage('App imported manually!');
      setManualUrl('');
      setDeployUrl('');
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'github', label: 'Sync GitHub', icon: <Github className="w-4 h-4" /> },
    { id: 'manual', label: 'Git URL', icon: <Link className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass-strong rounded-3xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-display font-bold text-white text-xl">Import App</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-6 mt-4 bg-white/5 rounded-xl border border-white/10">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-body font-medium transition-all duration-200 ${
                tab === t.id
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {tab === 'github' && (
            <div className="space-y-4">
              <p className="text-white/50 text-sm font-body">
                Sync all your web repositories from GitHub. Filters out non-web projects automatically.
              </p>
              <button
                onClick={handleRefreshGitHub}
                disabled={isLoading || !token}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Sync from GitHub</>
                )}
              </button>
              {!token && (
                <p className="text-yellow-400/60 text-xs text-center">Connect GitHub first to use this feature</p>
              )}
            </div>
          )}

          {tab === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs font-body mb-2 block">Repository URL</label>
                <input
                  type="url"
                  value={manualUrl}
                  onChange={e => setManualUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs font-body mb-2 block">Deployed URL (optional)</label>
                <input
                  type="url"
                  value={deployUrl}
                  onChange={e => setDeployUrl(e.target.value)}
                  placeholder="https://myapp.vercel.app"
                  className="input-field w-full"
                />
              </div>
              <button
                onClick={handleImportUrl}
                disabled={isLoading || !manualUrl.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                ) : (
                  <><Link className="w-4 h-4" /> Import Repository</>
                )}
              </button>
            </div>
          )}

          {/* Status */}
          {status !== 'idle' && (
            <div className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
              status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
