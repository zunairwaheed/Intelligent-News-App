import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Modal, FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../../services/api';

const COUNTRIES = [
  { code: 'af', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'al', name: 'Albania', flag: '🇦🇱' },
  { code: 'dz', name: 'Algeria', flag: '🇩🇿' },
  { code: 'ar', name: 'Argentina', flag: '🇦🇷' },
  { code: 'au', name: 'Australia', flag: '🇦🇺' },
  { code: 'at', name: 'Austria', flag: '🇦🇹' },
  { code: 'bd', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'be', name: 'Belgium', flag: '🇧🇪' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦' },
  { code: 'cl', name: 'Chile', flag: '🇨🇱' },
  { code: 'cn', name: 'China', flag: '🇨🇳' },
  { code: 'co', name: 'Colombia', flag: '🇨🇴' },
  { code: 'cz', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'dk', name: 'Denmark', flag: '🇩🇰' },
  { code: 'eg', name: 'Egypt', flag: '🇪🇬' },
  { code: 'fi', name: 'Finland', flag: '🇫🇮' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'gr', name: 'Greece', flag: '🇬🇷' },
  { code: 'hk', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'hu', name: 'Hungary', flag: '🇭🇺' },
  { code: 'in', name: 'India', flag: '🇮🇳' },
  { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'ie', name: 'Ireland', flag: '🇮🇪' },
  { code: 'il', name: 'Israel', flag: '🇮🇱' },
  { code: 'it', name: 'Italy', flag: '🇮🇹' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'ke', name: 'Kenya', flag: '🇰🇪' },
  { code: 'kw', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'my', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
  { code: 'nl', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'nz', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'ng', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'no', name: 'Norway', flag: '🇳🇴' },
  { code: 'pk', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'ph', name: 'Philippines', flag: '🇵🇭' },
  { code: 'pl', name: 'Poland', flag: '🇵🇱' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
  { code: 'qa', name: 'Qatar', flag: '🇶🇦' },
  { code: 'ro', name: 'Romania', flag: '🇷🇴' },
  { code: 'ru', name: 'Russia', flag: '🇷🇺' },
  { code: 'sa', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬' },
  { code: 'za', name: 'South Africa', flag: '🇿🇦' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
  { code: 'es', name: 'Spain', flag: '🇪🇸' },
  { code: 'lk', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'se', name: 'Sweden', flag: '🇸🇪' },
  { code: 'ch', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'tw', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'th', name: 'Thailand', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkey', flag: '🇹🇷' },
  { code: 'ua', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'ae', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'vn', name: 'Vietnam', flag: '🇻🇳' },
];

const CountryPickerModal = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.code.includes(q)) : COUNTRIES;
  }, [search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={picker.safe}>
        <View style={picker.header}>
          <Text style={picker.title}>Select Country</Text>
          <TouchableOpacity onPress={onClose} style={picker.closeBtn}>
            <Ionicons name="close" size={24} color="#222" />
          </TouchableOpacity>
        </View>

        <View style={picker.searchBox}>
          <Ionicons name="search-outline" size={16} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            style={picker.searchInput}
            placeholder="Search country..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity style={picker.item} onPress={() => { onSelect(item); setSearch(''); }}>
              <Text style={picker.flag}>{item.flag}</Text>
              <Text style={picker.countryName}>{item.name}</Text>
              <Text style={picker.countryCode}>{item.code.toUpperCase()}</Text>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={picker.sep} />}
        />
      </SafeAreaView>
    </Modal>
  );
};


export default function SubmitNewsScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', content: '', location_name: '', country_code: 'gb',
  });
  
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === 'gb'));
  
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const debounceRef = useRef(null);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!cityQuery.trim() || cityQuery.length < 2 || cityQuery === form.location_name) { 
      setCitySuggestions([]); 
      setShowSuggestions(false);
      return; 
    }
    
    setShowSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const countryFilter = selectedCountry ? `&countrycodes=${selectedCountry.code}` : '';
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&addressdetails=1&limit=5&featuretype=city${countryFilter}&accept-language=en`;
        const res = await fetch(url, { headers: { 'User-Agent': 'LocalNewsApp/1.0' } });
        const data = await res.json();
        setCitySuggestions(data);
      } catch { 
        setCitySuggestions([]); 
      } finally { 
        setLoadingSuggestions(false); 
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [cityQuery, selectedCountry, form.location_name]);

  const handleSelectCity = (place) => {
    const addr = place.address || {};
    const city = place.name_en || addr.city || addr.town || addr.village || addr.county || place.display_name.split(',')[0];
    const code = (addr.country_code || selectedCountry?.code || 'us').toLowerCase();
    
    setForm(f => ({ ...f, location_name: city, country_code: code }));
    setCityQuery(city);
    setShowSuggestions(false);
  };

  const detectCurrentLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geocode = await Location.reverseGeocodeAsync(pos.coords);
      if (geocode.length > 0) {
        const place = geocode[0];
        const countryCode = (place.isoCountryCode || 'us').toLowerCase();
        const city = place.city || place.region || '';
        const countryInfo = COUNTRIES.find(c => c.code === countryCode);
        
        if (countryInfo) setSelectedCountry(countryInfo);
        setForm(f => ({ ...f, country_code: countryCode, location_name: city }));
        setCityQuery(city);
      }
    } catch {
      Alert.alert('Error', 'Could not detect your location.');
    } finally {
      setDetecting(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8, base64: true,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.location_name.trim()) {
      Alert.alert('Error', 'Please fill in Title, Content, and select a valid City.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        location_name: form.location_name.trim(),
        country_code: form.country_code.trim() || selectedCountry.code,
      };

      if (image && image.base64) {
        payload.image = 'data:image/jpeg;base64,' + image.base64;
      }

      const token = await AsyncStorage.getItem('@access_token');
      const response = await fetch(`${BASE_URL}/api/news/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { response: { data: errorData } };
      }
      setSubmitted(true);
      setForm({ title: '', content: '', location_name: '', country_code: 'gb' });
      setCityQuery('');
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

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="always">
          <View style={styles.noticeBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#f9a825" />
            <Text style={styles.noticeText}>All submissions are reviewed by our team before going live.</Text>
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

          {/* Location Dropdowns Inline */}
          <Text style={styles.label}>Country *</Text>
          <TouchableOpacity style={styles.countryPickerBtn} onPress={() => setCountryPickerVisible(true)}>
            {selectedCountry ? (
              <>
                <Text style={styles.pickerFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.pickerName}>{selectedCountry.name}</Text>
              </>
            ) : (
              <Text style={styles.pickerPlaceholder}>Select Country...</Text>
            )}
            <Ionicons name="chevron-down" size={18} color="#888" style={{marginLeft: 'auto'}}/>
          </TouchableOpacity>

          <Text style={styles.label}>City *</Text>
          <View style={[styles.input, { padding: 0 }]}>
            <TextInput
              style={{ paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#222' }}
              value={cityQuery}
              onChangeText={(text) => {
                setCityQuery(text);
                if (text !== form.location_name) {
                  setForm(f => ({ ...f, location_name: '' }));
                }
              }}
              placeholder="Start typing your city..."
              placeholderTextColor="#aaa"
            />
          </View>
          
          {showSuggestions && (loadingSuggestions || citySuggestions.length > 0) && (
            <View style={styles.suggestionsBox}>
              {loadingSuggestions ? (
                <ActivityIndicator color="#1a73e8" style={{ padding: 12 }} />
              ) : (
                citySuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.place_id?.toString()}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectCity(item)}
                  >
                    <Ionicons name="location-outline" size={16} color="#666" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionCity} numberOfLines={1}>
                        {item.name_en || item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0]}
                      </Text>
                      <Text style={styles.suggestionSub} numberOfLines={1}>{item.display_name}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          <TouchableOpacity style={styles.detectBtn} onPress={detectCurrentLocation} disabled={detecting}>
            {detecting
              ? <ActivityIndicator size="small" color="#1a73e8" />
              : <Ionicons name="navigate" size={18} color="#1a73e8" />
            }
            <Text style={styles.detectText}>Use My Current Location</Text>
          </TouchableOpacity>

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
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit for Review</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        onSelect={(c) => { 
          setSelectedCountry(c);
          setForm(f => ({ ...f, country_code: c.code, location_name: '' }));
          setCityQuery('');
          setCountryPickerVisible(false); 
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 3 },
  form: { padding: 16, paddingBottom: 40 },
  noticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffde7', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ffe082' },
  noticeText: { flex: 1, fontSize: 13, color: '#666', marginLeft: 8, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#222', backgroundColor: '#fff' },
  textarea: { minHeight: 120, paddingTop: 12 },
  imagePicker: { borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fafafa' },
  previewImage: { width: '100%', height: 180, borderRadius: 8 },
  imagePlaceholder: { height: 120, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { color: '#bbb', fontSize: 13, marginTop: 6 },
  removeImage: { alignItems: 'flex-end', marginTop: 4 },
  removeImageText: { color: '#e53935', fontSize: 13 },
  btn: { backgroundColor: '#1a73e8', borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#34a853', marginTop: 16 },
  successMsg: { fontSize: 15, color: '#555', textAlign: 'center', marginTop: 12, lineHeight: 22 },
  anotherBtn: { marginTop: 28, backgroundColor: '#1a73e8', borderRadius: 8, paddingHorizontal: 28, paddingVertical: 13 },
  anotherText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  
  countryPickerBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: '#ddd',
  },
  pickerFlag: { fontSize: 22, marginRight: 10 },
  pickerName: { fontSize: 15, color: '#222', fontWeight: '500' },
  pickerPlaceholder: { fontSize: 15, color: '#aaa' },
  
  suggestionsBox: {
    marginTop: 4, backgroundColor: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    overflow: 'hidden', zIndex: 10
  },
  detectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 16, backgroundColor: '#e8f0fe',
    borderRadius: 8, paddingVertical: 13,
  },
  detectText: { color: '#1a73e8', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  suggestionCity: { fontSize: 14, fontWeight: '600', color: '#222' },
  suggestionSub: { fontSize: 11, color: '#999', marginTop: 1 },
});

const picker = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: '700', color: '#222' },
  closeBtn: { padding: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: '#f5f7ff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e0e4f0' },
  searchInput: { flex: 1, fontSize: 15, color: '#222' },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  flag: { fontSize: 24, marginRight: 14 },
  countryName: { flex: 1, fontSize: 15, color: '#222' },
  countryCode: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  sep: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },
});
