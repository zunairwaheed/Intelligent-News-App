import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password/', {
        email: email.trim().toLowerCase(),
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      Alert.alert('Success', 'Password has been updated successfully!');
      setIsForgotPassword(false);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update password. Please check your details.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Intelligent News App</Text>
          <Text style={styles.tagline}>News from your neighborhood</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.title}>{isForgotPassword ? 'Reset Password' : 'Sign In'}</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />

          {!isForgotPassword ? (
            <>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.input, styles.passInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry={!showPass}
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotBtn} onPress={() => setIsForgotPassword(true)}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.input, styles.passInput]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New Password"
                  secureTextEntry={!showNewPass}
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPass(!showNewPass)}>
                  <Ionicons name={showNewPass ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.input, styles.passInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm Password"
                  secureTextEntry={!showConfirmPass}
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPass(!showConfirmPass)}>
                  <Ionicons name={showConfirmPass ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.btnText}>{loading ? 'Updating...' : 'Update Password'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={() => setIsForgotPassword(false)}>
                <Text style={styles.backText}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}

          {!isForgotPassword && (
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.signupLink}>
              <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#1a73e8' },
  tagline: { fontSize: 14, color: '#555', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 20 },
  label: { fontSize: 13, color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#222',
    backgroundColor: '#fafafa',
  },
  passRow: { flexDirection: 'row', alignItems: 'center' },
  passInput: { flex: 1 },
  eyeBtn: { position: 'absolute', right: 0, paddingHorizontal: 12, paddingVertical: 11 },
  eyeText: { color: '#1a73e8', fontSize: 13 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: '#1a73e8', fontSize: 13, fontWeight: '500' },
  btn: {
    backgroundColor: '#1a73e8', borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backBtn: { alignSelf: 'center', marginTop: 16 },
  backText: { color: '#555', fontSize: 14, fontWeight: '500' },
  signupLink: { marginTop: 16 },
  link: { textAlign: 'center', color: '#555', fontSize: 14 },
  linkBold: { color: '#1a73e8', fontWeight: '600' },
});
