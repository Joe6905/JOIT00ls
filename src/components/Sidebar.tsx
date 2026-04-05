import { Search, Plus, RefreshCw, LogOut, Github, Pin, Globe, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import useStore from '../store';
import type { TechStack, AppStatus } from '../types';

interface SidebarProps {
  onImport: () => void;
}

const TECH_FILTERS: { value: TechStack | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'React', label: '⚛️ React' },
  { value: 'TypeScript', label: '🔷 TS' },
  { value: 'JavaScript', label: '🟨 JS' },
  { value: 'HTML', label: '🌐 HTML' },
  { value: 'Next.js', label: '▲ Next' },
  { value: 'Vue', label: '💚 Vue' },
];

const STATUS_FILTERS: { value: AppStatus | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Apps', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { value: 'deployed', label: 'Deployed', icon: <Globe className="w-3.5 h-3.5" /> },
  { value: 'not-deployed', label: 'Local Only', icon: <Github className="w-3.5 h-3.5" /> },
];

export default function Sidebar({ onImport }: SidebarProps) {
  const {
    user, token, apps,
    searchQuery, filterTech, filterStatus,
    setSearchQuery, setFilterTech, setFilterStatus, clearToken
  } = useStore();

  const pinnedCount = apps.filter(a => a.pinned).length;
  const deployedCount = apps.filter(a => a.status === 'deployed').length;

  return (
    <aside className="w-64 flex-shrink-0 h-screen flex flex-col glass border-r border-white/10 overflow-hidden">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center text-lg">
            ⚡
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-base">Joi Tools</h1>
            <p className="text-white/30 text-xs">App Launcher</p>
          </div>
        </div>
      </div>

      {/* User */}
      {user && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-body font-medium truncate">{user.name || user.login}</p>
              <p className="text-white/30 text-xs truncate">@{user.login}</p>
            </div>
            <button
              onClick={clearToken}
              className="text-white/20 hover:text-red-400 transition-colors p-1"
              title="Disconnect"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-white/10">
        {[
          { label: 'Total', value: apps.length },
          { label: 'Live', value: deployedCount },
          { label: 'Pinned', value: pinnedCount },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-xl bg-white/5">
            <div className="font-display font-bold text-white text-lg leading-none">{s.value}</div>
            <div className="text-white/30 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search apps..."
            className="input-field w-full pl-9 py-2 text-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 flex-1 overflow-y-auto scrollbar-thin space-y-5">
        {/* Status Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="w-3 h-3 text-white/30" />
            <span className="text-white/30 text-xs font-body uppercase tracking-wider">Status</span>
          </div>
          <div className="space-y-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-body transition-all duration-150 ${
                  filterStatus === f.value
                    ? 'bg-accent/20 text-accent'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tech Filter */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/30 text-xs font-body uppercase tracking-wider">Technology</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TECH_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilterTech(f.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-body transition-all duration-150 ${
                  filterTech === f.value
                    ? 'bg-accent/25 text-accent border border-accent/40'
                    : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20 hover:text-white/70'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={onImport}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Import App
        </button>
      </div>
    </aside>
  );
}
