import axios from 'axios';
import { CONFIG } from '../config';

const wgerClient = axios.create({
  baseURL: CONFIG.WGER.BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

export interface Exercise {
  id: string;
  name: string;
  description: string;
  bodyPart: string;
  target: string;
  equipment?: string;
  gifUrl: string; 
  instructions: string[];
}

/**
 * Fetch exercises using /exerciseinfo/ for comprehensive data including Spanish names and nested images.
 */
export const fetchExercises = async (limit = 20, offset = 0, categoryId?: string): Promise<Exercise[]> => {
  try {
    const params: any = {
      language: 4, // Spanish
      limit: limit.toString(),
      offset: offset.toString(),
    };

    if (categoryId && categoryId !== 'all') {
      params.category = categoryId;
    }

    const res = await wgerClient.get('/exerciseinfo/', { params });
    const results = res.data.results || [];
    
    return results.map((item: any) => {
      const ex = item.exercise;
      if (!ex) return null;

      // Extract image URL from the nested 'images' array
      const image = item.images && item.images.length > 0 
        ? item.images[0].image 
        : '';
      
      const rawDesc = ex.description || '';
      const cleanDescription = rawDesc 
        ? rawDesc.replace(/<[^>]*>?/gm, '').trim() 
        : 'Ejecuta el ejercicio de forma lenta y controlada para maximizar resultados.';
        
      const instructions = cleanDescription.split(/[.!?]+/).filter((s: string) => s.trim().length > 5);

      return {
        id: ex.id.toString(),
        name: ex.name || 'Ejercicio',
        description: cleanDescription,
        bodyPart: item.category ? item.category.name : 'General',
        target: item.category ? item.category.name : 'General',
        equipment: item.equipment && item.equipment.length > 0 ? item.equipment[0].name : 'Varios',
        gifUrl: image, 
        instructions: instructions.length > 0 ? instructions : [
          'Mantén el torso estable durante el movimiento.',
          'Controla la respiración: exhala al realizar el esfuerzo.',
          'No bloquees las articulaciones al final del rango.'
        ],
      };
    }).filter(Boolean) as Exercise[];
  } catch (error) {
    console.error('❌ Error fetching from wger /exerciseinfo/:', error);
    return [];
  }
};

/**
 * Fallback image fetcher if needed (legacy support)
 */
export const fetchExerciseImage = async (exerciseId: string): Promise<string> => {
  try {
    const res = await wgerClient.get('/exerciseimage/', { params: { exercise: exerciseId } });
    return res.data.results && res.data.results.length > 0 ? res.data.results[0].image : '';
  } catch {
    return '';
  }
};

export const fetchBodyParts = async (): Promise<{id: string, name: string}[]> => {
  return [
    { id: 'all', name: 'Todos' },
    { id: '11', name: 'Pecho' },
    { id: '12', name: 'Espalda' },
    { id: '9', name: 'Piernas' },
    { id: '1', name: 'Bíceps' },
    { id: '13', name: 'Hombros' },
    { id: '10', name: 'Abs' },
  ];
};

export const fetchExercisesByBodyPart = async (bodyPartId: string, limit = 20, offset = 0): Promise<Exercise[]> => {
  return fetchExercises(limit, offset, bodyPartId);
};
