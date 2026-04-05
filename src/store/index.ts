import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStore, JoiApp, GitHubRepo, GitHubUser, TechStack, AppStatus, DeploymentPlatform } from '../types';
import { repoToApp, isWebRepo } from '../utils';

const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      apps: [],
      token: null,
      user: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      filterTech: 'all',
      filterStatus: 'all',
      activeApp: null,

      setToken: (token: string) => set({ token }),
      clearToken: () => set({ token: null, user: null }),
      setUser: (user: GitHubUser | null) => set({ user }),

      addApp: (app: JoiApp) =>
        set(state => ({
          apps: state.apps.some(a => a.id === app.id)
            ? state.apps
            : [app, ...state.apps],
        })),

      updateApp: (id: string, updates: Partial<JoiApp>) =>
        set(state => ({
          apps: state.apps.map(app =>
            app.id === id ? { ...app, ...updates } : app
          ),
        })),

      removeApp: (id: string) =>
        set(state => ({ apps: state.apps.filter(app => app.id !== id) })),

      togglePin: (id: string) =>
        set(state => ({
          apps: state.apps.map(app =>
            app.id === id ? { ...app, pinned: !app.pinned } : app
          ),
        })),

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setSearchQuery: (searchQuery: string) => set({ searchQuery }),
      setFilterTech: (filterTech: TechStack | 'all') => set({ filterTech }),
      setFilterStatus: (filterStatus: AppStatus | 'all') => set({ filterStatus }),
      setActiveApp: (activeApp: JoiApp | null) => set({ activeApp }),

      importGitHubRepos: (repos: GitHubRepo[]) => {
        const webRepos = repos.filter(r => {
          const app = repoToApp(r);
          return isWebRepo(app.techStack);
        });

        const newApps = webRepos.map(repoToApp);
        const existing = get().apps;

        const merged = [...existing];
        for (const newApp of newApps) {
          const idx = merged.findIndex(a => a.id === newApp.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...newApp, pinned: merged[idx].pinned };
          } else {
            merged.push(newApp);
          }
        }

        set({ apps: merged });
      },

      reorderApps: (fromIndex: number, toIndex: number) => {
        const apps = [...get().apps];
        const [moved] = apps.splice(fromIndex, 1);
        apps.splice(toIndex, 0, moved);
        set({ apps });
      },
    }),
    {
      name: 'joi-tools-storage',
      partialize: (state) => ({
        apps: state.apps,
        token: state.token,
        user: state.user,
      }),
    }
  )
);

export default useStore;
