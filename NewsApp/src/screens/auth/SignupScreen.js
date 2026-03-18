import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// Field must be defined OUTSIDE the screen component so React doesn't
// create a new component type on every re-render (which would dismiss the keyboard).
const Field = ({ label, placeholder, keyboard = 'default', secure = false, value, onChangeText, showPass, onToggleShow }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.passRow}>
      <TextInput
        style={[styles.input, secure && styles.passInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboard}
        autoCapitalize="none"
        secureTextEntry={secure && !showPass}
        placeholderTextColor="#aaa"
      />
      {secure && (
        <TouchableOpacity style={styles.eyeBtn} onPress={onToggleShow}>
          <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  </>
);

export default function SignupScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSignup = async () => {
    const { username, email, password, password2 } = form;
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password !== password2) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        password2,
        phone: form.phone.trim(),
      });
    } catch (err) {
      console.log('Registration error:', JSON.stringify(err.response?.data));
      const data = err.response?.data;
      let msg = 'Registration failed. Please try again.';
      if (data) {
        if (typeof data === 'string') {
          msg = data;
        } else {
          msg = Object.entries(data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join('\n');
        }
      }
      Alert.alert('Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.appName}>Intelligent News App</Text>
          <Text style={styles.tagline}>Stay informed, stay local</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>

          <Field label="Username *" placeholder="johndoe" value={form.username} onChangeText={set('username')} />
          <Field label="Email *" placeholder="you@example.com" keyboard="email-address" value={form.email} onChangeText={set('email')} />
          <Field label="Phone (optional)" placeholder="+1 234 567 8900" keyboard="phone-pad" value={form.phone} onChangeText={set('phone')} />
          <Field 
            label="Password *" 
            placeholder="Min. 8 characters" 
            secure 
            showPass={showPass} 
            onToggleShow={() => setShowPass(!showPass)}
            value={form.password} 
            onChangeText={set('password')} 
          />

          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, styles.passInput]}
              value={form.password2}
              onChangeText={set('password2')}
              placeholder="Repeat password"
              secureTextEntry={!showPass}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { flexGrow: 1, padding: 20, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  appName: { fontSize: 30, fontWeight: 'bold', color: '#1a73e8' },
  tagline: { fontSize: 13, color: '#555', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 8 },
  label: { fontSize: 13, color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#222',
    backgroundColor: '#fafafa',
  },
  passRow: { flexDirection: 'row', alignItems: 'center' },
  passInput: { flex: 1 },
  passInput: { flex: 1 },
  eyeBtn: { position: 'absolute', right: 0, paddingHorizontal: 12, paddingVertical: 11 },
  eyeText: { color: '#1a73e8', fontSize: 13 },
  btn: {
    backgroundColor: '#1a73e8', borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 16, color: '#555', fontSize: 14 },
  linkBold: { color: '#1a73e8', fontWeight: '600' },
});
