import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Modal, ScrollView, Alert, TextInput, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import apiClient from '../api/client';

export default function PetListScreen({ route }) {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Options matching AddPetScreen requirements
  const dropdownOptions = {
    gender: ['Male', 'Female'],
    vaccinationStatus: ['Up to date', 'Pending', 'Not Vaccinated'],
    isFriendly: ['Yes', 'No', 'Partially'],
    allergies: ['None', 'Grain-free', 'Skin Allergies', 'Other'],
  };

  const fetchPets = async () => {
    try {
      const res = await apiClient.get('/pets');
      setPets(res.data);

      const autoOpenId = route.params?.autoOpenId;
      if (autoOpenId) {
        const petToOpen = res.data.find(p => p._id === autoOpenId);
        if (petToOpen) handleOpenDetails(petToOpen);
      }
    } catch (err) {
      console.error("Error fetching pets:", err);
    }
  };

  useEffect(() => { fetchPets(); }, [route.params?.autoOpenId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPets().then(() => setRefreshing(false));
  }, []);

  const handleOpenDetails = (pet) => {
    setSelectedPet({ ...pet });
    setIsModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedPetData = { 
        ...selectedPet, 
        age: parseInt(selectedPet.age) || 0 
      };
      await apiClient.put(`/pets/${selectedPet._id}`, updatedPetData);
      Alert.alert("Success 🐾", "Pet updated!");
      setIsEditing(false);
      setIsModalVisible(false);
      fetchPets(); 
    } catch (err) {
      Alert.alert("Error", "Failed to save changes.");
    }
  };

  const renderPetItem = ({ item }) => (
    <View style={styles.petCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petSub}>{item.species} • {item.breed} • {item.gender}</Text>
      </View>
      <TouchableOpacity style={styles.detailsBtn} onPress={() => handleOpenDetails(item)}>
        <Text style={styles.detailsBtnText}>Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={pets}
        keyExtractor={(item) => item._id}
        renderItem={renderPetItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} color="#4CAF50" />}
      />

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{isEditing ? "Edit Pet Profile" : selectedPet?.name}</Text>
              
              <DetailRow label="Name" value={selectedPet?.name} isEditing={isEditing} 
                onChange={(val) => setSelectedPet({...selectedPet, name: val})} />
              
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <DetailRow label="Age" value={String(selectedPet?.age || '')} isEditing={isEditing} keyboardType="numeric"
                    onChange={(val) => setSelectedPet({...selectedPet, age: val})} />
                </View>
                <View style={{ flex: 1 }}>
                   <DropdownRow label="Gender" value={selectedPet?.gender} isEditing={isEditing}
                    options={dropdownOptions.gender} onSelect={(val) => setSelectedPet({...selectedPet, gender: val})} />
                </View>
              </View>

              <DetailRow label="Breed" value={selectedPet?.breed} isEditing={isEditing} 
                onChange={(val) => setSelectedPet({...selectedPet, breed: val})} />

              <Text style={styles.sectionHeader}>Medical & Behavior</Text>

              <DropdownRow label="Vaccination" value={selectedPet?.vaccinationStatus} isEditing={isEditing}
                options={dropdownOptions.vaccinationStatus} onSelect={(val) => setSelectedPet({...selectedPet, vaccinationStatus: val})} />

              <DetailRow label="Allergies" value={selectedPet?.allergies} isEditing={isEditing} 
                onChange={(val) => setSelectedPet({...selectedPet, allergies: val})} />

              <DetailRow label="Afraid of" value={selectedPet?.afraidOf} isEditing={isEditing} 
                onChange={(val) => setSelectedPet({...selectedPet, afraidOf: val})} />

              <DropdownRow label="Friendly Status" value={selectedPet?.isFriendly} isEditing={isEditing}
                options={dropdownOptions.isFriendly} onSelect={(val) => setSelectedPet({...selectedPet, isFriendly: val})} />

              <View style={styles.modalButtons}>
                {isEditing ? (
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}><Text style={styles.btnText}>Save Changes</Text></TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}><Text style={styles.btnText}>Edit Profile</Text></TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeBtn} onPress={() => { setIsModalVisible(false); setIsEditing(false); }}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const DropdownRow = ({ label, value, options, isEditing, onSelect }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    {isEditing ? (
      <View style={styles.chipContainer}>
        {options.map((opt) => (
          <TouchableOpacity key={opt} style={[styles.chip, value === opt && styles.chipActive]} onPress={() => onSelect(opt)}>
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : <Text style={styles.detailValue}>{value || 'Not provided'}</Text>}
  </View>
);

const DetailRow = ({ label, value, isEditing, onChange, keyboardType = "default" }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    {isEditing ? <TextInput style={styles.detailInput} value={value} onChangeText={onChange} keyboardType={keyboardType}/> : <Text style={styles.detailValue}>{value || 'Not provided'}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  petCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 3 },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  petSub: { color: '#777', marginTop: 4 },
  detailsBtn: { backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  detailsBtnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center', marginBottom: 20 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#444', marginTop: 10, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  detailRow: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  detailLabel: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  detailValue: { fontSize: 16, marginTop: 4, color: '#333' },
  detailInput: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginTop: 5, borderWidth: 1, borderColor: '#ddd', color: '#333' },
  row: { flexDirection: 'row' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#eee' },
  chipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50', borderWidth: 1 },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: '#4CAF50', fontWeight: 'bold' },
  modalButtons: { marginTop: 10 },
  saveBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  editBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  closeBtn: { padding: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeBtnText: { color: '#FF5252', fontWeight: 'bold', fontSize: 16 }
});