import React from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Share, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../../services/api';
import { getImageUri } from '../../utils/helpers';
import { getFullCountryName } from '../../utils/helpers';

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function NewsDetailScreen({ route, navigation }) {
  const { item, isCommunity, userCountry } = route.params;
  const [isExpanded, setIsExpanded] = React.useState(false);

  const imageUri = getImageUri(item, BASE_URL);

  const handleShare = () => {
    Share.share({
      title: item.title,
      message: item.link || item.title,
    });
  };

  const handleOpenLink = () => {
    if (item.link) Linking.openURL(item.link);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Article</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Image 
          source={imageUri ? { uri: imageUri } : require('../../../assets/not-available.png')} 
          style={styles.image} 
          resizeMode="cover" 
        />
        <View style={styles.content}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            {isCommunity && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Community</Text>
              </View>
            )}
            {(item.category || []).map((cat) => (
              <View key={cat} style={[styles.badge, styles.catBadge]}>
                <Text style={styles.catBadgeText}>{cat}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>{item.title}</Text>

          {/* Meta */}
          <View style={styles.meta}>
            {(item.location_name || item.country || userCountry) && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color="#1a73e8" />
                <Text style={styles.metaText}>
                  {item.location_name || (userCountry ? getFullCountryName(userCountry) : (item.country ? (Array.isArray(item.country) ? getFullCountryName(item.country[0]) : getFullCountryName(String(item.country))) : null))}
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color="#888" />
              <Text style={styles.metaTextGray}>{formatDate(item.pubDate || item.created_at)}</Text>
            </View>
            {(item.source_id || item.author_name) && (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={13} color="#888" />
                <Text style={styles.metaTextGray}>{item.source_id || item.author_name}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Description or AI Content */}
          {(item.description || item.content) ? (
            <View>
              <Text 
                style={styles.description} 
                numberOfLines={isExpanded ? undefined : 5}
              >
                {(item.description || item.content || '').replace(/[*#_`]+/g, '').trim()}
              </Text>
              {(item.description || item.content || '').length > 200 && (
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.showMoreBtn}>
                  <Text style={styles.showMoreText}>{isExpanded ? 'Show Less' : 'Show More'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.body}>No content available.</Text>
          )}

          {item.link && (
            <TouchableOpacity style={styles.linkBtn} onPress={handleOpenLink}>
              <Ionicons name="open-outline" size={16} color="#1a73e8" />
              <Text style={styles.linkBtnText}>Read full article</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', marginTop: 30, marginBottom: 30 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#333', marginHorizontal: 8 },
  shareBtn: { padding: 4 },
  scroll: { flex: 1 },
  image: { width: '100%', height: 220 },
  content: { padding: 20 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  badge: {
    backgroundColor: '#e8f0fe', borderRadius: 4, paddingHorizontal: 8,
    paddingVertical: 3, marginRight: 6, marginBottom: 4,
  },
  badgeText: { color: '#1a73e8', fontSize: 11, fontWeight: '600' },
  catBadge: { backgroundColor: '#f0f0f0' },
  catBadgeText: { color: '#666', fontSize: 11 },
  title: { fontSize: 22, fontWeight: '800', color: '#111', lineHeight: 30, marginBottom: 14 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#1a73e8', marginLeft: 4 },
  metaTextGray: { fontSize: 12, color: '#888', marginLeft: 4 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  description: { fontSize: 16, color: '#444', fontStyle: 'italic', lineHeight: 26, marginBottom: 12 },
  body: { fontSize: 16, color: '#333', lineHeight: 26 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', marginTop: 24,
    borderWidth: 1, borderColor: '#1a73e8', borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  linkBtnText: { color: '#1a73e8', fontWeight: '600', marginLeft: 6 },
  showMoreBtn: { marginTop: -8, marginBottom: 12, alignSelf: 'flex-start' },
  showMoreText: { color: '#1a73e8', fontWeight: '600', fontSize: 13 },
});
