import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { achievementApi } from '../../src/services/api';
import { AchievementCard } from '../../src/components/AchievementCard';
import { Achievement, UserAchievement } from '../../src/types';

export default function AchievementsScreen() {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [all, user] = await Promise.all([
        achievementApi.getAll(),
        achievementApi.getUserAchievements(),
      ]);
      setAllAchievements(all);
      setUserAchievements(user);
    } catch (error) {
      console.error('Error loading achievements:', error);
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

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement.id));
  const unlockedCount = userAchievements.length;
  const totalCount = allAchievements.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Logros</Text>
          <Text style={styles.subtitle}>¡Desbloquea logros entrenando!</Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="trophy" size={32} color="#FFD700" />
            <View style={styles.progressInfo}>
              <Text style={styles.progressCount}>
                {unlockedCount} de {totalCount}
              </Text>
              <Text style={styles.progressLabel}>Logros desbloqueados</Text>
            </View>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Unlocked Achievements */}
        {userAchievements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Desbloqueados ({unlockedCount})</Text>
            </View>
            {userAchievements.map((ua) => (
              <AchievementCard
                key={ua.achievement.id}
                achievement={ua.achievement}
                unlocked={true}
                unlockedDate={ua.fecha_desbloqueo}
              />
            ))}
          </View>
        )}

        {/* Locked Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={20} color="#888" />
            <Text style={styles.sectionTitle}>Por desbloquear ({totalCount - unlockedCount})</Text>
          </View>
          {allAchievements
            .filter(a => !unlockedIds.has(a.id))
            .map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={false}
              />
            ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressInfo: {
    flex: 1,
    marginLeft: 16,
  },
  progressCount: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    color: '#888',
    fontSize: 13,
  },
  progressPercent: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
