import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement, UserAchievement } from '../types';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked?: boolean;
  unlockedDate?: string;
}

const iconMap: Record<string, string> = {
  trophy: 'trophy',
  fire: 'flame',
  star: 'star',
  medal: 'medal',
  flame: 'bonfire',
  crown: 'ribbon',
  shield: 'shield-checkmark',
  gem: 'diamond',
  calendar: 'calendar',
  flash: 'flash',
  rocket: 'rocket',
  infinite: 'infinite',
  sunny: 'sunny',
  moon: 'moon',
  happy: 'happy',
  barbell: 'barbell',
  diamond: 'diamond',
};

const typeColors: Record<string, string> = {
  especial: '#FFD700',
  semanal: '#4CAF50',
  mensual: '#9C27B0',
  diario: '#2196F3',
};

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, unlocked = false, unlockedDate }) => {
  const iconName = iconMap[achievement.icono] || 'trophy';
  const typeColor = typeColors[achievement.tipo] || '#FF6B35';

  return (
    <View style={[styles.card, !unlocked && styles.locked]}>
      <View style={[styles.iconContainer, { backgroundColor: unlocked ? typeColor : '#333' }]}>
        <Ionicons 
          name={iconName as any} 
          size={32} 
          color={unlocked ? '#FFF' : '#666'} 
        />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, !unlocked && styles.lockedText]}>{achievement.nombre}</Text>
        <Text style={[styles.description, !unlocked && styles.lockedText]}>{achievement.descripcion}</Text>
        
        {unlocked && unlockedDate && (
          <View style={styles.unlockedRow}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={styles.unlockedText}>
              Desbloqueado el {new Date(unlockedDate).toLocaleDateString('es-ES')}
            </Text>
          </View>
        )}
        
        {!unlocked && (
          <View style={styles.progressRow}>
            <Ionicons name="lock-closed" size={14} color="#666" />
            <Text style={styles.progressText}>Bloqueado</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locked: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#AAA',
    fontSize: 13,
    marginBottom: 8,
  },
  lockedText: {
    color: '#666',
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlockedText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressText: {
    color: '#666',
    fontSize: 12,
  },
});
