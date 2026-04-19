import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = () => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: "Hello! I am the PawPass Advanced AI Assistant. 🐾\n\nI am connected to a comprehensive veterinary database. Ask me about medical concerns, behavior, nutrition, or emergency first aid." }
  ]);
  const scrollViewRef = useRef();

  // --- THE "BIG ANSWER" ENGINE ---
  const getAIResponse = (input) => {
    const text = input.toLowerCase();

    if (text.includes("toxic") || text.includes("eat") || text.includes("poison")) {
      return `🚫 **COMPLETE NUTRITIONAL SAFETY GUIDE**\n\nIt is critical to know that pet metabolism differs significantly from humans. \n\n**1. Lethal Toxins:**\n• **Xylitol:** Found in sugar-free gum. Causes rapid insulin release and liver failure.\n• **Grapes/Raisins:** Can cause acute kidney failure in dogs.\n• **Onions/Garlic:** Damages red blood cells leading to anemia.\n\n**2. High Risk:**\n• **Chocolate:** Contains Theobromine. Darker is more dangerous.\n• **Macadamia Nuts:** Causes weakness, vomiting, and tremors.\n\n**💡 PRO TIP:** If ingestion occurred, do not wait for symptoms. Symptoms often mean internal damage has already begun. Contact a vet immediately.`;
    }

    if (text.includes("potty") || text.includes("pee") || text.includes("house train")) {
      return `🏠 **MASTERING HOUSE TRAINING (PRO METHOD)**\n\nHouse training is about management and preventions, not punishment.\n\n**Step-by-Step Strategy:**\n• **The 15-Minute Rule:** Take them out 15 mins after eating, drinking, or waking up from a nap.\n• **The Crate Method:** Use a crate just big enough for them to turn around. Pets instinctively won't soil where they sleep.\n• **Elimination Command:** Use a specific phrase like "Go Potty" every time they succeed outside.\n\n**⚠️ WHAT TO AVOID:** Never rub a pet's nose in an accident. They won't understand why you are angry; they will just learn to be afraid of you.`;
    }

    if (text.includes("bark") || text.includes("noise") || text.includes("stop")) {
      return `🗣️ **BEHAVIORAL ANALYSIS: EXCESSIVE BARKING**\n\nTo stop barking, we must first identify the 'Why'.\n\n**1. Demand Barking:** They want food or attention. Ignore completely. Reward only when they are silent.\n**2. Alert Barking:** Use the 'Thank You' method. Acknowledge the sound, then call them to you and reward the 'Quiet' command.\n**3. Boredom:** Increase physical activity by 30 minutes daily.\n\n**Pro Tool:** Try 'Nose Work'—hiding treats around the house. A dog using its nose for 10 minutes is as tired as a dog running for 30 minutes.`;
    }

    if (text.includes("flea") || text.includes("tick") || text.includes("itch")) {
      return `🐜 **PARASITE CONTROL & PREVENTION**\n\nFleas and ticks aren't just annoying; they carry Lyme disease and Tapeworms.\n\n**Action Plan:**\n• **Year-Round Protection:** Many parasites survive winter indoors. Use a vet-prescribed oral or topical monthly.\n• **Home Treatment:** If you see fleas, you must wash all bedding in 60°C water and vacuum carpets daily for 21 days.\n• **Tick Removal:** Use tweezers to grab the head close to the skin. Do not twist or use a match; pull straight up.`;
    }

    if (text.includes("vaccine") || text.includes("shots") || text.includes("medical")) {
      return `🩺 **VETERINARY HEALTH & VACCINATION PROTOCOL**\n\nPreventative care is significantly cheaper than emergency surgery.\n\n**Core Vaccinations:**\n• **DHPP/FVRCP:** Protects against major respiratory and viral diseases.\n• **Rabies:** Legally required in most regions.\n• **Leptospirosis:** Critical if your pet spends time near wildlife or standing water.\n\n**Annual Lab Work:** Once a pet reaches age 7, bi-annual blood panels are recommended to catch kidney/liver changes early.`;
    }

    if (text.includes("bath") || text.includes("groom") || text.includes("brush")) {
      return `🛁 **HYGIENE & SKIN CARE ESSENTIALS**\n\n**Bathing Frequency:**\n• Dogs: Every 4–8 weeks. Over-bathing causes dry, itchy skin.\n• Cats: Rarely. Only if they are elderly or have skin conditions.\n\n**Technique:**\n• Use lukewarm water. Hot water can burn them easily.\n• Use soap-free pet shampoo (human shampoo pH is too acidic for pets).\n• **Nail Clipping:** Trim every 3 weeks to prevent 'Quick' overgrowth which causes pain when walking.`;
    }

    if (text.includes("chew") || text.includes("destroy") || text.includes("shoes")) {
      return `🦴 **CURBING DESTRUCTIVE CHEWING**\n\nChewing is a biological necessity for dogs; our goal is to redirect it.\n\n**The Solution:**\n• **Appropriate Outlets:** Provide varying textures (hard rubber like Kongs, soft plush, and digestible dental chews).\n• **Rotation:** Don't leave all toys out. Switch them every 3 days to keep them "new" and interesting.\n• **Management:** Use bitter apple spray on furniture legs.\n\n**Note:** If an adult dog suddenly starts chewing, it is often a sign of separation anxiety.`;
    }

    if (text.includes("exercise") || text.includes("walk") || text.includes("play")) {
      return `🎾 **PHYSICAL & MENTAL STIMULATION GUIDE**\n\nPhysical exercise builds the body, but mental exercise builds the brain.\n\n**Physical:** A 20-minute brisk walk is standard, but try 'Interval Training' (short bursts of running) for high-energy breeds.\n**Mental:** Use snuffle mats or frozen lick pads. Licking and sniffing lower a pet's cortisol (stress) levels.\n\n**Warning:** Avoid heavy exercise for 1 hour after eating to prevent 'Bloat,' a life-threatening stomach condition.`;
    }

    if (text.includes("weight") || text.includes("fat") || text.includes("diet")) {
      return `⚖️ **WEIGHT MANAGEMENT & OBESITY PREVENTION**\n\nOver 50% of pets are overweight, which shortens their lifespan by up to 2.5 years.\n\n**The Assessment:**\n• You should be able to feel the ribs easily like the back of your hand.\n• From above, your pet should have a visible 'waist' tuck.\n\n**Action Steps:**\n• **Switch to Green Beans:** Replace 10% of their kibble with low-sodium green beans to keep them full with fewer calories.\n• **Ditch the Bowl:** Use slow-feeders to make mealtime an active process.`;
    }

    if (text.includes("bite") || text.includes("nipping") || text.includes("mouthy")) {
      return `🦷 **STOPPING PUPPY NIPPING & BITING**\n\nPuppies explore the world with their mouths, but we must teach "Bite Inhibition".\n\n**The "Ouch" Method:**\n1. When the teeth touch skin, make a high-pitched "Yelp!" sound.\n2. Immediately stop all play and turn your back for 30 seconds.\n3. Return with a toy. If they bite the toy, praise them heavily.\n\n**Consistency:** Everyone in the house must follow this rule, or the pet will get confused.`;
    }

    return "That is a complex topic! 🐾\n\nI am currently analyzing your query. To give you the most accurate advice, could you tell me your pet's age and breed? In the meantime, I recommend checking our 'Expert Insights' module or calling your local clinic for a physical exam.";
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    // AI Processing Delay (Simulates "Thinking" for a "Big" answer)
    setTimeout(() => {
      const response = getAIResponse(currentInput);
      const botMsg = { id: Date.now() + 1, type: 'bot', text: response };
      setIsTyping(false);
      setMessages(prev => [...prev, botMsg]);
    }, 1800);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.aiBadge}>
          <Ionicons name="hardware-chip" size={20} color="#FFF" />
        </View>
        <View>
          <Text style={styles.headerTitle}>PawPass AI Expert</Text>
          <Text style={styles.headerStatus}>v2.4 Engine Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={{ paddingVertical: 20 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.msgContainer, msg.type === 'user' ? styles.userContainer : styles.botContainer]}>
              <View style={[styles.bubble, msg.type === 'user' ? styles.userBubble : styles.botBubble]}>
                <Text style={[styles.msgText, msg.type === 'user' ? styles.userText : styles.botText]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
          {isTyping && (
            <View style={styles.botContainer}>
              <View style={[styles.bubble, styles.botBubble, { paddingVertical: 10 }]}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.typingText}>Generating expert response...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.inputArea}>
            <TextInput 
              placeholder="Ask a detailed question..." 
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              onPress={handleSend} 
              style={[styles.sendBtn, { backgroundColor: inputText.trim() ? '#1A1A1A' : '#CCC' }]}
              disabled={!inputText.trim()}
            >
              <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F6' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE',
    elevation: 4 
  },
  aiBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  headerStatus: { fontSize: 11, color: '#4CAF50', fontWeight: 'bold', textTransform: 'uppercase' },
  
  chatArea: { flex: 1, paddingHorizontal: 16 },
  msgContainer: { marginVertical: 10, flexDirection: 'row', width: '100%' },
  botContainer: { justifyContent: 'flex-start' },
  userContainer: { justifyContent: 'flex-end' },
  
  bubble: { maxWidth: '85%', padding: 16, borderRadius: 18 },
  botBubble: { backgroundColor: '#FFF', borderTopLeftRadius: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
  userBubble: { backgroundColor: '#4CAF50', borderTopRightRadius: 2 },
  
  msgText: { fontSize: 15, lineHeight: 23 },
  botText: { color: '#2C3E50' },
  userText: { color: '#FFF', fontWeight: '500' },
  typingText: { fontSize: 10, color: '#999', marginTop: 4, textAlign: 'center' },

  footer: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#F0F2F5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 },
  input: { flex: 1, fontSize: 16, maxHeight: 120, color: '#1A1A1A' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});

export default ChatScreen;