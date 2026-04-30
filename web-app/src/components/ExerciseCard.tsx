import React, { useState } from 'react';
import type { Exercise } from '../services/exerciseService';
import { Target, Layers, X, ChevronRight, Dumbbell } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise }) => {
  const [showModal, setShowModal] = useState(false);

  // High-quality sport placeholder from Unsplash
  const placeholderUrl = `https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=600`;
  const imageUrl = exercise.gifUrl || placeholderUrl;

  return (
    <>
      <div
        className="h-100"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
        onClick={() => setShowModal(true)}
      >
        {/* Exercise Image */}
        <div style={{ height: '200px', background: '#111', position: 'relative', overflow: 'hidden' }}>
          <img
            src={imageUrl}
            alt={exercise.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).src = placeholderUrl; }}
          />
          {!exercise.gifUrl && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
              <Dumbbell size={24} className="opacity-50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <span style={{ color: '#FF6B35', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {exercise.target}
            </span>
          </div>
          
          {/* Bold Name */}
          <h5 style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px', lineHeight: '1.2' }}>
            {exercise.name}
          </h5>

          <div className="mt-auto pt-3 border-top border-secondary border-opacity-10 d-flex justify-content-between">
            <div className="d-flex align-items-center gap-2 text-muted-custom small fw-bold">
              <Target size={14} className="text-primary-custom" />
              {exercise.bodyPart}
            </div>
            <div className="d-flex align-items-center gap-2 text-muted-custom small fw-bold">
              <Layers size={14} />
              {exercise.equipment}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 2000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-dark rounded-5 overflow-hidden w-100"
            style={{ maxWidth: '600px', maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div style={{ position: 'relative', height: '300px' }}>
              <img src={imageUrl} className="w-100 h-100 object-fit-cover" />
              <button onClick={() => setShowModal(false)} className="btn position-absolute top-0 end-0 m-3 bg-white bg-opacity-10 rounded-circle text-white p-2">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 300px)' }}>
              <h2 className="fw-black text-white mb-3 text-uppercase">{exercise.name}</h2>
              <div className="d-flex gap-2 mb-4">
                 <span className="badge bg-primary-custom px-3 py-2 rounded-pill">{exercise.bodyPart}</span>
                 <span className="badge bg-secondary px-3 py-2 rounded-pill opacity-75">{exercise.equipment}</span>
              </div>
              <h6 className="fw-bold text-primary-custom mb-3">TÉCNICA DE ELITE</h6>
              <div className="d-flex flex-column gap-3">
                {exercise.instructions.map((step, i) => (
                  <div key={i} className="d-flex gap-3 p-3 rounded-4 bg-white bg-opacity-5 border border-white border-opacity-10">
                    <div className="fw-black text-primary-custom fs-4">{i + 1}</div>
                    <p className="text-white opacity-75 m-0 small">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExerciseCard;
