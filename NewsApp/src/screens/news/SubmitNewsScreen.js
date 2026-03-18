import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function SubmitNewsScreen() {
  const [form, setForm] = useState({
    title: '', content: '', location_name: '', country_code: 'us',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.location_name.trim()) {
      Alert.alert('Error', 'Please fill in Title, Content, and Location.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('content', form.content.trim());
      formData.append('location_name', form.location_name.trim());
      formData.append('country_code', form.country_code.trim() || 'us');

      if (image) {
        formData.append('image', {
          uri: image.uri,
          name: 'news_image.jpg',
          type: 'image/jpeg',
        });
      }

      await api.post('/api/news/submit/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
      setForm({ title: '', content: '', location_name: '', country_code: 'us' });
      setImage(null);
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join('\n')
        : 'Submission failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={80} color="#34a853" />
          <Text style={styles.successTitle}>Submitted!</Text>
          <Text style={styles.successMsg}>
            Your news has been submitted and is pending review.{'\n'}
            It will appear publicly once approved by our team.
          </Text>
          <TouchableOpacity style={styles.anotherBtn} onPress={() => setSubmitted(false)}>
            <Text style={styles.anotherText}>Submit Another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1, marginTop: 30 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Submit News</Text>
          <Text style={styles.headerSub}>Your report will be reviewed before publishing</Text>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {/* Verification notice */}
          <View style={styles.noticeBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#f9a825" />
            <Text style={styles.noticeText}>
              All submissions are reviewed by our team before going live.
            </Text>
          </View>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={set('title')}
            placeholder="Brief headline for the news"
            placeholderTextColor="#aaa"
            maxLength={300}
          />

          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.content}
            onChangeText={set('content')}
            placeholder="Describe the news in detail..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={form.location_name}
            onChangeText={set('location_name')}
            placeholder="e.g. Downtown Manhattan, NY"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Country Code</Text>
          <TextInput
            style={[styles.input, styles.shortInput]}
            value={form.country_code}
            onChangeText={(v) => set('country_code')(v.toLowerCase().slice(0, 2))}
            placeholder="us"
            placeholderTextColor="#aaa"
            maxLength={2}
            autoCapitalize="none"
          />

          {/* Image picker */}
          <Text style={styles.label}>Photo (optional)</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={28} color="#aaa" />
                <Text style={styles.imagePlaceholderText}>Tap to add a photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {image && (
            <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImage}>
              <Text style={styles.removeImageText}>Remove photo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Submit for Review</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  header: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 3 },
  form: { padding: 16, paddingBottom: 40 },
  noticeBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffde7',
    borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ffe082',
  },
  noticeText: { flex: 1, fontSize: 13, color: '#666', marginLeft: 8, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#222',
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 120, paddingTop: 12 },
  shortInput: { width: 80 },
  imagePicker: {
    borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
    borderRadius: 10, overflow: 'hidden', backgroundColor: '#fafafa',
  },
  previewImage: { width: '100%', height: 180, borderRadius: 8 },
  imagePlaceholder: { height: 120, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: '#bbb', fontSize: 13, marginTop: 6 },
  removeImage: { alignItems: 'flex-end', marginTop: 4 },
  removeImageText: { color: '#e53935', fontSize: 13 },
  btn: {
    backgroundColor: '#1a73e8', borderRadius: 8, paddingVertical: 15,
    alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#34a853', marginTop: 16 },
  successMsg: { fontSize: 15, color: '#555', textAlign: 'center', marginTop: 12, lineHeight: 22 },
  anotherBtn: {
    marginTop: 28, backgroundColor: '#1a73e8', borderRadius: 8,
    paddingHorizontal: 28, paddingVertical: 13,
  },
  anotherText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
