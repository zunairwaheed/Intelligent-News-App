import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TextInput, SafeAreaView, ScrollView, Modal,
  Animated
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import api from '../../services/api';
import NewsCard from '../../components/common/NewsCard';
import { getSavedLocation, saveLocation } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';

const TABS = ['Latest', 'Community'];
const CATEGORIES = ['All', 'Business', 'Entertainment', 'Health', 'Science', 'Sports', 'Technology', 'Top', 'World'];

export default function HomeScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('Latest');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [location, setLocation] = useState({
    city: user?.city || '',
    country_code: user?.country_code || 'us',
  });
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Filter States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDomain, setFilterDomain] = useState('');
  const [filterTimeframe, setFilterTimeframe] = useState('');
  const [filterSort, setFilterSort] = useState('');

  // Draft Filter States
  const [draftDomain, setDraftDomain] = useState('');
  const [draftTimeframe, setDraftTimeframe] = useState('');
  const [draftSort, setDraftSort] = useState('');

  const [availableChannels, setAvailableChannels] = useState([]);

  // Animation Refs
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 260; // Total height including the top: 30 offset
  
  const clampedScroll = Animated.diffClamp(scrollY, 0, HEADER_MAX_HEIGHT);
  
  const headerTranslate = clampedScroll.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT],
    outputRange: [0, -HEADER_MAX_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = clampedScroll.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT / 2, HEADER_MAX_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Auto-detect location on first load if not saved
  useEffect(() => {
    const initLocation = async () => {
      const saved = await getSavedLocation();
      if (saved) {
        setLocation(saved);
      } else {
        await detectLocation();
      }
    };
    initLocation();
  }, []);

  useFocusEffect(useCallback(() => {
    fetchNews();
  }, [tab, location, selectedCategory, filterDomain, filterTimeframe, filterSort]));

  const detectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show Intelligent News App.');
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
        setLocation(newLoc);
        await saveLocation(newLoc);
        // Persist to profile
        await api.patch('/api/auth/profile/', {
          city: newLoc.city,
          country_code: newLoc.country_code,
          latitude: newLoc.latitude,
          longitude: newLoc.longitude,
        });
      }
    } catch (err) {
      // Silently fall back to default location
    }
  };

  const fetchNews = async (page = null, append = false) => {
    if (!append) setLoading(true);
    try {
      let data;
      if (tab === 'Latest') {
        const params = { country: location.country_code };
        if (search.trim()) params.q = search.trim();
        if (selectedCategory !== 'All') params.category = selectedCategory.toLowerCase();
        if (filterDomain.trim()) params.domain = filterDomain.trim();
        if (filterTimeframe) params.timeframe = filterTimeframe;
        if (filterSort) params.prioritydomain = filterSort;
        if (page) params.page = page;
        const res = await api.get('/api/news/external/', { params });
        data = res.data;
        if (append) {
          setNews((prev) => [...prev, ...(data.results || [])]);
        } else {
          setNews(data.results || []);
        }
        setTotalResults(data.totalResults || 0);
        setNextPage(data.nextPage || null);

        // Extract unique channels
        if (data.results) {
          const channels = [...new Set(data.results.map(item => item.source_id).filter(Boolean))];
          setAvailableChannels(prev => [...new Set([...prev, ...channels])].slice(0, 15));
        }
      } else {
        const params = { country: location.country_code };
        const res = await api.get('/api/news/community/', { params });
        setNews(res.data.results || []);
        setTotalResults(res.data.count || res.data.length || 0);
        setNextPage(null);
      }
    } catch {
      if (!append) setNews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setNextPage(null);
    fetchNews();
  };

  const loadMore = () => {
    if (nextPage && !loadingMore && tab === 'Latest') {
      setLoadingMore(true);
      fetchNews(nextPage, true);
    }
  };

  const handleSearch = () => {
    setSearching(false);
    setNextPage(null);
    fetchNews();
  };

  const applyFilters = () => {
    setFilterDomain(draftDomain);
    setFilterTimeframe(draftTimeframe);
    setFilterSort(draftSort);
    setShowFilterModal(false);
    setNextPage(null);
  };

  const clearFilters = () => {
    setDraftDomain('');
    setDraftTimeframe('');
    setDraftSort('');
    setFilterDomain('');
    setFilterTimeframe('');
    setFilterSort('');
    setShowFilterModal(false);
    setNextPage(null);
  };

  const openFilters = () => {
    setDraftDomain(filterDomain);
    setDraftTimeframe(filterTimeframe);
    setDraftSort(filterSort);
    setShowFilterModal(true);
  };

  const locationLabel = location.city
    ? `${location.city} · ${location.country_code?.toUpperCase()}`
    : location.country_code?.toUpperCase() || 'Loading...';

  return (<SafeAreaView style={styles.safe}>
    <Animated.View style={[
      styles.headerContainer,
      { transform: [{ translateY: headerTranslate }], opacity: headerOpacity }
    ]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>Intelligent News App</Text>
        </View>
        <TouchableOpacity
          style={styles.locationBtn}
          onPress={() => navigation.navigate('ChangeLocation', { location, onSave: (l) => setLocation(l) })}
        >
          <Ionicons name="location-outline" size={14} color="#1a73e8" />
          <Text style={styles.locationText} numberOfLines={1}>{locationLabel}</Text>
          <Ionicons name="chevron-down" size={14} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#999" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search news..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#aaa"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setTimeout(fetchNews, 100); }}>
              <Ionicons name="close-circle" size={16} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilters}>
          <Ionicons name="options-outline" size={24} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabActive]}
            onPress={() => { setTab(t); setSelectedCategory('All'); }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Result Count and Filters */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {loading ? 'Searching...' : `${totalResults} article${totalResults !== 1 ? 's' : ''} found`}
        </Text>
      </View>

      {/* Categories Filter (Only show for Latest tab) */}
      {tab === 'Latest' && (
        <View style={styles.categoriesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </Animated.View>

    {loading ? (
      <View style={[styles.center, { marginTop: HEADER_MAX_HEIGHT }]}><ActivityIndicator size="large" color="#1a73e8" /></View>
    ) : news.length === 0 ? (
      <View style={[styles.center, { marginTop: HEADER_MAX_HEIGHT }]}>
        <Ionicons name="newspaper-outline" size={60} color="#ddd" />
        <Text style={styles.emptyText}>No news found for this area.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <Animated.FlatList
        data={news}
        keyExtractor={(item, i) => (item.article_id || item.id || i).toString()}
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            isCommunity={tab === 'Community'}
            userCountry={location?.country_code}
            onPress={() => navigation.navigate('NewsDetail', { item, isCommunity: tab === 'Community', userCountry: location?.country_code })}
          />
        )}
        contentContainerStyle={[
          styles.list, 
          { paddingTop: tab === 'Latest' ? HEADER_MAX_HEIGHT + 70 : HEADER_MAX_HEIGHT + 20 }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} progressViewOffset={HEADER_MAX_HEIGHT} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#1a73e8" style={{ margin: 16 }} /> : null}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    )}

    {/* Filter Modal */}
    <Modal visible={showFilterModal} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Advanced Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.filterLabel}>News Channel (Domain)</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="e.g. bbc.co.uk, cnn.com"
              value={draftDomain}
              onChangeText={setDraftDomain}
              placeholderTextColor="#aaa"
              autoCapitalize="none"
            />

            {availableChannels.length > 0 && (
              <View style={styles.suggestionBox}>
                <Text style={styles.suggestionTitle}>Suggested Channels:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionScroll}>
                  {availableChannels.map((ch) => (
                    <TouchableOpacity
                      key={ch}
                      style={[styles.suggestionChip, draftDomain === ch && styles.suggestionChipActive]}
                      onPress={() => setDraftDomain(ch)}
                    >
                      <Text style={[styles.suggestionText, draftDomain === ch && styles.suggestionTextActive]}>{ch}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.filterLabel}>Date & Time</Text>
            <View style={styles.filterOptions}>
              {['', '24', '48', '7d'].map((tf) => (
                <TouchableOpacity
                  key={tf}
                  style={[styles.filterOption, draftTimeframe === tf && styles.filterOptionActive]}
                  onPress={() => setDraftTimeframe(tf)}
                >
                  <Text style={[styles.filterOptionText, draftTimeframe === tf && styles.filterOptionTextActive]}>
                    {tf === '' ? 'All Time' : tf === '7d' ? 'Past 7 days' : `Past ${tf} hours`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Priority Sort</Text>
            <View style={styles.filterOptions}>
              {['', 'top'].map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[styles.filterOption, draftSort === sort && styles.filterOptionActive]}
                  onPress={() => setDraftSort(sort)}
                >
                  <Text style={[styles.filterOptionText, draftSort === sort && styles.filterOptionTextActive]}>
                    {sort === '' ? 'Relevance' : 'Top News First'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalBtnClear} onPress={clearFilters}>
              <Text style={styles.modalBtnClearText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnApply} onPress={applyFilters}>
              <Text style={styles.modalBtnApplyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff', marginTop: 0 },
  headerContainer: {
    position: 'absolute', top: 30, left: 0, right: 0,
    zIndex: 1000, backgroundColor: '#fff', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  appTitle: { fontSize: 20, fontWeight: '800', color: '#1a73e8' },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f0fe',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, maxWidth: 180,
  },
  locationText: { fontSize: 12, color: '#1a73e8', marginHorizontal: 4, fontWeight: '500' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#eee',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#222' },
  filterBtn: { marginLeft: 12, padding: 4 },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  tabBtn: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1a73e8' },
  tabText: { fontSize: 14, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#1a73e8', fontWeight: '700' },
  categoriesWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10 },
  categoriesScroll: { paddingHorizontal: 16, gap: 8 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee'
  },
  categoryChipActive: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  categoryText: { fontSize: 13, color: '#555', fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#aaa', fontSize: 15, marginTop: 12, textAlign: 'center' },
  retryBtn: {
    marginTop: 16, backgroundColor: '#1a73e8', borderRadius: 8,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  countRow: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  countText: { fontSize: 13, color: '#888', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  modalBody: { padding: 20 },
  filterLabel: { fontSize: 14, fontWeight: '700', color: '#444', marginBottom: 10, marginTop: 4 },
  filterInput: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginBottom: 20, color: '#333' },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  filterOption: { backgroundColor: '#f5f5f5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
  filterOptionActive: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  filterOptionText: { color: '#555', fontSize: 13, fontWeight: '500' },
  filterOptionTextActive: { color: '#fff' },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  modalBtnClear: { flex: 1, paddingVertical: 14, alignItems: 'center', marginRight: 10, borderRadius: 8, backgroundColor: '#f5f5f5' },
  modalBtnClearText: { color: '#555', fontWeight: '600', fontSize: 15 },
  modalBtnApply: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#1a73e8' },
  modalBtnApplyText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  suggestionBox: { marginBottom: 20 },
  suggestionTitle: { fontSize: 12, color: '#888', marginBottom: 8, fontWeight: '600' },
  suggestionScroll: { gap: 8 },
  suggestionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#eee' },
  suggestionChipActive: { backgroundColor: '#e8f0fe', borderColor: '#1a73e8' },
  suggestionText: { fontSize: 11, color: '#666' },
  suggestionTextActive: { color: '#1a73e8', fontWeight: '600' },
});
