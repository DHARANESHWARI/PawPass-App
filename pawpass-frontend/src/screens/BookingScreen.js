import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, ScrollView, Platform 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../api/client';

const BookingScreen = ({ route, navigation }) => {
  const mainService = route.params?.serviceType || 'Vet Visit';
  
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [subService, setSubService] = useState('');
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);

  // Expanded Services List
  const servicesMap = {
    'Vet Visit': [
      'General Checkup', 'Vaccination', 'Dental Cleaning', 
      'Emergency/Injury', 'Skin/Allergy Consultation', 'Deworming'
    ],
    'Sitter': [
      'Day Care (8hrs)', 'Overnight Boarding', 'Dog Walking (30 min)', 
      'Dog Walking (1 hr)', 'House Sitting', 'Drop-in Visit'
    ],
    'Groomer': [
      'Full Grooming', 'Bath & Brush', 'Nail Trimming', 
      'Ear Cleaning', 'Puppy\'s First Groom', 'De-Shedding Treatment'
    ],
    'Trainer': [
      'Puppy Socialization', 'Basic Obedience', 'Leash Training', 
      'Aggression Management', 'Potty Training', 'Agility Training'
    ]
  };

  const timeSlots = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM'];

  useEffect(() => {
    apiClient.get('/pets').then(res => {
      setPets(res.data);
      if (res.data.length > 0) setSelectedPetId(res.data[0]._id);
    }).catch(err => console.log("Pet Fetch Error:", err));
  }, []);

  const handleBook = async () => {
    if (!selectedPetId || !subService || !selectedTime) {
      return Alert.alert("Missing Details", "Please select a pet, specific service, and a time slot.");
    }

    setLoading(true);
    try {
      await apiClient.post('/bookings', {
        petId: selectedPetId,
        service: `${mainService}: ${subService}`,
        date: date.toDateString(),
        time: selectedTime
      });
      
      Alert.alert("Success! 🐾", "Appointment confirmed.");
      // Navigates back to the Home tab inside the MainApp stack
      navigation.navigate('MainApp', { screen: 'Home' }); 
    } catch (err) {
      console.log("Booking Post Error:", err.response?.data);
      Alert.alert("Booking Failed", "Check your internet or server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Book {mainService}</Text>
      
      {/* 1. Pet Selection */}
      <Text style={styles.label}>Select Your Pet</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={selectedPetId} onValueChange={setSelectedPetId}>
          {pets.length > 0 ? pets.map(p => (
            <Picker.Item key={p._id} label={p.name} value={p._id} />
          )) : <Picker.Item label="No pets found" value={null} />}
        </Picker>
      </View>

      {/* 2. Sub-Service Selection */}
      <Text style={styles.label}>Select Specific Service</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={subService} onValueChange={setSubService}>
          <Picker.Item label="Choose service..." value="" />
          {servicesMap[mainService].map(s => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>
      </View>

      {/* 3. Date Selection */}
      <Text style={styles.label}>Select Date</Text>
      <TouchableOpacity style={styles.inputBtn} onPress={() => setShowCalendar(true)}>
        <Text style={styles.inputText}>📅 {date.toDateString()}</Text>
      </TouchableOpacity>
      
      {showCalendar && (
        <DateTimePicker 
          value={date} 
          mode="date" 
          minimumDate={new Date()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowCalendar(false);
            if (selectedDate) setDate(selectedDate);
          }} 
        />
      )}

      {/* 4. Time Selection */}
      <Text style={styles.label}>Select Time Slot</Text>
      <View style={styles.timeGrid}>
        {timeSlots.map(slot => (
          <TouchableOpacity 
            key={slot} 
            style={[styles.timeChip, selectedTime === slot && styles.timeChipActive]}
            onPress={() => setSelectedTime(slot)}
          >
            <Text style={[styles.timeText, selectedTime === slot && styles.timeTextActive]}>
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        style={[styles.bookBtn, loading && { opacity: 0.7 }]} 
        onPress={handleBook}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookBtnText}>Confirm Booking</Text>}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 15, marginBottom: 8 },
  pickerContainer: { backgroundColor: '#F5F7FA', borderRadius: 12, borderWidth: 1, borderColor: '#E0E4E8', overflow: 'hidden' },
  inputBtn: { padding: 15, backgroundColor: '#F5F7FA', borderRadius: 12, borderWidth: 1, borderColor: '#E0E4E8' },
  inputText: { fontSize: 16, color: '#333' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timeChip: { width: '48%', padding: 12, backgroundColor: '#F5F7FA', borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0E4E8' },
  timeChipActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  timeText: { color: '#555', fontWeight: '500' },
  timeTextActive: { color: '#fff' },
  bookBtn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, elevation: 2 },
  bookBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default BookingScreen;

