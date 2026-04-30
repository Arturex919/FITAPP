import React, { useEffect, useState } from 'react';
import { fetchExercises, fetchBodyParts } from '../services/exerciseService';
import type { Exercise } from '../services/exerciseService';
import ExerciseCard from './ExerciseCard';
import { Loader2, Search, RefreshCcw, Sparkles, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const ExerciseGallery = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const loadData = async (newOffset = offset, categoryId = activeCategoryId) => {
    setLoading(true);
    try {
      const [data, catData] = await Promise.all([
        fetchExercises(LIMIT, newOffset, categoryId),
        categories.length === 0 ? fetchBodyParts() : Promise.resolve(categories)
      ]);
      setExercises(data || []);
      if (categories.length === 0) setCategories(catData);
      setOffset(newOffset);
      setActiveCategoryId(categoryId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Gallery load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(0, 'all'); }, []);

  const handleCategoryChange = (id: string) => {
    loadData(0, id);
  };

  const handleNext = () => loadData(offset + LIMIT);
  const handlePrev = () => loadData(Math.max(0, offset - LIMIT));

  const filtered = exercises.filter(ex =>
    (ex.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div className="row mb-4 align-items-center g-4">
        <div className="col-12 col-xl-7">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Sparkles size={20} className="text-primary-custom" />
            <span className="text-primary-custom fw-black text-uppercase small" style={{ letterSpacing: '0.2em' }}>
              Base de Datos wger (Español)
            </span>
          </div>
          <h2 className="fw-black text-white mb-1" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>
            Explora Movimientos
          </h2>
        </div>
        
        <div className="col-12 col-xl-5">
          <div className="glass-card p-2 d-flex gap-2">
            <div className="flex-grow-1 position-relative">
              <Search size={20} className="position-absolute top-50 translate-middle-y ms-3 opacity-50 text-white" />
              <input
                type="text"
                placeholder="Busca un ejercicio..."
                className="form-control bg-transparent border-0 py-3 ps-5 text-white"
                style={{ boxShadow: 'none' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => loadData(0)} className="btn btn-primary-custom rounded-3 px-4 shadow-none">
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="d-flex align-items-center gap-2 mb-5 overflow-auto pb-3" style={{ scrollbarWidth: 'none' }}>
        <div className="bg-primary-custom p-2 rounded-3 text-white me-2">
          <Filter size={18} />
        </div>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`btn rounded-4 px-4 py-2 fw-black text-nowrap transition-all ${
              activeCategoryId === cat.id ? 'btn-primary-custom shadow-lg' : 'btn-outline-secondary'
            }`}
            style={{ 
              fontSize: '0.85rem',
              border: activeCategoryId === cat.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: activeCategoryId === cat.id ? 'white' : 'var(--text-muted)'
            }}
          >
            {cat.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-4">
          <Loader2 size={60} className="animate-spin text-primary-custom" />
          <h4 className="text-muted-custom fw-bold">Cargando base de datos...</h4>
        </div>
      ) : (
        <>
          <div className="row g-4 mb-5">
            {filtered.map(ex => (
              <div key={ex.id} className="col-12 col-md-6 col-xl-3" style={{ minHeight: '380px' }}>
                <ExerciseCard exercise={ex} />
              </div>
            ))}
          </div>

          {/* Real Pagination Buttons */}
          <div className="d-flex justify-content-center align-items-center gap-4 pb-5">
            <button 
              disabled={offset === 0}
              onClick={handlePrev}
              className="btn btn-outline-secondary rounded-circle p-3 transition-all"
              style={{ width: '60px', height: '60px', opacity: offset === 0 ? 0.3 : 1 }}
            >
              <ChevronLeft size={32} />
            </button>
            
            <div className="text-center">
              <span className="d-block fw-black text-white" style={{ fontSize: '1.2rem' }}>PÁGINA {(offset / LIMIT) + 1}</span>
              <small className="text-muted-custom fw-bold">MOSTRANDO {offset + 1} - {offset + exercises.length}</small>
            </div>

            <button 
              disabled={exercises.length < LIMIT}
              onClick={handleNext}
              className="btn btn-outline-secondary rounded-circle p-3 transition-all"
              style={{ width: '60px', height: '60px', opacity: exercises.length < LIMIT ? 0.3 : 1 }}
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExerciseGallery;
