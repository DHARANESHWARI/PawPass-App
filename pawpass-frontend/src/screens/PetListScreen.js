import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Modal, ScrollView, Alert, TextInput, RefreshControl 
} from 'react-native';
// Use this import to stop the terminal warnings
import { SafeAreaView } from 'react-native-safe-area-context'; 
import apiClient from '../api/client';

export default function PetListScreen() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Define your impressive dropdown options
  const dropdownOptions = {
    vaccinationStatus: ['Up to date', 'Pending', 'Not Vaccinated', 'Other'],
    isFriendly: ['Very Friendly', 'Shy', 'Aggressive', 'Other'],
    allergies: ['None', 'Grain-free', 'Skin Allergies', 'Other'],
    afraidOf: ['None', 'Thunder', 'Other Dogs', 'Other']
  };

  const fetchPets = async () => {
    try {
      const res = await apiClient.get('/pets');
      setPets(res.data);
    } catch (err) {
      console.error("Error fetching pets:", err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPets().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchPets();
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
      Alert.alert("Success 🐾", "Pet details updated!");
      setIsEditing(false);
      setIsModalVisible(false);
      fetchPets(); 
    } catch (err) {
      Alert.alert("Update Failed", "The server couldn't save these changes.");
    }
  };

  const renderPetItem = ({ item }) => (
    <View style={styles.petCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petSub}>Age: {item.age}</Text>
      </View>
      <TouchableOpacity 
        style={styles.detailsBtn} 
        onPress={() => handleOpenDetails(item)}
      >
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} color="#4CAF50" />
        }
      />

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Pet Profile" : `${selectedPet?.name}'s Profile`}
              </Text>

              <DetailRow label="Name" value={selectedPet?.name} isEditing={isEditing} 
                onChange={(val) => setSelectedPet({...selectedPet, name: val})} />
              
              <DetailRow label="Age" value={String(selectedPet?.age || '')} isEditing={isEditing} keyboardType="numeric"
                onChange={(val) => setSelectedPet({...selectedPet, age: val})} />

              {/* Advanced Dropdown Rows */}
              <DropdownRow 
                label="Vaccination" 
                field="vaccinationStatus" 
                value={selectedPet?.vaccinationStatus} 
                isEditing={isEditing}
                options={dropdownOptions.vaccinationStatus}
                onSelect={(val) => setSelectedPet({...selectedPet, vaccinationStatus: val})} 
              />

              <DropdownRow 
                label="Allergies" 
                field="allergies" 
                value={selectedPet?.allergies} 
                isEditing={isEditing}
                options={dropdownOptions.allergies}
                onSelect={(val) => setSelectedPet({...selectedPet, allergies: val})} 
              />

              <DropdownRow 
                label="Afraid of" 
                field="afraidOf" 
                value={selectedPet?.afraidOf} 
                isEditing={isEditing}
                options={dropdownOptions.afraidOf}
                onSelect={(val) => setSelectedPet({...selectedPet, afraidOf: val})} 
              />

              <DropdownRow 
                label="Friendly?" 
                field="isFriendly" 
                value={selectedPet?.isFriendly} 
                isEditing={isEditing}
                options={dropdownOptions.isFriendly}
                onSelect={(val) => setSelectedPet({...selectedPet, isFriendly: val})} 
              />

              <View style={styles.modalButtons}>
                {isEditing ? (
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                    <Text style={styles.btnText}>Save Changes</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                    <Text style={styles.btnText}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.closeBtn} 
                  onPress={() => { setIsModalVisible(false); setIsEditing(false); }}
                >
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

// 2. The New Impressive Dropdown Component
const DropdownRow = ({ label, value, options, isEditing, onSelect }) => {
  const isStandard = options.includes(value);
  const showOtherInput = value === 'Other' || (!isStandard && value !== '' && value != null);

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {isEditing ? (
        <View>
          <View style={styles.chipContainer}>
            {options.map((opt) => (
              <TouchableOpacity 
                key={opt} 
                style={[styles.chip, (value === opt || (opt === 'Other' && !isStandard)) && styles.chipActive]}
                onPress={() => onSelect(opt === 'Other' ? 'Other' : opt)}
              >
                <Text style={[styles.chipText, (value === opt || (opt === 'Other' && !isStandard)) && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {showOtherInput && (
            <TextInput 
              style={styles.detailInput}
              placeholder="Please specify..."
              value={value === 'Other' ? '' : value}
              onChangeText={onSelect}
              autoFocus={value === 'Other'}
            />
          )}
        </View>
      ) : (
        <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
      )}
    </View>
  );
};

const DetailRow = ({ label, value, isEditing, onChange, keyboardType = "default" }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    {isEditing ? (
      <TextInput 
        style={styles.detailInput} 
        value={value} 
        onChangeText={onChange} 
        keyboardType={keyboardType}
      />
    ) : (
      <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  petCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, elevation: 3 },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  petSub: { color: '#777', marginTop: 4 },
  detailsBtn: { backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  detailsBtnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', marginBottom: 20, textAlign: 'center' },
  detailRow: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  detailLabel: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 5 },
  detailValue: { fontSize: 16, color: '#333', marginTop: 4, fontWeight: '500' },
  detailInput: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#DDD', color: '#333' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#EEE' },
  chipActive: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#4CAF50' },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: '#4CAF50', fontWeight: 'bold' },
  modalButtons: { marginTop: 10 },
  editBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  saveBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  closeBtn: { padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeBtnText: { color: '#FF5252', fontWeight: 'bold', fontSize: 16 }
});