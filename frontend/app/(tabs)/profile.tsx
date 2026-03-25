import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

const OBJETIVOS: Record<string, string> = {
  perder_peso: 'Perder peso',
  ganar_musculo: 'Ganar músculo',
  resistencia: 'Mejorar resistencia',
  general: 'Fitness general',
};

const NIVELES: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.nombre?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.total_entrenamientos || 0}</Text>
              <Text style={styles.statLabel}>Entrenamientos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.racha_dias || 0}</Text>
              <Text style={styles.statLabel}>Días racha</Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="flag-outline" size={20} color="#FF6B35" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Objetivo</Text>
                <Text style={styles.infoValue}>
                  {OBJETIVOS[user?.objetivo || ''] || 'No definido'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoSeparator} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="speedometer-outline" size={20} color="#FF6B35" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nivel</Text>
                <Text style={styles.infoValue}>
                  {NIVELES[user?.nivel || ''] || 'No definido'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoSeparator} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Miembro desde</Text>
                <Text style={styles.infoValue}>
                  {user?.fecha_registro ? formatDate(user.fecha_registro) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="notifications-outline" size={20} color="#888" />
              </View>
              <Text style={styles.menuText}>Notificaciones</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.menuSeparator} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="language-outline" size={20} color="#888" />
              </View>
              <Text style={styles.menuText}>Idioma</Text>
              <Text style={styles.menuValue}>Español</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.menuSeparator} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="help-circle-outline" size={20} color="#888" />
              </View>
              <Text style={styles.menuText}>Ayuda</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.menuSeparator} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name="information-circle-outline" size={20} color="#888" />
              </View>
              <Text style={styles.menuText}>Acerca de</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>TrainForge v1.0.0</Text>
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
  profileCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    color: '#FF6B35',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  infoSeparator: {
    height: 1,
    backgroundColor: '#333',
    marginLeft: 72,
  },
  menuCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  menuValue: {
    color: '#888',
    fontSize: 14,
    marginRight: 8,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#333',
    marginLeft: 72,
  },
  logoutButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoutText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});
