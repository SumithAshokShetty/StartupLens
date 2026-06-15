import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setView('dashboard');
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        setView('dashboard');
      } else if (!isGuest) {
        setView('landing');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isGuest]);

  const handleBack = (target?: string) => {
    setView('landing');
    if (target) {
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    setUser(null);
    setView('landing');
  };

  return (
    <>
      {view === 'landing' ? (
        <LandingPage 
          onStart={() => setView('dashboard')} 
          onStartAsGuest={() => {
            setIsGuest(true);
            setView('dashboard');
          }}
          user={user}
        />
      ) : (
        <Dashboard 
          onBack={handleBack} 
          user={user} 
          isGuest={isGuest} 
          onLogout={handleLogout} 
        />
      )}
    </>
  );
}

export default App;
