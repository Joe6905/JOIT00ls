/**
 * Joi Tools — Local Auto-Deploy Engine
 * Detects project type, processes files, and deploys to Netlify Drop API
 */

export type ProjectType =
  | 'html'
  | 'react-vite'
  | 'react-cra'
  | 'nextjs'
  | 'typescript'
  | 'vue'
  | 'svelte'
  | 'unknown';

export interface DetectedProject {
  type: ProjectType;
  name: string;
  label: string;
  buildCommand: string | null;
  hasPackageJson: boolean;
  entryFile: string | null;
  canDeployDirect: boolean; // true = no build needed (plain HTML)
  files: FileEntry[];
}

export interface FileEntry {
  path: string;
  content: string | ArrayBuffer;
  isText: boolean;
}

export interface DeployProgress {
  stage: 'detecting' | 'reading' | 'building' | 'packaging' | 'uploading' | 'done' | 'error';
  message: string;
  percent: number;
}

export interface DeployResult {
  success: boolean;
  deployUrl?: string;
  siteId?: string;
  deployId?: string;
  error?: string;
  logs?: string[];
}

// ─── Project Detection ────────────────────────────────────────────────────────

export async function detectProjectType(
  fileList: FileSystemFileEntry[] | File[]
): Promise<DetectedProject> {
  const files: FileEntry[] = [];
  const filePaths: string[] = [];

  // Collect all file paths first
  if (fileList[0] instanceof File) {
    for (const f of fileList as File[]) {
      filePaths.push(f.name);
    }
  }

  // Detect by key files
  const hasPackageJson = filePaths.some(p => p === 'package.json' || p.endsWith('/package.json'));
  const hasIndexHtml = filePaths.some(p => p === 'index.html' || p.endsWith('/index.html'));
  const hasNextConfig = filePaths.some(p =>
    p.includes('next.config') || p.includes('next.config.js') || p.includes('next.config.ts')
  );
  const hasViteConfig = filePaths.some(p => p.includes('vite.config'));
  const hasSvelteConfig = filePaths.some(p => p.includes('svelte.config'));
  const hasVueFiles = filePaths.some(p => p.endsWith('.vue'));
  const hasTsConfig = filePaths.some(p => p === 'tsconfig.json');
  const hasTsFiles = filePaths.some(p => p.endsWith('.ts') || p.endsWith('.tsx'));
  const hasReactFiles = filePaths.some(p => p.endsWith('.jsx') || p.endsWith('.tsx'));
  const hasCssFiles = filePaths.some(p => p.endsWith('.css'));

  const name = detectProjectName(filePaths);

  if (hasNextConfig) {
    return {
      type: 'nextjs',
      name,
      label: 'Next.js',
      buildCommand: 'npm run build',
      hasPackageJson: true,
      entryFile: 'app/page.tsx',
      canDeployDirect: false,
      files,
    };
  }

  if (hasSvelteConfig) {
    return {
      type: 'svelte',
      name,
      label: 'Svelte / SvelteKit',
      buildCommand: 'npm run build',
      hasPackageJson: true,
      entryFile: 'src/App.svelte',
      canDeployDirect: false,
      files,
    };
  }

  if (hasVueFiles) {
    return {
      type: 'vue',
      name,
      label: 'Vue.js',
      buildCommand: 'npm run build',
      hasPackageJson: true,
      entryFile: 'src/App.vue',
      canDeployDirect: false,
      files,
    };
  }

  if (hasViteConfig && (hasReactFiles || hasTsFiles)) {
    return {
      type: 'react-vite',
      name,
      label: 'React + Vite',
      buildCommand: 'npm run build',
      hasPackageJson: true,
      entryFile: 'src/main.tsx',
      canDeployDirect: false,
      files,
    };
  }

  if (hasReactFiles && hasPackageJson) {
    return {
      type: 'react-cra',
      name,
      label: 'React (CRA)',
      buildCommand: 'npm run build',
      hasPackageJson: true,
      entryFile: 'src/index.tsx',
      canDeployDirect: false,
      files,
    };
  }

  if (hasTsFiles && !hasReactFiles) {
    return {
      type: 'typescript',
      name,
      label: 'TypeScript',
      buildCommand: 'npx tsc',
      hasPackageJson,
      entryFile: 'index.ts',
      canDeployDirect: false,
      files,
    };
  }

  // Plain HTML/CSS/JS — can deploy directly!
  if (hasIndexHtml || hasCssFiles || filePaths.some(p => p.endsWith('.html'))) {
    return {
      type: 'html',
      name,
      label: 'HTML / CSS / JS',
      buildCommand: null,
      hasPackageJson: false,
      entryFile: 'index.html',
      canDeployDirect: true,
      files,
    };
  }

  return {
    type: 'unknown',
    name,
    label: 'Unknown Project',
    buildCommand: null,
    hasPackageJson,
    entryFile: null,
    canDeployDirect: false,
    files,
  };
}

function detectProjectName(paths: string[]): string {
  // Try to find package.json name from paths
  const rootPkg = paths.find(p => p === 'package.json');
  if (!rootPkg) {
    // Use first folder name
    const first = paths[0] || '';
    return first.split('/')[0] || 'my-app';
  }
  return 'my-app';
}

// ─── File Reading ─────────────────────────────────────────────────────────────

export async function readFilesFromInput(
  files: FileList | File[]
): Promise<{ entries: FileEntry[]; packageJson: Record<string, unknown> | null }> {
  const entries: FileEntry[] = [];
  let packageJson: Record<string, unknown> | null = null;

  const fileArray = Array.from(files);

  for (const file of fileArray) {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

    // Skip node_modules, .git, dist, build
    if (
      relativePath.includes('node_modules/') ||
      relativePath.includes('.git/') ||
      relativePath.includes('/.next/') ||
      relativePath.includes('/dist/') ||
      relativePath.includes('/build/') ||
      relativePath.includes('/.cache/')
    ) {
      continue;
    }

    const isText = isTextFile(file.name);

    try {
      if (isText) {
        const text = await file.text();
        entries.push({ path: relativePath, content: text, isText: true });

        if (file.name === 'package.json') {
          try {
            packageJson = JSON.parse(text);
          } catch { /* ignore */ }
        }
      } else {
        const buffer = await file.arrayBuffer();
        entries.push({ path: relativePath, content: buffer, isText: false });
      }
    } catch {
      // Skip unreadable files
    }
  }

  return { entries, packageJson };
}

function isTextFile(filename: string): boolean {
  const textExtensions = [
    '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.json',
    '.md', '.txt', '.svg', '.xml', '.yaml', '.yml', '.env',
    '.gitignore', '.toml', '.config', '.vue', '.svelte', '.mjs', '.cjs',
  ];
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return textExtensions.includes(ext);
}

// ─── Netlify Drop Deploy ──────────────────────────────────────────────────────

export async function deployToNetlify(
  entries: FileEntry[],
  netlifyToken: string,
  projectName: string,
  onProgress: (p: DeployProgress) => void
): Promise<DeployResult> {
  const logs: string[] = [];

  try {
    onProgress({ stage: 'packaging', message: 'Packaging files...', percent: 40 });

    // Create a zip blob from file entries
    const zip = await createZipBlob(entries);
    logs.push(`Packaged ${entries.length} files (${formatBytes(zip.size)})`);

    onProgress({ stage: 'uploading', message: 'Creating Netlify site...', percent: 55 });

    // 1. Create a new site
    const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: sanitizeSiteName(projectName),
        custom_domain: null,
      }),
    });

    if (!siteRes.ok) {
      // Try with a unique name
      const uniqueRes = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: null }),
      });
      if (!uniqueRes.ok) {
        const err = await uniqueRes.text();
        throw new Error(`Failed to create site: ${err}`);
      }
      const site = await uniqueRes.json();
      return await uploadZipToSite(site.id, site.name, zip, netlifyToken, logs, onProgress);
    }

    const site = await siteRes.json();
    logs.push(`Site created: ${site.name}.netlify.app`);

    return await uploadZipToSite(site.id, site.name, zip, netlifyToken, logs, onProgress);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Deploy failed';
    return { success: false, error: message, logs };
  }
}

async function uploadZipToSite(
  siteId: string,
  siteName: string,
  zip: Blob,
  token: string,
  logs: string[],
  onProgress: (p: DeployProgress) => void
): Promise<DeployResult> {
  onProgress({ stage: 'uploading', message: 'Uploading to Netlify...', percent: 70 });

  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/zip',
    },
    body: zip,
  });

  if (!deployRes.ok) {
    const err = await deployRes.text();
    throw new Error(`Upload failed: ${err}`);
  }

  const deploy = await deployRes.json();
  logs.push(`Deploy ID: ${deploy.id}`);

  onProgress({ stage: 'uploading', message: 'Waiting for deploy to go live...', percent: 85 });

  // Poll for ready state
  const liveUrl = await pollDeployReady(siteId, deploy.id, token, onProgress);

  return {
    success: true,
    deployUrl: liveUrl || `https://${siteName}.netlify.app`,
    siteId,
    deployId: deploy.id,
    logs,
  };
}

async function pollDeployReady(
  siteId: string,
  deployId: string,
  token: string,
  onProgress: (p: DeployProgress) => void,
  maxAttempts = 30
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const res = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deployId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.state === 'ready') return data.ssl_url || data.url;
      if (data.state === 'error') throw new Error('Deploy failed on Netlify');

      onProgress({
        stage: 'uploading',
        message: `Deploy processing... (${data.state})`,
        percent: 85 + Math.min(i * 2, 12),
      });
    }
  }

  return '';
}

// ─── Zip Creation (pure browser, no lib needed) ───────────────────────────────

async function createZipBlob(entries: FileEntry[]): Promise<Blob> {
  // Use JSZip-compatible manual zip creation
  // We'll use a lightweight approach: create a FormData-compatible multipart
  // Actually, we need real ZIP for Netlify. Use the CompressionStream approach.

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  for (const entry of entries) {
    // Normalize path - remove leading folder name for cleaner structure
    const parts = entry.path.split('/');
    const normalizedPath = parts.length > 1 ? parts.slice(1).join('/') : parts[0];
    if (!normalizedPath) continue;

    if (entry.isText) {
      zip.file(normalizedPath, entry.content as string);
    } else {
      zip.file(normalizedPath, entry.content as ArrayBuffer);
    }
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeSiteName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ─── Netlify Token Validation ─────────────────────────────────────────────────

export async function validateNetlifyToken(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.netlify.com/api/v1/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.full_name || data.email || 'Netlify User';
  } catch {
    return null;
  }
}

// ─── Project Type Config ──────────────────────────────────────────────────────

export const PROJECT_TYPE_INFO: Record<
  ProjectType,
  { icon: string; color: string; deployable: boolean; note: string }
> = {
  html: {
    icon: '🌐',
    color: '#e44d26',
    deployable: true,
    note: 'Deploy instantly — no build needed',
  },
  'react-vite': {
    icon: '⚛️',
    color: '#61dafb',
    deployable: true,
    note: 'Builds with Vite then deploys',
  },
  'react-cra': {
    icon: '⚛️',
    color: '#61dafb',
    deployable: true,
    note: 'Builds with react-scripts then deploys',
  },
  nextjs: {
    icon: '▲',
    color: '#ffffff',
    deployable: true,
    note: 'Deploys via Next.js export',
  },
  typescript: {
    icon: '🔷',
    color: '#3178c6',
    deployable: true,
    note: 'Compiles TS then deploys output',
  },
  vue: {
    icon: '💚',
    color: '#42b883',
    deployable: true,
    note: 'Builds with Vite/Vue CLI then deploys',
  },
  svelte: {
    icon: '🔥',
    color: '#ff3e00',
    deployable: true,
    note: 'Builds SvelteKit then deploys',
  },
  unknown: {
    icon: '📦',
    color: '#4a4a6a',
    deployable: false,
    note: 'Cannot auto-deploy — unknown project type',
  },
};
