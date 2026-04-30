import React from 'react';
import { Apple, Coffee, Utensils, Zap, ChevronRight, Activity, PieChart } from 'lucide-react';

const Nutrition = () => {
  return (
    <div className="fade-in-up">
      <div className="mb-5">
        <div className="d-flex align-items-center gap-2 mb-2">
          <Apple className="text-primary-custom" size={20} />
          <span className="text-primary-custom fw-bold small text-uppercase ls-1">Guía Nutricional Elite</span>
        </div>
        <h2 className="display-6 fw-bold mb-0">Combustible para el Éxito</h2>
        <p className="text-muted-custom mt-2 fs-5">Optimiza tu rendimiento con recomendaciones basadas en ciencia.</p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="glass-card p-5 h-100">
            <div className="p-3 rounded-4 bg-success bg-opacity-10 d-inline-block mb-4">
              <PieChart size={32} color="#10B981" />
            </div>
            <h4 className="fw-bold mb-1">Macros Diarios</h4>
            <p className="text-muted-custom small mb-4">Optimizado para ganar masa muscular limpia.</p>
            
            <div className="mt-5 d-flex flex-column gap-4">
              <div>
                <div className="d-flex justify-content-between small fw-bold mb-2">
                  <span className="text-uppercase ls-1">Proteínas</span>
                  <span className="text-primary-custom">180g / 200g</span>
                </div>
                <div className="progress bg-secondary bg-opacity-10" style={{ height: '10px', borderRadius: '10px' }}>
                  <div className="progress-bar bg-success rounded-pill" style={{ width: '90%' }}></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between small fw-bold mb-2">
                  <span className="text-uppercase ls-1">Carbohidratos</span>
                  <span className="text-main">250g / 300g</span>
                </div>
                <div className="progress bg-secondary bg-opacity-10" style={{ height: '10px', borderRadius: '10px' }}>
                  <div className="progress-bar bg-primary-custom rounded-pill" style={{ width: '83%' }}></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between small fw-bold mb-2">
                  <span className="text-uppercase ls-1">Grasas</span>
                  <span className="text-main">70g / 80g</span>
                </div>
                <div className="progress bg-secondary bg-opacity-10" style={{ height: '10px', borderRadius: '10px' }}>
                  <div className="progress-bar bg-warning rounded-pill" style={{ width: '87%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-8">
          <div className="glass-card p-5 h-100 position-relative overflow-hidden">
             <div className="position-absolute top-0 end-0 p-4 opacity-10">
                <Activity size={120} />
             </div>
             <div className="d-flex align-items-center gap-4 mb-5">
                <div className="p-4 rounded-4 bg-primary-glow">
                  <Zap size={40} className="text-primary-custom" />
                </div>
                <div>
                  <h3 className="fw-bold mb-0">Análisis Post-Entreno</h3>
                  <p className="text-muted-custom mb-0">Basado en tu última sesión registrada.</p>
                </div>
             </div>

             <div className="p-4 bg-dark bg-opacity-5 rounded-4 border border-secondary border-opacity-10 mb-4">
                <blockquote className="mb-0 fs-5 lh-lg italic text-main fw-medium">
                  "Para optimizar la recuperación después de tu press de banca, te sugiero un batido de proteína de suero con 1 plátano y 5g de creatina. Esto ayudará a reponer el glucógeno y acelerar la síntesis de proteína muscular. 🥤💪"
                </blockquote>
             </div>

             <div className="d-flex gap-3 mt-4">
                <button className="btn btn-primary-custom px-4 d-flex align-items-center gap-2">
                  Plan de Comidas Completo
                  <ChevronRight size={18} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nutrition;
