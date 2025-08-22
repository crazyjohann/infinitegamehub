import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
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
} from 'lucide-react';

// Web-compatible dimensions
const { width } = Dimensions.get('window') || { width: window?.innerWidth || 1200 };
const CARD_WIDTH = (width - 48) / 2;

// Mock game store for web
const useGameStore = () => {
  const [highScores, setHighScores] = useState(() => {
    try {
      const saved = localStorage.getItem('gameHighScores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(() => {
    try {
      const saved = localStorage.getItem('totalGamesPlayed');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const getTotalHighScore = () => {
    return Object.values(highScores).reduce((sum, score) => sum + score, 0);
  };

  return { highScores, totalGamesPlayed, getTotalHighScore };
};

// Mock router for web
const router = {
  push: (route) => {
    console.log('Navigate to:', route);
    // You can implement actual routing here if needed
    alert(`Would navigate to: ${route}`);
  }
};

// Mock haptics for web
const Haptics = {
  impactAsync: (style) => {
    // Web doesn't have haptics, so we just log it
    console.log('Haptic feedback:', style);
  },
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  }
};

// SafeAreaView replacement for web
const SafeAreaView = ({ children, style }) => (
  <View style={[{ paddingTop: 0 }, style]}>
    {children}
  </View>
);

const gameCategories = [
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

const games = [
  { id: 'slope2', name: "Slope 2", image: "https://placehold.co/300x200/5C007C/ffffff?text=Slope+2", url: "https://2slope.github.io/", genre: "Arcade", developer: "RoboGames", rating: 4.2, popularity: 150, description: "Navigate a ball down a steep slope while avoiding obstacles in this fast-paced arcade game.", features: ["High-speed gameplay", "Challenging obstacles", "Smooth controls", "Endless levels"], difficulty: "Hard", estimatedTime: "5-20 min", gradient: ['#5C007C', '#8B1A9C'], category: 'action', tags: ['fast-paced', 'endless', 'challenging'] },
  { id: 'italian-brainrot', name: "Italian Brainrot Clicker", image: "https://placehold.co/300x200/004080/ffffff?text=Italian+Brainrot+Clicker", url: "https://italianbrainrotclicker.pages.dev/", genre: "Clicker", developer: "Pasta Devs", rating: 3.8, popularity: 80, description: "A quirky clicker game with Italian flair and endless upgrades.", features: ["Incremental gameplay", "Italian theme", "Multiple upgrades", "Achievements"], difficulty: "Easy", estimatedTime: "10-60 min", gradient: ['#004080', '#0066CC'], category: 'casual', tags: ['clicker', 'incremental', 'italian'] },
  { id: '2048', name: "2048", image: "https://placehold.co/300x200/4CAF50/ffffff?text=2048", url: "https://specials.manoramaonline.com/Mobile/2022/2048-game/index.html", genre: "Puzzle", developer: "Gabriele Cirulli", rating: 4.5, popularity: 200, description: "Slide numbered tiles to combine them and reach the 2048 tile in this addictive puzzle game.", features: ["Strategic gameplay", "Smooth animations", "Score tracking", "Undo moves"], difficulty: "Medium", estimatedTime: "10-30 min", gradient: ['#4CAF50', '#66BB6A'], category: 'puzzle', tags: ['numbers', 'strategy', 'addictive'], route: '/games/twenty48' },
  { id: 'flappy-bird', name: "Flappy Bird", image: "https://placehold.co/300x200/FF5722/ffffff?text=Flappy+Bird", url: "https://flappybird.io/", genre: "Arcade", developer: "Dong Nguyen", rating: 3.5, popularity: 120, description: "Guide a bird through pipes in this notoriously difficult arcade game.", features: ["Simple controls", "Challenging gameplay", "Retro graphics", "High score system"], difficulty: "Hard", estimatedTime: "2-10 min", gradient: ['#FF5722', '#FF7043'], category: 'action', tags: ['bird', 'pipes', 'challenging'] },
  { id: 'snake', name: "Snake", image: "https://placehold.co/300x200/2196F3/ffffff?text=Snake", url: "https://www.mathsisfun.com/games/snake.html", genre: "Arcade", developer: "Classic Games Inc.", rating: 4.0, popularity: 180, description: "Control a growing snake to eat food while avoiding walls and your own tail.", features: ["Classic gameplay", "Progressive difficulty", "Score tracking", "Smooth controls"], difficulty: "Medium", estimatedTime: "5-15 min", gradient: ['#2196F3', '#42A5F5'], category: 'casual', tags: ['classic', 'snake', 'retro'], route: '/games/snake' },
  { id: 'tetris', name: "Tetris", image: "https://placehold.co/300x200/9C27B0/ffffff?text=Tetris", url: "https://tetris.com/play-tetris/", genre: "Puzzle", developer: "Alexey Pajitnov", rating: 4.7, popularity: 250, description: "Arrange falling blocks to create complete lines in this legendary puzzle game.", features: ["Classic Tetris gameplay", "Multiple levels", "Line clearing", "Increasing speed"], difficulty: "Medium", estimatedTime: "10-45 min", gradient: ['#9C27B0', '#BA68C8'], category: 'puzzle', tags: ['blocks', 'classic', 'legendary'] },
  { id: 'pacman', name: "Pac-Man", image: "https://placehold.co/300x200/FFEB3B/000000?text=Pac-Man", url: "https://freepacman.org/", genre: "Arcade", developer: "Namco", rating: 4.3, popularity: 190, description: "Navigate mazes, eat dots, and avoid ghosts in this iconic arcade classic.", features: ["Classic maze gameplay", "Ghost AI", "Power pellets", "Multiple levels"], difficulty: "Medium", estimatedTime: "5-20 min", gradient: ['#FFEB3B', '#FFF176'], category: 'action', tags: ['maze', 'ghosts', 'classic'] },
  { id: 'among-us', name: "Among Us", image: "https://placehold.co/300x200/8BC34A/ffffff?text=Among+Us", url: "https://universal-games-unblocked.vercel.app/projects/among-us/index.html", genre: "Party", developer: "Innersloth", rating: 4.8, popularity: 300, description: "Find the impostor among your crewmates in this social deduction game.", features: ["Multiplayer gameplay", "Social deduction", "Task completion", "Emergency meetings"], difficulty: "Easy", estimatedTime: "10-20 min", gradient: ['#8BC34A', '#9CCC65'], category: 'multiplayer', tags: ['impostor', 'social', 'deduction'] }
];

function IframeModal({ game, visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false, // Changed for web compatibility
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const handleOpenInBrowser = () => {
    if (game?.url) {
      window.open(game.url, '_blank');
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
              colors={game.gradient || ['#667eea', '#764ba2']}
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
                  colors={game.gradient || ['#667eea', '#764ba2']}
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

function GameModal({ game, visible, onClose, onPlay, onPlayInIframe }) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { highScores } = useGameStore();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
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
              colors={game.gradient || ['#667eea', '#764ba2']}
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
                      colors={game.gradient || ['#667eea', '#764ba2']}
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

function GameCardComponent({ game, index, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { highScores } = useGameStore();
  const highScore = highScores[game.id] || 0;

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: false,
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

function Sidebar({ visible, onClose, categories, selectedCategory, onCategorySelect }) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const handleCategoryPress = (categoryId) => {
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
                      colors={isSelected ? category.gradient : ['transparent', 'transparent']}
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
