import { useState } from 'react';
import { Github, Key, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import useStore from '../store';
import { fetchGitHubUser, fetchAllUserRepos } from '../api/github';

export default function TokenInput() {
  const [inputToken, setInputToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const { setToken, setUser, importGitHubRepos, setLoading } = useStore();

  async function handleConnect() {
    if (!inputToken.trim()) return;

    setStatus('loading');
    setMessage('Authenticating with GitHub...');

    try {
      const user = await fetchGitHubUser(inputToken.trim());
      setMessage(`Hello, ${user.name || user.login}! Fetching repositories...`);
      setUser(user);
      setToken(inputToken.trim());

      const repos = await fetchAllUserRepos(inputToken.trim());
      importGitHubRepos(repos);

      setStatus('success');
      setMessage(`Connected! Imported ${repos.length} repositories.`);
      setLoading(false);
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Connection failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-accent-cyan mb-6 glow-accent">
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-5xl font-display font-bold text-gradient mb-3">Joi Tools</h1>
          <p className="text-white/50 font-body text-lg">Your personal app launcher & workspace OS</p>
        </div>

        {/* Connect Card */}
        <div className="glass-strong rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-white text-lg">Connect GitHub</h2>
              <p className="text-white/40 text-sm">Enter your Personal Access Token</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showToken ? 'text' : 'password'}
                value={inputToken}
                onChange={e => setInputToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="input-field w-full pl-11 pr-11 font-mono text-sm"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleConnect}
              disabled={!inputToken.trim() || status === 'loading'}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <><Github className="w-4 h-4" /> Connect to GitHub</>
              )}
            </button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mt-4 flex items-center gap-3 p-3 rounded-xl text-sm ${
              status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              'bg-white/5 text-white/50 border border-white/10'
            }`}>
              {status === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {status === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
              {message}
            </div>
          )}

          {/* Help */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-white/30 text-xs text-center">
              Create a token at{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:user"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent/80 underline"
              >
                github.com/settings/tokens
              </a>
              {' '}with <code className="font-mono bg-white/10 px-1 rounded">repo</code> scope
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: '🔗', label: 'Import Repos' },
            { icon: '🚀', label: 'Link Deploys' },
            { icon: '🖥️', label: 'Live Preview' },
          ].map(f => (
            <div key={f.label} className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-white/40 text-xs font-body">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
