import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { gameId } = params;

  const [gameData, setGameData] = useState<any>(null);

  useEffect(() => {
    fetchGame();
  }, []);

  const fetchGame = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/game/${gameId}`);
      setGameData(response.data);
    } catch (error) {
      console.error('Error fetching game:', error);
    }
  };

  if (!gameData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  const winner = gameData.player1_score > gameData.player2_score ? gameData.player1_name :
                 gameData.player2_score > gameData.player1_score ? gameData.player2_name :
                 'Tie';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name={winner === 'Tie' ? 'trophy' : 'trophy'} 
          size={80} 
          color="#FFD700" 
        />
        <Text style={styles.title}>
          {winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`}
        </Text>
      </View>

      <View style={styles.scoresContainer}>
        <View style={[styles.playerResult, gameData.player1_score >= gameData.player2_score && styles.winner]}>
          <Text style={styles.playerResultName}>{gameData.player1_name}</Text>
          <Text style={styles.playerResultScore}>{gameData.player1_score}</Text>
          <Text style={styles.playerResultWords}>{gameData.player1_words.length} words</Text>
        </View>

        <View style={[styles.playerResult, gameData.player2_score >= gameData.player1_score && styles.winner]}>
          <Text style={styles.playerResultName}>{gameData.player2_name}</Text>
          <Text style={styles.playerResultScore}>{gameData.player2_score}</Text>
          <Text style={styles.playerResultWords}>{gameData.player2_words.length} words</Text>
        </View>
      </View>

      <View style={styles.mainWordDisplay}>
        <Text style={styles.mainWordLabel}>Main Word Was:</Text>
        <Text style={styles.mainWordText}>{gameData.main_word.toUpperCase()}</Text>
      </View>

      <ScrollView style={styles.wordLists}>
        <View style={styles.wordListSection}>
          <Text style={styles.wordListTitle}>{gameData.player1_name}'s Words:</Text>
          {gameData.player1_words.map((wordEntry: any, index: number) => (
            <View key={index} style={styles.wordItem}>
              <Text style={styles.wordText}>{wordEntry.word}</Text>
              <View style={styles.wordStats}>
                <Text style={[styles.wordStatus, wordEntry.valid ? styles.valid : styles.invalid]}>
                  {wordEntry.valid ? '✓' : '✗'}
                </Text>
                <Text style={styles.wordPoints}>{wordEntry.points} pts</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.wordListSection}>
          <Text style={styles.wordListTitle}>{gameData.player2_name}'s Words:</Text>
          {gameData.player2_words.map((wordEntry: any, index: number) => (
            <View key={index} style={styles.wordItem}>
              <Text style={styles.wordText}>{wordEntry.word}</Text>
              <View style={styles.wordStats}>
                <Text style={[styles.wordStatus, wordEntry.valid ? styles.valid : styles.invalid]}>
                  {wordEntry.valid ? '✓' : '✗'}
                </Text>
                <Text style={styles.wordPoints}>{wordEntry.points} pts</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/')}
        >
          <Ionicons name="home" size={24} color="#fff" />
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.playAgainButton]}
          onPress={() => router.replace('/setup')}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
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
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  playerResult: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  winner: {
    backgroundColor: '#0f3460',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  playerResultName: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 12,
  },
  playerResultScore: {
    color: '#4CAF50',
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playerResultWords: {
    color: '#888',
    fontSize: 14,
  },
  mainWordDisplay: {
    alignItems: 'center',
    backgroundColor: '#0f3460',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  mainWordLabel: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 8,
  },
  mainWordText: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  wordLists: {
    flex: 1,
    marginBottom: 20,
  },
  wordListSection: {
    marginBottom: 20,
  },
  wordListTitle: {
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
  wordStats: {
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  playAgainButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
