import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../../services/api';
import { getFullCountryName, getImageUri } from '../../utils/helpers';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NewsCard({ item, onPress, isCommunity = false, userCountry }) {
  const imageUri = getImageUri(item, BASE_URL);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image 
        source={imageUri ? { uri: imageUri } : require('../../../assets/not-available.png')} 
        style={styles.image} 
        resizeMode="cover" 
      />
      <View style={styles.body}>
        <View style={styles.topRow}>
          {isCommunity && <View style={styles.communityBadge}><Text style={styles.communityText}>Community</Text></View>}
          {item.source_id && <Text style={styles.source}>{item.source_id}</Text>}
        </View>

        <Text style={styles.title} numberOfLines={3}>{item.title}</Text>

        <View style={styles.meta}>
          <View style={styles.locationWrap}>
            {(item.location_name || item.country || userCountry) && (
              <>
                <Ionicons name="location-outline" size={13} color="#1a73e8" />
                <Text style={styles.location} numberOfLines={1}>
                  {item.location_name || (userCountry ? getFullCountryName(userCountry) : (item.country ? (Array.isArray(item.country) ? getFullCountryName(item.country[0]) : getFullCountryName(String(item.country))) : null))}
                </Text>
              </>
            )}
          </View>
          <Text style={styles.time}>
            {timeAgo(item.pubDate || item.created_at)}
          </Text>
        </View>

        {item.description && (
          <Text style={styles.desc} numberOfLines={2}>{item.description || item.content}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 10, marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  image: { width: '100%', height: 170 },
  body: { padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  communityBadge: {
    backgroundColor: '#e8f0fe', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, marginRight: 8,
  },
  communityText: { color: '#1a73e8', fontSize: 11, fontWeight: '600' },
  source: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', lineHeight: 22 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  locationWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, paddingRight: 8 },
  location: { fontSize: 12, color: '#1a73e8', fontWeight: '500', marginLeft: 4 },
  time: { fontSize: 12, color: '#999' },
  desc: { fontSize: 13, color: '#555', marginTop: 6, lineHeight: 19 },
});
