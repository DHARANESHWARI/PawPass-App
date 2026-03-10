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
      const res = await apiClient.get(`/owner/dashboard?date=${selectedDate}`);
      setData(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // LOGOUT LOGIC
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            navigation.replace('Login'); // Returns user to Login screen
          } 
        }
      ]
    );
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await apiClient.patch(`/owner/bookings/${id}/status`, { status: newStatus });
      await fetchDashboard();
      
      if (newStatus === 'Confirmed') setActiveTab('Confirmed');
      if (newStatus === 'Checked-In') setActiveTab('Active');
      if (newStatus === 'Completed') setActiveTab('Done');
    } catch (err) {
      Alert.alert("Error", "Could not update status.");
    }
  };

  const getDisplayList = () => {
    if (!data || !data.bookings) return [];
    const list = data.bookings;
    switch (activeTab) {
      case 'Queue': return list.filter(b => b.status === 'Pending');
      case 'Confirmed': return list.filter(b => b.status === 'Confirmed');
      case 'Active': return list.filter(b => ['Checked-In', 'In-Process'].includes(b.status));
      case 'Done': return list.filter(b => b.status === 'Completed' || b.status === 'Cancelled');
      default: return [];
    }
  };

  if (loading && !data) return <ActivityIndicator size="large" style={{flex:1, marginTop: 100}} color="#4CAF50" />;

  return (
    <View style={styles.container}>
      {/* HEADER WITH LOGOUT */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateLabel}>{selectedDate}</Text>
          <Text style={styles.title}>Admin Hub</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCalendar(!showCalendar)}>
            <Text style={{fontSize: 20}}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {marginLeft: 10, backgroundColor: '#FFEBEE'}]} onPress={handleLogout}>
            <Text style={{fontSize: 20}}>🚪</Text> 
          </TouchableOpacity>
        </View>
      </View>

      {showCalendar && (
        <View style={styles.calCard}>
          <Calendar onDayPress={(day) => { setSelectedDate(formatDBDate(new Date(day.dateString))); setShowCalendar(false); }} />
        </View>
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} />}>
        {/* STATS GRID */}
        <View style={styles.statsRow}>
           <View style={styles.statBox}><Text style={styles.statNum}>{data?.stats?.queue || 0}</Text><Text style={styles.statLab}>QUEUE</Text></View>
           <View style={styles.statBox}><Text style={[styles.statNum, {color: '#4CAF50'}]}>{data?.stats?.confirmed || 0}</Text><Text style={styles.statLab}>CONFIRMED</Text></View>
           <View style={styles.statBox}><Text style={[styles.statNum, {color: '#2196F3'}]}>{data?.stats?.active || 0}</Text><Text style={styles.statLab}>ACTIVE</Text></View>
           <View style={styles.statBox}><Text style={[styles.statNum, {color: '#9E9E9E'}]}>{data?.stats?.completed || 0}</Text><Text style={styles.statLab}>DONE</Text></View>
        </View>

        <View style={styles.tabContainer}>
          {['Queue', 'Confirmed', 'Active', 'Done'].map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === t && {color:'#4CAF50'}]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {getDisplayList().length === 0 ? (
          <Text style={styles.emptyText}>No pets in this section</Text>
        ) : (
          getDisplayList().map(item => (
            <View key={item._id} style={styles.card}>
              <View style={styles.cardMain}>
                <View>
                  <Text style={styles.petName}>🐾 {item.pet?.name || 'Pet'}</Text>
                  <Text style={styles.subText}>{item.service} • {item.time}</Text>
                </View>
                <View style={styles.badge}><Text style={styles.badgeText}>{item.status}</Text></View>
              </View>

              <View style={styles.footer}>
                {item.status === 'Pending' && (
                  <View style={styles.row}>
                    <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Confirmed')} style={[styles.actionBtn, {backgroundColor:'#4CAF50'}]}><Text style={styles.btnText}>Approve</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Cancelled')} style={[styles.actionBtn, {backgroundColor:'#F44336', marginLeft: 10}]}><Text style={styles.btnText}>Reject</Text></TouchableOpacity>
                  </View>
                )}
                {item.status === 'Confirmed' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Checked-In')} style={[styles.actionBtn, {backgroundColor:'#9C27B0'}]}><Text style={styles.btnText}>Check-In Pet</Text></TouchableOpacity>}
                {item.status === 'Checked-In' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'In-Process')} style={[styles.actionBtn, {backgroundColor:'#00BCD4'}]}><Text style={styles.btnText}>Start Service</Text></TouchableOpacity>}
                {item.status === 'In-Process' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Completed')} style={[styles.actionBtn, {backgroundColor:'#4CAF50'}]}><Text style={styles.btnText}>Finish</Text></TouchableOpacity>}
                {item.status === 'Completed' && <Text style={styles.doneText}>Completed successfully ✅</Text>}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  dateLabel: { color: '#888', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  iconBtn: { backgroundColor: '#FFF', padding: 12, borderRadius: 15, elevation: 4 },
  calCard: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', marginBottom: 20, elevation: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { width: '23%', backgroundColor: '#FFF', padding: 12, borderRadius: 16, elevation: 2, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#F39C12' },
  statLab: { fontSize: 8, color: '#BBB', fontWeight: 'bold', marginTop: 2 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E0E4E8', borderRadius: 15, padding: 5, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  activeTab: { backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },
  tabText: { fontWeight: 'bold', color: '#999', fontSize: 12 },
  card: { backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 15, elevation: 3 },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  subText: { color: '#7F8C8D', marginTop: 4, fontSize: 14 },
  badge: { backgroundColor: '#F4F7F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, color: '#27AE60', fontWeight: 'bold' },
  footer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 15 },
  row: { flexDirection: 'row' },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  doneText: { textAlign: 'center', color: '#BDC3C7', fontStyle: 'italic' },
  emptyText: { textAlign: 'center', color: '#AAA', marginTop: 40, fontSize: 16 }
});

export default OwnerDashboard;