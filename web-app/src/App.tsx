import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ExerciseGallery from './components/ExerciseGallery';
import AIChatFAB from './components/AIChatFAB';
import AuthOTP from './components/AuthOTP';
import Routines from './components/Routines';
import { Sparkles, Trophy } from 'lucide-react';

export type ViewState = 'explorar' | 'rutinas';
export type ThemeMode = 'dark' | 'light';

export interface Routine {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  exercises: number;
  exerciseList?: string[];  // Named exercises for WorkoutTimer
  image: string;
  isAiGenerated?: boolean;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('explorar');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [routines, setRoutines] = useState<Routine[]>([]);

  // ── Initialise from localStorage ──────────────────────────────────────────
  useEffect(() => {
    const savedSession = localStorage.getItem('tf_session');
    const savedTheme   = localStorage.getItem('tf_theme') as ThemeMode;
    const savedRoutines = localStorage.getItem('tf_routines');

    if (savedSession) setIsAuthenticated(true);
    setTheme(savedTheme === 'light' ? 'light' : 'dark');

    if (savedRoutines) {
      try { setRoutines(JSON.parse(savedRoutines)); } catch { /* ignore */ }
    } else {
      // Default starter routine
      setRoutines([{
        id: '1',
        title: 'Fuerza Total Llama-3',
        description: 'Plan optimizado para hipertrofia y desarrollo de fuerza base.',
        duration: '45 min',
        difficulty: 'Intermedio',
        exercises: 6,
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
        isAiGenerated: true,
      }]);
    }
  }, []);

  // ── Apply theme class to <html> so CSS vars propagate everywhere ───────────
  useEffect(() => {
    document.documentElement.classList.remove('dark-theme', 'light-theme');
    document.documentElement.classList.add(`${theme}-theme`);
    localStorage.setItem('tf_theme', theme);
  }, [theme]);

  // ── Persist routines ───────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('tf_routines', JSON.stringify(routines));
  }, [routines]);

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

  const addRoutine = (r: Omit<Routine, 'id'>) => {
    setRoutines(prev => [{ ...r, id: Date.now().toString() }, ...prev]);
    setCurrentView('rutinas');
  };

  const deleteRoutine = (id: string) =>
    setRoutines(prev => prev.filter(r => r.id !== id));

  const handleLogin = (phone: string) => {
    localStorage.setItem('tf_session', phone);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('tf_session');
    setIsAuthenticated(false);
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!isAuthenticated) return <AuthOTP onLogin={handleLogin} />;

  return (
    <div className="min-vh-100 pb-5">
      <Navbar
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={setCurrentView}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="container py-5 px-4">
        {currentView === 'rutinas' ? (
          <Routines routines={routines} onDelete={deleteRoutine} />
        ) : (
          <div className="fade-in-up">
            {/* ── Hero Banner ── */}
            <div
              className="glass-card p-5 mb-5 d-flex align-items-center justify-content-between flex-wrap gap-4 overflow-hidden position-relative"
              style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg-color) 100%)' }}
            >
              <div className="position-absolute top-0 end-0 p-5" style={{ opacity: 0.05 }}>
                <Trophy size={220} />
              </div>

              <div className="position-relative" style={{ zIndex: 2 }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Sparkles size={22} className="text-primary-custom" />
                  <span
                    className="text-primary-custom fw-bold text-uppercase small"
                    style={{ letterSpacing: '0.1em' }}
                  >
                    Elite Training Platform
                  </span>
                </div>
                <h1
                  className="fw-bold mb-3"
                  style={{
                    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                    lineHeight: '0.95',
                    letterSpacing: '-3px',
                    color: 'var(--text-main)',
                  }}
                >
                  FORJA TU <br />DESTINO
                </h1>
                <p className="text-muted-custom mb-0 fs-5" style={{ maxWidth: '480px' }}>
                  La plataforma de entrenamiento definitiva. Rutinas inteligentes impulsadas por IA.
                </p>
              </div>

              <div className="glass-card d-flex gap-5 p-4" style={{ zIndex: 2 }}>
                <div className="text-center">
                  <h2 className="mb-0 fw-bold text-primary-custom">1300+</h2>
                  <small
                    className="text-muted-custom fw-bold text-uppercase"
                    style={{ letterSpacing: '0.1em', fontSize: '0.65rem' }}
                  >
                    Técnicas
                  </small>
                </div>
                <div className="text-center border-start border-secondary border-opacity-10 ps-5">
                  <h2 className="mb-0 fw-bold text-primary-custom">4.9★</h2>
                  <small
                    className="text-muted-custom fw-bold text-uppercase"
                    style={{ letterSpacing: '0.1em', fontSize: '0.65rem' }}
                  >
                    Ranking
                  </small>
                </div>
              </div>
            </div>

            {/* ── Exercise Library ── */}
            <ExerciseGallery />
          </div>
        )}
      </main>

      <footer className="py-4 text-center mt-4">
        <div className="container border-top border-secondary border-opacity-10 pt-4">
          <p
            className="mb-0 text-muted-custom small fw-bold text-uppercase"
            style={{ letterSpacing: '0.1em' }}
          >
            &copy; 2026 TRAINFORGE — Built for Greatness.
          </p>
        </div>
      </footer>

      {/* ── AI Coach FAB ── */}
      <AIChatFAB onAddRoutine={addRoutine} />
    </div>
  );
}

export default App;
