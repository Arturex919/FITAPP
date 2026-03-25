import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { routineApi, exerciseApi } from '../../src/services/api';
import { RoutineCard } from '../../src/components/RoutineCard';
import { ExerciseCard } from '../../src/components/ExerciseCard';
import { Routine, Exercise } from '../../src/types';

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'grid-outline' },
  { id: 'calentamiento', label: 'Calentamiento', icon: 'flame-outline' },
  { id: 'pesas', label: 'Pesas', icon: 'barbell-outline' },
  { id: 'calistenia', label: 'Calistenia', icon: 'body-outline' },
  { id: 'cardio', label: 'Cardio', icon: 'heart-outline' },
  { id: 'pliometria', label: 'Pliometría', icon: 'flash-outline' },
  { id: 'estiramiento', label: 'Estiramientos', icon: 'fitness-outline' },
];

export default function TrainScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'routines' | 'exercises'>('routines');
  const [category, setCategory] = useState('all');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab, category]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'routines') {
        const data = await routineApi.getAll();
        setRoutines(data);
      } else {
        const params = category !== 'all' ? { categoria: category } : undefined;
        const data = await exerciseApi.getAll(params);
        setExercises(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Entrenar</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'routines' && styles.tabActive]}
          onPress={() => setTab('routines')}
        >
          <Ionicons 
            name="list-outline" 
            size={20} 
            color={tab === 'routines' ? '#FFF' : '#888'} 
          />
          <Text style={[styles.tabText, tab === 'routines' && styles.tabTextActive]}>
            Rutinas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'exercises' && styles.tabActive]}
          onPress={() => setTab('exercises')}
        >
          <Ionicons 
            name="fitness-outline" 
            size={20} 
            color={tab === 'exercises' ? '#FFF' : '#888'} 
          />
          <Text style={[styles.tabText, tab === 'exercises' && styles.tabTextActive]}>
            Ejercicios
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter (for exercises) */}
      {tab === 'exercises' && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, category === cat.id && styles.categoryChipActive]}
              onPress={() => setCategory(cat.id)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={16} 
                color={category === cat.id ? '#FFF' : '#888'} 
              />
              <Text style={[styles.categoryText, category === cat.id && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'routines' ? (
            <>
              <Text style={styles.sectionTitle}>
                {routines.length} Rutinas Disponibles
              </Text>
              {routines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onPress={() => router.push(`/workout/${routine.id}`)}
                />
              ))}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                {exercises.length} Ejercicios
              </Text>
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#FF6B35',
  },
  categoryText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
});
