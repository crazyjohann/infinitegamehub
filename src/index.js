import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  Modal,
  Pressable,
  Linking,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Gamepad2, 
  Trophy, 
  Star,
  Play,
  X,
  Clock,
  Target,
  Sparkles,
  User,
  ExternalLink,
  Monitor,
  Image as ImageIcon,
  Menu,
  Search,
  Filter,
  Zap,
  Sword,
  Palette,
  Puzzle,
  Car,
  Users,
  Heart,
  Gamepad,
  Brain,
  Flame,
  TrendingUp
} from 'lucide-react-native';
import { useGameStore } from '@/hooks/game-store';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface GameCard {
  id: string;
  name: string;
  image: string;
  url: string;
  genre: string;
  developer: string;
  rating: number;
  popularity: number;
  description?: string;
  features?: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  estimatedTime?: string;
  icon?: React.ReactNode;
  gradient?: string[];
  route?: string;
  version?: string;
  iframeCode?: string;
  category?: string;
  tags?: string[];
}

interface GameCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  gradient: string[];
  count: number;
}

const gameCategories: GameCategory[] = [
  { id: 'all', name: 'All Games', icon: <Gamepad size={20} color="#fff" />, color: '#667eea', gradient: ['#667eea', '#764ba2'], count: 0 },
  { id: 'action', name: 'Action', icon: <Zap size={20} color="#fff" />, color: '#ff6b6b', gradient: ['#ff6b6b', '#ee5a24'], count: 0 },
  { id: 'adventure', name: 'Adventure', icon: <Sword size={20} color="#fff" />, color: '#4ecdc4', gradient: ['#4ecdc4', '#44a08d'], count: 0 },
  { id: 'puzzle', name: 'Puzzle', icon: <Puzzle size={20} color="#fff" />, color: '#45b7d1', gradient: ['#45b7d1', '#96c93d'], count: 0 },
  { id: 'racing', name: 'Racing', icon: <Car size={20} color="#fff" />, color: '#f39c12', gradient: ['#f39c12', '#e74c3c'], count: 0 },
  { id: 'multiplayer', name: 'Multiplayer', icon: <Users size={20} color="#fff" />, color: '#9b59b6', gradient: ['#9b59b6', '#8e44ad'], count: 0 },
  { id: 'casual', name: 'Casual', icon: <Heart size={20} color="#fff" />, color: '#e91e63', gradient: ['#e91e63', '#ad1457'], count: 0 },
  { id: 'strategy', name: 'Strategy', icon: <Brain size={20} color="#fff" />, color: '#2ecc71', gradient: ['#2ecc71', '#27ae60'], count: 0 },
  { id: 'trending', name: 'Trending', icon: <Flame size={20} color="#fff" />, color: '#ff9500', gradient: ['#ff9500', '#ff6348'], count: 0 },
];

const games: GameCard[] = [
  { id: 'slope2', name: "Slope 2", image: "https://placehold.co/300x200/5C007C/ffffff?text=Slope+2", url: "https://2slope.github.io/", genre: "Arcade", developer: "RoboGames", rating: 4.2, popularity: 150, description: "Navigate a ball down a steep slope while avoiding obstacles in this fast-paced arcade game.", features: ["High-speed gameplay", "Challenging obstacles", "Smooth controls", "Endless levels"], difficulty: "Hard", estimatedTime: "5-20 min", gradient: ['#5C007C', '#8B1A9C'], category: 'action', tags: ['fast-paced', 'endless', 'challenging'] },
  { id: 'italian-brainrot', name: "Italian Brainrot Clicker", image: "https://placehold.co/300x200/004080/ffffff?text=Italian+Brainrot+Clicker", url: "https://italianbrainrotclicker.pages.dev/", genre: "Clicker", developer: "Pasta Devs", rating: 3.8, popularity: 80, description: "A quirky clicker game with Italian flair and endless upgrades.", features: ["Incremental gameplay", "Italian theme", "Multiple upgrades", "Achievements"], difficulty: "Easy", estimatedTime: "10-60 min", gradient: ['#004080', '#0066CC'], category: 'casual', tags: ['clicker', 'incremental', 'italian'] },
  { id: '2048', name: "2048", image: "https://placehold.co/300x200/4CAF50/ffffff?text=2048", url: "https://specials.manoramaonline.com/Mobile/2022/2048-game/index.html", genre: "Puzzle", developer: "Gabriele Cirulli", rating: 4.5, popularity: 200, description: "Slide numbered tiles to combine them and reach the 2048 tile in this addictive puzzle game.", features: ["Strategic gameplay", "Smooth animations", "Score tracking", "Undo moves"], difficulty: "Medium", estimatedTime: "10-30 min", gradient: ['#4CAF50', '#66BB6A'], category: 'puzzle', tags: ['numbers', 'strategy', 'addictive'], route: '/games/twenty48' },
  { id: 'flappy-bird', name: "Flappy Bird", image: "https://placehold.co/300x200/FF5722/ffffff?text=Flappy+Bird", url: "https://flappybird.io/", genre: "Arcade", developer: "Dong Nguyen", rating: 3.5, popularity: 120, description: "Guide a bird through pipes in this notoriously difficult arcade game.", features: ["Simple controls", "Challenging gameplay", "Retro graphics", "High score system"], difficulty: "Hard", estimatedTime: "2-10 min", gradient: ['#FF5722', '#FF7043'], category: 'action', tags: ['bird', 'pipes', 'challenging'] },
  { id: 'snake', name: "Snake", image: "https://placehold.co/300x200/2196F3/ffffff?text=Snake", url: "https://www.mathsisfun.com/games/snake.html", genre: "Arcade", developer: "Classic Games Inc.", rating: 4.0, popularity: 180, description: "Control a growing snake to eat food while avoiding walls and your own tail.", features: ["Classic gameplay", "Progressive difficulty", "Score tracking", "Smooth controls"], difficulty: "Medium", estimatedTime: "5-15 min", gradient: ['#2196F3', '#42A5F5'], category: 'casual', tags: ['classic', 'snake', 'retro'], route: '/games/snake' },
  { id: 'tetris', name: "Tetris", image: "https://placehold.co/300x200/9C27B0/ffffff?text=Tetris", url: "https://tetris.com/play-tetris/", genre: "Puzzle", developer: "Alexey Pajitnov", rating: 4.7, popularity: 250, description: "Arrange falling blocks to create complete lines in this legendary puzzle game.", features: ["Classic Tetris gameplay", "Multiple levels", "Line clearing", "Increasing speed"], difficulty: "Medium", estimatedTime: "10-45 min", gradient: ['#9C27B0', '#BA68C8'], category: 'puzzle', tags: ['blocks', 'classic', 'legendary'] },
  { id: 'pacman', name: "Pac-Man", image: "https://placehold.co/300x200/FFEB3B/000000?text=Pac-Man", url: "https://freepacman.org/", genre: "Arcade", developer: "Namco", rating: 4.3, popularity: 190, description: "Navigate mazes, eat dots, and avoid ghosts in this iconic arcade classic.", features: ["Classic maze gameplay", "Ghost AI", "Power pellets", "Multiple levels"], difficulty: "Medium", estimatedTime: "5-20 min", gradient: ['#FFEB3B', '#FFF176'], category: 'action', tags: ['maze', 'ghosts', 'classic'] },
  { id: 'minesweeper', name: "Minesweeper", image: "https://placehold.co/300x200/F44336/ffffff?text=Minesweeper", url: "https://minesweeper.online/", genre: "Puzzle", developer: "Microsoft", rating: 4.1, popularity: 110, description: "Clear a minefield using logic and deduction in this classic puzzle game.", features: ["Logic-based gameplay", "Multiple difficulty levels", "Timer", "Flag system"], difficulty: "Hard", estimatedTime: "5-30 min", gradient: ['#F44336', '#EF5350'], category: 'strategy', tags: ['logic', 'mines', 'deduction'] },
  { id: 'crossy-road', name: "Crossy Road", image: "https://placehold.co/300x200/607D8B/ffffff?text=Crossy+Road", url: "https://pixelpad.io/app/wsjezhiqjue/?emb=1", genre: "Arcade", developer: "Hipster Whale", rating: 4.4, popularity: 160, description: "Cross busy roads, rivers, and train tracks in this endless arcade hopper.", features: ["Endless gameplay", "Collectible characters", "Voxel graphics", "Simple controls"], difficulty: "Medium", estimatedTime: "5-25 min", gradient: ['#607D8B', '#78909C'], category: 'action', tags: ['endless', 'hopper', 'voxel'] },
  { id: 'basketball-stars', name: "Basketball Stars", image: "https://placehold.co/300x200/795548/ffffff?text=Basketball+Stars", url: "https://basketball-stars.github.io/", genre: "Sports", developer: "Madpuffers", rating: 3.9, popularity: 90, description: "Shoot hoops and compete in this exciting basketball game.", features: ["Realistic physics", "Multiple game modes", "Skill shots", "Tournament play"], difficulty: "Medium", estimatedTime: "10-30 min", gradient: ['#795548', '#8D6E63'], category: 'multiplayer', tags: ['basketball', 'sports', 'tournament'] },
  { id: 'subway-surfers', name: "Subway Surfers", image: "https://placehold.co/300x200/E91E63/ffffff?text=Subway+Surfers", url: "https://staticquasar931.github.io/Subway-Surfers/", genre: "Runner", developer: "Kiloo & SYBO Games", rating: 4.6, popularity: 220, description: "Run through subway tracks, dodge trains, and collect coins in this endless runner.", features: ["Endless running", "Power-ups", "Character customization", "Daily challenges"], difficulty: "Easy", estimatedTime: "5-30 min", gradient: ['#E91E63', '#EC407A'], category: 'trending', tags: ['runner', 'endless', 'subway'] },
  { id: 'run3', name: "Run 3", image: "https://placehold.co/300x200/03A9F4/ffffff?text=Run+3", url: "https://schoolisntfun.github.io/mnt/run3.html", genre: "Platformer", developer: "Kongregate", rating: 4.0, popularity: 130, description: "Run and jump through space tunnels in this gravity-defying platformer.", features: ["Gravity mechanics", "Multiple characters", "Tunnel exploration", "Physics-based gameplay"], difficulty: "Medium", estimatedTime: "10-40 min", gradient: ['#03A9F4', '#29B6F6'], category: 'adventure', tags: ['space', 'gravity', 'platformer'] },
  { id: 'among-us', name: "Among Us", image: "https://placehold.co/300x200/8BC34A/ffffff?text=Among+Us", url: "https://universal-games-unblocked.vercel.app/projects/among-us/index.html", genre: "Party", developer: "Innersloth", rating: 4.8, popularity: 300, description: "Find the impostor among your crewmates in this social deduction game.", features: ["Multiplayer gameplay", "Social deduction", "Task completion", "Emergency meetings"], difficulty: "Easy", estimatedTime: "10-20 min", gradient: ['#8BC34A', '#9CCC65'], category: 'multiplayer', tags: ['impostor', 'social', 'deduction'] },
  { id: 'vex5', name: "Vex 5", image: "https://placehold.co/300x200/FFC107/000000?text=Vex+5", url: "https://vexgame-unblocked.github.io/", genre: "Platformer", developer: "Agame", rating: 4.1, popularity: 100, description: "Navigate through challenging obstacle courses in this precision platformer.", features: ["Precision platforming", "Challenging levels", "Smooth animations", "Checkpoint system"], difficulty: "Hard", estimatedTime: "15-45 min", gradient: ['#FFC107', '#FFD54F'], category: 'adventure', tags: ['precision', 'obstacles', 'challenging'] },
  { id: 'paperio2', name: "Paper.io 2", image: "https://placehold.co/300x200/9E9E9E/ffffff?text=Paper.io+2", url: "https://paper-io.com/paper-io-2", genre: "Strategy", developer: "Voodoo", rating: 4.2, popularity: 140, description: "Capture territory by drawing lines and avoid other players in this strategic game.", features: ["Territory capture", "Multiplayer battles", "Strategic gameplay", "Real-time competition"], difficulty: "Medium", estimatedTime: "5-20 min", gradient: ['#9E9E9E', '#BDBDBD'], category: 'strategy', tags: ['territory', 'multiplayer', 'strategic'] },
  { id: 'motox3m', name: "Moto X3M", image: "https://placehold.co/300x200/FF7F50/ffffff?text=Moto+X3M", url: "https://moto-x3m.io/", genre: "Racing", developer: "Madpuffers", rating: 4.5, popularity: 170, description: "Race through obstacle courses on a motorcycle in this thrilling racing game.", features: ["Motorcycle racing", "Stunt gameplay", "Multiple levels", "Physics-based"], difficulty: "Medium", estimatedTime: "10-35 min", gradient: ['#FF7F50', '#FF8A65'], category: 'racing', tags: ['motorcycle', 'stunts', 'racing'] },
  { id: 'wordle', name: "Wordle", image: "https://placehold.co/300x200/6A5ACD/ffffff?text=Wordle", url: "https://artworksforchange.org/games/wordle/", genre: "Puzzle", developer: "Josh Wardle", rating: 4.3, popularity: 95, description: "Guess the five-letter word in six tries in this daily word puzzle.", features: ["Daily puzzles", "Word guessing", "Letter feedback", "Share results"], difficulty: "Medium", estimatedTime: "5-15 min", gradient: ['#6A5ACD', '#7B68EE'], category: 'puzzle', tags: ['words', 'daily', 'guessing'] },
  { id: 'solitaire', name: "Solitaire", image: "https://placehold.co/300x200/008B8B/ffffff?text=Solitaire", url: "https://www.solitr.com/", genre: "Card", developer: "Microsoft", rating: 3.7, popularity: 70, description: "Play the classic card game of Solitaire with traditional Klondike rules.", features: ["Classic Klondike", "Drag and drop", "Auto-complete", "Statistics tracking"], difficulty: "Easy", estimatedTime: "10-30 min", gradient: ['#008B8B', '#20B2AA'], category: 'casual', tags: ['cards', 'solitaire', 'classic'] },
  { id: 'chess', name: "Chess", image: "https://placehold.co/300x200/404040/ffffff?text=Chess", url: "https://www.mathsisfun.com/games/chess.html", genre: "Board", developer: "Maths Is Fun", rating: 4.0, popularity: 115, description: "Play the classic strategy game of Chess against the computer or friends.", features: ["Classic chess rules", "AI opponent", "Move validation", "Game analysis"], difficulty: "Hard", estimatedTime: "15-60 min", gradient: ['#404040', '#616161'], category: 'strategy', tags: ['chess', 'strategy', 'classic'] },
  { id: 'memory-match', name: "Memory Match", image: "https://placehold.co/300x200/E91E63/ffffff?text=Memory+Match", url: "#", genre: "Puzzle", developer: "Infinity Hub", rating: 4.2, popularity: 85, description: "Test your memory by matching pairs of cards in this classic memory game.", features: ["Memory training", "Multiple difficulty levels", "Score tracking", "Timer challenge"], difficulty: "Easy", estimatedTime: "5-15 min", gradient: ['#E91E63', '#EC407A'], category: 'puzzle', tags: ['memory', 'cards', 'matching'], route: '/games/memory' },
  { id: 'tic-tac-toe', name: "Tic Tac Toe", image: "https://placehold.co/300x200/9C27B0/ffffff?text=Tic+Tac+Toe", url: "#", genre: "Strategy", developer: "Infinity Hub", rating: 3.8, popularity: 65, description: "Play the classic game of Tic Tac Toe against AI or friends.", features: ["AI opponent", "Two player mode", "Win detection", "Simple gameplay"], difficulty: "Easy", estimatedTime: "2-5 min", gradient: ['#9C27B0', '#BA68C8'], category: 'strategy', tags: ['classic', 'strategy', 'quick'], route: '/games/tictactoe' }
];

interface GameModalProps {
  game: GameCard | null;
  visible: boolean;
  onClose: () => void;
  onPlay: () => void;
  onPlayInIframe: () => void;
}

interface IframeModalProps {
  game: GameCard | null;
  visible: boolean;
  onClose: () => void;
}

function IframeModal({ game, visible, onClose }: IframeModalProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const handleOpenInBrowser = () => {
    if (game?.url) {
      Linking.openURL(game.url);
      onClose();
    }
  };

  if (!game || !game.url) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View 
          style={[
            styles.iframeModalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.glassModal}>
            <LinearGradient
              colors={game.gradient ? game.gradient as [string, string, ...string[]] : ['#667eea', '#764ba2']}
              style={styles.iframeModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <Monitor size={40} color="#fff" />
              <Text style={styles.iframeModalTitle}>Play {game.name} in Browser</Text>
              <Text style={styles.iframeModalSubtitle}>External game experience</Text>
            </LinearGradient>
            
            <View style={styles.iframeModalContent}>
              <Text style={styles.iframeDescription}>
                This will open the game in your default browser for the full web experience.
              </Text>
              
              <View style={styles.iframeInfoContainer}>
                <View style={styles.iframeInfoItem}>
                  <ExternalLink size={16} color="#8B92B9" />
                  <Text style={styles.iframeInfoText}>External website</Text>
                </View>
                <View style={styles.iframeInfoItem}>
                  <Monitor size={16} color="#8B92B9" />
                  <Text style={styles.iframeInfoText}>Full screen experience</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.openBrowserButton} onPress={handleOpenInBrowser}>
                <LinearGradient
                  colors={game.gradient ? game.gradient as [string, string, ...string[]] : ['#667eea', '#764ba2']}
                  style={styles.openBrowserGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <ExternalLink size={20} color="#fff" />
                  <Text style={styles.openBrowserText}>Open in Browser</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function GameModal({ game, visible, onClose, onPlay, onPlayInIframe }: GameModalProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { highScores } = useGameStore();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  if (!game) return null;

  const highScore = highScores[game.id] || 0;
  const difficultyColor = game.difficulty ? {
    Easy: '#4ade80',
    Medium: '#fbbf24',
    Hard: '#f87171',
  }[game.difficulty] : '#8B92B9';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.glassModal}>
            <LinearGradient
              colors={game.gradient ? game.gradient as [string, string, ...string[]] : ['#667eea', '#764ba2']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.modalIconContainer}>
                {game.icon || <ImageIcon size={32} color="#fff" />}
              </View>
              <Text style={styles.modalTitle}>{game.name}</Text>
              <Text style={styles.modalSubtitle}>{game.genre}</Text>
            </LinearGradient>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>{game.description}</Text>
              
              <View style={styles.ratingDeveloperContainer}>
                <View style={styles.ratingContainer}>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        color={star <= Math.floor(game.rating) ? '#FFD700' : '#4A5568'}
                        fill={star <= Math.floor(game.rating) ? '#FFD700' : 'transparent'}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>{game.rating}</Text>
                </View>
                <View style={styles.developerContainer}>
                  <User size={16} color="#8B92B9" />
                  <View>
                    <Text style={styles.developerText}>{game.developer}</Text>
                    {game.version && <Text style={styles.versionText}>v{game.version}</Text>}
                  </View>
                </View>
              </View>
              
              <View style={styles.gameInfoRow}>
                {game.difficulty && (
                  <View style={styles.infoItem}>
                    <Target size={16} color="#8B92B9" />
                    <Text style={styles.infoLabel}>Difficulty</Text>
                    <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
                      <Text style={styles.difficultyText}>{game.difficulty}</Text>
                    </View>
                  </View>
                )}
                {game.estimatedTime && (
                  <View style={styles.infoItem}>
                    <Clock size={16} color="#8B92B9" />
                    <Text style={styles.infoLabel}>Duration</Text>
                    <Text style={styles.infoValue}>{game.estimatedTime}</Text>
                  </View>
                )}
              </View>

              {highScore > 0 && (
                <View style={styles.highScoreContainer}>
                  <Trophy size={20} color="#FFD700" />
                  <Text style={styles.highScoreText}>Best Score: {highScore}</Text>
                </View>
              )}

              {game.features && (
                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Features</Text>
                  {game.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Sparkles size={14} color="#4ade80" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.buttonContainer}>
                {game.route && (
                  <TouchableOpacity style={styles.playButton} onPress={onPlay}>
                    <LinearGradient
                      colors={game.gradient ? game.gradient as [string, string, ...string[]] : ['#667eea', '#764ba2']}
                      style={styles.playButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Play size={20} color="#fff" fill="#fff" />
                      <Text style={styles.playButtonText}>Play Native</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.iframeButton} onPress={onPlayInIframe}>
                  <View style={styles.iframeButtonContent}>
                    <Monitor size={20} color="#8B92B9" />
                    <Text style={styles.iframeButtonText}>Play in Browser</Text>
                    <ExternalLink size={16} color="#8B92B9" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function GameCardComponent({ game, index, onPress }: { game: GameCard; index: number; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { highScores } = useGameStore();
  const highScore = highScores[game.id] || 0;

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.touchable}
      >
        <View style={styles.glassCard}>
          <LinearGradient
            colors={game.gradient ? [game.gradient[0], game.gradient[1], 'rgba(255,255,255,0.1)'] : ['#667eea', '#764ba2', 'rgba(255,255,255,0.1)']}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                {game.icon || <ImageIcon size={24} color="#fff" />}
              </View>
              <Text style={styles.cardTitle}>{game.name}</Text>
              <Text style={styles.cardSubtitle}>{game.genre}</Text>
              {highScore > 0 && (
                <View style={styles.scoreContainer}>
                  <Trophy size={14} color="#FFD700" />
                  <Text style={styles.scoreText}>{highScore}</Text>
                </View>
              )}
            </View>
            <View style={styles.cardPlayButton}>
              <Play size={20} color="#fff" fill="#fff" />
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  categories: GameCategory[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

function Sidebar({ visible, onClose, categories, selectedCategory, onCategorySelect }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const handleCategoryPress = (categoryId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCategorySelect(categoryId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.sidebarOverlay, { opacity: opacityAnim }]}>
        <Pressable style={styles.sidebarBackdrop} onPress={onClose} />
        <Animated.View 
          style={[
            styles.sidebarContainer,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={styles.glassSidebar}>
            <LinearGradient
              colors={['#0A0E27', '#1a1f3a', '#2a2f4a']}
              style={styles.sidebarHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity style={styles.sidebarCloseButton} onPress={onClose}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <Filter size={32} color="#fff" />
              <Text style={styles.sidebarTitle}>Categories</Text>
              <Text style={styles.sidebarSubtitle}>Filter games by type</Text>
            </LinearGradient>
            
            <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
              {categories.map((category, index) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemSelected
                    ]}
                    onPress={() => handleCategoryPress(category.id)}
                  >
                    <LinearGradient
                      colors={isSelected ? category.gradient as [string, string, ...string[]] : ['transparent', 'transparent']}
                      style={styles.categoryItemGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={[
                        styles.categoryIcon,
                        { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : category.color }
                      ]}>
                        {category.icon}
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={[
                          styles.categoryName,
                          { color: isSelected ? '#fff' : '#E2E8F0' }
                        ]}>
                          {category.name}
                        </Text>
                        <Text style={[
                          styles.categoryCount,
                          { color: isSelected ? 'rgba(255,255,255,0.8)' : '#8B92B9' }
                        ]}>
                          {category.count} games
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <View style={styles.selectedDot} />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { totalGamesPlayed, getTotalHighScore } = useGameStore();
  const totalScore = getTotalHighScore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedGame, setSelectedGame] = useState<GameCard | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [iframeModalVisible, setIframeModalVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoriesWithCounts = gameCategories.map(category => {
    const count = category.id === 'all' 
      ? games.length 
      : games.filter(game => game.category === category.id).length;
    return { ...category, count };
  });

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleGamePress = (game: GameCard) => {
    setSelectedGame(game);
    setModalVisible(true);
  };

  const handlePlayGame = () => {
    if (selectedGame?.route) {
      setModalVisible(false);
      setTimeout(() => {
        router.push(selectedGame.route as any);
      }, 200);
    }
  };

  const handlePlayInIframe = () => {
    if (selectedGame?.url) {
      setModalVisible(false);
      setIframeModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleMenuPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSidebarVisible(true);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0E27', '#1a1f3a']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
              <Menu size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Gamepad2 size={32} color="#fff" />
              <Text style={styles.title}>Infinity Hub</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.subtitle}>Choose your adventure</Text>
        </Animated.View>

        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
          <View style={styles.glassSearchBar}>
            <Search size={20} color="#8B92B9" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search games..."
              placeholderTextColor="#8B92B9"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <X size={18} color="#8B92B9" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {selectedCategory !== 'all' && (
          <Animated.View style={[styles.categoryBanner, { opacity: fadeAnim }]}>
            <View style={styles.glassCategoryBanner}>
              <LinearGradient
                colors={(categoriesWithCounts.find(c => c.id === selectedCategory)?.gradient || ['#667eea', '#764ba2']) as [string, string, ...string[]]}
                style={styles.categoryBannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {categoriesWithCounts.find(c => c.id === selectedCategory)?.icon}
                <Text style={styles.categoryBannerText}>
                  {categoriesWithCounts.find(c => c.id === selectedCategory)?.name}
                </Text>
                <TouchableOpacity 
                  onPress={() => setSelectedCategory('all')}
                  style={styles.categoryBannerClose}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
          <View style={styles.glassStatCard}>
            <Star size={20} color="#FFD700" />
            <View>
              <Text style={styles.statValue}>{totalScore}</Text>
              <Text style={styles.statLabel}>Total Score</Text>
            </View>
          </View>
          <View style={styles.glassStatCard}>
            <Trophy size={20} color="#FF6B6B" />
            <View>
              <Text style={styles.statValue}>{totalGamesPlayed}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gamesGrid}>
            {filteredGames.length > 0 ? (
              filteredGames.map((game, index) => (
                <GameCardComponent 
                  key={game.id} 
                  game={game} 
                  index={index} 
                  onPress={() => handleGamePress(game)}
                />
              ))
            ) : (
              <View style={styles.noGamesContainer}>
                <View style={styles.noGamesIcon}>
                  <Search size={48} color="#8B92B9" />
                </View>
                <Text style={styles.noGamesTitle}>No games found</Text>
                <Text style={styles.noGamesSubtitle}>
                  {searchQuery ? `No games match "${searchQuery}"` : 'No games in this category'}
                </Text>
                {(searchQuery || selectedCategory !== 'all') && (
                  <TouchableOpacity 
                    style={styles.resetButton}
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                  >
                    <Text style={styles.resetButtonText}>Show All Games</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
        
        <GameModal
          game={selectedGame}
          visible={modalVisible}
          onClose={handleCloseModal}
          onPlay={handlePlayGame}
          onPlayInIframe={handlePlayInIframe}
        />
        
        <IframeModal
          game={selectedGame}
          visible={iframeModalVisible}
          onClose={() => setIframeModalVisible(false)}
        />
        
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          categories={categoriesWithCounts}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B92B9',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  glassStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B92B9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  touchable: {
    flex: 1,
  },
  glassCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 12,
  },
  card: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  scoreText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  cardPlayButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    maxHeight: '85%',
  },
  glassModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalContent: {
    padding: 24,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
  },
  modalDescription: {
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 24,
    marginBottom: 24,
  },
  gameInfoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8B92B9',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 24,
  },
  highScoreText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  playButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  ratingDeveloperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ratingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  developerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  developerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  versionText: {
    fontSize: 12,
    color: '#8B92B9',
  },
  buttonContainer: {
    gap: 12,
  },
  iframeButton: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  iframeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  iframeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B92B9',
  },
  iframeModalContainer: {
    maxHeight: '70%',
  },
  iframeModalHeader: {
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
    position: 'relative',
  },
  iframeModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  iframeModalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  iframeModalContent: {
    padding: 24,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
  },
  iframeDescription: {
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  iframeInfoContainer: {
    gap: 16,
    marginBottom: 32,
  },
  iframeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  iframeInfoText: {
    fontSize: 14,
    color: '#8B92B9',
  },
  openBrowserButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  openBrowserGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  openBrowserText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Header styles
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerSpacer: {
    width: 44,
  },
  // Search styles
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  glassSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  // Category banner styles
  categoryBanner: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  glassCategoryBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryBannerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  categoryBannerClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // No games styles
  noGamesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    width: '100%',
  },
  noGamesIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noGamesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  noGamesSubtitle: {
    fontSize: 16,
    color: '#8B92B9',
    textAlign: 'center',
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Sidebar styles
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    flex: 1,
  },
  sidebarContainer: {
    width: 300,
    height: '100%',
  },
  glassSidebar: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    position: 'relative',
  },
  sidebarCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoryItem: {
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryItemSelected: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
