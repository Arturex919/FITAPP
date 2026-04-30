import { CONFIG } from '../config';

const GROQ_API_KEY = CONFIG.GROQ.KEY;
const API_URL = `${CONFIG.GROQ.BASE_URL}/chat/completions`;

/**
 * Get AI response from Groq.
 * Context: TF Coach Elite (No DB mentions)
 */
export async function getAIResponse(message: string): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.GROQ.MODEL,
        messages: [
          {
            role: 'system',
            content: `Eres el "TF Coach Elite". 
            
            REGLAS CRÍTICAS:
            - Sé EXTREMADAMENTE conciso.
            - Máximo 2 párrafos cortos.
            - PROHIBIDO mencionar "base de datos", "wger" o términos técnicos de software.
            - No hables de nutrición. Di: "Solo soy experto en entrenamiento de élite".
            - Usa **negritas** para resaltar conceptos clave.
            
            Si te piden una rutina:
            Recomienda ejercicios clásicos de gimnasio. 
            Mantenlo motivador y profesional.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.6,
        max_tokens: 200, 
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Groq:', error);
    return 'Entendido. **Reintenta** tu mensaje.';
  }
}
