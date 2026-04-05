import { useState } from 'react';
import { X, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import type { JoiApp } from '../types';
import useStore from '../store';
import { detectDeploymentPlatform, getPlatformLabel } from '../utils';

interface DeployLinkDialogProps {
  app: JoiApp;
  onClose: () => void;
}

export default function DeployLinkDialog({ app, onClose }: DeployLinkDialogProps) {
  const [url, setUrl] = useState(app.deployedUrl || '');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { updateApp } = useStore();

  function handleSave() {
    if (!url.trim()) {
      // Remove deployment
      updateApp(app.id, {
        deployedUrl: null,
        platform: null,
        status: 'not-deployed',
        favicon: null,
      });
      setStatus('success');
      setTimeout(onClose, 500);
      return;
    }

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http')) finalUrl = `https://${finalUrl}`;

    const platform = detectDeploymentPlatform(finalUrl);
    updateApp(app.id, {
      deployedUrl: finalUrl,
      platform,
      status: 'deployed',
      favicon: `https://www.google.com/s2/favicons?domain=${finalUrl}&sz=64`,
    });
    setStatus('success');
    setTimeout(onClose, 600);
  }

  const previewPlatform = url ? detectDeploymentPlatform(url.startsWith('http') ? url : `https://${url}`) : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass-strong rounded-3xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-display font-bold text-white text-lg">Link Deployment</h2>
            <p className="text-white/40 text-sm">{app.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-white/50 text-xs font-body mb-2 block">Deployed URL</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://myapp.vercel.app"
                className="input-field w-full pl-11"
                autoFocus
              />
            </div>
          </div>

          {/* Platform Preview */}
          {previewPlatform && (
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-white/60">Detected: <span className="text-white font-medium">{getPlatformLabel(previewPlatform)}</span></span>
            </div>
          )}

          {/* Platform shortcuts */}
          <div>
            <p className="text-white/30 text-xs mb-2">Quick platforms:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '▲ Vercel', placeholder: 'myapp.vercel.app' },
                { label: '◈ Netlify', placeholder: 'myapp.netlify.app' },
                { label: '⬡ GH Pages', placeholder: 'user.github.io/repo' },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => setUrl(`https://${p.placeholder}`)}
                  className="text-xs py-2 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-all border border-white/10 font-body"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {app.deployedUrl && (
              <button
                onClick={() => { setUrl(''); handleSave(); }}
                className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400/70 hover:text-red-400 text-sm font-body transition-all"
              >
                Remove Deployment
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-1 btn-primary"
            >
              {status === 'success' ? '✓ Saved!' : 'Save Link'}
            </button>
          </div>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Deployment linked successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
