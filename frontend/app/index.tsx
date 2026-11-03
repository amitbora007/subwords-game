import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="game-controller" size={80} color="#4CAF50" />
        <Text style={styles.title}>Word Builder</Text>
        <Text style={styles.subtitle}>Create subwords from a main word!</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/setup')}
        >
          <Text style={styles.buttonText}>Start New Game</Text>
        </TouchableOpacity>

        <View style={styles.rulesContainer}>
          <Text style={styles.rulesTitle}>How to Play:</Text>
          <Text style={styles.ruleText}>• 2 players take turns on same device</Text>
          <Text style={styles.ruleText}>• Each player gets 120 seconds per turn</Text>
          <Text style={styles.ruleText}>• Create subwords from the main word</Text>
          <Text style={styles.ruleText}>• Each valid word scores points = word length</Text>
          <Text style={styles.ruleText}>• Words must be at least 3 letters</Text>
          <Text style={styles.ruleText}>• Highest score wins!</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#bbb',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rulesContainer: {
    backgroundColor: '#16213e',
    padding: 24,
    borderRadius: 16,
    width: '100%',
  },
  rulesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  ruleText: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 8,
    lineHeight: 24,
  },
});
