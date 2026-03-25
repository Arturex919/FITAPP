import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

export const CookieConsent: React.FC = () => {
  const { cookiesAccepted, acceptCookies } = useAuthStore();
  const [showDetails, setShowDetails] = useState(false);

  if (cookiesAccepted) return null;

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={32} color="#FF6B35" />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Política de Privacidad y Cookies</Text>
          <Text style={styles.description}>
            Usamos cookies y almacenamiento local para mejorar tu experiencia. Al continuar, aceptas nuestra política de privacidad.
          </Text>
          
          <TouchableOpacity onPress={() => setShowDetails(true)}>
            <Text style={styles.link}>Ver detalles completos</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.acceptButton} onPress={acceptCookies}>
            <Text style={styles.acceptButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Política de Privacidad</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.sectionTitle}>1. Datos que Recopilamos</Text>
              <Text style={styles.sectionText}>
                • Email y contraseña (encriptada con bcrypt){"\n"}
                • Nombre de usuario{"\n"}
                • Objetivos y nivel de fitness{"\n"}
                • Historial de entrenamientos{"\n"}
                • Logros desbloqueados
              </Text>
              
              <Text style={styles.sectionTitle}>2. Uso de Cookies y Almacenamiento Local</Text>
              <Text style={styles.sectionText}>
                • Token de autenticación JWT para mantener tu sesión{"\n"}
                • Preferencias de cookies{"\n"}
                • Caché de datos para mejor rendimiento
              </Text>
              
              <Text style={styles.sectionTitle}>3. Servicios de Terceros</Text>
              <Text style={styles.sectionText}>
                • OpenAI GPT-4.1: Para consejos nutricionales personalizados{"\n"}
                • MongoDB: Almacenamiento seguro de datos{"\n"}
                • YouTube: Enlaces a tutoriales de ejercicios (no rastreamos tu actividad)
              </Text>
              
              <Text style={styles.sectionTitle}>4. Seguridad</Text>
              <Text style={styles.sectionText}>
                • Contraseñas encriptadas con bcrypt{"\n"}
                • Protección contra ataques de fuerza bruta{"\n"}
                • Tokens JWT con expiración de 24 horas{"\n"}
                • Conexiones HTTPS seguras
              </Text>
              
              <Text style={styles.sectionTitle}>5. Tus Derechos</Text>
              <Text style={styles.sectionText}>
                • Acceder a tus datos personales{"\n"}
                • Solicitar eliminación de tu cuenta{"\n"}
                • Exportar tus datos de entrenamiento{"\n"}
                • Revocar consentimiento en cualquier momento
              </Text>
              
              <Text style={styles.sectionTitle}>6. Retención de Datos</Text>
              <Text style={styles.sectionText}>
                Mantenemos tus datos mientras tu cuenta esté activa. Puedes solicitar la eliminación contactándonos.
              </Text>
              
              <Text style={styles.sectionTitle}>7. Contacto</Text>
              <Text style={styles.sectionText}>
                Para cualquier consulta sobre privacidad, contacta a: soporte@trainforge.app
              </Text>
              
              <Text style={styles.lastUpdate}>
                Última actualización: Julio 2025
              </Text>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalAcceptButton} 
              onPress={() => {
                acceptCookies();
                setShowDetails(false);
              }}
            >
              <Text style={styles.modalAcceptButtonText}>Aceptar y Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 16,
    flexDirection: 'column',
    gap: 12,
  },
  iconContainer: {
    alignItems: 'center',
  },
  content: {
    gap: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    color: '#AAA',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#FF6B35',
    fontSize: 13,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionText: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 22,
  },
  lastUpdate: {
    color: '#888',
    fontSize: 12,
    marginTop: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalAcceptButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  modalAcceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
