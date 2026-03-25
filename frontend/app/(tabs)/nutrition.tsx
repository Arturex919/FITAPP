import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { nutritionApi } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { NutritionAdvice } from '../../src/types';

const ACTIVITY_LEVELS = [
  { id: 'sedentario', label: 'Sedentario', desc: 'Poco o ningún ejercicio' },
  { id: 'ligero', label: 'Ligero', desc: '1-3 días/semana' },
  { id: 'moderado', label: 'Moderado', desc: '3-5 días/semana' },
  { id: 'activo', label: 'Muy Activo', desc: '6-7 días/semana' },
  { id: 'intenso', label: 'Extremo', desc: 'Atleta profesional' },
];

export default function NutritionScreen() {
  const { user } = useAuthStore();
  const [activityLevel, setActivityLevel] = useState('moderado');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<NutritionAdvice | null>(null);

  const getAdvice = async () => {
    setLoading(true);
    try {
      const data = await nutritionApi.getAdvice({
        objetivo: user?.objetivo || 'general',
        nivel_actividad: activityLevel,
      });
      setAdvice(data);
    } catch (error: any) {
      console.error('Error getting advice:', error);
      Alert.alert('Error', 'No se pudo obtener el consejo nutricional');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrición</Text>
          <Text style={styles.subtitle}>Consejos personalizados con IA</Text>
        </View>

        {/* Objective Display */}
        <View style={styles.objectiveCard}>
          <Ionicons name="flag-outline" size={24} color="#FF6B35" />
          <View style={styles.objectiveContent}>
            <Text style={styles.objectiveLabel}>Tu objetivo</Text>
            <Text style={styles.objectiveValue}>
              {user?.objetivo === 'perder_peso' && 'Perder peso'}
              {user?.objetivo === 'ganar_musculo' && 'Ganar músculo'}
              {user?.objetivo === 'resistencia' && 'Mejorar resistencia'}
              {user?.objetivo === 'general' && 'Fitness general'}
              {!user?.objetivo && 'No definido'}
            </Text>
          </View>
        </View>

        {/* Activity Level Selector */}
        <Text style={styles.sectionTitle}>Nivel de actividad actual</Text>
        <View style={styles.activityContainer}>
          {ACTIVITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.activityCard,
                activityLevel === level.id && styles.activityCardActive,
              ]}
              onPress={() => setActivityLevel(level.id)}
            >
              <Text style={[
                styles.activityLabel,
                activityLevel === level.id && styles.activityLabelActive,
              ]}>
                {level.label}
              </Text>
              <Text style={styles.activityDesc}>{level.desc}</Text>
              {activityLevel === level.id && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Get Advice Button */}
        <TouchableOpacity
          style={[styles.adviceButton, loading && styles.buttonDisabled]}
          onPress={getAdvice}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.adviceButtonText}>Obtener Consejo Personalizado</Text>
            </>
          )}
        </TouchableOpacity>

        {/* AI Advice Display */}
        {advice && (
          <View style={styles.adviceContainer}>
            <View style={styles.adviceHeader}>
              <Ionicons name="bulb" size={24} color="#FFD700" />
              <Text style={styles.adviceTitle}>Tu Consejo Personalizado</Text>
            </View>
            
            <Text style={styles.adviceText}>{advice.consejo}</Text>
            
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>Recomendaciones:</Text>
              {advice.recomendaciones.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Consejos Rápidos</Text>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Ionicons name="water" size={24} color="#2196F3" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Hidratación</Text>
              <Text style={styles.tipText}>Bebe 2-3 litros de agua al día</Text>
            </View>
          </View>
          
          <View style={styles.tipCard}>
            <View style={[styles.tipIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
              <Ionicons name="leaf" size={24} color="#4CAF50" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Proteína</Text>
              <Text style={styles.tipText}>1.6-2.2g por kg de peso corporal</Text>
            </View>
          </View>
          
          <View style={styles.tipCard}>
            <View style={[styles.tipIconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.2)' }]}>
              <Ionicons name="time" size={24} color="#FF9800" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Timing</Text>
              <Text style={styles.tipText}>Come proteína dentro de 2h post-entreno</Text>
            </View>
          </View>
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
  objectiveCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  objectiveContent: {
    flex: 1,
  },
  objectiveLabel: {
    color: '#888',
    fontSize: 12,
  },
  objectiveValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  activityContainer: {
    gap: 8,
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  activityCardActive: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  activityLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activityLabelActive: {
    color: '#FF6B35',
  },
  activityDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  checkIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adviceButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  adviceButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adviceContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  adviceTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adviceText: {
    color: '#CCC',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationsTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  recommendationText: {
    color: '#CCC',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  tipsSection: {
    marginTop: 8,
  },
  tipCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipText: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
});
