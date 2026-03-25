import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Routine } from '../types';

interface RoutineCardProps {
  routine: Routine;
  onPress: () => void;
}

const typeColors: Record<string, string> = {
  fuerza: '#FF6B35',
  cardio: '#E91E63',
  flexibilidad: '#9C27B0',
  mixto: '#2196F3',
};

const levelColors: Record<string, string> = {
  principiante: '#4CAF50',
  intermedio: '#FF9800',
  avanzado: '#F44336',
};

export const RoutineCard: React.FC<RoutineCardProps> = ({ routine, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.typeIndicator, { backgroundColor: typeColors[routine.tipo] || '#FF6B35' }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{routine.nombre}</Text>
          <View style={[styles.levelBadge, { backgroundColor: levelColors[routine.nivel] || '#666' }]}>
            <Text style={styles.levelText}>{routine.nivel.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>{routine.descripcion}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={16} color="#FF6B35" />
            <Text style={styles.statText}>{routine.duracion_minutos} min</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="flame-outline" size={16} color="#FF6B35" />
            <Text style={styles.statText}>{routine.calorias_estimadas} kcal</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="list-outline" size={16} color="#FF6B35" />
            <Text style={styles.statText}>{routine.ejercicios.length} ejercicios</Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={24} color="#666" style={styles.arrow} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  typeIndicator: {
    width: 4,
    height: '100%',
    minHeight: 100,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    color: '#888',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#CCC',
    fontSize: 12,
  },
  arrow: {
    marginRight: 12,
  },
});
