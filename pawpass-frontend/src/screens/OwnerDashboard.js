import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  RefreshControl, ScrollView, Alert, Modal, Dimensions
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const OwnerDashboard = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Queue');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showPetModal, setShowPetModal] = useState(false);

  // --- ANALYTICS ENGINE ---
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
      
      {/* IMPROVED SERVICE BREAKDOWN MODAL */}
      <Modal visible={showServiceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '85%' }]}>
            <View style={styles.modalHeaderRow}>
               <Ionicons name="flame" size={24} color="#FF5722" />
               <Text style={styles.modalTitle}>Daily Service Mix</Text>
            </View>
            
            <View style={styles.modalScrollArea}>
              {Object.entries(analytics.serviceBreakdown).length > 0 ? (
                Object.entries(analytics.serviceBreakdown).map(([name, count]) => (
                  <View key={name} style={styles.serviceItemRow}>
                    <Text style={styles.serviceItemName}>{name}</Text>
                    <View style={styles.countPill}>
                       <Text style={styles.countPillText}>{count} Booked</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No bookings for this date.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.closeBtnPrimary} onPress={() => setShowServiceModal(false)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PET DETAILS MODAL */}
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
                  { label: 'Gender', val: selectedPet?.gender || 'Not Provided', icon: 'male-female' },
                ].map((item, i) => (
                  <View key={i} style={styles.gridItem}>
                    <Ionicons name={item.icon} size={14} color="#4CAF50" style={{marginBottom: 4}} />
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailVal}>{item.val}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.sectionDivider} />
              <Text style={styles.sectionLabel}>Medical & Behavior</Text>

              {[
                { label: 'Vaccination', val: selectedPet?.vaccinationStatus, icon: 'medkit' },
                { label: 'Allergies', val: selectedPet?.allergies, icon: 'alert-circle' },
                { label: 'Fears', val: selectedPet?.afraidOf, icon: 'thunderstorm' },
                { label: 'Friendly', val: selectedPet?.isFriendly, icon: 'happy' },
              ].map((item, i) => (
                <View key={i} style={styles.listDetailItem}>
                  <View style={styles.listIconCircle}><Ionicons name={item.icon} size={18} color="#4CAF50" /></View>
                  <View style={{flex:1}}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={[styles.detailVal, {fontSize: 15}]}>{item.val || 'None'}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtnPrimary} onPress={() => setShowPetModal(false)}>
              <Text style={styles.closeBtnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={styles.titleBar}>
        <View>
          <Text style={styles.greetingText}>Welcome Back,</Text>
          <Text style={styles.adminTitle}>Owner Command</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} />}
      >
        
        {/* ANALYTICS SECTION */}
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
               <View style={styles.statHeader}>
                 <Ionicons name="flame" size={16} color="#FF5722" />
                 <Text style={styles.miniStatLab}>HOT SERVICE</Text>
               </View>
               <Text style={styles.miniStatVal} numberOfLines={1}>{analytics.topService}</Text>
            </TouchableOpacity>
            
            <View style={styles.miniStat}>
               <View style={styles.statHeader}>
                 <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                 <Text style={styles.miniStatLab}>COMPLETED</Text>
               </View>
               <Text style={styles.miniStatVal}>{analytics.completed} / {analytics.total}</Text>
            </View>
          </View>
        </View>

        {/* DATE SELECTION */}
        <View style={styles.dateSection}>
          <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)} style={styles.datePickerToggle}>
            <Ionicons name="calendar" size={18} color="#4CAF50" style={{marginRight: 8}} />
            <Text style={styles.selectedDateText}>{selectedDate}</Text>
            <Ionicons name={showCalendar ? "chevron-up" : "chevron-down"} size={14} color="#4CAF50" style={{marginLeft: 8}} />
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
          {getDisplayList().length > 0 ? getDisplayList().map(item => {
            const isRejected = item.status === 'Cancelled';
            return (
              <View key={item._id} style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.infoWrapper}>
                    <TouchableOpacity onPress={() => openPetDetails(item.pet)}>
                      <Text style={styles.petName}>
                        {isRejected ? '❌ ' : '🐾 '}{item.pet?.name || 'Unknown Pet'}
                        <Text style={styles.reviewLink}> (Review)</Text>
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
          }) : (
            <View style={styles.emptyContainer}>
               <Ionicons name="documents-outline" size={50} color="#DDD" />
               <Text style={styles.emptyText}>No bookings in this category.</Text>
            </View>
          )}
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  titleBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
  greetingText: { fontSize: 12, color: '#888', fontWeight: '600' },
  adminTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  logoutBtn: { backgroundColor: '#FFF0F0', padding: 10, borderRadius: 12 },
  analyticsSection: { paddingHorizontal: 20, paddingTop: 10 },
  revenueCard: { backgroundColor: '#1A1A1A', padding: 22, borderRadius: 28, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  anaLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
  revenueVal: { color: '#FFF', fontSize: 38, fontWeight: 'bold', marginVertical: 4 },
  progressBar: { height: 6, backgroundColor: '#4CAF50', borderRadius: 3 },
  progressRow: { height: 6, width: '100%', backgroundColor: '#333', borderRadius: 3, marginTop: 12 },
  progressText: { color: '#888', fontSize: 11, marginTop: 10 },
  miniStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  miniStat: { backgroundColor: '#FFF', width: '48%', padding: 16, borderRadius: 24, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  miniStatVal: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  miniStatLab: { fontSize: 9, color: '#999', fontWeight: '800', marginLeft: 6 },
  
  // MODAL STYLES (HOT SERVICES)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 30, padding: 25, elevation: 20 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginLeft: 10 },
  modalScrollArea: { marginVertical: 10 },
  serviceItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 16, marginBottom: 10 },
  serviceItemName: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1 },
  countPill: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  countPillText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 12 },
  closeBtnPrimary: { backgroundColor: '#1A1A1A', marginTop: 20, padding: 18, borderRadius: 18, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // PET MODAL
  petModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', backgroundColor: '#F9FAFB', padding: 14, borderRadius: 18, marginBottom: 12 },
  sectionDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#AAA', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  listDetailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  listIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(76, 175, 80, 0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  detailLabel: { fontSize: 9, color: '#AAA', fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  detailVal: { fontSize: 14, color: '#1A1A1A', fontWeight: '700' },
  
  dateSection: { paddingHorizontal: 20, paddingVertical: 15 },
  datePickerToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, alignSelf: 'flex-start', elevation: 2 },
  selectedDateText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  calendarPopout: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 20, elevation: 10, overflow: 'hidden', marginBottom: 15 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#F0F0F0' },
  tabBtnActive: { borderBottomColor: '#4CAF50' },
  tabText: { color: '#BBB', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#4CAF50' },
  listSection: { paddingHorizontal: 20 },
  bookingCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 26, marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  infoWrapper: { flex: 1, marginRight: 12 },
  statusBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, height: 26 },
  petName: { fontSize: 19, fontWeight: '800', color: '#1A1A1A' },
  reviewLink: { fontSize: 11, color: '#4CAF50', fontWeight: '500' },
  serviceText: { color: '#888', fontSize: 13, marginTop: 5, fontWeight: '500' },
  statusText: { color: '#22C55E', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  cardFooter: { marginTop: 18, borderTopWidth: 1, borderTopColor: '#F9FAFB', paddingTop: 18 },
  buttonGroup: { flexDirection: 'row' },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#AAA', marginTop: 10, fontWeight: '600' }
});

export default OwnerDashboard;