import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const TURN_TIME = 120; // 120 seconds per turn

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { gameId, player1, player2, mode, difficulty } = params;

  const [gameData, setGameData] = useState<any>(null);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [submitting, setSubmitting] = useState(false);
  const [computerThinking, setComputerThinking] = useState(false);
  const timerRef = useRef<any>(null);
  const isComputerMode = mode === 'pvc';

  // Fetch game data
  const fetchGame = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/game/${gameId}`);
      setGameData(response.data);
    } catch (error) {
      console.error('Error fetching game:', error);
    }
  };

  // Initialize game
  useEffect(() => {
    fetchGame();
  }, []);

  // Check if it's computer's turn
  useEffect(() => {
    if (gameData && isComputerMode && gameData.current_player === 2 && gameData.status === 'active') {
      handleComputerTurn();
    }
  }, [gameData?.current_player]);

  // Timer
  useEffect(() => {
    if (!gameData || gameData.status === 'finished' || computerThinking) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleEndTurn();
          return TURN_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameData, computerThinking]);

  const handleComputerTurn = async () => {
    setComputerThinking(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      // Get computer words
      const response = await axios.post(`${BACKEND_URL}/api/game/computer-turn`, {
        game_id: gameId,
        difficulty: difficulty || 'medium',
      });

      const computerWords = response.data.words;

      // Submit each word with delay
      for (const wordEntry of computerWords) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await axios.post(`${BACKEND_URL}/api/game/submit-word`, {
          game_id: gameId,
          word: wordEntry.word,
          player: 2,
        });

        await fetchGame();
      }

      // Wait a bit before ending turn
      await new Promise(resolve => setTimeout(resolve, 2000));

      setComputerThinking(false);
      await handleEndTurn();
    } catch (error) {
      console.error('Error in computer turn:', error);
      setComputerThinking(false);
      Alert.alert('Error', 'Computer turn failed');
    }
  };

  const handleSubmitWord = async () => {
    if (!currentWord.trim()) return;
    if (currentWord.trim().length < 3) {
      Alert.alert('Too Short', 'Word must be at least 3 letters');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/game/submit-word`, {
        game_id: gameId,
        word: currentWord.trim(),
        player: gameData.current_player,
      });

      const result = response.data;
      if (result.valid) {
        Alert.alert('Valid Word!', `+${result.points} points`);
        setCurrentWord('');
        await fetchGame();
      } else {
        Alert.alert('Invalid', result.reason);
      }
    } catch (error) {
      console.error('Error submitting word:', error);
      Alert.alert('Error', 'Failed to submit word');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndTurn = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/game/switch-turn`, {
        game_id: gameId,
      });

      await fetchGame();
      
      if (response.data.status === 'finished') {
        // Game over
        router.replace({
          pathname: '/results',
          params: { gameId },
        });
      } else {
        // Next player's turn
        setTimeLeft(TURN_TIME);
        
        if (!isComputerMode) {
          Alert.alert(
            'Turn Switch',
            `${response.data.next_player === 1 ? player1 : player2}'s turn now!`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error switching turn:', error);
    }
  };

  if (!gameData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const currentPlayerName = gameData.current_player === 1 ? player1 : player2;
  const currentPlayerWords = gameData.current_player === 1 ? gameData.player1_words : gameData.player2_words;
  const currentPlayerScore = gameData.current_player === 1 ? gameData.player1_score : gameData.player2_score;
  const isComputerTurn = isComputerMode && gameData.current_player === 2;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Computer Thinking Overlay */}
      {computerThinking && (
        <View style={styles.computerOverlay}>
          <View style={styles.computerCard}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.computerText}>Computer is thinking...</Text>
            <Text style={styles.computerSubtext}>Finding words...</Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.scoreBoard}>
          <View style={styles.scoreItem}>
            <Text style={styles.playerName}>{player1}</Text>
            <Text style={styles.score}>{gameData.player1_score}</Text>
          </View>
          <View style={styles.vsContainer}>
            <Text style={styles.vs}>VS</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.playerName}>{player2}</Text>
            <Text style={styles.score}>{gameData.player2_score}</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainWordContainer}>
        <Text style={styles.mainWordLabel}>Main Word</Text>
        <Text style={styles.mainWord}>{gameData.main_word.toUpperCase()}</Text>
      </View>

      <View style={styles.turnInfo}>
        <Text style={styles.currentTurn}>{currentPlayerName}'s Turn</Text>
        <View style={styles.timerContainer}>
          <Ionicons name="time" size={24} color={timeLeft < 30 ? '#f44336' : '#4CAF50'} />
          <Text style={[styles.timer, timeLeft < 30 && styles.timerWarning]}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      {!isComputerTurn && (
        <View style={styles.inputSection}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter a word..."
              placeholderTextColor="#666"
              value={currentWord}
              onChangeText={setCurrentWord}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmitWord}
              disabled={submitting || !currentWord.trim()}
            >
              <Ionicons name="checkmark-circle" size={32} color={currentWord.trim() ? '#4CAF50' : '#666'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isComputerTurn && (
        <View style={styles.computerTurnIndicator}>
          <Ionicons name="phone-portrait" size={32} color="#4CAF50" />
          <Text style={styles.computerTurnText}>Computer is playing...</Text>
        </View>
      )}

      <ScrollView style={styles.wordsList}>
        <Text style={styles.wordsTitle}>
          {isComputerTurn ? "Computer's Words" : "Your Words"} ({currentPlayerWords.length})
        </Text>
        {currentPlayerWords.map((wordEntry: any, index: number) => (
          <View key={index} style={styles.wordItem}>
            <Text style={styles.wordText}>{wordEntry.word}</Text>
            <View style={styles.wordInfo}>
              <Text style={[styles.wordStatus, wordEntry.valid ? styles.valid : styles.invalid]}>
                {wordEntry.valid ? '✓' : '✗'}
              </Text>
              <Text style={styles.wordPoints}>{wordEntry.points} pts</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {!isComputerTurn && (
        <TouchableOpacity 
          style={styles.endTurnButton}
          onPress={handleEndTurn}
        >
          <Text style={styles.endTurnText}>End Turn</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  computerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  computerCard: {
    backgroundColor: '#16213e',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  computerText: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  computerSubtext: {
    color: '#bbb',
    fontSize: 16,
    marginTop: 8,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 8,
  },
  score: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  vsContainer: {
    marginHorizontal: 20,
  },
  vs: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  mainWordContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#0f3460',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  mainWordLabel: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 8,
  },
  mainWord: {
    color: '#4CAF50',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  turnInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  currentTurn: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timer: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timerWarning: {
    color: '#f44336',
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    paddingVertical: 16,
  },
  submitButton: {
    padding: 8,
  },
  computerTurnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  computerTurnText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  wordsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  wordsTitle: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  wordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  wordText: {
    color: '#fff',
    fontSize: 16,
  },
  wordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordStatus: {
    fontSize: 18,
    marginRight: 12,
  },
  valid: {
    color: '#4CAF50',
  },
  invalid: {
    color: '#f44336',
  },
  wordPoints: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endTurnButton: {
    backgroundColor: '#FF9800',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  endTurnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
