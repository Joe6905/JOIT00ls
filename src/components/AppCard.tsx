import { useState, useRef } from 'react';
import { Star, ExternalLink, Github, Pin, Trash2, Edit3, Globe } from 'lucide-react';
import type { JoiApp } from '../types';
import useStore from '../store';
import { formatRelativeTime, getPlatformColor, getPlatformLabel } from '../utils';

interface AppCardProps {
  app: JoiApp;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
}

export default function AppCard({ app, index, onDragStart, onDragOver, onDrop }: AppCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { setActiveApp, togglePin, removeApp, updateApp } = useStore();

  const handleOpen = () => {
    if (app.deployedUrl) {
      setActiveApp(app);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
    onDragStart(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const platformColor = getPlatformColor(app.platform);
  const isDeployed = app.status === 'deployed' && !!app.deployedUrl;

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={onDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowActions(false); }}
      className={`card group cursor-pointer relative overflow-hidden select-none
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${isHovered ? 'border-white/20 shadow-lg shadow-black/30 -translate-y-1' : 'border-border'}
      `}
      style={{ transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Gradient accent top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-60 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${app.iconColor}, transparent)`,
          opacity: isHovered ? 1 : 0.3,
        }}
      />

      {/* Pin indicator */}
      {app.pinned && (
        <div className="absolute top-3 right-3 z-10">
          <Pin className="w-3 h-3 text-accent fill-accent" />
        </div>
      )}

      <div className="p-5">
        {/* Icon + Name */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden"
            style={{ background: `${app.iconColor}20`, border: `1px solid ${app.iconColor}30` }}
          >
            {app.favicon ? (
              <img
                src={app.favicon}
                alt={app.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={app.favicon ? 'hidden' : ''}>{app.iconEmoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-white text-base leading-tight truncate mb-1">
              {app.name}
            </h3>
            <p className="text-white/40 text-xs line-clamp-2 font-body leading-relaxed">
              {app.description}
            </p>
          </div>
        </div>

        {/* Tech Stack Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {app.techStack.slice(0, 3).map(tech => (
            <span key={tech} className="tech-tag">{tech}</span>
          ))}
          {app.techStack.length > 3 && (
            <span className="tech-tag">+{app.techStack.length - 3}</span>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isDeployed ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: isDeployed ? platformColor : '#4a4a6a' }}
            />
            <span className="text-xs font-body" style={{ color: isDeployed ? platformColor : '#4a4a6a' }}>
              {isDeployed ? getPlatformLabel(app.platform) : 'Not deployed'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-white/30">
            {app.stars > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Star className="w-3 h-3" />
                {app.stars}
              </div>
            )}
            <span className="text-xs">{formatRelativeTime(app.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Hover Actions Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 transition-all duration-200 ${
          isHovered && showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ActionButton icon={<Github className="w-4 h-4" />} label="Repo" onClick={() => window.open(app.repoUrl, '_blank')} />
        {isDeployed && (
          <ActionButton icon={<Globe className="w-4 h-4" />} label="Open" onClick={handleOpen} primary />
        )}
        <ActionButton icon={<Pin className="w-4 h-4" />} label={app.pinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(app.id)} />
        <ActionButton icon={<Trash2 className="w-4 h-4" />} label="Remove" onClick={() => removeApp(app.id)} danger />
      </div>

      {/* Bottom bar: click to show actions or open */}
      <div
        className="absolute inset-0 flex items-end"
        onClick={() => {
          if (!showActions) setShowActions(true);
          else if (isDeployed) handleOpen();
        }}
      />

      {/* Quick open button (visible on hover if deployed) */}
      {isDeployed && !showActions && isHovered && (
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <button
            onClick={handleOpen}
            className="w-full py-2 rounded-xl text-xs font-display font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: `${app.iconColor}20`,
              border: `1px solid ${app.iconColor}40`,
              color: app.iconColor,
            }}
          >
            <ExternalLink className="w-3 h-3" />
            Open App
          </button>
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}

function ActionButton({ icon, label, onClick, primary, danger }: ActionButtonProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-150 hover:scale-110 active:scale-95 ${
        primary ? 'bg-accent hover:bg-accent/90 text-white' :
        danger ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' :
        'bg-white/10 hover:bg-white/20 text-white/80'
      }`}
    >
      {icon}
      <span className="text-xs font-body">{label}</span>
    </button>
  );
}
