import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, Zap, Clock, Trophy, CheckCircle2, Flame, FastForward, Bell } from 'lucide-react';
import type { Routine } from '../App';

const DEFAULT_EXERCISE_NAMES = [
  'Press de Banca', 'Sentadilla Libre', 'Peso Muerto', 'Pull-up / Dominada',
  'Remo con Barra', 'Press Militar', 'Curl de Bíceps', 'Extensión de Tríceps',
];

interface WorkoutTimerProps {
  routine: Routine;
  onBack: () => void;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ routine, onBack }) => {
  const DEFAULT_REST = 90;
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  const TOTAL_SETS = 3;
  const exerciseNames = routine.exerciseList?.length ? routine.exerciseList : DEFAULT_EXERCISE_NAMES.slice(0, routine.exercises);

  useEffect(() => {
    if (!isRunning) return;
    
    if (isResting && seconds <= 0) {
      // Timer finished
      setIsResting(false);
      setIsRunning(false);
      setShowAlert(true);
      // Native vibration/beep if supported
      if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }

    const t = setInterval(() => setSeconds(s => isResting ? s - 1 : s + 1), 1000);
    return () => clearInterval(t);
  }, [isRunning, seconds, isResting]);

  const handleFinishSet = () => {
    if (currentSet < TOTAL_SETS) {
      setCurrentSet(s => s + 1);
      setSeconds(DEFAULT_REST);
      setIsResting(true);
      setIsRunning(true);
    } else if (currentExerciseIdx < exerciseNames.length - 1) {
      setCurrentExerciseIdx(i => i + 1);
      setCurrentSet(1);
      setSeconds(DEFAULT_REST);
      setIsResting(true);
      setIsRunning(true);
    } else {
      setCurrentExerciseIdx(exerciseNames.length); // Completed
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (currentExerciseIdx >= exerciseNames.length) {
    return (
      <div className="text-center py-5 fade-in-up">
        <Trophy size={100} className="text-primary-custom mb-4" />
        <h1 className="fw-black text-white display-3">¡LOGRADO!</h1>
        <p className="text-muted-custom fs-4 mb-5">Has forjado tu rutina: {routine.title}</p>
        <button onClick={onBack} className="btn btn-primary-custom px-5 py-4 rounded-4 fw-black fs-5 shadow-lg">CERRAR SESIÓN</button>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      {/* Visual Alert when timer hits 0 */}
      {showAlert && (
        <div className="position-fixed top-0 start-0 w-100 p-4" style={{ zIndex: 3000, animation: 'slideDown 0.5s ease' }}>
          <div className="alert alert-warning shadow-lg border-0 rounded-4 d-flex align-items-center gap-3 p-4" 
               style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #D45224 100%)', color: 'white' }}>
            <Bell size={32} className="animate-bounce" />
            <div>
              <h5 className="mb-0 fw-black">¡DESCANSO TERMINADO!</h5>
              <small className="opacity-75">Es hora de la siguiente serie.</small>
            </div>
            <button onClick={() => setShowAlert(false)} className="btn-close btn-close-white ms-auto shadow-none"></button>
          </div>
        </div>
      )}

      <button onClick={onBack} className="btn btn-link text-muted-custom p-0 mb-5 d-flex align-items-center gap-2 text-decoration-none fw-bold">
        <ChevronLeft size={20} /> ABANDONAR ENTRENAMIENTO
      </button>

      <div className="row g-5">
        <div className="col-12 col-lg-8">
          <div className="glass-card p-5 text-center position-relative overflow-hidden" 
               style={{ border: isResting ? '3px solid #FF6B35' : '1px solid var(--border-subtle)', transition: 'all 0.3s ease' }}>
            
            {isResting && (
              <div className="position-absolute top-0 start-0 h-100 bg-primary-custom opacity-10" 
                   style={{ width: `${(seconds / DEFAULT_REST) * 100}%`, transition: 'width 1s linear' }} />
            )}

            <div className="d-flex justify-content-center gap-2 mb-4">
              <span className={`badge rounded-pill px-4 py-2 fs-6 ${isResting ? 'bg-primary-custom animate-pulse' : 'bg-secondary'}`} style={{ letterSpacing: '0.1em' }}>
                {isResting ? 'DESCANSO ACTIVO' : `SERIE ${currentSet} DE ${TOTAL_SETS}`}
              </span>
            </div>

            <h1 className="fw-black text-white mb-2 display-4" style={{ letterSpacing: '-1.5px' }}>{exerciseNames[currentExerciseIdx]}</h1>
            <p className="text-muted-custom fw-bold fs-5 mb-5 opacity-75">{routine.title}</p>

            <div style={{ fontSize: '7rem', fontWeight: 900, color: isResting ? '#FF6B35' : 'white', fontFamily: 'monospace', lineHeight: 1 }}>
              {formatTime(seconds)}
            </div>
            
            <div className="d-flex justify-content-center gap-4 mt-5 mb-5">
              <button onClick={() => setSeconds(isResting ? DEFAULT_REST : 0)} className="btn btn-outline-secondary rounded-4 p-3 border-opacity-25" title="Reiniciar">
                <RotateCcw size={32} />
              </button>
              <button onClick={() => setIsRunning(!isRunning)} className="btn btn-primary-custom rounded-4 px-5 py-4 shadow-lg scale-hover">
                {isRunning ? <Pause size={40} /> : <Play size={40} />}
              </button>
              {isResting && (
                <button onClick={() => { setIsResting(false); setSeconds(0); setIsRunning(false); }} className="btn btn-outline-warning rounded-4 p-3 border-opacity-25" title="Saltar descanso">
                  <FastForward size={32} />
                </button>
              )}
            </div>

            {!isResting && (
              <button onClick={handleNext} className="btn btn-primary-custom w-100 p-4 rounded-4 fw-black shadow-lg fs-3 transform-active">
                TERMINAR SERIE
              </button>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="glass-card p-4">
            <h5 className="fw-black mb-4 d-flex align-items-center gap-2" style={{ color: '#FF6B35' }}>
              <Flame size={20} /> LISTA DE EJERCICIOS
            </h5>
            <div className="d-flex flex-column gap-2">
              {exerciseNames.map((name, i) => (
                <div key={i} className={`p-3 rounded-4 d-flex align-items-center gap-3 transition-all ${i === currentExerciseIdx ? 'bg-primary-custom text-white shadow-sm scale-102' : 'bg-dark bg-opacity-20 opacity-50'}`}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    background: i < currentExerciseIdx ? '#10B981' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800
                  }}>
                    {i < currentExerciseIdx ? <CheckCircle2 size={18} /> : i + 1}
                  </div>
                  <span className="fw-bold">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scale-hover:hover { transform: scale(1.05); }
        .scale-102 { transform: scale(1.02); }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        .transform-active:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
};

export default WorkoutTimer;
