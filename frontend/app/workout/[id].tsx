import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { routineApi, warmupApi, workoutApi } from '../../src/services/api';
import { Routine, Exercise } from '../../src/types';

type WorkoutPhase = 'preview' | 'warmup' | 'workout' | 'cooldown' | 'complete';

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [warmupExercises, setWarmupExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [phase, setPhase] = useState<WorkoutPhase>('preview');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoutine();
  }, [id]);

  const loadRoutine = async () => {
    if (!id) return;
    try {
      const [routineData, exercisesData, warmupData] = await Promise.all([
        routineApi.getById(id),
        routineApi.getExercises(id),
        warmupApi.get(id.includes('fuerza') || id.includes('pesas') ? 'pesas' : 'general'),
      ]);
      setRoutine(routineData);
      setExercises(exercisesData);
      setWarmupExercises(warmupData);
    } catch (error) {
      console.error('Error loading routine:', error);
      Alert.alert('Error', 'No se pudo cargar la rutina');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = () => {
    setStartTime(new Date());
    if (warmupExercises.length > 0) {
      setPhase('warmup');
    } else {
      setPhase('workout');
    }
    setCurrentIndex(0);
  };

  const getCurrentExercises = (): Exercise[] => {
    if (phase === 'warmup') return warmupExercises;
    if (phase === 'workout') return exercises.filter(e => e.categoria !== 'estiramiento');
    if (phase === 'cooldown') return exercises.filter(e => e.categoria === 'estiramiento');
    return [];
  };

  const completeExercise = () => {
    const current = getCurrentExercises();
    if (current[currentIndex]) {
      setCompletedExercises(prev => [...prev, current[currentIndex].id]);
    }
    
    if (currentIndex < current.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Move to next phase
      if (phase === 'warmup') {
        setPhase('workout');
        setCurrentIndex(0);
      } else if (phase === 'workout') {
        const cooldown = exercises.filter(e => e.categoria === 'estiramiento');
        if (cooldown.length > 0) {
          setPhase('cooldown');
          setCurrentIndex(0);
        } else {
          setPhase('complete');
        }
      } else if (phase === 'cooldown') {
        setPhase('complete');
      }
    }
  };

  const skipExercise = () => {
    const current = getCurrentExercises();
    if (currentIndex < current.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeExercise();
    }
  };

  const saveWorkout = async () => {
    if (!routine || !startTime) return;
    
    setSaving(true);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    
    try {
      await workoutApi.create({
        rutina_id: routine.id,
        ejercicios_completados: completedExercises,
        duracion_minutos: durationMinutes,
        calorias_quemadas: Math.round(routine.calorias_estimadas * (completedExercises.length / exercises.length)),
      });
      
      Alert.alert(
        '¡Entrenamiento Completado!',
        `Completaste ${completedExercises.length} ejercicios en ${durationMinutes} minutos.`,
        [{ text: '¡Genial!', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'No se pudo guardar el entrenamiento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Rutina no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Preview Phase
  if (phase === 'preview') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>{routine.nombre}</Text>
            <Text style={styles.previewDescription}>{routine.descripcion}</Text>
            
            <View style={styles.previewStats}>
              <View style={styles.previewStat}>
                <Ionicons name="time-outline" size={24} color="#FF6B35" />
                <Text style={styles.previewStatValue}>{routine.duracion_minutos}</Text>
                <Text style={styles.previewStatLabel}>minutos</Text>
              </View>
              <View style={styles.previewStat}>
                <Ionicons name="flame-outline" size={24} color="#FF6B35" />
                <Text style={styles.previewStatValue}>{routine.calorias_estimadas}</Text>
                <Text style={styles.previewStatLabel}>kcal</Text>
              </View>
              <View style={styles.previewStat}>
                <Ionicons name="list-outline" size={24} color="#FF6B35" />
                <Text style={styles.previewStatValue}>{exercises.length}</Text>
                <Text style={styles.previewStatLabel}>ejercicios</Text>
              </View>
            </View>
          </View>
          
          {warmupExercises.length > 0 && (
            <View style={styles.phaseSection}>
              <View style={styles.phaseBadge}>
                <Ionicons name="flame" size={16} color="#FF6B35" />
                <Text style={styles.phaseBadgeText}>Calentamiento</Text>
              </View>
              <Text style={styles.phaseInfo}>{warmupExercises.length} ejercicios de movilidad</Text>
            </View>
          )}
          
          <View style={styles.exercisesList}>
            <Text style={styles.exercisesTitle}>Ejercicios de la rutina:</Text>
            {exercises.map((ex, index) => (
              <View key={ex.id} style={styles.exercisePreviewItem}>
                <Text style={styles.exercisePreviewNumber}>{index + 1}</Text>
                <View style={styles.exercisePreviewContent}>
                  <Text style={styles.exercisePreviewName}>{ex.nombre}</Text>
                  <Text style={styles.exercisePreviewDetail}>
                    {ex.series && ex.repeticiones 
                      ? `${ex.series} series x ${ex.repeticiones} reps`
                      : ex.duracion_segundos 
                      ? `${ex.duracion_segundos} segundos`
                      : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
            <Ionicons name="play" size={24} color="#FFF" />
            <Text style={styles.startButtonText}>Comenzar Entrenamiento</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Complete Phase
  if (phase === 'complete') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completeContainer}>
          <View style={styles.completeIcon}>
            <Ionicons name="trophy" size={80} color="#FFD700" />
          </View>
          
          <Text style={styles.completeTitle}>¡Entrenamiento Completado!</Text>
          <Text style={styles.completeSubtitle}>Excelente trabajo, sigue así</Text>
          
          <View style={styles.completeStats}>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{completedExercises.length}</Text>
              <Text style={styles.completeStatLabel}>Ejercicios</Text>
            </View>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>
                {startTime ? Math.round((new Date().getTime() - startTime.getTime()) / 60000) : 0}
              </Text>
              <Text style={styles.completeStatLabel}>Minutos</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={saveWorkout}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.saveButtonText}>Guardar Progreso</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Workout Phase
  const currentExercises = getCurrentExercises();
  const currentExercise = currentExercises[currentIndex];

  if (!currentExercise) {
    setPhase('complete');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.workoutHeader}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Abandonar entrenamiento',
            '¿Estás seguro de que quieres salir? Se perderá tu progreso.',
            [
              { text: 'Continuar', style: 'cancel' },
              { text: 'Salir', style: 'destructive', onPress: () => router.back() },
            ]
          );
        }}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.phaseBadgeSmall}>
          <Ionicons 
            name={phase === 'warmup' ? 'flame' : phase === 'cooldown' ? 'fitness' : 'barbell'} 
            size={14} 
            color="#FFF" 
          />
          <Text style={styles.phaseBadgeSmallText}>
            {phase === 'warmup' ? 'Calentamiento' : phase === 'cooldown' ? 'Estiramiento' : 'Entrenamiento'}
          </Text>
        </View>
        
        <Text style={styles.progressText}>
          {currentIndex + 1}/{currentExercises.length}
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${((currentIndex + 1) / currentExercises.length) * 100}%` }
          ]} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.exerciseContainer}>
        <View style={styles.gifContainer}>
          <Image 
            source={{ uri: currentExercise.gif_url }}
            style={styles.exerciseGif}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{currentExercise.nombre}</Text>
          <Text style={styles.exerciseMuscle}>{currentExercise.musculo_principal}</Text>
          
          <View style={styles.exerciseMetrics}>
            {currentExercise.series && (
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{currentExercise.series}</Text>
                <Text style={styles.metricLabel}>Series</Text>
              </View>
            )}
            {currentExercise.repeticiones && (
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{currentExercise.repeticiones}</Text>
                <Text style={styles.metricLabel}>Reps</Text>
              </View>
            )}
            {currentExercise.duracion_segundos && !currentExercise.repeticiones && (
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{currentExercise.duracion_segundos}s</Text>
                <Text style={styles.metricLabel}>Duración</Text>
              </View>
            )}
          </View>
          
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Instrucciones:</Text>
            {currentExercise.instrucciones.map((inst, idx) => (
              <Text key={idx} style={styles.instructionItem}>
                {idx + 1}. {inst}
              </Text>
            ))}
          </View>
          
          {currentExercise.youtube_url && (
            <TouchableOpacity 
              style={styles.youtubeLink}
              onPress={() => Linking.openURL(currentExercise.youtube_url)}
            >
              <Ionicons name="logo-youtube" size={20} color="#FF0000" />
              <Text style={styles.youtubeLinkText}>Ver tutorial en YouTube</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.skipButton} onPress={skipExercise}>
          <Ionicons name="play-skip-forward" size={20} color="#888" />
          <Text style={styles.skipButtonText}>Saltar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.completeButton} onPress={completeExercise}>
          <Ionicons name="checkmark" size={24} color="#FFF" />
          <Text style={styles.completeButtonText}>Completado</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewHeader: {
    marginBottom: 24,
  },
  previewTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewDescription: {
    color: '#888',
    fontSize: 16,
    marginBottom: 24,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  previewStatLabel: {
    color: '#888',
    fontSize: 12,
  },
  phaseSection: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  phaseBadgeText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  phaseInfo: {
    color: '#AAA',
    fontSize: 14,
  },
  exercisesList: {
    marginBottom: 24,
  },
  exercisesTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exercisePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  exercisePreviewNumber: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
    width: 30,
  },
  exercisePreviewContent: {
    flex: 1,
  },
  exercisePreviewName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  exercisePreviewDetail: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Workout view
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  phaseBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  phaseBadgeSmallText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#333',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B35',
  },
  exerciseContainer: {
    paddingBottom: 100,
  },
  gifContainer: {
    height: 250,
    backgroundColor: '#1E1E1E',
  },
  exerciseGif: {
    width: '100%',
    height: '100%',
  },
  exerciseInfo: {
    padding: 20,
  },
  exerciseName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exerciseMuscle: {
    color: '#FF6B35',
    fontSize: 16,
    marginBottom: 20,
  },
  exerciseMetrics: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  instructions: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionItem: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  youtubeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  youtubeLinkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 12,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  skipButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Complete view
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completeIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  completeTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  completeSubtitle: {
    color: '#888',
    fontSize: 16,
    marginBottom: 40,
  },
  completeStats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 40,
  },
  completeStat: {
    alignItems: 'center',
  },
  completeStatValue: {
    color: '#FF6B35',
    fontSize: 48,
    fontWeight: 'bold',
  },
  completeStatLabel: {
    color: '#888',
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
