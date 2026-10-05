import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/views/LandingPage';
import { AppDashboard } from './components/views/AppDashboard';
import { PublicContentView } from './components/views/PublicContentView';
import { AuthModal } from './components/modals/AuthModal';
import { GraphQLExplorerModal } from './components/modals/GraphQLExplorerModal';
import { User } from './types';
import { api, getStoredUser, getStoredToken, clearStoredAuth } from './api/client';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'public_doc'>('landing');
  const [publicSlug, setPublicSlug] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGraphQLModalOpen, setIsGraphQLModalOpen] = useState(false);

  // Check URL pathname or hash on mount and on popstate
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      if (path.startsWith('/d/')) {
        const slug = path.substring(3);
        setPublicSlug(slug);
        setCurrentView('public_doc');
      } else if (path === '/app') {
        setCurrentView('app');
      } else {
        // default landing
        setCurrentView('landing');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Check stored auth session
  useEffect(() => {
    const cached = getStoredUser();
    if (cached) {
      setCurrentUser(cached);
    }
    const token = getStoredToken();
    if (token) {
      api.getMe()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          clearStoredAuth();
          setCurrentUser(null);
        });
    }
  }, []);

  const navigateTo = (view: 'landing' | 'app') => {
    setCurrentView(view);
    const newPath = view === 'app' ? '/app' : '/';
    window.history.pushState({}, '', newPath);
  };

  const openPublicDoc = (slug: string) => {
    setPublicSlug(slug);
    setCurrentView('public_doc');
    window.history.pushState({}, '', `/d/${slug}`);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    navigateTo('landing');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenGraphQL={() => setIsGraphQLModalOpen(true)}
      />

      {/* View routing */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onEnterApp={() => {
              if (!currentUser) {
                setIsAuthModalOpen(true);
              } else {
                navigateTo('app');
              }
            }}
            onOpenDoc={openPublicDoc}
            onOpenGraphQLModal={() => setIsGraphQLModalOpen(true)}
          />
        )}

        {currentView === 'app' && (
          <AppDashboard
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onViewPublicDoc={openPublicDoc}
          />
        )}

        {currentView === 'public_doc' && (
          <PublicContentView
            slug={publicSlug}
            onNavigateHome={() => navigateTo('landing')}
            onOpenApp={() => navigateTo('app')}
          />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          navigateTo('app');
        }}
      />

      <GraphQLExplorerModal
        isOpen={isGraphQLModalOpen}
        onClose={() => setIsGraphQLModalOpen(false)}
      />
    </div>
  );
}
