import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SetupScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'pvp' | 'pvc'>('pvp');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    if (!player1.trim()) {
      Alert.alert('Error', 'Please enter player name');
      return;
    }

    if (mode === 'pvp' && !player2.trim()) {
      Alert.alert('Error', 'Please enter both player names');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/game/create`, {
        player1_name: player1.trim(),
        player2_name: mode === 'pvc' ? 'Computer' : player2.trim(),
        mode: mode,
        difficulty: mode === 'pvc' ? difficulty : null,
      });

      const gameData = response.data;
      router.push({
        pathname: '/game',
        params: { 
          gameId: gameData.id,
          player1: player1.trim(),
          player2: mode === 'pvc' ? 'Computer' : player2.trim(),
          mode: mode,
          difficulty: mode === 'pvc' ? difficulty : '',
        },
      });
    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert('Error', 'Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Game Setup</Text>

        {/* Mode Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Mode</Text>
          <View style={styles.modeContainer}>
            <TouchableOpacity 
              style={[styles.modeButton, mode === 'pvp' && styles.modeButtonActive]}
              onPress={() => setMode('pvp')}
            >
              <Ionicons 
                name="people" 
                size={32} 
                color={mode === 'pvp' ? '#4CAF50' : '#666'} 
              />
              <Text style={[styles.modeText, mode === 'pvp' && styles.modeTextActive]}>
                Player vs Player
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modeButton, mode === 'pvc' && styles.modeButtonActive]}
              onPress={() => setMode('pvc')}
            >
              <Ionicons 
                name="phone-portrait" 
                size={32} 
                color={mode === 'pvc' ? '#4CAF50' : '#666'} 
              />
              <Text style={[styles.modeText, mode === 'pvc' && styles.modeTextActive]}>
                Player vs Computer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Difficulty Selection (only for PvC) */}
        {mode === 'pvc' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Difficulty</Text>
            <View style={styles.difficultyContainer}>
              <TouchableOpacity 
                style={[styles.difficultyButton, difficulty === 'easy' && styles.difficultyButtonActive]}
                onPress={() => setDifficulty('easy')}
              >
                <Text style={[styles.difficultyText, difficulty === 'easy' && styles.difficultyTextActive]}>
                  Easy
                </Text>
                <Text style={styles.difficultyDesc}>3-5 words</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.difficultyButton, difficulty === 'medium' && styles.difficultyButtonActive]}
                onPress={() => setDifficulty('medium')}
              >
                <Text style={[styles.difficultyText, difficulty === 'medium' && styles.difficultyTextActive]}>
                  Medium
                </Text>
                <Text style={styles.difficultyDesc}>5-8 words</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.difficultyButton, difficulty === 'hard' && styles.difficultyButtonActive]}
                onPress={() => setDifficulty('hard')}
              >
                <Text style={[styles.difficultyText, difficulty === 'hard' && styles.difficultyTextActive]}>
                  Hard
                </Text>
                <Text style={styles.difficultyDesc}>8-12 words</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Player Names */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player {mode === 'pvc' ? 'Name' : 'Names'}</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={24} color="#4CAF50" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Player 1 Name"
                placeholderTextColor="#666"
                value={player1}
                onChangeText={setPlayer1}
                maxLength={20}
              />
            </View>

            {mode === 'pvp' && (
              <View style={styles.inputWrapper}>
                <Ionicons name="person" size={24} color="#FF9800" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Player 2 Name"
                  placeholderTextColor="#666"
                  value={player2}
                  onChangeText={setPlayer2}
                  maxLength={20}
                />
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.startButton, loading && styles.buttonDisabled]}
          onPress={startGame}
          disabled={loading}
        >
          <Text style={styles.startButtonText}>
            {loading ? 'Creating Game...' : 'Start Game'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#0f3460',
  },
  modeText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modeTextActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#0f3460',
  },
  difficultyText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  difficultyTextActive: {
    color: '#4CAF50',
  },
  difficultyDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    paddingVertical: 16,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
