import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { workoutApi, routineApi } from '../../src/services/api';
import { StatsCard } from '../../src/components/StatsCard';
import { RoutineCard } from '../../src/components/RoutineCard';
import { WorkoutStats, Routine } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsData, routinesData] = await Promise.all([
        workoutApi.getStats(),
        routineApi.getAll({ nivel: user?.nivel }),
      ]);
      setStats(statsData);
      setRoutines(routinesData.slice(0, 3));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.nombre || 'Atleta'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.streakBadge}
            onPress={() => router.push('/(tabs)/achievements')}
          >
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <Text style={styles.streakText}>{stats?.racha_actual || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <Text style={styles.sectionTitle}>Tu Progreso</Text>
        <View style={styles.statsRow}>
          <StatsCard
            icon="barbell-outline"
            value={stats?.total_entrenamientos || 0}
            label="Entrenamientos"
            color="#FF6B35"
          />
          <StatsCard
            icon="flame-outline"
            value={stats?.calorias_quemadas_mes || 0}
            label="Kcal este mes"
            color="#E91E63"
          />
        </View>
        <View style={styles.statsRow}>
          <StatsCard
            icon="time-outline"
            value={stats?.minutos_entrenados_mes || 0}
            label="Min este mes"
            color="#4CAF50"
          />
          <StatsCard
            icon="calendar-outline"
            value={stats?.entrenamientos_mes || 0}
            label="Sesiones mes"
            color="#2196F3"
          />
        </View>

        {/* Quick Start */}
        <TouchableOpacity 
          style={styles.quickStartButton}
          onPress={() => router.push('/(tabs)/train')}
        >
          <View style={styles.quickStartContent}>
            <Ionicons name="flash" size={32} color="#FFF" />
            <View style={styles.quickStartText}>
              <Text style={styles.quickStartTitle}>Comenzar Entrenamiento</Text>
              <Text style={styles.quickStartSubtitle}>Elige tu rutina y empieza ahora</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Recommended Routines */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rutinas Recomendadas</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/train')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            onPress={() => router.push(`/workout/${routine.id}`)}
          />
        ))}

        {/* Motivation Quote */}
        <View style={styles.quoteCard}>
          <Ionicons name="sparkles" size={24} color="#FFD700" />
          <Text style={styles.quoteText}>
            "El único entrenamiento malo es el que no hiciste"
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: '#888',
    fontSize: 16,
  },
  userName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  quickStartButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quickStartText: {
    gap: 4,
  },
  quickStartTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickStartSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  quoteText: {
    color: '#AAA',
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
  },
});
