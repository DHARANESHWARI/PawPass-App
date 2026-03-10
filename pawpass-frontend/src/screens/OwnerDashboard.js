import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OwnerDashboard = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Queue');
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDBDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('en-US', options).replace(/,/g, '');
  };

  const [selectedDate, setSelectedDate] = useState(formatDBDate(new Date()));

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/owner/dashboard?date=${selectedDate}`);
      setData(res.data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await apiClient.patch(`/owner/bookings/${id}/status`, { status: newStatus });
      fetchDashboard();
      if (newStatus === 'Confirmed') setActiveTab('Today');
    } catch (err) {
      Alert.alert("Error", "Update failed.");
    }
  };

  const getDisplayList = () => {
    if (!data) return [];
    if (activeTab === 'Queue') return data.queue; 
    if (activeTab === 'History') return data.bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');
    return data.bookings.filter(b => ['Confirmed', 'Checked-In', 'In-Process'].includes(b.status));
  };

  if (loading && !data) return <ActivityIndicator size="large" style={{flex:1}} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.dateLabel}>{selectedDate}</Text><Text style={styles.title}>Admin Hub</Text></View>
        <View style={{flexDirection:'row'}}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCalendar(!showCalendar)}><Text style={{fontSize: 20}}>📅</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {marginLeft:10}]} onPress={async () => {await AsyncStorage.clear(); navigation.replace('Login');}}><Text style={{fontSize: 20}}>🚪</Text></TouchableOpacity>
        </View>
      </View>

      {showCalendar && (
        <View style={styles.cal}>
          <Calendar onDayPress={(day) => { setSelectedDate(formatDBDate(new Date(day.dateString))); setShowCalendar(false); }} />
        </View>
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} />}>
        <View style={styles.stats}>
          <View style={styles.statBox}><Text style={styles.statNum}>{data?.stats.pending}</Text><Text style={styles.statLab}>QUEUE</Text></View>
          <View style={styles.statBox}><Text style={[styles.statNum, {color:'#2196F3'}]}>{data?.stats.confirmed}</Text><Text style={styles.statLab}>CONFIRMED</Text></View>
        </View>

        <View style={styles.tabs}>
          {['Queue', 'Today', 'History'].map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.activeTab]}>
              <Text style={[styles.tabT, activeTab === t && {color:'#4CAF50'}]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {getDisplayList().map(item => (
          <View key={item._id} style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.petName}>🐾 {item.pet?.name || 'Pet'}</Text>
                <Text style={styles.badge}>{item.status}</Text>
            </View>
            <Text style={styles.info}>{item.service} | {item.time}</Text>
            <View style={styles.actions}>
              {item.status === 'Pending' && (
                <View style={{flexDirection:'row'}}>
                  <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Confirmed')} style={[styles.btn, {backgroundColor:'#4CAF50'}]}><Text style={styles.btnT}>Confirm</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Cancelled')} style={[styles.btn, {backgroundColor:'#F44336', marginLeft:10}]}><Text style={styles.btnT}>Reject</Text></TouchableOpacity>
                </View>
              )}
              {item.status === 'Confirmed' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Checked-In')} style={[styles.btn, {backgroundColor:'#9C27B0'}]}><Text style={styles.btnT}>Check-In</Text></TouchableOpacity>}
              {item.status === 'Checked-In' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'In-Process')} style={[styles.btn, {backgroundColor:'#00BCD4'}]}><Text style={styles.btnT}>Start Service</Text></TouchableOpacity>}
              {item.status === 'In-Process' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Completed')} style={[styles.btn, {backgroundColor:'#4CAF50'}]}><Text style={styles.btnT}>Finish</Text></TouchableOpacity>}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dateLabel: { color: '#999', fontSize: 12 },
  title: { fontSize: 26, fontWeight: 'bold' },
  iconBtn: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, elevation: 3 },
  cal: { backgroundColor: '#FFF', borderRadius: 15, overflow: 'hidden', marginBottom: 15 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { width: '48%', backgroundColor: '#FFF', padding: 15, borderRadius: 15, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#FF9800' },
  statLab: { fontSize: 10, color: '#AAA', fontWeight: 'bold' },
  tabs: { flexDirection: 'row', backgroundColor: '#DDD', borderRadius: 12, padding: 4, marginBottom: 15 },
  tab: { flex: 1, padding: 10, alignItems: 'center' },
  activeTab: { backgroundColor: '#FFF', borderRadius: 10 },
  tabT: { fontWeight: 'bold', color: '#888' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  petName: { fontSize: 18, fontWeight: 'bold' },
  badge: { fontSize: 10, color: '#4CAF50', fontWeight: 'bold' },
  info: { color: '#666', marginVertical: 8 },
  actions: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnT: { color: '#FFF', fontWeight: 'bold' }
});

export default OwnerDashboard;