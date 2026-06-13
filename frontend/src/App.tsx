import { useState } from 'react';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';

function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');

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

  return (
    <>
      {view === 'landing' ? (
        <LandingPage onStart={() => setView('dashboard')} />
      ) : (
        <Dashboard onBack={handleBack} />
      )}
    </>
  );
}

export default App;
