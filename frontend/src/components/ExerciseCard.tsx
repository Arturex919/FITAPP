import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../types';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  showYoutube?: boolean;
}

const difficultyColors: Record<string, string> = {
  facil: '#4CAF50',
  medio: '#FF9800',
  dificil: '#F44336',
};

const categoryIcons: Record<string, string> = {
  calentamiento: 'flame-outline',
  pesas: 'barbell-outline',
  calistenia: 'body-outline',
  cardio: 'heart-outline',
  pliometria: 'flash-outline',
  estiramiento: 'fitness-outline',
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onPress, showYoutube = true }) => {
  const [imageError, setImageError] = useState(false);

  const openYoutube = () => {
    if (exercise.youtube_url) {
      Linking.openURL(exercise.youtube_url);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {!imageError ? (
          <Image
            source={{ uri: exercise.gif_url }}
            style={styles.gif}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons 
              name={categoryIcons[exercise.categoria] as any || 'fitness-outline'} 
              size={60} 
              color="#FF6B35" 
            />
            <Text style={styles.placeholderText}>Ver en YouTube</Text>
          </View>
        )}
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColors[exercise.dificultad] || '#666' }]}>
          <Text style={styles.difficultyText}>{exercise.dificultad.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons 
            name={categoryIcons[exercise.categoria] as any || 'fitness-outline'} 
            size={20} 
            color="#FF6B35" 
          />
          <Text style={styles.category}>{exercise.categoria.toUpperCase()}</Text>
        </View>
        
        <Text style={styles.title}>{exercise.nombre}</Text>
        <Text style={styles.muscle}>{exercise.musculo_principal}</Text>
        
        <View style={styles.statsRow}>
          {exercise.series && (
            <View style={styles.stat}>
              <Ionicons name="layers-outline" size={14} color="#888" />
              <Text style={styles.statText}>{exercise.series} series</Text>
            </View>
          )}
          {exercise.repeticiones && (
            <View style={styles.stat}>
              <Ionicons name="repeat-outline" size={14} color="#888" />
              <Text style={styles.statText}>{exercise.repeticiones} reps</Text>
            </View>
          )}
          {exercise.duracion_segundos && !exercise.repeticiones && (
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={14} color="#888" />
              <Text style={styles.statText}>{exercise.duracion_segundos}s</Text>
            </View>
          )}
        </View>
        
        {showYoutube && exercise.youtube_url && (
          <TouchableOpacity style={styles.youtubeButton} onPress={openYoutube}>
            <Ionicons name="logo-youtube" size={18} color="#FF0000" />
            <Text style={styles.youtubeText}>Ver tutorial en YouTube</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 160,
    backgroundColor: '#2A2A2A',
    position: 'relative',
  },
  gif: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    color: '#FF6B35',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  muscle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#888',
    fontSize: 12,
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  youtubeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
