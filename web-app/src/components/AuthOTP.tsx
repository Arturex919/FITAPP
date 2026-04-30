import React, { useState } from 'react';
import { Smartphone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthOTPProps {
  onLogin: (phone: string) => void;
}

const AuthOTP: React.FC<AuthOTPProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = () => {
    if (phone.length < 9) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStep('otp');
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOTP = () => {
    if (otp.length < 4) return;
    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      onLogin(phone);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 p-4">
      <div className="card shadow-xl p-5 border-0 rounded-4 bg-dark bg-opacity-50" style={{ maxWidth: '400px', width: '100%', border: '1px solid rgba(255,107,53,0.1)' }}>
        <div className="text-center mb-5">
          <div className="p-3 bg-primary-custom bg-opacity-10 rounded-circle d-inline-block mb-3">
             <ShieldCheck size={48} color="#FF6B35" />
          </div>
          <h2 className="fw-bold mb-2">Bienvenido</h2>
          <p className="text-muted">Ingresa tus datos para continuar forjando tu destino.</p>
        </div>

        {step === 'phone' ? (
          <div className="d-flex flex-column gap-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-0 border-bottom border-secondary rounded-0 text-muted">
                <Smartphone size={20} />
              </span>
              <input 
                type="tel" 
                className="form-control bg-transparent border-0 border-bottom border-secondary rounded-0 text-white shadow-none py-3" 
                placeholder="Número de teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button 
              className="btn btn-primary-custom py-3 mt-3 d-flex align-items-center justify-content-center gap-2"
              onClick={handleRequestOTP}
              disabled={loading || phone.length < 9}
            >
              {loading ? 'Enviando...' : 'Obtener Código'}
              <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-0 border-bottom border-secondary rounded-0 text-muted">
                <Lock size={20} />
              </span>
              <input 
                type="text" 
                className="form-control bg-transparent border-0 border-bottom border-secondary rounded-0 text-white shadow-none py-3 text-center" 
                placeholder="Ingresa el código (4 dígitos)"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ letterSpacing: '8px', fontSize: '1.5rem' }}
              />
            </div>
            <div className="d-flex flex-column gap-2">
              <button 
                className="btn btn-primary-custom py-3 d-flex align-items-center justify-content-center gap-2"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length < 4}
              >
                {loading ? 'Verificando...' : 'Confirmar Acceso'}
                <ShieldCheck size={20} />
              </button>
              <button className="btn btn-link text-muted" onClick={() => setStep('phone')} style={{ fontSize: '0.8rem', textDecoration: 'none' }}>
                Volver a ingresar el teléfono
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthOTP;
