import React, { useState } from 'react';
import { Sun, Moon, Plus } from 'lucide-react';
import { BotLogo } from './BotLogo';

interface HeaderProps {
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  onResetChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTheme, onToggleTheme, onResetChat }) => {
  const [themeAnimating, setThemeAnimating] = useState(false);

  const handleThemeToggle = () => {
    setThemeAnimating(true);
    onToggleTheme();
    setTimeout(() => setThemeAnimating(false), 500);
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-5 py-3.5 backdrop-blur-2xl transition-all"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--header-border)',
        boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center">
          <BotLogo size={30} />
        </div>
        <div className="flex flex-col leading-tight">
          <span
            className="font-display font-bold tracking-tight text-sm sm:text-base"
            style={{ color: 'var(--text-primary)' }}
          >
            North Star
          </span>
          <span className="text-[10px] font-medium flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Support Bot
          </span>
        </div>
      </div>

      {/* Actions: New Chat & Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* New Chat Button */}
        <div className="relative group">
          <button
            onClick={onResetChat}
            className="rounded-full p-2 border backdrop-blur-md transition-all duration-200 hover:scale-110 hover:rotate-90 active:scale-90"
            style={{
              background: 'var(--header-btn-bg)',
              borderColor: 'var(--header-btn-border)',
              color: 'var(--header-btn-text)',
            }}
            aria-label="Start new chat"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
          <span
            className="absolute top-full right-0 mt-2 px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-lg"
            style={{
              background: 'var(--text-primary)',
              color: 'var(--glass-bg)',
            }}
          >
            Start new chat
          </span>
        </div>

        {/* Theme Toggle with spin animation */}
        <button
          onClick={handleThemeToggle}
          className={`rounded-full p-2 border backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-90 ${themeAnimating ? 'animate-[themeSpin_0.5s_ease-out]' : ''}`}
          style={{
            background: 'var(--header-btn-bg)',
            borderColor: 'var(--header-btn-border)',
            color: 'var(--header-btn-text)',
          }}
          title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {currentTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  );
};
