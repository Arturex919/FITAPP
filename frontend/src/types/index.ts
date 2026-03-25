export interface User {
  id: string;
  email: string;
  nombre: string;
  objetivo: string;
  nivel: string;
  fecha_registro: string;
  racha_dias: number;
  total_entrenamientos: number;
}

export interface Exercise {
  id: string;
  nombre: string;
  categoria: string;
  musculo_principal: string;
  descripcion: string;
  instrucciones: string[];
  gif_url: string;
  youtube_url: string;
  dificultad: string;
  duracion_segundos?: number;
  repeticiones?: number;
  series?: number;
}

export interface Routine {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  nivel: string;
  duracion_minutos: number;
  ejercicios: string[];
  calorias_estimadas: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  fecha: string;
  rutina_id?: string;
  ejercicios_completados: string[];
  duracion_minutos: number;
  calorias_quemadas: number;
  notas: string;
}

export interface Achievement {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  tipo: string;
  condicion: string;
  valor_requerido: number;
}

export interface UserAchievement {
  achievement: Achievement;
  fecha_desbloqueo: string;
}

export interface WorkoutStats {
  entrenamientos_mes: number;
  calorias_quemadas_mes: number;
  minutos_entrenados_mes: number;
  racha_actual: number;
  total_entrenamientos: number;
}

export interface NutritionAdvice {
  consejo: string;
  recomendaciones: string[];
}
