import React, { useState } from 'react';
import { Play, Clock, Dumbbell, Sparkles, Trash2, ChevronRight, Activity } from 'lucide-react';
import type { Routine } from '../App';
import WorkoutTimer from './WorkoutTimer';

interface RoutinesProps {
  routines: Routine[];
  onDelete: (id: string) => void;
}

const Routines: React.FC<RoutinesProps> = ({ routines, onDelete }) => {
  const [activeWorkout, setActiveWorkout] = useState<Routine | null>(null);

  if (activeWorkout) {
    return <WorkoutTimer routine={activeWorkout} onBack={() => setActiveWorkout(null)} />;
  }

  return (
    <div className="fade-in-up">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4 mb-5">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <Activity className="text-primary-custom" size={20} />
            <span className="text-primary-custom fw-bold text-uppercase ls-1 small">Centro de Entrenamiento</span>
          </div>
          <h2 className="display-6 fw-bold mb-0">Mis Rutinas</h2>
          <p className="text-muted-custom mt-2 mb-0 fs-5">Tus planes personalizados listos para ejecutar.</p>
        </div>
        {routines.length > 0 && (
          <div className="glass-card d-flex align-items-center gap-3 px-4 py-3">
            <Sparkles className="text-primary-custom" size={24} />
            <div>
              <h4 className="mb-0 fw-bold">{routines.filter(r => r.isAiGenerated).length}</h4>
              <small className="text-muted-custom fw-bold text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Generadas por IA</small>
            </div>
          </div>
        )}
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-5 glass-card d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '400px' }}>
          <div style={{ padding: '1.5rem', borderRadius: '50%', background: 'var(--glass)', marginBottom: '1.5rem' }}>
            <Dumbbell size={60} className="text-primary-custom" />
          </div>
          <h3 className="fw-bold">Aún no tienes rutinas</h3>
          <p className="text-muted-custom mx-auto" style={{ maxWidth: '400px' }}>
            Habla con tu Coach Virtual y pídele una rutina. Con un clic la tendrás guardada aquí.
          </p>
        </div>
      ) : (
        <div className="row g-4 mb-5">
          {routines.map(routine => (
            <div key={routine.id} className="col-12 col-xl-6">
              <div className="glass-card overflow-hidden h-100">
                <div className="row g-0 h-100">
                  {/* Image */}
                  <div className="col-12 col-md-5 position-relative overflow-hidden">
                    <img
                      src={routine.image}
                      className="w-100 h-100"
                      alt={routine.title}
                      style={{ objectFit: 'cover', minHeight: '240px' }}
                    />
                    <div className="position-absolute inset-0 top-0 start-0 end-0 bottom-0"
                         style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
                    {routine.isAiGenerated && (
                      <div className="position-absolute top-0 start-0 m-3">
                        <div style={{
                          background: 'rgba(0,0,0,0.8)',
                          color: 'var(--primary-color)',
                          padding: '5px 14px',
                          borderRadius: '100px',
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          letterSpacing: '1px',
                          border: '1px solid var(--primary-glow)',
                          display: 'flex', alignItems: 'center', gap: '5px'
                        }}>
                          <Sparkles size={10} /> IA COACH
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="col-12 col-md-7">
                    <div className="p-4 p-lg-5 d-flex flex-column h-100">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h4 className="fw-bold mb-1 text-main">{routine.title}</h4>
                          <span className="text-primary-custom small fw-bold text-uppercase" style={{ letterSpacing: '0.05em' }}>
                            {routine.difficulty}
                          </span>
                        </div>
                        <button
                          className="btn p-2 text-danger border-0 bg-transparent"
                          onClick={() => onDelete(routine.id)}
                          style={{ opacity: 0.6, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <p className="text-muted-custom mb-4 flex-grow-1" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {routine.description}
                      </p>

                      <div className="d-flex gap-4 mb-4 pt-3 border-top border-secondary border-opacity-10">
                        <div className="d-flex align-items-center gap-2 text-muted-custom small">
                          <Clock size={16} className="text-primary-custom" />
                          <span className="fw-bold">{routine.duration}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-muted-custom small">
                          <Dumbbell size={16} className="text-primary-custom" />
                          <span className="fw-bold">{routine.exercises} Ejercicios</span>
                        </div>
                      </div>

                      <button
                        className="btn btn-primary-custom w-100 d-flex align-items-center justify-content-center gap-2 py-3 fw-bold"
                        onClick={() => setActiveWorkout(routine)}
                      >
                        <Play size={18} fill="white" />
                        ENTRENAR AHORA
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .ls-1 { letter-spacing: 0.1em; }
      `}</style>
    </div>
  );
};

export default Routines;
