import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Linking, LayoutAnimation, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = () => {
  const [expandedId, setExpandedId] = useState(null);

  const tips = [
    { 
      id: 1, 
      title: "🩺 Annual Checkup Guide", 
      desc: "Essential questions for your vet.", 
      details: "• Ask about ideal weight & nutrition.\n• Check dental health for plaque buildup.\n• Verify if booster shots are due.\n• Mention any new lumps, bumps, or habits.",
      color: '#E3F2FD', 
      icon: 'medical' 
    },
    { 
      id: 2, 
      title: "🍎 Nutrition & Diet", 
      desc: "What's safe for your pet's plate?", 
      details: "✅ SAFE: Plain pumpkin, apples (no seeds), cooked eggs.\n❌ TOXIC: Chocolate, grapes, macadamia nuts, garlic.\n💡 PRO TIP: Treats should only make up 10% of daily calories.",
      color: '#E8F5E9', 
      icon: 'nutrition' 
    },
    { 
      id: 3, 
      title: "🚫 Safety Alert", 
      desc: "Common household dangers.", 
      details: "• Many indoor plants like Lilies are lethal to cats.\n• Keep sugar-free gum (Xylitol) far away from dogs.\n• Salt lamps can be dangerous if licked excessively.\n• Secure heavy furniture to walls.",
      color: '#FFEBEE', 
      icon: 'warning' 
    },
    { 
      id: 4, 
      title: "🎾 Exercise Tips", 
      desc: "Healthy bodies, happy minds.", 
      details: "• Puppies: Short, frequent walks to protect joints.\n• Senior Pets: Low-impact swimming or gentle walks.\n• Mental: Hide treats around the room for 'nose work'.\n• Cats: Use vertical space (cat trees) for climbing.",
      color: '#FFF3E0', 
      icon: 'bicycle' 
    },
  ];

  const toggleExpand = (id) => {
    // Standard animation that works across architectures
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.title}>Pet Resources</Text>
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Interactive Support Card */}
        <TouchableOpacity 
          style={styles.supportCard}
          onPress={() => Linking.openURL('mailto:support@pawpass.com')}
          activeOpacity={0.9}
        >
          <View style={styles.supportHeader}>
            <View style={styles.supportTextContainer}>
              <Text style={styles.supportTitle}>Need Assistance? 🐾</Text>
              <Text style={styles.supportSubtitle}>Tap here to email our experts</Text>
            </View>
            <Ionicons name="mail-unread" size={40} color="rgba(255,255,255,0.8)" />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Expert Insights</Text>
        
        {tips.map((tip) => (
          <TouchableOpacity 
            key={tip.id} 
            style={[
              styles.tipCard, 
              { backgroundColor: tip.color },
              expandedId === tip.id && styles.activeCard
            ]}
            onPress={() => toggleExpand(tip.id)}
            activeOpacity={0.7}
          >
            <View style={styles.tipHeader}>
              <View style={styles.iconTitleRow}>
                <View style={styles.iconCircle}>
                   <Ionicons name={tip.icon} size={20} color="#333" />
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
              </View>
              <Ionicons 
                name={expandedId === tip.id ? "chevron-up-circle" : "chevron-down-circle"} 
                size={24} 
                color="#666" 
              />
            </View>
            
            {!expandedId && <Text style={styles.tipDesc}>{tip.desc}</Text>}

            {expandedId === tip.id && (
              <View style={styles.detailBox}>
                <Text style={styles.detailText}>{tip.details}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  title: { 
    fontSize: 34, 
    fontWeight: 'bold', 
    paddingHorizontal: 20, 
    paddingTop: 40, 
    color: '#1A1A1A' 
  },
  container: { padding: 20 },
  supportCard: { 
    backgroundColor: '#4CAF50', 
    padding: 22, 
    borderRadius: 24, 
    marginBottom: 30, 
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12
  },
  supportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  supportTextContainer: { flex: 1 },
  supportTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  supportSubtitle: { color: '#fff', fontSize: 14, opacity: 0.9, marginTop: 4 },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#444', marginBottom: 15, marginLeft: 5 },
  tipCard: { 
    padding: 20, 
    borderRadius: 22, 
    marginBottom: 16, 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  activeCard: {
    borderColor: 'rgba(0,0,0,0.1)',
    elevation: 4,
  },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconTitleRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tipTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginLeft: 12 },
  tipDesc: { fontSize: 14, color: '#666', marginTop: 10, marginLeft: 48 },
  detailBox: { marginTop: 15, paddingLeft: 10 },
  detailText: { fontSize: 15, color: '#2C3E50', lineHeight: 24, fontWeight: '500' },
});

export default ChatScreen;