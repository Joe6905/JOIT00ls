import { useState, useEffect } from 'react';
import useStore from './store';
import TokenInput from './components/TokenInput';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ImportDialog from './components/ImportDialog';
import AppViewerModal from './components/AppViewerModal';

export default function App() {
  const { token, activeApp } = useStore();
  const [showImport, setShowImport] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowImport(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!token) {
    return <TokenInput />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-void grid-noise">
      <Sidebar onImport={() => setShowImport(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h1 className="font-display font-bold text-white text-xl">Dashboard</h1>
            <p className="text-white/30 text-xs font-body">Your personal app workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/30 text-xs font-mono">
              ⌘K Import
            </kbd>
            <button
              onClick={() => setShowImport(true)}
              className="btn-primary text-sm px-4 py-2"
            >
              + Import
            </button>
          </div>
        </header>

        <Dashboard onOpenImport={() => setShowImport(true)} />
      </main>

      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
      {activeApp && <AppViewerModal />}
    </div>
  );
}
