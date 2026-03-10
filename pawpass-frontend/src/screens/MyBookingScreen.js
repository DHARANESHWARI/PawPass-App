import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import apiClient from '../api/client';

export default function MyBookingScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings/my');
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) { 
      console.error("MyBooking Fetch Error:", err); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const getStatusStyle = (status) => {
    switch(status) {
      case 'In-Process': return { color: '#2196F3', bg: '#E3F2FD' };
      case 'Completed': return { color: '#4CAF50', bg: '#E8F5E9' };
      case 'Confirmed': return { color: '#4CAF50', bg: '#E8F5E9' };
      case 'Cancelled': return { color: '#F44336', bg: '#FFEBEE' };
      default: return { color: '#FF9800', bg: '#FFF3E0' }; // Pending
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
          {/* FIXED: Replaced <div> with <View> */}
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.dateText}>📅 {item.date}  |  ⏰ {item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Appointments</Text>
      {loading ? <ActivityIndicator size="large" color="#4CAF50" /> : (
        <FlatList 
          data={bookings}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchBookings();}} />}
          ListEmptyComponent={<Text style={styles.empty}>No bookings yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 20, color: '#1A1A1A' },
  card: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, padding: 18, borderRadius: 16, elevation: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  serviceText: { color: '#666', marginTop: 4, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  footer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
  dateText: { color: '#888', fontSize: 13, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});