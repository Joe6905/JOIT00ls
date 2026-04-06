import { useState, useEffect } from 'react';
import useStore from './store';
import TokenInput from './components/TokenInput';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ImportDialog from './components/ImportDialog';
import AppViewerModal from './components/AppViewerModal';
import LocalDeployDialog from './components/LocalDeployDialog';

export default function App() {
  const { token, activeApp } = useStore();
  const [showImport, setShowImport] = useState(false);
  const [showLocalDeploy, setShowLocalDeploy] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowImport(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowLocalDeploy(true);
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
      <Sidebar
        onImport={() => setShowImport(true)}
        onLocalDeploy={() => setShowLocalDeploy(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h1 className="font-display font-bold text-white text-xl">Dashboard</h1>
            <p className="text-white/30 text-xs font-body">Your personal app workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLocalDeploy(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/25 transition-all text-sm font-display font-semibold"
            >
              ⚡ Auto Deploy
            </button>
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
      {showLocalDeploy && <LocalDeployDialog onClose={() => setShowLocalDeploy(false)} />}
      {activeApp && <AppViewerModal />}
    </div>
  );
}
