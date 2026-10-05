import React from 'react';
import { User } from '../types';
import { Layers, Terminal, LogOut, User as UserIcon, Plus } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'app' | 'public_doc';
  onNavigate: (view: 'landing' | 'app') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenGraphQL: () => void;
  onOpenNewModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenGraphQL,
  onOpenNewModal
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-left font-bold tracking-tight text-neutral-100 hover:text-white transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white font-mono text-xs font-semibold shadow-sm">
            OS
          </div>
          <span className="text-base tracking-tight font-semibold">OmniSpace</span>
        </button>

        {/* Zone 2: 4-5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          <button
            onClick={() => onNavigate('landing')}
            className={`transition-colors hover:text-neutral-100 ${
              currentView === 'landing' ? 'text-neutral-100' : ''
            }`}
          >
            Showcase
          </button>
          
          <button
            onClick={() => onNavigate('app')}
            className={`transition-colors hover:text-neutral-100 ${
              currentView === 'app' ? 'text-neutral-100' : ''
            }`}
          >
            Workspace Console
          </button>

          <button
            onClick={onOpenGraphQL}
            className="flex items-center gap-1.5 transition-colors hover:text-neutral-100 font-mono text-xs"
          >
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Strawberry GraphQL</span>
          </button>

          <a
            href="#architecture"
            onClick={(e) => {
              if (currentView !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => {
                  document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="transition-colors hover:text-neutral-100"
          >
            Architecture
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {currentView === 'app' && onOpenNewModal && (
                <button
                  onClick={onOpenNewModal}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Item</span>
                </button>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-xs font-mono text-neutral-300 border border-neutral-700">
                    {currentUser.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-neutral-300">
                    {currentUser.username}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('app')}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shadow-sm"
              >
                Launch Console
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
