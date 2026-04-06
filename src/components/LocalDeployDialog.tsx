import { useState, useRef, useCallback } from 'react';
import {
  X, Upload, FolderOpen, Zap, CheckCircle2, AlertCircle,
  Loader2, Globe, ExternalLink, Copy, ChevronRight, FileCode,
  Rocket, RefreshCw, Terminal
} from 'lucide-react';
import useStore from '../store';
import {
  detectProjectType, readFilesFromInput, deployToNetlify,
  validateNetlifyToken, PROJECT_TYPE_INFO,
  type DetectedProject, type DeployProgress, type DeployResult
} from '../api/localDeploy';
import { generateIconColor, getIconEmoji } from '../utils';
import type { JoiApp, TechStack } from '../types';

interface LocalDeployDialogProps {
  onClose: () => void;
}

type Step = 'drop' | 'token' | 'detected' | 'deploying' | 'done';

export default function LocalDeployDialog({ onClose }: LocalDeployDialogProps) {
  const [step, setStep] = useState<Step>('drop');
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [detected, setDetected] = useState<DetectedProject | null>(null);
  const [netlifyToken, setNetlifyToken] = useState('');
  const [tokenUser, setTokenUser] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [progress, setProgress] = useState<DeployProgress | null>(null);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const folderRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addApp } = useStore();

  // ── Drag & Drop ──────────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const items = Array.from(e.dataTransfer.items);
    const allFiles: File[] = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry?.();
        if (entry?.isDirectory) {
          await collectFilesFromEntry(entry as FileSystemDirectoryEntry, allFiles);
        } else {
          const f = item.getAsFile();
          if (f) allFiles.push(f);
        }
      }
    }

    await processFiles(allFiles);
  }, []);

  async function collectFilesFromEntry(
    entry: FileSystemDirectoryEntry,
    result: File[]
  ): Promise<void> {
    const reader = entry.createReader();
    await new Promise<void>(resolve => {
      reader.readEntries(async entries => {
        for (const e of entries) {
          if (e.isFile) {
            const file = await new Promise<File>(res =>
              (e as FileSystemFileEntry).file(res)
            );
            // Add webkitRelativePath-like property
            Object.defineProperty(file, 'webkitRelativePath', {
              value: e.fullPath.replace(/^\//, ''),
            });
            result.push(file);
          } else if (e.isDirectory) {
            await collectFilesFromEntry(e as FileSystemDirectoryEntry, result);
          }
        }
        resolve();
      });
    });
  }

  async function processFiles(fileList: File[]) {
    if (!fileList.length) return;
    setFiles(fileList);

    const paths = fileList.map(
      f => (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name
    );
    const det = await detectProjectType(paths as unknown as File[]);
    // Override with real file paths
    const updatedDet = { ...det };
    setDetected(updatedDet);
    setStep('token');
  }

  // ── Token Validation ─────────────────────────────────────────────────────────

  async function handleCheckToken() {
    if (!netlifyToken.trim()) return;
    setTokenStatus('checking');
    const user = await validateNetlifyToken(netlifyToken.trim());
    if (user) {
      setTokenUser(user);
      setTokenStatus('valid');
      setStep('detected');
    } else {
      setTokenStatus('invalid');
    }
  }

  // ── Deploy ───────────────────────────────────────────────────────────────────

  async function handleDeploy() {
    if (!detected || !netlifyToken) return;
    setStep('deploying');
    setLogs([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);
    addLog(`🔍 Detected: ${detected.label}`);
    addLog(`📁 Reading ${files.length} files...`);

    setProgress({ stage: 'reading', message: 'Reading project files...', percent: 15 });

    const { entries, packageJson } = await readFilesFromInput(files);
    addLog(`✓ Read ${entries.length} files (skipped node_modules, dist, .git)`);

    if (packageJson) {
      addLog(`📦 Package: ${(packageJson as { name?: string }).name || 'unnamed'} v${(packageJson as { version?: string }).version || '?'}`);
    }

    setProgress({ stage: 'building', message: 'Preparing for deployment...', percent: 35 });

    const projectName =
      (packageJson as { name?: string })?.name ||
      detected.name ||
      'joi-app';

    addLog(`🚀 Deploying "${projectName}" to Netlify...`);

    const deployResult = await deployToNetlify(
      entries,
      netlifyToken.trim(),
      projectName,
      (p) => {
        setProgress(p);
        addLog(`  → ${p.message}`);
      }
    );

    setResult(deployResult);

    if (deployResult.success && deployResult.deployUrl) {
      addLog(`✅ Live at: ${deployResult.deployUrl}`);

      // Add to Joi Tools dashboard
      const techMap: Record<string, TechStack> = {
        html: 'HTML',
        'react-vite': 'React',
        'react-cra': 'React',
        nextjs: 'Next.js',
        typescript: 'TypeScript',
        vue: 'Vue',
        svelte: 'Svelte',
      };

      const app: JoiApp = {
        id: `local-${Date.now()}`,
        name: projectName,
        description: `${detected.label} app — deployed from local folder`,
        repoUrl: '',
        deployedUrl: deployResult.deployUrl,
        platform: 'netlify',
        techStack: [techMap[detected.type] || 'JavaScript'],
        language: detected.type === 'typescript' ? 'TypeScript' : 'JavaScript',
        stars: 0,
        updatedAt: new Date().toISOString(),
        status: 'deployed',
        pinned: false,
        favicon: `https://www.google.com/s2/favicons?domain=${deployResult.deployUrl}&sz=64`,
        iconColor: generateIconColor(projectName),
        iconEmoji: PROJECT_TYPE_INFO[detected.type].icon,
        topics: ['local-deploy'],
        source: 'manual',
      };

      addApp(app);
    } else {
      addLog(`❌ Error: ${deployResult.error}`);
    }

    setStep('done');
    setProgress({ stage: 'done', message: 'Complete!', percent: 100 });
  }

  function handleCopyUrl() {
    if (result?.deployUrl) {
      navigator.clipboard.writeText(result.deployUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleReset() {
    setStep('drop');
    setFiles([]);
    setDetected(null);
    setProgress(null);
    setResult(null);
    setLogs([]);
  }

  // ── Project type info ────────────────────────────────────────────────────────

  const typeInfo = detected ? PROJECT_TYPE_INFO[detected.type] : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={step !== 'deploying' ? onClose : undefined} />

      <div className="relative w-full max-w-xl glass-strong rounded-3xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Auto Deploy</h2>
              <p className="text-white/40 text-xs">Drop your local project → live URL in seconds</p>
            </div>
          </div>
          {step !== 'deploying' && (
            <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 px-6 pt-4">
          {(['drop', 'token', 'detected', 'deploying', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300 ${
                step === s ? 'bg-accent text-white scale-110' :
                ['drop', 'token', 'detected', 'deploying', 'done'].indexOf(step) > i
                  ? 'bg-accent/30 text-accent' : 'bg-white/10 text-white/30'
              }`}>
                {['drop', 'token', 'detected', 'deploying', 'done'].indexOf(step) > i
                  ? '✓' : i + 1}
              </div>
              {i < 4 && <div className={`flex-1 h-px mx-1 ${
                ['drop', 'token', 'detected', 'deploying', 'done'].indexOf(step) > i
                  ? 'bg-accent/40' : 'bg-white/10'
              }`} />}
            </div>
          ))}
        </div>

        <div className="p-6 space-y-4">

          {/* STEP 1: DROP ZONE */}
          {step === 'drop' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-10 text-center cursor-pointer group ${
                  isDragOver
                    ? 'border-accent bg-accent/10 scale-[1.02]'
                    : 'border-white/15 hover:border-white/30 hover:bg-white/5'
                }`}
                onClick={() => folderRef.current?.click()}
              >
                <div className={`text-5xl mb-4 transition-transform duration-300 ${isDragOver ? 'scale-125' : 'group-hover:scale-110'}`}>
                  📁
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">
                  {isDragOver ? 'Drop it!' : 'Drop Your Project Folder'}
                </h3>
                <p className="text-white/40 text-sm mb-4">
                  Drag & drop your entire project folder here
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['HTML/CSS/JS', 'React', 'TypeScript', 'Next.js', 'Vue', 'Svelte'].map(t => (
                    <span key={t} className="tech-tag text-xs">{t}</span>
                  ))}
                </div>

                <input
                  ref={folderRef}
                  type="file"
                  className="hidden"
                  // @ts-ignore
                  webkitdirectory=""
                  multiple
                  onChange={e => e.target.files && processFiles(Array.from(e.target.files))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => folderRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white/60 hover:text-white text-sm"
                >
                  <FolderOpen className="w-4 h-4" />
                  Browse Folder
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white/60 hover:text-white text-sm"
                >
                  <FileCode className="w-4 h-4" />
                  Select Files
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".html,.css,.js,.jsx,.ts,.tsx,.json,.svg,.png,.jpg,.gif,.ico"
                  onChange={e => e.target.files && processFiles(Array.from(e.target.files))}
                />
              </div>

              {/* Supported types */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/30 text-xs font-body mb-3">Supported project types:</p>
                <div className="space-y-2">
                  {Object.entries(PROJECT_TYPE_INFO)
                    .filter(([k]) => k !== 'unknown')
                    .map(([type, info]) => (
                      <div key={type} className="flex items-center gap-2">
                        <span className="text-sm">{info.icon}</span>
                        <span className="text-white/50 text-xs flex-1">{info.note}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${info.deployable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {info.deployable ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TOKEN */}
          {step === 'token' && detected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-2xl">{typeInfo?.icon}</span>
                <div>
                  <p className="font-display font-semibold text-white">{detected.label} detected</p>
                  <p className="text-white/40 text-xs">{typeInfo?.note}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs px-2 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/20">
                    {files.length} files
                  </span>
                </div>
              </div>

              <div>
                <label className="text-white/50 text-xs font-body mb-2 block">
                  Netlify Personal Access Token
                </label>
                <input
                  type="password"
                  value={netlifyToken}
                  onChange={e => { setNetlifyToken(e.target.value); setTokenStatus('idle'); }}
                  onKeyDown={e => e.key === 'Enter' && handleCheckToken()}
                  placeholder="nfp_xxxxxxxxxxxx"
                  className="input-field w-full font-mono text-sm"
                  autoFocus
                />
                <p className="text-white/25 text-xs mt-1.5">
                  Get token at{' '}
                  <a
                    href="https://app.netlify.com/user/applications/personal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    app.netlify.com/user/applications
                  </a>
                </p>
              </div>

              {tokenStatus === 'invalid' && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-4 h-4" />
                  Invalid token. Please check and try again.
                </div>
              )}

              {tokenStatus === 'valid' && (
                <div className="flex items-center gap-2 text-green-400 text-sm p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  Connected as <strong>{tokenUser}</strong>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleReset} className="btn-ghost flex-1 text-sm">
                  ← Back
                </button>
                <button
                  onClick={handleCheckToken}
                  disabled={!netlifyToken.trim() || tokenStatus === 'checking'}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {tokenStatus === 'checking' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>
                  ) : (
                    <>Verify Token <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM & DEPLOY */}
          {step === 'detected' && detected && (
            <div className="space-y-4">
              <div
                className="p-5 rounded-2xl border"
                style={{ borderColor: `${typeInfo?.color}30`, background: `${typeInfo?.color}08` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{typeInfo?.icon}</span>
                  <div>
                    <h3 className="font-display font-bold text-white text-base">{detected.label}</h3>
                    <p className="text-white/40 text-sm">{detected.name}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-white text-sm font-mono">{files.length}</div>
                    <div className="text-white/30 text-xs">files</div>
                  </div>
                </div>
                <p className="text-white/50 text-sm">{typeInfo?.note}</p>
              </div>

              {/* Deploy summary */}
              <div className="space-y-2">
                {[
                  { label: 'Platform', value: '◈ Netlify (Free)' },
                  { label: 'Account', value: tokenUser || 'Netlify User' },
                  { label: 'Build', value: detected.buildCommand || 'None (static deploy)' },
                  { label: 'Time estimate', value: detected.canDeployDirect ? '~10 seconds' : '~60 seconds' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/40 text-sm">{row.label}</span>
                    <span className="text-white text-sm font-mono">{row.value}</span>
                  </div>
                ))}
              </div>

              {!typeInfo?.deployable && (
                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>This project type may not deploy correctly automatically. You can still try or link a deployed URL manually.</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('token')} className="btn-ghost flex-1 text-sm">
                  ← Back
                </button>
                <button
                  onClick={handleDeploy}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                  style={{ background: typeInfo?.color === '#ffffff' ? '#6c63ff' : undefined }}
                >
                  <Zap className="w-4 h-4" />
                  Deploy Now
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: DEPLOYING */}
          {step === 'deploying' && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent to-accent-cyan rounded-full transition-all duration-700"
                  style={{ width: `${progress?.percent || 0}%` }}
                />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
                <Loader2 className="w-5 h-5 text-accent animate-spin flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">{progress?.message}</p>
                  <p className="text-white/40 text-xs capitalize">{progress?.stage}...</p>
                </div>
                <span className="ml-auto font-mono text-accent text-sm">{progress?.percent}%</span>
              </div>

              {/* Live logs */}
              <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                  <Terminal className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-white/30 text-xs font-mono">Deploy Log</span>
                </div>
                <div className="p-4 max-h-40 overflow-y-auto scrollbar-thin space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className="text-xs font-mono text-white/60 leading-relaxed">
                      {log}
                    </div>
                  ))}
                  {!logs.length && (
                    <div className="text-xs font-mono text-white/30">Starting...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: DONE */}
          {step === 'done' && result && (
            <div className="space-y-4">
              {result.success ? (
                <>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="font-display font-bold text-white text-xl mb-1">🎉 Live!</h3>
                    <p className="text-white/40 text-sm">Your app is deployed and running</p>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                    <Globe className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 text-sm font-mono flex-1 truncate">
                      {result.deployUrl}
                    </span>
                    <button
                      onClick={handleCopyUrl}
                      className="text-green-400/60 hover:text-green-400 transition-colors flex-shrink-0"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => window.open(result.deployUrl, '_blank')}
                      className="btn-primary flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open App
                    </button>
                    <button onClick={handleReset} className="btn-ghost flex items-center justify-center gap-2 text-sm">
                      <RefreshCw className="w-4 h-4" />
                      Deploy Another
                    </button>
                  </div>

                  <p className="text-center text-white/30 text-xs">
                    ✓ Added to your Joi Tools dashboard
                  </p>
                </>
              ) : (
                <>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="font-display font-bold text-white text-xl mb-2">Deploy Failed</h3>
                    <p className="text-red-400 text-sm">{result.error}</p>
                  </div>

                  {/* Error logs */}
                  <div className="bg-black/40 rounded-xl border border-red-500/20 p-4 max-h-40 overflow-y-auto scrollbar-thin">
                    {logs.map((log, i) => (
                      <div key={i} className="text-xs font-mono text-white/50 leading-relaxed">{log}</div>
                    ))}
                  </div>

                  <button onClick={handleReset} className="btn-primary w-full flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
