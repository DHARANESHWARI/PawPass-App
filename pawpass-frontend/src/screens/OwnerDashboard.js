import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to exit the Admin panel?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await AsyncStorage.clear(); 
          navigation.replace('Login');
        } 
      }
    ]);
  };

  const executeStatusUpdate = async (id, status, reason = "") => {
    try {
      await apiClient.patch(`/owner/bookings/${id}/status`, { status, reason });
      await fetchDashboard();
    } catch (err) {
      Alert.alert("Error", "Update failed.");
    }
  };

  const handleStatusUpdate = (id, newStatus) => {
    if (newStatus === 'Cancelled') {
      Alert.alert("Reject", "Reason:", [
        { text: "Full", onPress: () => executeStatusUpdate(id, newStatus, "Fully Booked") },
        { text: "Staff Out", onPress: () => executeStatusUpdate(id, newStatus, "Staff Unavailable") },
        { text: "Cancel", style: "cancel" }
      ]);
    } else {
      executeStatusUpdate(id, newStatus);
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

  if (loading && !data) return <ActivityIndicator size="large" style={{flex:1}} color="#4CAF50" />;

  return (
    <SafeAreaView style={styles.container}>
      {/* CUSTOM TOP TITLE BAR */}
      <View style={styles.titleBar}>
        <Text style={styles.adminTitle}>Admin</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} />}>
        
        {/* DATE SELECTOR SECTION */}
        <View style={styles.dateSection}>
          <Text style={styles.headerLabel}>Admin Overview</Text>
          <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)} style={styles.datePickerToggle}>
            <Text style={styles.selectedDateText}>{selectedDate}</Text>
            <Text style={styles.chevron}> ▼</Text>
          </TouchableOpacity>
        </View>

        {showCalendar && (
          <View style={styles.calendarPopout}>
            <Calendar 
              onDayPress={(day) => { setSelectedDate(formatDBDate(new Date(day.dateString))); setShowCalendar(false); }} 
              theme={{ selectedDayBackgroundColor: '#4CAF50', todayTextColor: '#4CAF50' }}
            />
          </View>
        )}

        {/* QUICK STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{data?.stats?.queue || 0}</Text>
            <Text style={styles.statLab}>PENDING</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, {color: '#4CAF50'}]}>{data?.stats?.confirmed || 0}</Text>
            <Text style={styles.statLab}>CONFIRMED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, {color: '#2196F3'}]}>{data?.stats?.active || 0}</Text>
            <Text style={styles.statLab}>ONGOING</Text>
          </View>
        </View>

        {/* TAB NAVIGATION */}
        <View style={styles.tabs}>
          {['Queue', 'Confirmed', 'Active', 'Done'].map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BOOKING CARDS */}
        <View style={styles.listSection}>
          {getDisplayList().map(item => (
            <View key={item._id} style={styles.bookingCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.petName}>🐾 {item.pet?.name}</Text>
                  <Text style={styles.serviceText}>{item.service} • {item.time}</Text>
                </View>
                <View style={styles.statusBadge}><Text style={styles.statusText}>{item.status}</Text></View>
              </View>

              <View style={styles.cardFooter}>
                {item.status === 'Pending' && (
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Confirmed')} style={[styles.actionBtn, {backgroundColor: '#4CAF50'}]}><Text style={styles.btnTxt}>Approve</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Cancelled')} style={[styles.actionBtn, {backgroundColor: '#FF5252', marginLeft: 10}]}><Text style={styles.btnTxt}>Reject</Text></TouchableOpacity>
                  </View>
                )}
                {item.status === 'Confirmed' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Checked-In')} style={[styles.actionBtn, {backgroundColor: '#9C27B0'}]}><Text style={styles.btnTxt}>Check-In</Text></TouchableOpacity>}
                {item.status === 'Checked-In' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'In-Process')} style={[styles.actionBtn, {backgroundColor: '#00BCD4'}]}><Text style={styles.btnTxt}>Start Task</Text></TouchableOpacity>}
                {item.status === 'In-Process' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Completed')} style={[styles.actionBtn, {backgroundColor: '#4CAF50'}]}><Text style={styles.btnTxt}>Complete</Text></TouchableOpacity>}
              </View>
            </View>
          ))}
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F8' },
  // THE NEW TOP BAR
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  adminTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutBtn: { 
    backgroundColor: '#FFF0F0', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#FFE0E0' 
  },
  logoutText: { color: '#FF5252', fontWeight: 'bold', fontSize: 14 },
  
  // DATE SECTION
  dateSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  headerLabel: { fontSize: 12, color: '#AAA', fontWeight: 'bold', textTransform: 'uppercase' },
  selectedDateText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  datePickerToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  chevron: { fontSize: 12, color: '#4CAF50' },
  
  calendarPopout: { backgroundColor: '#FFF', margin: 10, borderRadius: 15, elevation: 5, overflow: 'hidden' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  statCard: { backgroundColor: '#FFF', width: '31%', padding: 15, borderRadius: 15, alignItems: 'center', elevation: 2 },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#F39C12' },
  statLab: { fontSize: 9, color: '#999', marginTop: 4, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#DDD' },
  tabBtnActive: { borderBottomColor: '#4CAF50' },
  tabText: { color: '#AAA', fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: '#4CAF50' },
  listSection: { paddingHorizontal: 20 },
  bookingCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 18, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  serviceText: { color: '#777', fontSize: 14, marginTop: 4 },
  statusBadge: { backgroundColor: '#F0F9F4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#4CAF50', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  cardFooter: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15 },
  buttonGroup: { flexDirection: 'row' },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnTxt: { color: '#FFF', fontWeight: 'bold' }
});

export default OwnerDashboard;