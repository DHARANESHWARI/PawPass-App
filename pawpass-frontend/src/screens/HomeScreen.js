import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import apiClient from '../api/client';
import PetStoryItem from '../components/PetStoryItem';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const [pets, setPets] = useState([]);
  const [userName, setUserName] = useState('Pet Parent');
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // --- Modal & Edit States ---
  const [selectedPet, setSelectedPet] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const dropdownOptions = {
    vaccinationStatus: ['Up to date', 'Pending', 'Not Vaccinated', 'Other'],
    isFriendly: ['Very Friendly', 'Shy', 'Aggressive', 'Other'],
    allergies: ['None', 'Grain-free', 'Skin Allergies', 'Other'],
    afraidOf: ['None', 'Thunder', 'Other Dogs', 'Other']
  };

  const fetchData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) setUserName(storedName);
      const res = await apiClient.get('/pets');
      setPets(res.data);
    } catch (err) {
      console.log("Home Data Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchData();
  }, [isFocused]);

  // --- Handlers ---
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
      fetchData(); 
    } catch (err) {
      Alert.alert("Update Failed", "Server error saving changes.");
    }
  };

  const services = [
    { id: '1', title: 'Vet Visit', icon: '🩺', color: '#E3F2FD', screen: 'Booking' },
    { id: '2', title: 'Sitter', icon: '🏠', color: '#F3E5F5', screen: 'Booking' },
    { id: '3', title: 'Groomer', icon: '✂️', color: '#E8F5E9', screen: 'Booking' },
    { id: '4', title: 'Trainer', icon: '🎾', color: '#FFF3E0', screen: 'Booking' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.logoText}>PawPass</Text>
          <Text style={styles.welcomeText}>Hello, {userName}! 👋</Text>
        </View>
        
        <View style={styles.storySection}>
          <Text style={styles.sectionTitle}>My Family</Text>
          {loading ? (
            <ActivityIndicator color="#4CAF50" style={{ marginVertical: 20 }} />
          ) : (
            <FlatList
              data={pets}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.storyList}
              ListHeaderComponent={
                <PetStoryItem isAddButton onPress={() => navigation.navigate('AddPet')} />
              }
              renderItem={({ item }) => (
                <PetStoryItem 
                  name={item.name} 
                  species={item.species} 
                  onPress={() => handleOpenDetails(item)} 
                />
              )}
            />
          )}
        </View>

        <View style={styles.serviceContainer}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <View style={styles.serviceGrid}>
            {services.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.serviceCard, { backgroundColor: item.color }]}
                onPress={() => navigation.navigate(item.screen, { serviceType: item.title })}
              >
                <Text style={styles.serviceIcon}>{item.icon}</Text>
                <Text style={styles.serviceTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.promoCard}>
          <View style={styles.promoInfo}>
            <Text style={styles.promoTitle}>Special Offer! 🎁</Text>
            <Text style={styles.promoText}>Get 20% off your first Grooming session!</Text>
          </View>
          <Text style={styles.promoIcon}>🧼</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* --- REUSABLE MODAL FROM PETLIST --- */}
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

              <DropdownRow 
                label="Vaccination" 
                value={selectedPet?.vaccinationStatus} 
                isEditing={isEditing}
                options={dropdownOptions.vaccinationStatus}
                onSelect={(val) => setSelectedPet({...selectedPet, vaccinationStatus: val})} 
              />

              <DropdownRow 
                label="Allergies" 
                value={selectedPet?.allergies} 
                isEditing={isEditing}
                options={dropdownOptions.allergies}
                onSelect={(val) => setSelectedPet({...selectedPet, allergies: val})} 
              />

              <DropdownRow 
                label="Friendly?" 
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
    </SafeAreaView>
  );
}

// --- Sub-components (Kept the same UI) ---
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
                onPress={() => onSelect(opt)}
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
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, marginTop: 10 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50' },
  welcomeText: { fontSize: 16, color: '#666', marginTop: 5, fontWeight: '500' },
  storySection: { marginTop: 25, paddingBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, color: '#333' },
  storyList: { paddingLeft: 20 },
  serviceContainer: { paddingHorizontal: 20, marginTop: 10 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceCard: { width: '47%', height: 110, borderRadius: 20, padding: 15, marginBottom: 15, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  serviceIcon: { fontSize: 32, marginBottom: 8 },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: '#444' },
  promoCard: { margin: 20, backgroundColor: '#4CAF50', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promoInfo: { flex: 0.8 },
  promoTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  promoText: { color: '#fff', fontWeight: '500', opacity: 0.9 },
  promoIcon: { fontSize: 40 },

  // Modal Styles
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