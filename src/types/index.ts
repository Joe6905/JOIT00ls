export type TechStack = 'HTML' | 'CSS' | 'JavaScript' | 'TypeScript' | 'React' | 'Vue' | 'Svelte' | 'Next.js' | 'Unknown';

export type DeploymentPlatform = 'vercel' | 'netlify' | 'github-pages' | 'custom' | null;

export type AppStatus = 'deployed' | 'not-deployed' | 'loading';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
  visibility: string;
}

export interface JoiApp {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  deployedUrl: string | null;
  platform: DeploymentPlatform;
  techStack: TechStack[];
  language: string | null;
  stars: number;
  updatedAt: string;
  status: AppStatus;
  pinned: boolean;
  favicon: string | null;
  iconColor: string;
  iconEmoji: string;
  topics: string[];
  source: 'github' | 'manual';
  githubFullName?: string;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
}

export interface AppStore {
  apps: JoiApp[];
  token: string | null;
  user: GitHubUser | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterTech: TechStack | 'all';
  filterStatus: AppStatus | 'all';
  activeApp: JoiApp | null;
  
  setToken: (token: string) => void;
  clearToken: () => void;
  setUser: (user: GitHubUser | null) => void;
  addApp: (app: JoiApp) => void;
  updateApp: (id: string, updates: Partial<JoiApp>) => void;
  removeApp: (id: string) => void;
  togglePin: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterTech: (tech: TechStack | 'all') => void;
  setFilterStatus: (status: AppStatus | 'all') => void;
  setActiveApp: (app: JoiApp | null) => void;
  importGitHubRepos: (repos: GitHubRepo[]) => void;
  reorderApps: (fromIndex: number, toIndex: number) => void;
}
