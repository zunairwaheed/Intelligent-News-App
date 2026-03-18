import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, SafeAreaView, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUS_COLORS = {
  pending: { bg: '#fff8e1', text: '#f9a825', icon: 'time-outline' },
  approved: { bg: '#e8f5e9', text: '#43a047', icon: 'checkmark-circle-outline' },
  rejected: { bg: '#fce4ec', text: '#e53935', icon: 'close-circle-outline' },
};

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchMySubmissions();
  }, []));

  const fetchMySubmissions = async () => {
    try {
      const res = await api.get('/api/news/my-submissions/');
      setSubmissions(res.data.results || res.data);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const renderSubmission = ({ item }) => {
    const s = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    return (
      <TouchableOpacity 
        style={styles.submissionCard}
        onPress={() => item.status === 'approved' && navigation.navigate('NewsDetail', { 
          item, 
          isCommunity: true, 
          userCountry: user?.country_code 
        })}
      >
        <View style={styles.submissionHeader}>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon} size={13} color={s.text} />
            <Text style={[styles.statusText, { color: s.text }]}>{item.status}</Text>
          </View>
          <Text style={styles.submissionDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.submissionTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.submissionLocation}>
          <Ionicons name="location-outline" size={12} color="#888" /> {item.location_name}
        </Text>
        {item.status === 'rejected' && item.rejection_reason ? (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>Reason:</Text>
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.username}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.city && (
            <View style={styles.locationTag}>
              <Ionicons name="location-outline" size={12} color="#1a73e8" />
              <Text style={styles.locationTagText}>{user.city} · {user.country_code?.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#e53935" />
        </TouchableOpacity>
      </View>

      {/* Admin Panel (Only for Staff) */}
      {user?.is_staff ? (
        <TouchableOpacity 
          style={styles.adminPanelBtn} 
          onPress={() => navigation.navigate('AdminReview')}
        >
          <View style={styles.adminIcon}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.adminTitle}>Admin Panel</Text>
            <Text style={styles.adminSub}>Review and approve news submissions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1a73e8" />
        </TouchableOpacity>
      ) : null}

      {/* Submissions Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Submissions</Text>
        <Text style={styles.sectionCount}>{submissions.length} article{submissions.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#1a73e8" /></View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSubmission}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchMySubmissions(); }}
              colors={['#1a73e8']}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="newspaper-outline" size={50} color="#ddd" />
              <Text style={styles.emptyText}>No submissions yet.</Text>
              <Text style={styles.emptySubText}>Use the Submit tab to share Intelligent News App.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff', marginTop: 30 },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a73e8',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 18, fontWeight: '700', color: '#222' },
  userEmail: { fontSize: 13, color: '#888', marginTop: 2 },
  locationTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationTagText: { fontSize: 12, color: '#1a73e8', marginLeft: 2 },
  logoutBtn: { padding: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  sectionCount: { fontSize: 13, color: '#888' },
  list: { padding: 16 },
  submissionCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#eee',
  },
  submissionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 12, fontWeight: '600', marginLeft: 4, textTransform: 'capitalize' },
  submissionDate: { fontSize: 12, color: '#aaa' },
  submissionTitle: { fontSize: 15, fontWeight: '600', color: '#222', lineHeight: 21 },
  submissionLocation: { fontSize: 12, color: '#888', marginTop: 6 },
  rejectionBox: {
    backgroundColor: '#fce4ec', borderRadius: 6, padding: 10, marginTop: 8,
  },
  rejectionLabel: { fontSize: 12, fontWeight: '700', color: '#c62828' },
  rejectionText: { fontSize: 12, color: '#555', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#aaa', marginTop: 12, fontWeight: '500' },
  emptySubText: { fontSize: 13, color: '#bbb', marginTop: 6, textAlign: 'center' },
  adminPanelBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, marginTop: 16, borderTopWidth: 1, borderTopColor: '#eee',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  adminIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f9a825',
    justifyContent: 'center', alignItems: 'center',
  },
  adminInfo: { flex: 1, marginLeft: 12 },
  adminTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  adminSub: { fontSize: 13, color: '#666', marginTop: 2 },
});
