import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Fill in all fields.");
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { 
        email: email.trim().toLowerCase(), 
        password 
      });

      await AsyncStorage.setItem('userToken', res.data.token);
      await AsyncStorage.setItem('userName', res.data.user.name);
      
      // Redirect based on the role in your MongoDB
      if (res.data.user.role === 'shop') {
        navigation.replace('ShopDashboard');
      } else {
        navigation.replace('MainApp');
      }
    } catch (err) {
      Alert.alert("Login Failed", err.response?.data?.msg || "Invalid Credentials");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PawPass</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.link}>
        <Text>Need an account? <Text style={{color: '#4CAF50', fontWeight: 'bold'}}>Sign Up</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 25, backgroundColor: '#fff' },
  logo: { fontSize: 40, fontWeight: 'bold', textAlign: 'center', color: '#4CAF50', marginBottom: 50 },
  input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, marginBottom: 15 },
  btn: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  link: { marginTop: 25, alignSelf: 'center' }
});