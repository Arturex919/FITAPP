import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { getAIResponse } from '../services/groqService';
import type { Routine } from '../App';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

interface AIChatFABProps {
  onAddRoutine: (routine: Omit<Routine, 'id'>) => void;
}

const AIChatFAB: React.FC<AIChatFABProps> = ({ onAddRoutine }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu **TF Coach**. ¿Listo para forjar tu destino? Elige nivel:',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync theme with document class
  useEffect(() => {
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark-theme'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (text?: string) => {
    const finalMsg = text || inputValue;
    if (!finalMsg.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: finalMsg,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await getAIResponse(finalMsg);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const themeStyles = {
    bg: isDarkMode ? '#121212' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    bubbleAi: isDarkMode ? '#1e1e1e' : '#f0f2f5',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  };

  return (
    <div className="position-fixed bottom-0 end-0 p-3 p-md-4" style={{ zIndex: 1050 }}>
      {isOpen && (
        <div className="glass-card mb-3 d-flex flex-column shadow-2xl animate-slide-up"
             style={{ 
               width: 'min(400px, 92vw)', 
               height: '550px', 
               borderRadius: '28px',
               background: themeStyles.bg,
               color: themeStyles.text,
               border: `1px solid ${themeStyles.border}`,
               boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
             }}>
          
          <div className="p-4 d-flex align-items-center justify-content-between border-bottom" style={{ borderColor: themeStyles.border }}>
            <div className="d-flex align-items-center gap-3">
              <Bot size={24} className="text-primary-custom" />
              <h6 className="mb-0 fw-black">TF COACH ELITE</h6>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn btn-link p-0 text-muted shadow-none" style={{ color: themeStyles.text }}>
              <X size={24} />
            </button>
          </div>

          <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                <div className="p-3"
                     style={{ 
                       maxWidth: '85%',
                       fontSize: '0.9rem',
                       background: msg.sender === 'user' ? '#FF6B35' : themeStyles.bubbleAi,
                       color: msg.sender === 'user' ? 'white' : themeStyles.text,
                       borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                       border: msg.sender === 'ai' ? `1px solid ${themeStyles.border}` : 'none'
                     }}>
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  
                  {msg.sender === 'ai' && msg.id === '1' && (
                    <div className="d-flex gap-2 mt-3">
                      {['Principiante', 'Avanzado'].map(lvl => (
                        <button key={lvl} onClick={() => handleSend(lvl)} className="btn btn-sm btn-primary-custom rounded-pill px-3 fw-bold">
                          {lvl}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="d-flex justify-content-start">
                <div className="p-3 rounded-4" style={{ background: themeStyles.bubbleAi }}>
                  <Loader2 size={16} className="animate-spin text-primary-custom" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-top" style={{ borderColor: themeStyles.border }}>
            <div className="position-relative">
              <input
                type="text"
                className="form-control bg-transparent py-3 pe-5"
                placeholder="Pregunta algo..."
                style={{ borderRadius: '14px', border: `1px solid ${themeStyles.border}`, color: themeStyles.text }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={() => handleSend()} className="btn position-absolute top-50 end-0 translate-middle-y me-2 text-primary-custom">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="btn btn-primary-custom rounded-4 shadow-lg scale-hover" style={{ width: '64px', height: '64px' }}>
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      <style>{`
        .scale-hover:hover { transform: scale(1.05); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default AIChatFAB;
