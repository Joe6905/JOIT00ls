import { useState, useRef, useEffect } from 'react';
import { X, ExternalLink, RefreshCw, Maximize2, Minimize2, Github, AlertTriangle, Loader2, Monitor, Smartphone } from 'lucide-react';
import useStore from '../store';
import { getPlatformLabel } from '../utils';

export default function AppViewerModal() {
  const { activeApp, setActiveApp } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (activeApp) {
      setIsLoading(true);
      setHasError(false);
      setReloadKey(k => k + 1);
    }
  }, [activeApp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveApp(null);
      if (e.key === 'F5') { e.preventDefault(); handleReload(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!activeApp) return null;

  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    setReloadKey(k => k + 1);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-void animate-scale-in">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 glass-strong border-b border-white/10 flex-shrink-0">
        {/* App info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: `${activeApp.iconColor}25` }}
          >
            {activeApp.favicon ? (
              <img src={activeApp.favicon} alt="" className="w-5 h-5 object-contain" />
            ) : (
              activeApp.iconEmoji
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-white text-sm truncate">{activeApp.name}</span>
              <span className="text-xs text-white/30 font-body hidden sm:block">
                {getPlatformLabel(activeApp.platform)}
              </span>
            </div>
            <div className="text-xs text-white/40 font-mono truncate">{activeApp.deployedUrl}</div>
          </div>
        </div>

        {/* URL Bar */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-xs font-mono text-white/50 truncate">{activeApp.deployedUrl}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleReload}
            className="btn-ghost p-2 rounded-lg"
            title="Reload (F5)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMobile(!isMobile)}
            className={`p-2 rounded-lg transition-all duration-150 ${isMobile ? 'bg-accent/20 text-accent' : 'btn-ghost'}`}
            title="Toggle mobile view"
          >
            {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>

          <button
            onClick={() => window.open(activeApp.deployedUrl!, '_blank')}
            className="btn-ghost p-2 rounded-lg"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.open(activeApp.repoUrl, '_blank')}
            className="btn-ghost p-2 rounded-lg"
            title="View source"
          >
            <Github className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-white/10" />

          <button
            onClick={() => setActiveApp(null)}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all duration-150"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void z-10">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `${activeApp.iconColor}20` }}
              >
                {activeApp.iconEmoji}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-panel border border-border flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-accent animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-white mb-1">Loading {activeApp.name}</p>
              <p className="text-white/40 text-sm">{activeApp.deployedUrl}</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void z-10">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-white mb-2">Cannot load this app</p>
              <p className="text-white/40 text-sm max-w-sm text-center mb-4">
                The app might block embedding via iframe (X-Frame-Options). Try opening it in a new tab.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleReload} className="btn-ghost flex items-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
                <button
                  onClick={() => window.open(activeApp.deployedUrl!, '_blank')}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" /> Open in New Tab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Iframe */}
        <div
          className={`h-full transition-all duration-300 ${
            isMobile ? 'w-[390px] shadow-2xl border-x border-white/10' : 'w-full'
          }`}
        >
          <iframe
            ref={iframeRef}
            key={reloadKey}
            src={activeApp.deployedUrl!}
            className="w-full h-full"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={activeApp.name}
            allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; payment"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
          />
        </div>

        {/* Mobile indicator */}
        {isMobile && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-xs font-body">
            390px — iPhone 14 Pro
          </div>
        )}
      </div>
    </div>
  );
}
