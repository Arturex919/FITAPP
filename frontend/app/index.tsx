import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  return (
    <LinearGradient
      colors={['#0A0A0A', '#1A1A1A', '#0A0A0A']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="fitness" size={80} color="#FF6B35" />
        </View>
        <Text style={styles.title}>TrainForge</Text>
        <Text style={styles.subtitle}>Tu Gimnasio Personal</Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Ionicons name="barbell-outline" size={28} color="#FF6B35" />
          <Text style={styles.featureText}>Rutinas Personalizadas</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="nutrition-outline" size={28} color="#FF6B35" />
          <Text style={styles.featureText}>Consejos Nutricionales con IA</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="trophy-outline" size={28} color="#FF6B35" />
          <Text style={styles.featureText}>Sistema de Logros</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.primaryButtonText}>Comenzar Ahora</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  featureText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333',
  },
  secondaryButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
