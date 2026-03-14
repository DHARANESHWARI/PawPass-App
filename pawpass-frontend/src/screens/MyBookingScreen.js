import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import apiClient from '../api/client';

const MyBookingScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings/my');
      if (res.data.success) setBookings(res.data.bookings);
    } catch (err) { 
        console.error("Booking fetch error:", err); 
    } finally { 
        setLoading(false); 
        setRefreshing(false); 
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'In-Process': return { color: '#2196F3', bg: '#E3F2FD' };
      case 'Checked-In': return { color: '#FBC02D', bg: '#FFFDE7' }; // Added Yellow
      case 'Completed': 
      case 'Confirmed': return { color: '#4CAF50', bg: '#E8F5E9' };
      case 'Cancelled': return { color: '#F44336', bg: '#FFEBEE' };
      default: return { color: '#FF9800', bg: '#FFF3E0' };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.petName}>🐾 {item.pet?.name || "Pet"}</Text>
            <Text style={styles.serviceText}>{item.service}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>

        {/* UPDATED: POLITE REJECTION BOX */}
        {item.status === 'Cancelled' && item.rejectionReason ? (
          <View style={styles.rejectionBox}>
            <View style={styles.rejectionHeader}>
               <Text style={styles.rejectionIcon}>💌</Text>
               <Text style={styles.rejectionTitle}>A message from our team:</Text>
            </View>
            <Text style={styles.rejectionText}>"{item.rejectionReason}"</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.dateText}>📅 {item.date}  |  ⏰ {item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Appointments</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={bookings}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchBookings();}} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No bookings yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 20, color: '#1A1A1A' },
  card: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, padding: 18, borderRadius: 16, elevation: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  serviceText: { color: '#666', marginTop: 4, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  
  // UPDATED REJECTION STYLES
  rejectionBox: { 
    backgroundColor: '#FFF9F9', 
    padding: 15, 
    borderRadius: 12, 
    marginTop: 12, 
    borderWidth: 1,
    borderColor: '#FFDADA',
    borderStyle: 'dashed'
  },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  rejectionIcon: { fontSize: 16, marginRight: 8 },
  rejectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#D32F2F' },
  rejectionText: { fontSize: 14, color: '#555', fontStyle: 'italic', lineHeight: 20 },
  
  footer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
  dateText: { color: '#888', fontSize: 13, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default MyBookingScreen;