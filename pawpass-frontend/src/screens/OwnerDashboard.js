import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, ActivityIndicator, Modal, ScrollView 
} from 'react-native';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OwnerDashboard = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const openPetProfile = (pet) => {
    if (!pet) return Alert.alert("Error", "Pet data missing.");
    setSelectedPet(pet);
    setModalVisible(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const renderBooking = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => openPetProfile(item.pet)}>
          <Text style={styles.petName}>🐾 {item.pet?.name || 'Unknown'}</Text>
          <Text style={styles.subLink}>View Full Profile</Text>
        </TouchableOpacity>
        <Text style={[styles.statusText, { color: item.status === 'Completed' ? '#4CAF50' : '#FF9800' }]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.text}><Text style={styles.bold}>Service:</Text> {item.service}</Text>
      <Text style={styles.text}><Text style={styles.bold}>Owner:</Text> {item.user?.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>

      <FlatList 
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={renderBooking}
        onRefresh={fetchBookings}
        refreshing={loading}
      />

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pet Medical Record</Text>
            {selectedPet && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeader}>General Info</Text>
                <View style={styles.infoRow}><Text style={styles.label}>Name:</Text><Text style={styles.val}>{selectedPet.name}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Breed:</Text><Text style={styles.val}>{selectedPet.breed || 'N/A'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Age:</Text><Text style={styles.val}>{selectedPet.age} Years</Text></View>

                <Text style={styles.sectionHeader}>Health & Medical</Text>
                {/* Vaccination Status field adjusted for full text */}
                <View style={styles.infoRow}><Text style={styles.label}>Vaccines:</Text><Text style={styles.val}>{selectedPet.vaccinationStatus || 'Unknown'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Allergies:</Text><Text style={styles.val}>{selectedPet.allergies || 'None'}</Text></View>

                <Text style={styles.sectionHeader}>Behavioral Profile</Text>
                <View style={styles.infoRow}><Text style={styles.label}>Friendly:</Text><Text style={styles.val}>{selectedPet.isFriendly || 'N/A'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Afraid Of:</Text><Text style={styles.val}>{selectedPet.afraidOf || 'None'}</Text></View>
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 50 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  logoutText: { color: 'red', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 3 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  subLink: { fontSize: 10, color: '#4CAF50', textDecorationLine: 'underline' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  text: { fontSize: 14, color: '#666', marginBottom: 2 },
  bold: { fontWeight: 'bold', color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#4CAF50', marginBottom: 15 },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', color: '#4CAF50', marginTop: 15, marginBottom: 5, textTransform: 'uppercase' },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start' // Ensures labels stay aligned if values wrap
  },
  label: { color: '#888', flex: 1 },
  val: { 
    color: '#333', 
    fontWeight: '500', 
    flex: 2, // Gives more space to the value (like "Up to date")
    textAlign: 'right' 
  },
  closeBtn: { marginTop: 20, backgroundColor: '#4CAF50', padding: 12, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: 'bold' }
});

export default OwnerDashboard;