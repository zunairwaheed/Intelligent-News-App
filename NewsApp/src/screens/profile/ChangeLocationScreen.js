import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, SafeAreaView, Alert,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../../services/api';
import { saveLocation } from '../../utils/storage';

// ---------------------------------------------------------------------------
// Country data — ISO2 code, flag emoji, name
// ---------------------------------------------------------------------------
const COUNTRIES = [
  { code: 'af', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'al', name: 'Albania', flag: '🇦🇱' },
  { code: 'dz', name: 'Algeria', flag: '🇩🇿' },
  { code: 'ad', name: 'Andorra', flag: '🇦🇩' },
  { code: 'ao', name: 'Angola', flag: '🇦🇴' },
  { code: 'ag', name: 'Antigua & Barbuda', flag: '🇦🇬' },
  { code: 'ar', name: 'Argentina', flag: '🇦🇷' },
  { code: 'am', name: 'Armenia', flag: '🇦🇲' },
  { code: 'au', name: 'Australia', flag: '🇦🇺' },
  { code: 'at', name: 'Austria', flag: '🇦🇹' },
  { code: 'az', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'bs', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'bh', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'bd', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'bb', name: 'Barbados', flag: '🇧🇧' },
  { code: 'by', name: 'Belarus', flag: '🇧🇾' },
  { code: 'be', name: 'Belgium', flag: '🇧🇪' },
  { code: 'bz', name: 'Belize', flag: '🇧🇿' },
  { code: 'bj', name: 'Benin', flag: '🇧🇯' },
  { code: 'bt', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'bo', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'ba', name: 'Bosnia & Herzegovina', flag: '🇧🇦' },
  { code: 'bw', name: 'Botswana', flag: '🇧🇼' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' },
  { code: 'bn', name: 'Brunei', flag: '🇧🇳' },
  { code: 'bg', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'bf', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'bi', name: 'Burundi', flag: '🇧🇮' },
  { code: 'cv', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: 'kh', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'cm', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦' },
  { code: 'cf', name: 'Central African Rep.', flag: '🇨🇫' },
  { code: 'td', name: 'Chad', flag: '🇹🇩' },
  { code: 'cl', name: 'Chile', flag: '🇨🇱' },
  { code: 'cn', name: 'China', flag: '🇨🇳' },
  { code: 'co', name: 'Colombia', flag: '🇨🇴' },
  { code: 'km', name: 'Comoros', flag: '🇰🇲' },
  { code: 'cg', name: 'Congo', flag: '🇨🇬' },
  { code: 'cr', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'hr', name: 'Croatia', flag: '🇭🇷' },
  { code: 'cu', name: 'Cuba', flag: '🇨🇺' },
  { code: 'cy', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'cz', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'dk', name: 'Denmark', flag: '🇩🇰' },
  { code: 'dj', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'dm', name: 'Dominica', flag: '🇩🇲' },
  { code: 'do', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'ec', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'eg', name: 'Egypt', flag: '🇪🇬' },
  { code: 'sv', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'gq', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'er', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'ee', name: 'Estonia', flag: '🇪🇪' },
  { code: 'sz', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'et', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'fj', name: 'Fiji', flag: '🇫🇯' },
  { code: 'fi', name: 'Finland', flag: '🇫🇮' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'ga', name: 'Gabon', flag: '🇬🇦' },
  { code: 'gm', name: 'Gambia', flag: '🇬🇲' },
  { code: 'ge', name: 'Georgia', flag: '🇬🇪' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'gh', name: 'Ghana', flag: '🇬🇭' },
  { code: 'gr', name: 'Greece', flag: '🇬🇷' },
  { code: 'gd', name: 'Grenada', flag: '🇬🇩' },
  { code: 'gt', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'gn', name: 'Guinea', flag: '🇬🇳' },
  { code: 'gw', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'gy', name: 'Guyana', flag: '🇬🇾' },
  { code: 'ht', name: 'Haiti', flag: '🇭🇹' },
  { code: 'hn', name: 'Honduras', flag: '🇭🇳' },
  { code: 'hu', name: 'Hungary', flag: '🇭🇺' },
  { code: 'is', name: 'Iceland', flag: '🇮🇸' },
  { code: 'in', name: 'India', flag: '🇮🇳' },
  { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'ir', name: 'Iran', flag: '🇮🇷' },
  { code: 'iq', name: 'Iraq', flag: '🇮🇶' },
  { code: 'ie', name: 'Ireland', flag: '🇮🇪' },
  { code: 'il', name: 'Israel', flag: '🇮🇱' },
  { code: 'it', name: 'Italy', flag: '🇮🇹' },
  { code: 'jm', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'jo', name: 'Jordan', flag: '🇯🇴' },
  { code: 'kz', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'ke', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ki', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'kw', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'kg', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'la', name: 'Laos', flag: '🇱🇦' },
  { code: 'lv', name: 'Latvia', flag: '🇱🇻' },
  { code: 'lb', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'ls', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'lr', name: 'Liberia', flag: '🇱🇷' },
  { code: 'ly', name: 'Libya', flag: '🇱🇾' },
  { code: 'li', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'lt', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'lu', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'mg', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'mw', name: 'Malawi', flag: '🇲🇼' },
  { code: 'my', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'mv', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ml', name: 'Mali', flag: '🇲🇱' },
  { code: 'mt', name: 'Malta', flag: '🇲🇹' },
  { code: 'mh', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'mr', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'mu', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'mx', name: 'Mexico', flag: '🇲🇽' },
  { code: 'fm', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'md', name: 'Moldova', flag: '🇲🇩' },
  { code: 'mc', name: 'Monaco', flag: '🇲🇨' },
  { code: 'mn', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'me', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'ma', name: 'Morocco', flag: '🇲🇦' },
  { code: 'mz', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'mm', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'na', name: 'Namibia', flag: '🇳🇦' },
  { code: 'nr', name: 'Nauru', flag: '🇳🇷' },
  { code: 'np', name: 'Nepal', flag: '🇳🇵' },
  { code: 'nl', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'nz', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'ni', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'ne', name: 'Niger', flag: '🇳🇪' },
  { code: 'ng', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'kp', name: 'North Korea', flag: '🇰🇵' },
  { code: 'mk', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'no', name: 'Norway', flag: '🇳🇴' },
  { code: 'om', name: 'Oman', flag: '🇴🇲' },
  { code: 'pk', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'pw', name: 'Palau', flag: '🇵🇼' },
  { code: 'pa', name: 'Panama', flag: '🇵🇦' },
  { code: 'pg', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'py', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'pe', name: 'Peru', flag: '🇵🇪' },
  { code: 'ph', name: 'Philippines', flag: '🇵🇭' },
  { code: 'pl', name: 'Poland', flag: '🇵🇱' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
  { code: 'qa', name: 'Qatar', flag: '🇶🇦' },
  { code: 'ro', name: 'Romania', flag: '🇷🇴' },
  { code: 'ru', name: 'Russia', flag: '🇷🇺' },
  { code: 'rw', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'kn', name: 'Saint Kitts & Nevis', flag: '🇰🇳' },
  { code: 'lc', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'vc', name: 'Saint Vincent & Grenadines', flag: '🇻🇨' },
  { code: 'ws', name: 'Samoa', flag: '🇼🇸' },
  { code: 'sm', name: 'San Marino', flag: '🇸🇲' },
  { code: 'st', name: 'São Tomé & Príncipe', flag: '🇸🇹' },
  { code: 'sa', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'sn', name: 'Senegal', flag: '🇸🇳' },
  { code: 'rs', name: 'Serbia', flag: '🇷🇸' },
  { code: 'sc', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'sl', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬' },
  { code: 'sk', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'si', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'sb', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'so', name: 'Somalia', flag: '🇸🇴' },
  { code: 'za', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ss', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'es', name: 'Spain', flag: '🇪🇸' },
  { code: 'lk', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'sd', name: 'Sudan', flag: '🇸🇩' },
  { code: 'sr', name: 'Suriname', flag: '🇸🇷' },
  { code: 'se', name: 'Sweden', flag: '🇸🇪' },
  { code: 'ch', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'sy', name: 'Syria', flag: '🇸🇾' },
  { code: 'tw', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'tj', name: 'Tajikistan', flag: '🇹🇯' },
  { code: 'tz', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'th', name: 'Thailand', flag: '🇹🇭' },
  { code: 'tl', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'tg', name: 'Togo', flag: '🇹🇬' },
  { code: 'to', name: 'Tonga', flag: '🇹🇴' },
  { code: 'tt', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { code: 'tn', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'tr', name: 'Turkey', flag: '🇹🇷' },
  { code: 'tm', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'tv', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'ug', name: 'Uganda', flag: '🇺🇬' },
  { code: 'ua', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'ae', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'uy', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'uz', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'vu', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 've', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'vn', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'ye', name: 'Yemen', flag: '🇾🇪' },
  { code: 'zm', name: 'Zambia', flag: '🇿🇲' },
  { code: 'zw', name: 'Zimbabwe', flag: '🇿🇼' },
];

// ---------------------------------------------------------------------------
// Country Picker Modal (standalone so it doesn't cause keyboard dismissal)
// ---------------------------------------------------------------------------
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
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#bbb" />
            </TouchableOpacity>
          )}
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

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function ChangeLocationScreen({ navigation, route }) {
  const { location, onSave } = route.params || {};
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    location?.country_code
      ? COUNTRIES.find(c => c.code === location.country_code.toLowerCase()) || null
      : null
  );
  const debounceRef = useRef(null);

  // Live city autocomplete while typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const countryFilter = selectedCountry ? `&countrycodes=${selectedCountry.code}` : '';
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&featuretype=city${countryFilter}&accept-language=en`;
        const res = await fetch(url, { headers: { 'User-Agent': 'LocalNewsApp/1.0' } });
        const data = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); } finally { setLoadingSuggestions(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, selectedCountry]);

  const searchLocation = async () => {
    if (!query.trim()) return;
    setSuggestions([]);
    setLoading(true);
    try {
      const countryFilter = selectedCountry ? `&countrycodes=${selectedCountry.code}` : '';
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10${countryFilter}&accept-language=en`;
      const res = await fetch(url, { headers: { 'User-Agent': 'LocalNewsApp/1.0' } });
      const data = await res.json();
      setResults(data);
    } catch {
      Alert.alert('Error', 'Could not search locations. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = async (place) => {
    const addr = place.address || {};
    // Extract the English city name from name_en tag if available, else fall back
    const city =
      place.name_en ||
      addr.city || addr.town || addr.village || addr.county ||
      place.display_name.split(',')[0];
    const countryCode = (addr.country_code || selectedCountry?.code || 'us').toLowerCase();

    const newLoc = {
      city,
      country_code: countryCode,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    };

    setSuggestions([]);
    setResults([]);
    setQuery('');
    if (!route.params?.skipProfileUpdate) {
      await saveLocation(newLoc);
      try {
        await api.patch('/api/auth/profile/', {
          city: newLoc.city,
          country_code: newLoc.country_code,
          latitude: newLoc.latitude,
          longitude: newLoc.longitude,
        });
      } catch { }
    }
    // Navigate back with data instead of using a callback (serializable navigation fix)
    navigation.navigate({
      name: route.params?.returnTo || 'Home',
      params: { updatedLocation: newLoc },
      merge: true,
    });
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
        const newLoc = {
          city: place.city || place.region || '',
          country_code: (place.isoCountryCode || 'us').toLowerCase(),
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        if (!route.params?.skipProfileUpdate) {
          await saveLocation(newLoc);
          try { await api.patch('/api/auth/profile/', newLoc); } catch { }
        }
        // Navigate back with data instead of using a callback (serializable navigation fix)
        navigation.navigate({
          name: route.params?.returnTo || 'Home',
          params: { updatedLocation: newLoc },
          merge: true,
        });
      }
    } catch {
      Alert.alert('Error', 'Could not detect your location.');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id?.toString()}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={22} color="#222" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Location</Text>
              </View>

              {/* Current location */}
              {location?.city && (
                <View style={styles.currentBox}>
                  <Ionicons name="location" size={16} color="#1a73e8" />
                  <Text style={styles.currentText}>
                    Current: {location.city} · {location.country_code?.toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Auto-detect */}
              <TouchableOpacity style={styles.detectBtn} onPress={detectCurrentLocation} disabled={detecting}>
                {detecting
                  ? <ActivityIndicator size="small" color="#1a73e8" />
                  : <Ionicons name="navigate" size={18} color="#1a73e8" />
                }
                <Text style={styles.detectText}>Use My Current Location</Text>
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR SEARCH MANUALLY</Text>
                <View style={styles.line} />
              </View>

              {/* ── Country Picker ── */}
              <View style={styles.sectionLabel}>
                <Ionicons name="flag-outline" size={14} color="#555" />
                <Text style={styles.sectionLabelText}>Country (optional — filters search)</Text>
              </View>
              <TouchableOpacity style={styles.countryPickerBtn} onPress={() => setPickerVisible(true)}>
                {selectedCountry ? (
                  <>
                    <Text style={styles.pickerFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.pickerName}>{selectedCountry.name}</Text>
                  </>
                ) : (
                  <Text style={styles.pickerPlaceholder}>Select a country…</Text>
                )}
                <Ionicons name="chevron-down" size={18} color="#888" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              {/* ── City Search ── */}
              <View style={styles.sectionLabel}>
                <Ionicons name="search-outline" size={14} color="#555" />
                <Text style={styles.sectionLabelText}>City or area</Text>
              </View>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type a city to see suggestions..."
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={searchLocation}
                  returnKeyType="search"
                  placeholderTextColor="#aaa"
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => { setQuery(''); setSuggestions([]); setResults([]); }}
                  >
                    <Ionicons name="close-circle" size={18} color="#bbb" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.searchBtn} onPress={searchLocation}>
                  <Text style={styles.searchBtnText}>Go</Text>
                </TouchableOpacity>
              </View>

              {/* Live suggestions dropdown */}
              {(loadingSuggestions || suggestions.length > 0) && (
                <View style={styles.suggestionsBox}>
                  {loadingSuggestions ? (
                    <ActivityIndicator color="#1a73e8" style={{ padding: 12 }} />
                  ) : (
                    suggestions.map((item) => {
                      const countryCode = item.address?.country_code?.toLowerCase() || '';
                      const countryInfo = COUNTRIES.find(c => c.code === countryCode);
                      const cityName = item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0];
                      return (
                        <TouchableOpacity
                          key={item.place_id?.toString()}
                          style={styles.suggestionItem}
                          onPress={() => selectLocation(item)}
                        >
                          <Text style={styles.suggestionFlag}>{countryInfo?.flag || '📍'}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.suggestionCity} numberOfLines={1}>{cityName}</Text>
                            <Text style={styles.suggestionSub} numberOfLines={1}>{item.display_name}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

              {loading && <ActivityIndicator color="#1a73e8" style={{ marginTop: 20 }} />}
            </View>
          }
          renderItem={({ item }) => {
            const countryCode = item.address?.country_code?.toLowerCase() || '';
            const countryInfo = COUNTRIES.find(c => c.code === countryCode);
            return (
              <TouchableOpacity style={styles.resultItem} onPress={() => selectLocation(item)}>
                <Text style={styles.resultFlag}>{countryInfo?.flag || '📍'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0]}
                  </Text>
                  <Text style={styles.placeSubtitle} numberOfLines={1}>{item.display_name}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            !loading && query.length > 0 ? (
              <Text style={styles.emptyText}>No results. Try a different search.</Text>
            ) : null
          }
        />
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(c) => { setSelectedCountry(c); setPickerVisible(false); }}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 20,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  currentBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f0fe',
    marginHorizontal: 16, marginTop: 16, borderRadius: 8, padding: 12,
  },
  currentText: { color: '#1a73e8', fontSize: 14, fontWeight: '500', marginLeft: 6 },
  detectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#1a73e8', borderRadius: 8, paddingVertical: 13,
  },
  detectText: { color: '#1a73e8', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: '#ddd' },
  orText: { fontSize: 11, color: '#aaa', marginHorizontal: 10, fontWeight: '600' },
  sectionLabel: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 6,
  },
  sectionLabelText: { fontSize: 12, color: '#555', fontWeight: '600', marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Country picker button
  countryPickerBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: '#ddd',
  },
  pickerFlag: { fontSize: 22, marginRight: 10 },
  pickerName: { fontSize: 15, color: '#222', fontWeight: '500' },
  pickerPlaceholder: { fontSize: 15, color: '#aaa' },
  // Search
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  searchInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#ddd', fontSize: 15, color: '#222',
  },
  searchBtn: {
    backgroundColor: '#1a73e8', borderRadius: 8,
    paddingHorizontal: 18, justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  clearBtn: { paddingHorizontal: 6, justifyContent: 'center' },
  // Suggestions dropdown
  suggestionsBox: {
    marginHorizontal: 16, marginTop: 4,
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#e0e4f0',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  suggestionFlag: { fontSize: 20, marginRight: 12 },
  suggestionCity: { fontSize: 15, fontWeight: '600', color: '#222' },
  suggestionSub: { fontSize: 11, color: '#999', marginTop: 1 },
  // Results
  list: { padding: 16 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 8, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#eee',
  },
  resultFlag: { fontSize: 22, marginRight: 12 },
  placeName: { fontSize: 15, fontWeight: '600', color: '#222' },
  placeSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 32, fontSize: 14 },
});

const picker = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#222' },
  closeBtn: { padding: 4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, backgroundColor: '#f5f7ff',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#e0e4f0',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#222' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  flag: { fontSize: 24, marginRight: 14 },
  countryName: { flex: 1, fontSize: 15, color: '#222' },
  countryCode: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  sep: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },
});
