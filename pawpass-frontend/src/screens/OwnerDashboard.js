import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OwnerDashboard = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/owner/bookings');
      setBookings(res.data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // NEW: Function to change status (Upcoming -> Completed / Cancelled)
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await apiClient.patch(`/owner/bookings/${id}`, { status: newStatus });
      Alert.alert("Success", `Booking marked as ${newStatus}`);
      fetchBookings(); // Refresh list to show new status
    } catch (err) {
      Alert.alert("Error", "Could not update status.");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const renderBooking = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.petName}>🐾 {item.pet?.name || 'Unknown Pet'}</Text>
        <Text style={[styles.statusText, { color: item.status === 'Completed' ? '#4CAF50' : '#FF9800' }]}>
          {item.status}
        </Text>
      </View>
      
      <Text style={styles.text}><Text style={styles.bold}>Owner:</Text> {item.user?.name}</Text>
      <Text style={styles.text}><Text style={styles.bold}>Service:</Text> {item.service}</Text>
      <Text style={styles.text}><Text style={styles.bold}>Time:</Text> {item.date} at {item.time}</Text>
      
      {/* ACTION BUTTONS */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: '#4CAF50' }]} 
          onPress={() => handleStatusUpdate(item._id, 'Completed')}
        >
          <Text style={styles.btnText}>Complete</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: '#F44336' }]} 
          onPress={() => handleStatusUpdate(item._id, 'Cancelled')}
        >
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBooking}
        onRefresh={fetchBookings}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 50 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  logoutBtn: { padding: 8, backgroundColor: '#FFEBEE', borderRadius: 8 },
  logoutText: { color: '#D32F2F', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 15, marginBottom: 15, elevation: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  statusText: { fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  text: { fontSize: 15, color: '#555', marginBottom: 4 },
  bold: { fontWeight: 'bold', color: '#222' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  btn: { flex: 0.48, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});

export default OwnerDashboard;