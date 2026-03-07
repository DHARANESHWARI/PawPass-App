import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import MyBookingScreen from '../screens/MyBookingScreen';
import ChatScreen from '../screens/ChatScreen';
import AddPetScreen from '../screens/AddPetScreen';
import PetListScreen from '../screens/PetListScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = ({ navigation }) => {
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel" },
      { 
        text: "Logout", 
        onPress: async () => { 
          await AsyncStorage.clear(); 
          navigation.replace('Login'); 
        } 
      }
    ]);
  };

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#4CAF50' }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen name="My Bookings" component={MyBookingScreen} options={{ tabBarIcon: () => <Text>📅</Text> }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarIcon: () => <Text>💬</Text> }} />
      <Tab.Screen 
        name="Exit" 
        component={HomeScreen} 
        listeners={{ tabPress: (e) => { e.preventDefault(); handleLogout(); } }} 
        options={{ tabBarIcon: () => <Text>🚪</Text> }} 
      />
    </Tab.Navigator>
  );
};

export default function AuthNavigator({ initialToken }) {
  return (
    <Stack.Navigator 
      initialRouteName={initialToken ? "MainApp" : "Login"}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="MainApp" component={MainTabs} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ headerShown: true }} />
      <Stack.Screen name="AddPet" component={AddPetScreen} options={{ headerShown: true }} />
      <Stack.Screen name="PetList" component={PetListScreen} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}