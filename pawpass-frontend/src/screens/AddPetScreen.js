import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import apiClient from '../api/client';

export default function AddPetScreen({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('');
  const [gender, setGender] = useState(''); // New Gender State

  // Behavioral/Medical Fields
  const [vaccination, setVaccination] = useState('Up to date');
  const [allergies, setAllergies] = useState('None');
  const [afraidOf, setAfraidOf] = useState('None');
  const [isFriendly, setIsFriendly] = useState('Yes');

  const speciesData = {
    Dog: ['Labrador', 'German Shepherd', 'Golden Retriever', 'Poodle', 'Bulldog', 'Other'],
    Cat: ['Persian', 'Siamese', 'Maine Coon', 'Ragdoll', 'Bengal', 'Other'],
    Rabbit: ['Mini Rex', 'Holland Lop', 'Dutch Rabbit', 'Flemish Giant', 'Other'],
  };

  const handleSave = async () => {
    // Added gender to the validation check
    if (!name || !selectedSpecies || !selectedBreed || !age || !gender) {
      return Alert.alert("Required Fields", "Please fill in all basic details (Name, Species, Breed, Gender, Age).");
    }

    try {
      await apiClient.post('/pets', {
        name: name.trim(),
        species: selectedSpecies,
        breed: selectedBreed,
        gender: gender, // Sending gender to backend
        age: parseInt(age),
        vaccinationStatus: vaccination,
        allergies: allergies,
        afraidOf: afraidOf,
        isFriendly: isFriendly
      });

      Alert.alert("Success 🐾", `${name} has been added!`);
      navigation.navigate('MainApp', { screen: 'Home' }); 
    } catch (err) {
      Alert.alert("Save Failed", err.response?.data?.msg || "Error connecting to server");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Register a Pet</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Pet Name</Text>
        <TextInput style={styles.input} placeholder="e.g. Buddy" value={name} onChangeText={setName} />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Species</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={selectedSpecies} onValueChange={(val) => { setSelectedSpecies(val); setSelectedBreed(''); }}>
              <Picker.Item label="Select..." value="" />
              {Object.keys(speciesData).map(s => <Picker.Item key={s} label={s} value={s} />)}
            </Picker>
          </View>
        </View>

        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Age (Years)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} placeholder="0" />
        </View>
      </View>

      {/* Row for Breed and Gender */}
      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Breed</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={selectedBreed} enabled={selectedSpecies !== ''} onValueChange={setSelectedBreed}>
              <Picker.Item label="Select..." value="" />
              {selectedSpecies && speciesData[selectedSpecies].map(b => <Picker.Item key={b} label={b} value={b} />)}
            </Picker>
          </View>
        </View>

        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={gender} onValueChange={(val) => setGender(val)}>
              <Picker.Item label="Select..." value="" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
            </Picker>
          </View>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Medical & Behavior</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Vaccination Status</Text>
        <TextInput style={styles.input} value={vaccination} onChangeText={setVaccination} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Allergies</Text>
        <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Afraid of (e.g. Thunder)</Text>
        <TextInput style={styles.input} value={afraidOf} onChangeText={setAfraidOf} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Is Friendly?</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={isFriendly} onValueChange={setIsFriendly}>
            <Picker.Item label="Yes" value="Yes" />
            <Picker.Item label="No" value="No" />
            <Picker.Item label="Partially" value="Partially" />
          </Picker>
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Pet Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginBottom: 20, textAlign: 'center' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  formGroup: { marginBottom: 15 },
  row: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#555' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 10 },
  pickerWrapper: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#DDD', borderRadius: 10, overflow: 'hidden' },
  saveBtn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});