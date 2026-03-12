import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  // FIXED: Removed the space after http:// to ensure valid URL formatting
  baseURL: 'http://10.130.20.245:5000/api', 
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    // Matches the 'x-auth-token' header expected by your backend middleware
    config.headers['x-auth-token'] = token;
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;