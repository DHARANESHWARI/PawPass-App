import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  RefreshControl, ScrollView, Alert, Modal 
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OwnerDashboard = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Queue');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  // States for Pet Modal
  const [selectedPet, setSelectedPet] = useState(null);
  const [showPetModal, setShowPetModal] = useState(false);

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
    if (!data || !data.bookings) return { revenue: 0, topService: 'N/A', completed: 0, total: 0, cancelled: 0, serviceBreakdown: {} };
    const bookings = data.bookings;
    const validBookings = bookings.filter(b => b.status !== 'Cancelled');
    const estRevenue = validBookings.length * 50; 
    const serviceCounts = {};
    bookings.forEach(b => {
      const s = b.service?.split(':')[0].trim() || "Service"; 
      serviceCounts[s] = (serviceCounts[s] || 0) + 1;
    });
    const topService = Object.keys(serviceCounts).length > 0 
      ? Object.keys(serviceCounts).reduce((a, b) => serviceCounts[a] > serviceCounts[b] ? a : b) 
      : 'None';
    const completed = bookings.filter(b => b.status === 'Completed').length;
    const cancelled = bookings.filter(b => b.status === 'Cancelled').length;
    const total = bookings.length;
    return { 
      revenue: estRevenue, topService, completed, total, cancelled, serviceBreakdown: serviceCounts,
      completionRate: (total - cancelled) > 0 ? Math.round((completed / (total - cancelled)) * 100) : 0
    };
  }, [data]);

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
    Alert.alert("Logout", "Exit Admin panel?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await AsyncStorage.clear(); navigation.replace('Login'); } }
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
      Alert.alert("Decline", "Reason?", [
        { text: "Slot Full", onPress: () => executeStatusUpdate(id, newStatus, "Our schedule is full.") },
        { text: "Staff Out", onPress: () => executeStatusUpdate(id, newStatus, "Staff unavailable.") },
        { text: "Cancel", style: "cancel" }
      ]);
    } else {
      executeStatusUpdate(id, newStatus);
    }
  };

  const openPetDetails = (pet) => {
    setSelectedPet(pet);
    setShowPetModal(true);
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
      
      {/* SERVICE BREAKDOWN MODAL */}
      <Modal visible={showServiceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Service Mix</Text>
            {Object.entries(analytics.serviceBreakdown).map(([name, count]) => (
              <View key={name} style={styles.modalRow}>
                <Text style={styles.modalText}>{name}</Text>
                <Text style={styles.modalCount}>{count} Booked</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowServiceModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PET DETAILS MODAL (FIXED GENDER FIELD) */}
      <Modal visible={showPetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '92%', maxHeight: '85%' }]}>
            <View style={styles.petModalHeader}>
              <Text style={styles.modalTitle}>🐾 {selectedPet?.name}'s Profile</Text>
              <TouchableOpacity onPress={() => setShowPetModal(false)}>
                <Ionicons name="close-circle" size={30} color="#DDD" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailGrid}>
                {[
                  { label: 'Species', val: selectedPet?.species, icon: 'paw' },
                  { label: 'Breed', val: selectedPet?.breed, icon: 'git-branch' },
                  { label: 'Age (Years)', val: selectedPet?.age, icon: 'calendar' },
                  // FIXED: Fallback to gender or sex depending on your backend schema
                  { label: 'Gender', val: selectedPet?.gender || selectedPet?.sex, icon: 'male-female' },
                ].map((item, i) => (
                  <View key={i} style={styles.gridItem}>
                    <Ionicons name={item.icon} size={14} color="#4CAF50" style={{marginBottom: 4}} />
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailVal}>{item.val || 'Unspecified'}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.sectionDivider} />
              <Text style={styles.sectionLabel}>Medical & Behavior</Text>

              {[
                { label: 'Vaccination Status', val: selectedPet?.vaccinationStatus, icon: 'medkit' },
                { label: 'Allergies', val: selectedPet?.allergies, icon: 'alert-circle' },
                { label: 'Afraid of (e.g. Thunder)', val: selectedPet?.fears || selectedPet?.afraidOf, icon: 'thunderstorm' },
                { label: 'Is Friendly?', val: selectedPet?.isFriendly ? "Yes" : "No", icon: 'happy' },
              ].map((item, i) => (
                <View key={i} style={styles.listDetailItem}>
                  <View style={styles.listIconCircle}><Ionicons name={item.icon} size={18} color="#4CAF50" /></View>
                  <View style={{flex:1}}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={[styles.detailVal, {fontSize: 15}]}>{item.val || 'None listed'}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPetModal(false)}>
              <Text style={styles.closeBtnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.titleBar}>
        <Text style={styles.adminTitle}>Owner Command</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} />}>
        
        {/* ANALYTICS */}
        <View style={styles.analyticsSection}>
          <View style={styles.revenueCard}>
            <Text style={styles.anaLabel}>ESTIMATED REVENUE</Text>
            <Text style={styles.revenueVal}>${analytics.revenue}</Text>
            <View style={styles.progressRow}>
                <View style={[styles.progressBar, { width: `${analytics.completionRate}%` }]} />
            </View>
            <Text style={styles.progressText}>{analytics.completionRate}% Task Efficiency</Text>
          </View>

          <View style={styles.miniStatsRow}>
            <TouchableOpacity style={styles.miniStat} onPress={() => setShowServiceModal(true)}>
               <Ionicons name="flame" size={18} color="#FF5722" />
               <Text style={styles.miniStatVal} numberOfLines={1}>{analytics.topService}</Text>
               <Text style={styles.miniStatLab}>HOT SERVICE</Text>
            </TouchableOpacity>
            
            <View style={styles.miniStat}>
               <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
               <Text style={styles.miniStatVal}>{analytics.completed} / {analytics.total}</Text>
               <Text style={[styles.miniStatLab, analytics.cancelled > 0 && {color: '#FF5252'}]}>
                 {analytics.cancelled > 0 ? `${analytics.cancelled} REJECTED` : 'COMPLETED'}
               </Text>
            </View>
          </View>
        </View>

        {/* DATE SELECTION */}
        <View style={styles.dateSection}>
          <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)} style={styles.datePickerToggle}>
            <Ionicons name="calendar" size={18} color="#4CAF50" style={{marginRight: 8}} />
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

        {/* TABS */}
        <View style={styles.tabs}>
          {['Queue', 'Confirmed', 'Active', 'Done'].map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BOOKING LIST */}
        <View style={styles.listSection}>
          {getDisplayList().map(item => {
            const isRejected = item.status === 'Cancelled';
            return (
              <View key={item._id} style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.infoWrapper}>
                    <TouchableOpacity onPress={() => openPetDetails(item.pet)}>
                      <Text style={styles.petName}>
                        {isRejected ? '❌ ' : '🐾 '}{item.pet?.name}
                        <Text style={{fontSize: 10, color: '#4CAF50', fontWeight: 'normal'}}> (Review)</Text>
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.serviceText}>{item.service} • {item.time}</Text>
                  </View>
                  <View style={[styles.statusBadge, isRejected && { backgroundColor: '#FFEBEE' }]}>
                    <Text style={[styles.statusText, isRejected && { color: '#FF5252' }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  {item.status === 'Pending' && (
                    <View style={styles.buttonGroup}>
                      <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Confirmed')} style={[styles.actionBtn, {backgroundColor: '#4CAF50'}]}><Text style={styles.btnTxt}>Approve</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Cancelled')} style={[styles.actionBtn, {backgroundColor: '#FF5252', marginLeft: 10}]}><Text style={styles.btnTxt}>Reject</Text></TouchableOpacity>
                    </View>
                  )}
                  {item.status === 'Confirmed' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Checked-In')} style={[styles.actionBtn, {backgroundColor: '#FBC02D'}]}><Text style={styles.btnTxt}>Check-In</Text></TouchableOpacity>}
                  {item.status === 'Checked-In' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'In-Process')} style={[styles.actionBtn, {backgroundColor: '#00BCD4'}]}><Text style={styles.btnTxt}>Start Task</Text></TouchableOpacity>}
                  {item.status === 'In-Process' && <TouchableOpacity onPress={() => handleStatusUpdate(item._id, 'Completed')} style={[styles.actionBtn, {backgroundColor: '#4CAF50'}]}><Text style={styles.btnTxt}>Complete</Text></TouchableOpacity>}
                </View>
              </View>
            );
          })}
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  titleBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
  adminTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  logoutBtn: { backgroundColor: '#FFF0F0', padding: 10, borderRadius: 12 },
  analyticsSection: { padding: 20 },
  revenueCard: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 24, elevation: 6 },
  anaLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  revenueVal: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginVertical: 4 },
  progressBar: { height: 6, backgroundColor: '#4CAF50', borderRadius: 3 },
  progressRow: { height: 6, width: '100%', backgroundColor: '#333', borderRadius: 3, marginTop: 10 },
  progressText: { color: '#888', fontSize: 11, marginTop: 8 },
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  miniStat: { backgroundColor: '#FFF', width: '48%', padding: 16, borderRadius: 20, elevation: 2, alignItems: 'center' },
  miniStatVal: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginTop: 4 },
  miniStatLab: { fontSize: 9, color: '#AAA', fontWeight: 'bold', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, elevation: 15 },
  petModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', backgroundColor: '#F9F9F9', padding: 12, borderRadius: 15, marginBottom: 12 },
  sectionDivider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 15, textTransform: 'uppercase' },
  listDetailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  listIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(76, 175, 80, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  detailLabel: { fontSize: 10, color: '#999', fontWeight: 'bold', textTransform: 'uppercase' },
  detailVal: { fontSize: 14, color: '#1A1A1A', fontWeight: '700' },
  closeBtn: { backgroundColor: '#1A1A1A', marginTop: 10, padding: 16, borderRadius: 14, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' },
  dateSection: { paddingHorizontal: 20, paddingVertical: 10 },
  datePickerToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, alignSelf: 'flex-start', elevation: 1 },
  selectedDateText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  chevron: { fontSize: 10, color: '#4CAF50' },
  calendarPopout: { backgroundColor: '#FFF', margin: 10, borderRadius: 15, elevation: 5, overflow: 'hidden' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#EEE' },
  tabBtnActive: { borderBottomColor: '#4CAF50' },
  tabText: { color: '#AAA', fontWeight: 'bold' },
  tabTextActive: { color: '#4CAF50' },
  listSection: { paddingHorizontal: 20 },
  bookingCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  infoWrapper: { flex: 1, marginRight: 12 },
  statusBadge: { backgroundColor: '#F0F9F4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  serviceText: { color: '#777', fontSize: 13, marginTop: 4 },
  statusText: { color: '#4CAF50', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  cardFooter: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15 },
  buttonGroup: { flexDirection: 'row' },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#FFF', fontWeight: 'bold' }
});

export default OwnerDashboard;