import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';

const OBJETIVOS = [
  { id: 'perder_peso', label: 'Perder peso', icon: 'trending-down-outline' },
  { id: 'ganar_musculo', label: 'Ganar músculo', icon: 'barbell-outline' },
  { id: 'resistencia', label: 'Mejorar resistencia', icon: 'heart-outline' },
  { id: 'general', label: 'Fitness general', icon: 'fitness-outline' },
];

const NIVELES = [
  { id: 'principiante', label: 'Principiante', desc: 'Nuevo en el fitness' },
  { id: 'intermedio', label: 'Intermedio', desc: '6+ meses de experiencia' },
  { id: 'avanzado', label: 'Avanzado', desc: '+2 años entrenando' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [nivel, setNivel] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!nombre || !email || !password) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!objetivo) {
        Alert.alert('Error', 'Selecciona tu objetivo');
        return;
      }
      setStep(3);
    }
  };

  const handleRegister = async () => {
    if (!nivel) {
      Alert.alert('Error', 'Selecciona tu nivel');
      return;
    }
    
    const success = await register(email, password, nombre, objetivo, nivel);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  const renderStep1 = () => (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor="#666"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Correo electrónico</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons 
              name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.questionText}>¿Cuál es tu objetivo?</Text>
      {OBJETIVOS.map((obj) => (
        <TouchableOpacity
          key={obj.id}
          style={[styles.optionCard, objetivo === obj.id && styles.optionCardSelected]}
          onPress={() => setObjetivo(obj.id)}
        >
          <Ionicons 
            name={obj.icon as any} 
            size={28} 
            color={objetivo === obj.id ? '#FF6B35' : '#888'} 
          />
          <Text style={[styles.optionText, objetivo === obj.id && styles.optionTextSelected]}>
            {obj.label}
          </Text>
          {objetivo === obj.id && (
            <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.questionText}>¿Cuál es tu nivel?</Text>
      {NIVELES.map((niv) => (
        <TouchableOpacity
          key={niv.id}
          style={[styles.optionCard, nivel === niv.id && styles.optionCardSelected]}
          onPress={() => setNivel(niv.id)}
        >
          <View style={styles.optionContent}>
            <Text style={[styles.optionText, nivel === niv.id && styles.optionTextSelected]}>
              {niv.label}
            </Text>
            <Text style={styles.optionDesc}>{niv.desc}</Text>
          </View>
          {nivel === niv.id && (
            <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => step > 1 ? setStep(step - 1) : router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => (
              <View 
                key={s} 
                style={[styles.progressDot, s <= step && styles.progressDotActive]} 
              />
            ))}
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 1 ? 'Crear Cuenta' : step === 2 ? 'Tu Objetivo' : 'Tu Nivel'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 ? 'Completa tus datos para empezar' : 
               step === 2 ? 'Personaliza tu experiencia' : 
               'Casi listo para entrenar'}
            </Text>
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.nextButton, isLoading && styles.buttonDisabled]}
              onPress={step < 3 ? handleNext : handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.nextButtonText}>
                {isLoading ? 'Creando cuenta...' : step < 3 ? 'Continuar' : 'Crear Cuenta'}
              </Text>
              {!isLoading && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
            </TouchableOpacity>

            {step === 1 && (
              <TouchableOpacity 
                style={styles.loginLink}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.loginLinkText}>
                  ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  progressDotActive: {
    backgroundColor: '#FF6B35',
  },
  header: {
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#FFF',
    fontSize: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  questionText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 16,
  },
  optionCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFF',
  },
  optionDesc: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 32,
    gap: 16,
  },
  nextButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#888',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
});
