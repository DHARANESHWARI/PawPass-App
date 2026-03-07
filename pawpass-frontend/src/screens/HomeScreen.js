import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import PetStoryItem from '../components/PetStoryItem';

export default function HomeScreen({ navigation }) {
  const [pets, setPets] = useState([]);
  const [userName, setUserName] = useState('Pet Parent');
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // Service Data Array
  const services = [
    { id: '1', title: 'Vet Visit', icon: '🩺', color: '#E3F2FD', screen: 'Booking' },
    { id: '2', title: 'Sitter', icon: '🏠', color: '#F3E5F5', screen: 'Booking' },
    { id: '3', title: 'Groomer', icon: '✂️', color: '#E8F5E9', screen: 'Booking' },
    { id: '4', title: 'Trainer', icon: '🎾', color: '#FFF3E0', screen: 'Booking' },
  ];

  const fetchData = async () => {
    try {
      // 1. Get User Data for the Greeting
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) setUserName(storedName);

      // 2. Fetch Pets from Database
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.logoText}>PawPass</Text>
          <Text style={styles.welcomeText}>Hello, {userName}! 👋</Text>
        </View>
        
        {/* Pets Story Section */}
        <View style={styles.storySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Family</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PetList')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

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
                  onPress={() => navigation.navigate('PetList', { selectedPetId: item._id })} 
                />
              )}
            />
          )}
        </View>

        {/* Services Section */}
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

        {/* Promotion Section */}
        <View style={styles.promoCard}>
          <View style={styles.promoInfo}>
            <Text style={styles.promoTitle}>Special Offer! 🎁</Text>
            <Text style={styles.promoText}>Get 20% off your first Grooming session!</Text>
          </View>
          <Text style={styles.promoIcon}>🧼</Text>
        </View>

        {/* Spacer for the bottom tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, marginTop: 10 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50' },
  welcomeText: { fontSize: 16, color: '#666', marginTop: 5, fontWeight: '500' },
  
  storySection: { marginTop: 25, paddingBottom: 15 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingRight: 20 
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, color: '#333' },
  viewAll: { color: '#4CAF50', fontWeight: '600', marginBottom: 15 },
  storyList: { paddingLeft: 20 },
  
  serviceContainer: { paddingHorizontal: 20, marginTop: 10 },
  serviceGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  serviceCard: {
    width: '47%',
    height: 110,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    // Elevation for Android
    elevation: 3, 
    // Shadow for iOS
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  serviceIcon: { fontSize: 32, marginBottom: 8 },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: '#444' },
  
  promoCard: { 
    margin: 20, 
    backgroundColor: '#4CAF50', 
    padding: 20, 
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  promoInfo: { flex: 0.8 },
  promoTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  promoText: { color: '#fff', fontWeight: '500', opacity: 0.9 },
  promoIcon: { fontSize: 40 }
});


