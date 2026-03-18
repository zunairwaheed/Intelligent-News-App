import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, Alert, RefreshControl,
  TextInput, Modal, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api, { BASE_URL } from '../../services/api';
import { getImageUri } from '../../utils/helpers';

export default function AdminReviewScreen({ navigation }) {
  const [pendingNews, setPendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Rejection Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchPending();
  }, []));

  const fetchPending = async () => {
    try {
      const res = await api.get('/api/news/admin/pending/');
      setPendingNews(res.data.results || res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch pending news.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (id) => {
    Alert.alert('Approve News', 'Are you sure you want to approve this article?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Approve', 
        onPress: async () => {
          try {
            await api.post(`/api/news/admin/review/${id}/`, { status: 'approved' });
            setPendingNews(prev => prev.filter(item => item.id !== id));
          } catch (err) {
            Alert.alert('Error', 'Approval failed.');
          }
        }
      },
    ]);
  };

  const openRejectModal = (id) => {
    setSelectedId(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection.');
      return;
    }
    setReviewing(true);
    try {
      await api.post(`/api/news/admin/review/${selectedId}/`, { 
        status: 'rejected', 
        rejection_reason: rejectionReason.trim() 
      });
      setPendingNews(prev => prev.filter(item => item.id !== selectedId));
      setShowRejectModal(false);
    } catch (err) {
      Alert.alert('Error', 'Rejection failed.');
    } finally {
      setReviewing(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.author}>{item.author_name || 'Anonymous'}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      {getImageUri(item, BASE_URL) && (
        <Image 
          source={{ uri: getImageUri(item, BASE_URL) }} 
          style={styles.previewImage} 
          resizeMode="cover"
        />
      )}
      <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
      <View style={styles.location}>
        <Ionicons name="location-outline" size={12} color="#888" />
        <Text style={styles.locationText}>{item.location_name} ({item.country_code?.toUpperCase()})</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.approveBtn]} 
          onPress={() => handleApprove(item.id)}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.actionText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn]} 
          onPress={() => openRejectModal(item.id)}
        >
          <Ionicons name="close" size={18} color="#fff" />
          <Text style={styles.actionText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Review</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#1a73e8" /></View>
      ) : (
        <FlatList
          data={pendingNews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPending(); }} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="shield-checkmark-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>No pending news to review.</Text>
            </View>
          }
        />
      )}

      {/* Rejection Modal */}
      <Modal visible={showRejectModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject News</Text>
            <Text style={styles.modalSub}>Provide a reason for the user:</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="e.g. Information not verified, missing source..."
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalConfirm, reviewing && { opacity: 0.6 }]} 
                onPress={handleReject}
                disabled={reviewing}
              >
                {reviewing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalConfirmText}>Confirm Rejection</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff', marginTop: 30 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  backBtn: { padding: 4 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 16, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  author: { fontSize: 13, fontWeight: '600', color: '#1a73e8' },
  date: { fontSize: 12, color: '#999' },
  title: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 6 },
  content: { fontSize: 14, color: '#555', lineHeight: 20 },
  location: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  locationText: { fontSize: 12, color: '#888', marginLeft: 4 },
  actions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', 
    justifyContent: 'center', paddingVertical: 10, borderRadius: 8,
  },
  approveBtn: { backgroundColor: '#34a853' },
  rejectBtn: { backgroundColor: '#e53935' },
  actionText: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 },
  previewImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#aaa', fontSize: 16, marginTop: 16, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 6 },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 12 },
  modalInput: { 
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12,
    fontSize: 14, minHeight: 100, marginBottom: 20, backgroundColor: '#fafafa'
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#f5f5f5' },
  modalCancelText: { color: '#666', fontWeight: '600' },
  modalConfirm: { flex: 2, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#e53935' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
});
