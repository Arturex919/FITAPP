import React from 'react';
import { Dumbbell, LogOut, Sun, Moon, Bell } from 'lucide-react';
import type { ViewState, ThemeMode } from '../App';

interface NavbarProps {
  onLogout?: () => void;
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, currentView, onViewChange, theme, onToggleTheme }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
      <div className="container px-4">
        <a className="navbar-brand d-flex align-items-center" href="#" onClick={() => onViewChange('explorar')}>
          <div className="me-3 d-flex align-items-center justify-content-center"
               style={{ background: 'var(--primary-color)', borderRadius: '12px', width: '40px', height: '40px' }}>
            <Dumbbell size={22} color="white" />
          </div>
          <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
            TRAINFORGE
          </span>
        </a>

        <button className="navbar-toggler border-0 shadow-none" type="button"
                data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon" style={{ filter: theme === 'light' ? 'invert(1)' : 'none' }}></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto mt-3 mt-lg-0 align-items-center gap-1">
            {(['explorar', 'rutinas'] as ViewState[]).map(view => (
              <li key={view} className="nav-item">
                <button
                  className="nav-link border-0 bg-transparent fw-bold px-4 py-2 rounded-3"
                  onClick={() => onViewChange(view)}
                  style={{
                    color: currentView === view ? 'var(--primary-color)' : 'var(--text-muted)',
                    background: currentView === view ? 'var(--primary-glow)' : 'transparent',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {view === 'explorar' ? 'Explorar' : 'Mis Rutinas'}
                </button>
              </li>
            ))}

            <li className="nav-item ms-3 d-flex gap-2">
              <button
                className="border-0 d-flex align-items-center justify-content-center"
                onClick={onToggleTheme}
                style={{
                  background: 'var(--glass)', border: '1px solid var(--border-subtle)',
                  width: '42px', height: '42px', borderRadius: '12px',
                  color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={onLogout}
                className="d-flex align-items-center justify-content-center gap-2 px-4"
                style={{
                  background: 'var(--primary-color)', border: 'none', borderRadius: '12px',
                  color: 'white', fontWeight: 700, cursor: 'pointer',
                  height: '42px', transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px var(--primary-glow)'
                }}
              >
                <LogOut size={18} />
                <span className="d-none d-md-inline">Salir</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
