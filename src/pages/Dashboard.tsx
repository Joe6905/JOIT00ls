import { useState, useRef } from 'react';
import { Pin, Inbox, Sparkles } from 'lucide-react';
import useStore from '../store';
import AppCard from '../components/AppCard';
import type { JoiApp, TechStack } from '../types';

interface DashboardProps {
  onOpenImport: () => void;
}

export default function Dashboard({ onOpenImport }: DashboardProps) {
  const { apps, searchQuery, filterTech, filterStatus } = useStore();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const { reorderApps } = useStore();

  // Filtered + sorted apps
  const filtered = apps
    .filter(app => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!app.name.toLowerCase().includes(q) &&
            !app.description.toLowerCase().includes(q) &&
            !app.techStack.some(t => t.toLowerCase().includes(q))) return false;
      }
      if (filterTech !== 'all') {
        if (!app.techStack.includes(filterTech as TechStack)) return false;
      }
      if (filterStatus !== 'all') {
        if (app.status !== filterStatus) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  const pinned = filtered.filter(a => a.pinned);
  const rest = filtered.filter(a => !a.pinned);

  const handleDrop = () => {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      reorderApps(dragFrom, dragOver);
    }
    setDragFrom(null);
    setDragOver(null);
  };

  if (apps.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/20 to-accent-cyan/20 border border-accent/20 flex items-center justify-center text-3xl mx-auto mb-6">
            🚀
          </div>
          <h2 className="font-display font-bold text-white text-2xl mb-3">No apps yet</h2>
          <p className="text-white/40 text-sm mb-6 font-body leading-relaxed">
            Import your GitHub repositories to get started. Connect GitHub and sync your projects.
          </p>
          <button onClick={onOpenImport} className="btn-primary inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Import First App
          </button>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="font-display font-semibold text-white text-xl mb-2">No results</h2>
          <p className="text-white/40 text-sm">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-8">
      {/* Pinned Section */}
      {pinned.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Pin className="w-4 h-4 text-accent fill-accent" />
            <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wider">Pinned</h2>
            <span className="text-white/30 text-xs">({pinned.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinned.map((app, i) => (
              <AppCard
                key={app.id}
                app={app}
                index={i}
                onDragStart={setDragFrom}
                onDragOver={setDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Apps */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-4 h-4 text-white/40" />
          <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wider">
            {pinned.length > 0 ? 'All Apps' : 'Apps'}
          </h2>
          <span className="text-white/30 text-xs">({rest.length})</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rest.map((app, i) => (
            <AppCard
              key={app.id}
              app={app}
              index={pinned.length + i}
              onDragStart={setDragFrom}
              onDragOver={setDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
