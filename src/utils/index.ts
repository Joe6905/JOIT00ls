import type { TechStack, DeploymentPlatform, GitHubRepo, JoiApp } from '../types';

const ICON_COLORS = [
  '#6c63ff', '#ff6584', '#43e8d8', '#f7b731', '#45aaf2',
  '#fd9644', '#a55eea', '#26de81', '#fc5c65', '#2bcbba',
];

const TECH_EMOJIS: Record<string, string> = {
  'React': '⚛️',
  'TypeScript': '🔷',
  'JavaScript': '🟨',
  'HTML': '🌐',
  'CSS': '🎨',
  'Vue': '💚',
  'Svelte': '🔥',
  'Next.js': '▲',
  'Unknown': '📦',
};

export function generateIconColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
}

export function getIconEmoji(techStack: TechStack[]): string {
  if (techStack.length === 0) return '📦';
  return TECH_EMOJIS[techStack[0]] || '📦';
}

export function detectTechStack(repo: GitHubRepo): TechStack[] {
  const techs: TechStack[] = [];
  const lang = repo.language?.toLowerCase() || '';
  const topics = repo.topics.map(t => t.toLowerCase());
  const name = repo.name.toLowerCase();
  const desc = (repo.description || '').toLowerCase();

  const combined = `${lang} ${topics.join(' ')} ${name} ${desc}`;

  if (combined.includes('next') || combined.includes('nextjs')) techs.push('Next.js');
  if (combined.includes('react')) techs.push('React');
  if (combined.includes('vue')) techs.push('Vue');
  if (combined.includes('svelte')) techs.push('Svelte');
  if (lang === 'typescript' || combined.includes('typescript') || combined.includes('ts')) techs.push('TypeScript');
  if (lang === 'javascript' || combined.includes('javascript')) techs.push('JavaScript');
  if (lang === 'html' || combined.includes('html')) techs.push('HTML');
  if (combined.includes('css')) techs.push('CSS');

  if (techs.length === 0) {
    if (lang === 'typescript') return ['TypeScript'];
    if (lang === 'javascript') return ['JavaScript'];
    if (lang === 'html') return ['HTML'];
    return ['Unknown'];
  }

  return [...new Set(techs)];
}

export function isWebRepo(techStack: TechStack[]): boolean {
  const webTechs: TechStack[] = ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Svelte', 'Next.js'];
  return techStack.some(t => webTechs.includes(t));
}

export function detectDeploymentPlatform(url: string | null): DeploymentPlatform {
  if (!url) return null;
  if (url.includes('vercel.app') || url.includes('vercel.com')) return 'vercel';
  if (url.includes('netlify.app') || url.includes('netlify.com')) return 'netlify';
  if (url.includes('github.io')) return 'github-pages';
  return 'custom';
}

export function repoToApp(repo: GitHubRepo): JoiApp {
  const techStack = detectTechStack(repo);
  const deployedUrl = repo.homepage || null;
  const platform = detectDeploymentPlatform(deployedUrl);

  return {
    id: `gh-${repo.id}`,
    name: repo.name,
    description: repo.description || 'No description available',
    repoUrl: repo.html_url,
    deployedUrl,
    platform,
    techStack,
    language: repo.language,
    stars: repo.stargazers_count,
    updatedAt: repo.updated_at,
    status: deployedUrl ? 'deployed' : 'not-deployed',
    pinned: false,
    favicon: deployedUrl ? `https://www.google.com/s2/favicons?domain=${deployedUrl}&sz=64` : null,
    iconColor: generateIconColor(repo.name),
    iconEmoji: getIconEmoji(techStack),
    topics: repo.topics,
    source: 'github',
    githubFullName: repo.full_name,
  };
}

export function parseManualUrl(url: string): Partial<JoiApp> {
  const name = url.split('/').pop()?.replace('.git', '') || 'Unnamed App';
  const isGitHub = url.includes('github.com');
  const techStack: TechStack[] = ['Unknown'];

  return {
    id: `manual-${Date.now()}`,
    name,
    description: 'Manually imported repository',
    repoUrl: isGitHub ? url.replace('.git', '') : url,
    deployedUrl: null,
    platform: null,
    techStack,
    language: null,
    stars: 0,
    updatedAt: new Date().toISOString(),
    status: 'not-deployed',
    pinned: false,
    favicon: null,
    iconColor: generateIconColor(name),
    iconEmoji: '📦',
    topics: [],
    source: 'manual',
  };
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function getPlatformColor(platform: DeploymentPlatform): string {
  switch (platform) {
    case 'vercel': return '#ffffff';
    case 'netlify': return '#00d9b1';
    case 'github-pages': return '#6e40c9';
    case 'custom': return '#43e8d8';
    default: return '#4a4a6a';
  }
}

export function getPlatformLabel(platform: DeploymentPlatform): string {
  switch (platform) {
    case 'vercel': return 'Vercel';
    case 'netlify': return 'Netlify';
    case 'github-pages': return 'GitHub Pages';
    case 'custom': return 'Custom';
    default: return 'None';
  }
}
