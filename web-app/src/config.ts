export const CONFIG = {
  WGER: {
    BASE_URL: import.meta.env.VITE_WGER_API_URL || 'https://wger.de/api/v2/',
  },
  GROQ: {
    KEY: import.meta.env.VITE_GROQ_API_KEY || '',
    MODEL: 'llama-3.3-70b-versatile',
    BASE_URL: 'https://api.groq.com/openai/v1',
  }
};
