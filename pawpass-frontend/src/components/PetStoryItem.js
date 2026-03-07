import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

const PetStoryItem = ({ name, species, onPress, isAddButton }) => {
  if (isAddButton) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={[styles.circle, styles.dashed]}>
          <Text style={styles.plus}>+</Text>
        </View>
        <Text style={styles.name}>Add Pet</Text>
      </TouchableOpacity>
    );
  }

  const emoji = species === 'Dog' ? '🐶' : species === 'Cat' ? '🐱' : species === 'Rabbit' ? '🐰' : '🐾';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.circle}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginRight: 15, width: 75 },
  circle: { 
    width: 65, 
    height: 65, 
    borderRadius: 32.5, 
    borderWidth: 2, 
    borderColor: '#4CAF50', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dashed: { borderColor: '#ccc', borderStyle: 'dashed', elevation: 0 },
  emoji: { fontSize: 28 },
  plus: { fontSize: 28, color: '#ccc', fontWeight: 'bold' },
  name: { fontSize: 12, marginTop: 6, color: '#333', fontWeight: '500', textAlign: 'center' }
});

export default PetStoryItem;

