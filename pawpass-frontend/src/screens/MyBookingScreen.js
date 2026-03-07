import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import apiClient from '../api/client';

export default function MyBookingScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings');
      setBookings(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.petName}>{item.pet?.name || "Previous Pet"}</Text>
          <Text style={styles.serviceText}>{item.service}</Text>
        </View>
        <Text style={styles.statusBadge}>{item.status}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.dateText}>📅 {item.date}</Text>
        <Text style={styles.dateText}>⏰ {item.time}</Text>
      </View>
    </View>
  );

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
  title: { fontSize: 24, fontWeight: 'bold', padding: 20 },
  card: { backgroundColor: '#fff', margin: 15, marginTop: 0, padding: 20, borderRadius: 15, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  serviceText: { color: '#666', marginTop: 4 },
  statusBadge: { color: '#2E7D32', fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  dateText: { color: '#888', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});