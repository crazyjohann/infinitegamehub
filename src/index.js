import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, orderBy, limit, addDoc, getDocs, doc, setDoc } from 'firebase/firestore'; // Added doc and setDoc

// --- Firebase Initialization ---
// Retrieve Firebase configuration from environment variables
// Note: Create React App (react-scripts) requires environment variables to be prefixed with REACT_APP_
// Only the essential configuration properties are listed here.
// Other properties (storageBucket, messagingSenderId, measurementId) are optional
// and only needed if you specifically use those Firebase services.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // appId is crucial for Firestore paths in this setup
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  // Optional Firebase config properties (uncomment and add if needed):
  // storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  // messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  // measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App
// Add a check to ensure projectId exists before initializing
if (!firebaseConfig.projectId) {
    console.error("Firebase 'projectId' is not provided in environment variables. Firebase will not initialize.");
    // You might want to display a user-friendly error message on the UI here.
}
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Context for Firebase and Auth State ---
const AppContext = createContext(null);

// Auth Provider Component to manage Firebase Authentication state
const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true); // To track initial auth state

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                // __initial_auth_token is for Canvas environment, not for Render deployment
                // This block will now only run in the Canvas environment
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    try {
                        await signInWithCustomToken(auth, __initial_auth_token);
                        setCurrentUser(auth.currentUser);
                    } catch (error) {
                        console.error("Error signing in with custom token (Canvas only):", error);
                        try {
                            await signInAnonymously(auth);
                            setCurrentUser(auth.currentUser);
                        } catch (anonError) {
                            console.error("Error with anonymous sign-in (Canvas fallback):", anonError);
                        }
                    }
                } else {
                    // For Render deployment, always attempt anonymous sign-in here
                    try {
                        await signInAnonymously(auth); // Sign in anonymously
                        setCurrentUser(auth.currentUser); // Set user after successful anonymous sign-in
                    } catch (anonError) {
                        console.error("Error with anonymous sign-in (Render):", anonError);
                        // Optionally, display a message to the user that authentication failed
                    }
                }
            }
            setLoadingAuth(false); // Auth state is ready, whether successful or failed
        });

        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []); // Run only once on component mount

    return (
        <AppContext.Provider value={{ db, auth, currentUser, loadingAuth }}>
            {children}
        </AppContext.Provider>
    );
};

// --- Main App Component ---
const App = () => {
    const { db, auth, currentUser, loadingAuth } = useContext(AppContext);
    const [games, setGames] = useState([]);
    const [filteredGames, setFilteredGames] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [fullscreenGameUrl, setFullscreenGameUrl] = useState(null);
    const [secretMessage, setSecretMessage] = useState('');
    const [secretMessageVisible, setSecretMessageVisible] = useState(false);
    const [secretModeActive, setSecretModeActive] = useState(0); // Changed to 0 for initial state
    const [currentHue, setCurrentHue] = useState(0);
    const [luckyCharmClickCount, setLuckyCharmClickCount] = useState(0);
    const LUCKY_CHARM_THRESHOLD = 7;
    const [selectedGameDetails, setSelectedGameDetails] = useState(null); // For game details modal
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Initialize theme from local storage or default to dark
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    const [currentFilter, setCurrentFilter] = useState('All');
    const [currentSort, setCurrentSort] = useState('Name (A-Z)');
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || 'Player');
    const [isPlayerNameModalOpen, setIsPlayerNameModalOpen] = useState(false);
    const [playerBuzzMessages, setPlayerBuzzMessages] = useState([
        "Welcome, Explorer! Discover new games!",
        "New High Score in 2048! Can you beat it?",
        "Upcoming Event: Tetris Tournament! Stay tuned!",
        "Tip: Try the Konami Code for a secret mode!",
        "Explore the cosmos of games!",
        "Lucky Charm found! What will happen next?",
        "Patience is a virtue, secrets await...",
    ]);
    const [currentBuzzIndex, setCurrentBuzzIndex] = useState(0);
    const [leaderboardScores, setLeaderboardScores] = useState([]); // For 2048 leaderboard
    const [showScoreSubmission, setShowScoreSubmission] = useState(false); // For 2048 score submission
    const [tempScore, setTempScore] = useState(0); // To hold the score for submission
    const [generatingBuzz, setGeneratingBuzz] = useState(false); // New state for AI buzz loading

    // Konami Code sequence (Up, Up, Down, Down, Left, Right, Left, Right, B, A, Enter)
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
    const konamiCodePositionRef = useRef(0); // Use a ref for mutable state in event listener

    const audioRef = useRef(null); // Ref for the audio element

    // --- Utility Functions ---

    /**
     * Displays a secret message.
     * @param {string} message - The message to display.
     * @param {number} duration - How long to show the message in milliseconds.
     */
    const showMessage = (message, duration = 3000) => {
        setSecretMessage(message);
        setSecretMessageVisible(true);
        setTimeout(() => {
            setSecretMessageVisible(false);
        }, duration);
    };

    /**
     * Shuffles an array in place (Fisher-Yates algorithm).
     * @param {Array} array - The array to shuffle.
     */
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    // Function to generate new buzz messages using Gemini API
    const generateNewBuzzMessages = async () => {
        setGeneratingBuzz(true);
        try {
            const prompt = "Generate 5 short, engaging, and positive news-feed style 'buzz' messages for a gaming hub website. Each message should be a single sentence. Examples: 'New High Score in 2048! Can you beat it?', 'Explore the cosmos of games!'. Ensure variety in topics (new games, events, tips, general excitement).";
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };
            const apiKey = ""; // Canvas will automatically provide this
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                // Split the text into individual messages, assuming they are separated by newlines or similar
                const newMessages = text.split('\n').filter(msg => msg.trim() !== '');
                setPlayerBuzzMessages(newMessages);
                setCurrentBuzzIndex(0); // Reset to first new message
                showMessage("New buzz messages generated!", 3000);
            } else {
                showMessage("Failed to generate new buzz messages.", 3000);
            }
        } catch (error) {
            console.error("Error generating buzz messages:", error);
            showMessage("Error generating buzz messages. Try again.", 3000);
        } finally {
            setGeneratingBuzz(false);
        }
    };

    // --- Theme Management ---
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme'); // Ensure dark-theme is applied if needed
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        }
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    // --- Firebase Data Fetching ---

    // Fetch games from Firestore
    useEffect(() => {
        // Only attempt to fetch if db is initialized and auth state is loaded
        if (!db || loadingAuth || !firebaseConfig.projectId) return;

        // Use firebaseConfig.appId here instead of the global appId variable
        const gamesCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/public/data/games`);
        const unsubscribe = onSnapshot(gamesCollectionRef, async (snapshot) => {
            let fetchedGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const defaultGamesToPopulate = [
                { name: "Slope 2", image: "https://placehold.co/300x200/5C007C/ffffff?text=Slope+2", url: "https://2slope.github.io/", genre: "Arcade", developer: "RoboGames", rating: 4.2, popularity: 150 },
                { name: "Italian Brainrot Clicker", image: "https://placehold.co/300x200/004080/ffffff?text=Italian+Brainrot+Clicker", url: "https://italianbrainrotclicker.pages.dev/", genre: "Clicker", developer: "Pasta Devs", rating: 3.8, popularity: 80 },
                { name: "2048", image: "https://placehold.co/300x200/4CAF50/ffffff?text=2048", url: "https://specials.manoramaonline.com/Mobile/2022/2048-game/index.html", genre: "Puzzle", developer: "Gabriele Cirulli", rating: 4.5, popularity: 200 },
                { name: "Flappy Bird", image: "https://placehold.co/300x200/FF5722/ffffff?text=Flappy+Bird", url: "https://flappybird.io/", genre: "Arcade", developer: "Dong Nguyen", rating: 3.5, popularity: 120 },
                { name: "Snake", image: "https://placehold.co/300x200/2196F3/ffffff?text=Snake", url: "https://www.mathsisfun.com/games/snake.html", genre: "Arcade", developer: "Classic Games Inc.", rating: 4.0, popularity: 180 },
                { name: "Tetris", image: "https://placehold.co/300x200/9C27B0/ffffff?text=Tetris", url: "https://tetris.com/play-tetris/", genre: "Puzzle", developer: "Alexey Pajitnov", rating: 4.7, popularity: 250 },
                { name: "Pac-Man", image: "https://placehold.co/300x200/FFEB3B/000000?text=Pac-Man", url: "https://freepacman.org/", genre: "Arcade", developer: "Namco", rating: 4.3, popularity: 190 },
                { name: "Minesweeper", image: "https://placehold.co/300x200/F44336/ffffff?text=Minesweeper", url: "https://minesweeper.online/", genre: "Puzzle", developer: "Microsoft", rating: 4.1, popularity: 110 },
                { name: "Crossy Road", image: "https://placehold.co/300x200/607D8B/ffffff?text=Crossy+Road", url: "https://pixelpad.io/app/wsjezhiqjue/?emb=1", genre: "Arcade", developer: "Hipster Whale", rating: 4.4, popularity: 160 },
                { name: "Basketball Stars", image: "https://placehold.co/300x200/795548/ffffff?text=Basketball+Stars", url: "https://basketball-stars.github.io/", genre: "Sports", developer: "Madpuffers", rating: 3.9, popularity: 90 },
                { name: "Subway Surfers", image: "https://placehold.co/300x200/E91E63/ffffff?text=Subway+Surfers", url: "https://staticquasar931.github.io/Subway-Surfers/", genre: "Runner", developer: "Kiloo & SYBO Games", rating: 4.6, popularity: 220 },
                { name: "Run 3", image: "https://placehold.co/300x200/03A9F4/ffffff?text=Run+3", url: "https://schoolisntfun.github.io/mnt/run3.html", genre: "Platformer", developer: "Kongregate", rating: 4.0, popularity: 130 },
                { name: "Among Us", image: "https://placehold.co/300x200/8BC34A/ffffff?text=Among+Us", url: "https://universal-games-unblocked.vercel.app/projects/among-us/index.html", genre: "Party", developer: "Innersloth", rating: 4.8, popularity: 300 },
                { name: "Vex 5", image: "https://placehold.co/300x200/FFC107/000000?text=Vex+5", url: "https://vexgame-unblocked.github.io/", genre: "Platformer", developer: "Agame", rating: 4.1, popularity: 100 },
                { name: "Paper.io 2", image: "https://placehold.co/300x200/9E9E9E/ffffff?text=Paper.io+2", url: "https://paper-io.com/paper-io-2", genre: "Strategy", developer: "Voodoo", rating: 4.2, popularity: 140 },
                { name: "Moto X3M", image: "https://placehold.co/300x200/FF7F50/ffffff?text=Moto+X3M", url: "https://moto-x3m.io/", genre: "Racing", developer: "Madpuffers", rating: 4.5, popularity: 170 },
                { name: "Wordle", image: "https://placehold.co/300x200/6A5ACD/ffffff?text=Wordle", url: "https://artworksforchange.org/games/wordle/", genre: "Puzzle", developer: "Josh Wardle", rating: 4.3, popularity: 95 },
                { name: "Solitaire", image: "https://placehold.co/300x200/008B8B/ffffff?text=Solitaire", url: "https://www.solitr.com/", genre: "Card", developer: "Microsoft", rating: 3.7, popularity: 70 },
                { name: "Chess", image: "https://placehold.co/300x200/404040/ffffff?text=Chess", url: "https://www.mathsisfun.com/games/chess.html", genre: "Board", developer: "Maths Is Fun", rating: 4.0, popularity: 115 }
                { name: "Roblox", image: "https://placehold.co/300x200/5C007C/ffffff?text=Roblox", url: "https://www.roblox.com", genre: "Hub", developer: "Roblox Corporation", rating: 5.0, popularity: 999 }

            ];

            // If Firestore is empty, populate it with default data
            if (fetchedGames.length === 0) {
                showMessage("Populating initial game data...", 3000);
                for (const game of defaultGamesToPopulate) {
                    await addDoc(gamesCollectionRef, game);
                }
                // After adding, re-fetch or manually set to ensure state is consistent
                setGames(defaultGamesToPopulate.map(game => ({ id: 'temp-id-' + Math.random(), ...game }))); // Assign temp IDs for immediate rendering
                setFilteredGames(defaultGamesToPopulate.map(game => ({ id: 'temp-id-' + Math.random(), ...game })));
            } else {
                // Check for specific game updates (Pac-Man and Solitaire)
                const pacmanDoc = fetchedGames.find(g => g.name === "Pac-Man");
                const solitaireDoc = fetchedGames.find(g => g.name === "Solitaire");

                const defaultPacman = defaultGamesToPopulate.find(g => g.name === "Pac-Man");
                const defaultSolitaire = defaultGamesToPopulate.find(g => g.name === "Solitaire");

                let needsUpdate = false;
                if (pacmanDoc && defaultPacman && pacmanDoc.url !== defaultPacman.url) {
                    console.log(`Updating Pac-Man URL from ${pacmanDoc.url} to ${defaultPacman.url}`);
                    await setDoc(doc(db, `artifacts/${firebaseConfig.appId}/public/data/games`, pacmanDoc.id), defaultPacman, { merge: true });
                    needsUpdate = true;
                }
                if (solitaireDoc && defaultSolitaire && solitaireDoc.url !== defaultSolitaire.url) {
                    console.log(`Updating Solitaire URL from ${solitaireDoc.url} to ${defaultSolitaire.url}`);
                    await setDoc(doc(db, `artifacts/${firebaseConfig.appId}/public/data/games`, solitaireDoc.id), defaultSolitaire, { merge: true });
                    needsUpdate = true;
                }

                // If any updates were made, re-fetch the data to ensure the local state is fresh
                if (needsUpdate) {
                    const updatedSnapshot = await getDocs(gamesCollectionRef);
                    fetchedGames = updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    showMessage("Game URLs updated in Firestore!", 2000);
                }

                setGames(fetchedGames);
                setFilteredGames(fetchedGames);
            }
        }, (error) => {
            console.error("Error fetching games:", error);
            showMessage("Failed to load games. Please try again later.", 5000);
        });

        return () => unsubscribe(); // Cleanup subscription
    }, [db, loadingAuth, firebaseConfig.projectId, firebaseConfig.appId]); // Re-run if db or auth loading state changes

    // Fetch leaderboard scores for 2048
    useEffect(() => {
        // Only attempt to fetch if db is initialized and auth state is loaded
        if (!db || loadingAuth || !firebaseConfig.projectId) return;

        // Use firebaseConfig.appId here instead of the global appId variable
        const leaderboardCollectionRef = collection(db, `artifacts/${firebaseConfig.appId}/public/data/leaderboard_2048`);
        // Order by score in descending order and limit to top 10
        const q = query(leaderboardCollectionRef, orderBy("score", "desc"), limit(10));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeaderboardScores(scores);
        }, (error) => {
            console.error("Error fetching leaderboard:", error);
            // Don't show message for leaderboard, as it's not critical for main app function
        });

        return () => unsubscribe();
    }, [db, loadingAuth, firebaseConfig.projectId, firebaseConfig.appId]);

    // --- Game Filtering and Sorting ---
    useEffect(() => {
        let currentGames = [...games]; // Start with a fresh copy of all games

        // Apply search filter
        if (searchTerm) {
            currentGames = currentGames.filter(game =>
                game.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply genre filter
        if (currentFilter !== 'All') {
            currentGames = currentGames.filter(game => game.genre === currentFilter);
        }

        // Apply sorting
        if (currentSort === 'Name (A-Z)') {
            currentGames.sort((a, b) => a.name.localeCompare(b.name));
        } else if (currentSort === 'Popularity (High to Low)') {
            currentGames.sort((a, b) => b.popularity - a.popularity);
        }

        setFilteredGames(currentGames);
    }, [searchTerm, games, currentFilter, currentSort]);

    // --- Secrets Implementation ---

    // Konami Code Effect
    useEffect(() => {
        let hueRotationInterval;
        const handleKeyDown = (event) => {
            const key = event.key.toLowerCase();
            if (key === konamiCode[konamiCodePositionRef.current]) {
                konamiCodePositionRef.current++;
                if (konamiCodePositionRef.current === konamiCode.length) {
                    setSecretModeActive(prev => !prev); // Toggle the mode
                    konamiCodePositionRef.current = 0; // Reset for next time
                }
            } else {
                konamiCodePositionRef.current = 0; // Reset if incorrect key is pressed
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        if (secretModeActive) {
            showMessage("Infinity Googleplex Mode Activated! Enjoy the spectrum and the cosmic dance!", 4000);
            hueRotationInterval = setInterval(() => {
                setCurrentHue(prevHue => (prevHue + 2) % 360);
            }, 50);
            document.body.classList.add('secret-mode-active');
        } else {
            showMessage("Infinity Googleplex Mode Deactivated. Back to regular reality.", 4000);
            clearInterval(hueRotationInterval);
            document.body.style.removeProperty('--hue-rotation');
            document.body.classList.remove('secret-mode-active');
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            clearInterval(hueRotationInterval);
        };
    }, [secretModeActive]); // Re-run effect when secretModeActive changes

    // Lucky Charm Clicker Secret
    const handleLuckyCharmClick = () => {
        setLuckyCharmClickCount(prevCount => prevCount + 1);
        if (luckyCharmClickCount + 1 === LUCKY_CHARM_THRESHOLD) {
            const shuffledGames = [...games];
            shuffleArray(shuffledGames);
            setGames(shuffledGames); // Update the main games state to trigger re-render
            showMessage("Games shuffled! A new order emerges from the cosmic chaos!", 5000);
            setLuckyCharmClickCount(0); // Reset after activation
        }
    };

    // Patient Observer Secret (time-based)
    useEffect(() => {
        let patientObserverTimeout;
        const startPatientObserver = () => {
            clearTimeout(patientObserverTimeout); // Clear any existing timeout
            patientObserverTimeout = setTimeout(() => {
                showMessage("Patience is a virtue! A hidden message just for you.", 5000);
            }, 30000); // Trigger after 30 seconds of inactivity
        };

        startPatientObserver(); // Start on component mount or when game closes

        return () => clearTimeout(patientObserverTimeout); // Cleanup on unmount
    }, [fullscreenGameUrl]); // Restart when game URL changes (closes)

    // Cursor Trail Effect
    useEffect(() => {
        const cursorCanvas = document.getElementById('cursorCanvas');
        if (!cursorCanvas) return; // Ensure canvas exists
        const ctx = cursorCanvas.getContext('2d');
        const trail = [];

        const resizeCanvas = () => {
            cursorCanvas.width = window.innerWidth;
            cursorCanvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const animateTrail = () => {
            ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
            for (let i = 0; i < trail.length; i++) {
                const particle = trail[i];
                particle.life -= 0.02;
                particle.size *= 0.95;
                particle.opacity -= 0.02;

                if (particle.life <= 0) {
                    trail.splice(i, 1);
                    i--;
                    continue;
                }

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(128, 0, 128, ${particle.opacity})`;
                ctx.fill();
            }
            requestAnimationFrame(animateTrail);
        };

        const handleMouseMove = (e) => {
            trail.push({
                x: e.clientX,
                y: e.clientY,
                size: Math.random() * 5 + 2,
                life: 1,
                opacity: 1
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
        animateTrail();

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', resizeCanvas);
            // No need to cancelAnimationFrame explicitly here, as it will stop when the component unmounts
        };
    }, []); // Run once on mount

    // Background Music
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.3; // Set default volume
            audioRef.current.loop = true;
            audioRef.current.play().catch(e => console.log("Autoplay prevented:", e)); // Attempt to play
        }
    }, []);

    const toggleMusic = () => {
        if (audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    };

    // --- UI Interactions ---

    const openGameDetails = (game) => {
        setSelectedGameDetails(game);
    };

    const closeGameDetails = () => {
        setSelectedGameDetails(null);
    };

    const launchGame = (url) => {
        setFullscreenGameUrl(url);
        document.body.style.overflow = 'hidden'; // Prevent scrolling when iframe is active
        closeGameDetails(); // Close details modal if open
    };

    const closeFullscreenGame = () => {
        setFullscreenGameUrl(null);
        document.body.style.overflow = ''; // Restore scrolling
    };

    const handlePlayerNameChange = (e) => {
        const newName = e.target.value;
        setPlayerName(newName);
        localStorage.setItem('playerName', newName); // Save to local storage
    };

    const openPlayerNameModal = () => {
        setIsPlayerNameModalOpen(true);
    };

    const closePlayerNameModal = () => {
        setIsPlayerNameModalOpen(false);
    };

    // --- 2048 Score Submission ---
    const handleScoreSubmission = async (scoreValue) => {
        if (!currentUser || !db) {
            showMessage("Please sign in to submit scores.", 3000);
            return;
        }
        // Ensure Firebase is initialized before trying to access Firestore
        if (!firebaseConfig.projectId) {
            showMessage("Firebase is not configured. Cannot submit score.", 3000);
            return;
        }

        // Use firebaseConfig.appId here instead of the global appId variable
        const scoreRef = collection(db, `artifacts/${firebaseConfig.appId}/public/data/leaderboard_2048`);
        try {
            await addDoc(scoreRef, {
                userId: currentUser.uid,
                playerName: playerName, // Use the current player name
                score: scoreValue,
                timestamp: new Date()
            });
            showMessage(`Score ${scoreValue} submitted!`, 3000);
            setShowScoreSubmission(false); // Hide the submission input
            setTempScore(0); // Reset temp score
        } catch (error) {
            console.error("Error submitting score:", error);
            showMessage("Failed to submit score. Try again.", 3000);
        }
    };

    // --- Render Logic ---
    if (loadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900 text-white text-2xl">
                Loading Infinity Game Hub...
            </div>
        );
    }

    // Get unique genres for filtering
    const uniqueGenres = ['All', ...new Set(games.map(game => game.genre))];

    return (
        <div className={`min-h-screen p-4 md:p-8 ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
            {/* Tailwind CSS and Font Awesome are loaded globally in the Canvas environment,
                but for a real React project, you'd typically import them or use a build process. */}
            <style>
                {`
                /* CSS Variables for Theming */
                :root {
                    /* Dark Theme Defaults */
                    --bg-gradient-start: #001f3f;
                    --bg-gradient-mid1: #0074d9;
                    --bg-gradient-mid2: #00bcd4;
                    --bg-gradient-mid3: #2ecc40;
                    --bg-gradient-end: #ffdc00;
                    --text-color: #e0e0e0;
                    --header-glass-bg: rgba(30, 42, 74, 0.3);
                    --search-input-bg: rgba(42, 59, 92, 0.5);
                    --card-glass-bg: rgba(30, 42, 74, 0.4);
                    --border-color-subtle: rgba(255, 255, 255, 0.15);
                    --border-color-card: rgba(255, 255, 255, 0.2);
                    --shadow-color-dark: rgba(0, 0, 0, 0.4);
                    --shadow-color-card: rgba(0, 0, 0, 0.5);
                    --shadow-color-card-hover: rgba(0, 0, 0, 0.7);
                    --modal-bg: rgba(30, 42, 74, 0.6);
                    --modal-border: rgba(255, 255, 255, 0.2);
                    --modal-shadow: rgba(0, 0, 0, 0.5);
                    --player-buzz-text-color: rgba(255, 255, 255, 0.7);
                    --player-buzz-shadow: rgba(0, 255, 255, 0.5);
                    --game-of-moment-color: #a78bfa;
                    --game-of-moment-shadow: rgba(167, 139, 250, 0.6);
                    --control-button-bg: #e94560;
                    --control-button-hover-bg: #c03953;
                    --close-button-bg: #e94560;
                    --close-button-hover-bg: #c03953;
                    --secret-message-bg: rgba(0, 255, 255, 0.85);
                    --secret-message-border: rgba(255, 255, 255, 0.3);
                    --secret-message-text-shadow: rgba(255, 255, 255, 0.5);
                    --hidden-trigger-bg: rgba(255, 255, 255, 0.1);
                    --hidden-trigger-color: rgba(255, 255, 255, 0.6);
                    --lucky-charm-bg: rgba(255, 255, 255, 0.08);
                    --theme-toggle-color: #fff; /* Icon color */
                }

                /* Light Theme */
                body.light-theme {
                    --bg-gradient-start: #e0f2f7;
                    --bg-gradient-mid1: #b3e5fc;
                    --bg-gradient-mid2: #81d4fa;
                    --bg-gradient-mid3: #4fc3f7;
                    --bg-gradient-end: #29b6f6;
                    --text-color: #333333;
                    --header-glass-bg: rgba(255, 255, 255, 0.6);
                    --search-input-bg: rgba(255, 255, 255, 0.8);
                    --card-glass-bg: rgba(255, 255, 255, 0.7);
                    --border-color-subtle: rgba(0, 0, 0, 0.1);
                    --border-color-card: rgba(0, 0, 0, 0.15);
                    --shadow-color-dark: rgba(0, 0, 0, 0.2);
                    --shadow-color-card: rgba(0, 0, 0, 0.15);
                    --shadow-color-card-hover: rgba(0, 0, 0, 0.3);
                    --modal-bg: rgba(255, 255, 255, 0.9);
                    --modal-border: rgba(0, 0, 0, 0.1);
                    --modal-shadow: rgba(0, 0, 0, 0.2);
                    --player-buzz-text-color: rgba(51, 51, 51, 0.7);
                    --player-buzz-shadow: rgba(0, 0, 0, 0.2);
                    --game-of-moment-color: #673ab7;
                    --game-of-moment-shadow: rgba(103, 58, 183, 0.4);
                    --control-button-bg: #42a5f5;
                    --control-button-hover-bg: #2196f3;
                    --close-button-bg: #42a5f5;
                    --close-button-hover-bg: #2196f3;
                    --secret-message-bg: rgba(0, 188, 212, 0.85);
                    --secret-message-border: rgba(0, 0, 0, 0.3);
                    --secret-message-text-shadow: rgba(0, 0, 0, 0.2);
                    --hidden-trigger-bg: rgba(0, 0, 0, 0.1);
                    --hidden-trigger-color: rgba(0, 0, 0, 0.6);
                    --lucky-charm-bg: rgba(0, 0, 0, 0.08);
                    --theme-toggle-color: #333; /* Icon color */
                }

                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-mid1) 25%, var(--bg-gradient-mid2) 50%, var(--bg-gradient-mid3) 75%, var(--bg-gradient-end) 100%);
                    background-size: 400% 400%;
                    animation: gradientAnimation 20s ease infinite;
                    color: var(--text-color);
                    overflow-x: hidden;
                    transition: background-color 0.5s ease, color 0.5s ease; /* Smooth theme transition */
                }

                @keyframes gradientAnimation {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .glass-effect {
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-radius: 15px;
                    transition: all 0.3s ease-in-out;
                }

                .header-glass {
                    background: var(--header-glass-bg); /* Use CSS variable */
                    backdrop-filter: blur(10px); /* Frosted glass effect */
                    -webkit-backdrop-filter: blur(10px); /* For Safari */
                    border: 1px solid var(--border-color-subtle); /* Use CSS variable */
                    box-shadow: 0 4px 20px 0 var(--shadow-color-dark); /* Use CSS variable */
                    border-radius: 15px; /* Explicitly set rounded corners for the header */
                    padding: 20px 40px;
                    margin-bottom: 2.5rem;
                }

                .search-input-glass {
                    background: var(--search-input-bg);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid var(--border-color-card);
                    box-shadow: 0 6px 20px 0 var(--shadow-color-dark);
                    border-radius: 20px; /* Increased border-radius for more rounded corners */
                    color: var(--text-color);
                    padding: 18px 24px 18px 60px;
                    font-size: 1rem;
                }
                .search-input-glass::placeholder {
                    color: rgba(224, 224, 224, 0.8); /* Still dark for contrast */
                }
                .light-theme .search-input-glass::placeholder {
                    color: rgba(51, 51, 51, 0.6); /* Darker for light theme */
                }
                .search-input-glass:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(129, 204, 254, 0.8);
                    border-color: rgba(129, 204, 254, 0.6);
                }

                .card-glass {
                    background: var(--card-glass-bg);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid var(--border-color-card);
                    box-shadow: 0 12px 48px 0 var(--shadow-color-card);
                    border-radius: 12px;
                    overflow: hidden;
                    cursor: pointer;
                    position: relative;
                    z-index: 10;
                    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
                    animation: none;
                }
                .card-glass:hover {
                    transform: translateY(-10px) scale(1.03);
                    box-shadow: 0 20px 50px 0 var(--shadow-color-card-hover);
                    animation: none;
                }

                .game-card img {
                    border-radius: 12px 12px 0 0;
                }
                .game-card h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .fullscreen-iframe-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: rgba(0, 0, 0, 0.98);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.4s ease-in-out, visibility 0.4s ease-in-out;
                }
                .fullscreen-iframe-container.active {
                    opacity: 1;
                    visibility: visible;
                }
                .game-iframe {
                    width: 95%;
                    height: 95%;
                    border: none;
                    border-radius: 16px;
                    box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
                }
                .close-button {
                    position: absolute;
                    top: 25px;
                    right: 25px;
                    background-color: var(--close-button-bg);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 45px;
                    height: 45px;
                    font-size: 24px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer;
                    z-index: 1001;
                    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
                    transition: background-color 0.2s ease, transform 0.2s ease;
                }
                .close-button:hover {
                    background-color: var(--close-button-hover-bg);
                    transform: scale(1.15) rotate(90deg);
                }

                /* Custom scrollbar for better aesthetics */
                ::-webkit-scrollbar {
                    width: 10px;
                }
                ::-webkit-scrollbar-track {
                    background: #1a1a2e;
                }
                ::-webkit-scrollbar-thumb {
                    background: #0f3460;
                    border-radius: 5px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #16213e;
                }

                /* Secret Mode styles - Now uses a CSS variable for dynamic hue rotation */
                body.secret-mode-active {
                    filter: hue-rotate(var(--hue-rotation)) saturate(1.5) brightness(1.5);
                    transition: filter 0.1s linear;
                }

                /* Keyframes for floating cards */
                @keyframes floatEffect {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                    100% { transform: translateY(0); }
                }

                body.secret-mode-active .game-card {
                    animation: floatEffect 3.5s ease-in-out infinite;
                    animation-delay: calc(var(--random-delay) * 0.5s);
                }

                /* Secret Message Glassmorphism */
                .secret-message {
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--secret-message-bg);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border: 1px solid var(--secret-message-border);
                    padding: 15px 30px;
                    border-radius: 10px;
                    color: #000; /* Always dark text for this message */
                    font-weight: bold;
                    font-size: 1.1rem;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.6s ease-in-out, visibility 0.6s ease-in-out;
                    z-index: 1002;
                    text-shadow: 1px 1px 2px var(--secret-message-text-shadow);
                    text-align: center;
                    max-width: 80%;
                }
                .secret-message.show {
                    opacity: 1;
                    visibility: visible;
                }

                /* Player Buzz Container */
                .player-buzz-container {
                    background: var(--header-glass-bg); /* Reusing header glass style */
                    border: 1px solid var(--border-color-subtle);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    padding: 1rem 1.5rem;
                    margin-bottom: 2rem;
                    text-align: center;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--player-buzz-text-color);
                    text-shadow: 0 0 8px var(--player-buzz-shadow);
                    overflow: hidden; /* For future text animation */
                }

                /* General button styling for consistency */
                .btn-primary {
                    background-color: #8B5CF6; /* Purple-600 */
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: background-color 0.2s ease-in-out;
                    &:hover {
                        background-color: #7C3AED; /* Purple-700 */
                    }
                }
                `}
            </style>

            {/* Cursor Trail Canvas */}
            <canvas id="cursorCanvas" className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"></canvas>

            {/* Background Music */}
            <audio ref={audioRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" preload="auto"></audio>
            <button
                onClick={toggleMusic}
                className="fixed bottom-4 left-4 z-[1000] p-3 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all duration-300"
                aria-label="Toggle Music"
            >
                {audioRef.current && !audioRef.current.paused ? (
                    <i className="fas fa-volume-up"></i>
                ) : (
                    <i className="fas fa-volume-mute"></i>
                )}
            </button>

            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="fixed top-4 right-4 z-[1000] p-3 rounded-full bg-gray-700 text-white shadow-lg hover:bg-gray-600 transition-all duration-300"
                aria-label="Toggle Theme"
            >
                {isDarkMode ? (
                    <i className="fas fa-sun text-yellow-400"></i>
                ) : (
                    <i className="fas fa-moon text-blue-400"></i>
                )}
            </button>

            {/* Header Section */}
            <header className="text-center mb-10 md:mb-16 header-glass mx-auto max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-bold text-white flex items-center justify-center space-x-4">
                    <i className="fas fa-gamepad text-purple-400"></i>
                    <span>Infinity Game Hub</span>
                    <i className="fas fa-ghost text-blue-400"></i>
                </h1>
                <p className="mt-2 text-lg md:text-xl text-gray-300">
                    Discover your next adventure, <span className="font-bold text-blue-300">{playerName}</span>!
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    User ID: {currentUser ? currentUser.uid : 'Loading...'}
                </p>
                <button
                    onClick={openPlayerNameModal}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                >
                    Set Player Name
                </button>
            </header>

            {/* Player Buzz / News Feed */}
            <div className="max-w-4xl mx-auto player-buzz-container glass-effect rounded-lg">
                <span id="playerBuzzText" className="player-buzz-text">
                    {playerBuzzMessages[currentBuzzIndex]}
                </span>
            </div>
            {/* New button for AI-powered buzz messages */}
            <div className="flex justify-center mt-4">
                <button
                    onClick={generateNewBuzzMessages}
                    disabled={generatingBuzz}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 flex items-center justify-center"
                >
                    {generatingBuzz ? (
                        <>
                            <i className="fas fa-spinner fa-spin mr-2"></i> Generating Buzz...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-magic mr-2"></i> Generate New Buzz
                        </>
                    )}
                </button>
            </div>

            {/* Search, Filter, Sort Controls */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                <div className="relative w-full sm:w-1/2">
                    <input
                        type="text"
                        id="searchBar"
                        placeholder="Search for your favorite games..."
                        className="w-full p-4 pl-12 rounded-xl shadow-lg search-input-glass focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    {/* Genre Filter */}
                    <select
                        className="p-3 rounded-lg glass-effect bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={currentFilter}
                        onChange={(e) => setCurrentFilter(e.target.value)}
                    >
                        {uniqueGenres.map(genre => (
                            <option key={genre} value={genre}>{genre}</option>
                        ))}
                    </select>

                    {/* Sorting */}
                    <select
                        className="p-3 rounded-lg glass-effect bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={currentSort}
                        onChange={(e) => setCurrentSort(e.target.value)}
                    >
                        <option value="Name (A-Z)">Name (A-Z)</option>
                        <option value="Popularity (High to Low)">Popularity (High to Low)</option>
                    </select>
                </div>
            </div>

            {/* Game Grid */}
            <main id="gameGrid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto pb-10">
                {filteredGames.map(game => (
                    <div
                        key={game.id}
                        className="game-card card-glass rounded-xl shadow-lg overflow-hidden cursor-pointer"
                        style={{ '--random-delay': Math.random().toFixed(2) }}
                        onClick={() => openGameDetails(game)}
                    >
                        <img
                            src={game.image}
                            alt={game.name}
                            className="w-full h-40 object-cover rounded-t-xl"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x200/3E2723/ffffff?text=Image+Not+Available'; }}
                        />
                        <div className="p-4 text-center">
                            <h3 className="text-xl font-semibold text-white truncate">{game.name}</h3>
                            <p className="text-sm text-gray-400">{game.genre}</p>
                        </div>
                    </div>
                ))}
            </main>

            {/* Global Leaderboard for 2048 */}
            <section className="max-w-2xl mx-auto my-16 p-8 glass-effect rounded-xl">
                <h2 className="text-3xl font-bold text-center text-purple-400 mb-6">2048 Top Scores</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-transparent border-collapse">
                        <thead>
                            <tr className="bg-gray-800 bg-opacity-50">
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-300 rounded-tl-lg">Rank</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Player</th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-300 rounded-tr-lg">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboardScores.length > 0 ? (
                                leaderboardScores.map((entry, index) => (
                                    <tr key={entry.id} className="border-b border-gray-700 border-opacity-50 last:border-b-0">
                                        <td className="py-3 px-4 text-left text-lg font-bold text-blue-300">{index + 1}</td>
                                        <td className="py-3 px-4 text-left text-md text-white">{entry.playerName || 'Anonymous'}</td>
                                        <td className="py-3 px-4 text-right text-md font-semibold text-green-400">{entry.score}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="py-4 text-center text-gray-400">No scores yet. Be the first!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setShowScoreSubmission(true)}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300"
                    >
                        Submit Your 2048 Score
                    </button>
                    {showScoreSubmission && (
                        <div className="mt-4 flex flex-col items-center gap-3">
                            <input
                                type="number"
                                placeholder="Enter your score"
                                value={tempScore}
                                onChange={(e) => setTempScore(parseInt(e.target.value) || 0)}
                                className="w-full p-3 rounded-lg glass-effect bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => handleScoreSubmission(tempScore)}
                                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
                            >
                                Submit
                            </button>
                        </div>
                    )}
                </div>
            </section>


            {/* Fullscreen Iframe Container */}
            {fullscreenGameUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[1000]">
                    <button
                        onClick={closeFullscreenGame}
                        className="absolute top-4 right-4 p-3 rounded-full bg-red-600 text-white text-xl hover:bg-red-700 transition-all duration-300 z-10"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                    <iframe
                        src={fullscreenGameUrl}
                        className="w-[95vw] h-[95vh] border-none rounded-xl shadow-2xl"
                        allowFullScreen
                    ></iframe>
                </div>
            )}

            {/* Game Details Modal */}
            {selectedGameDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1001]">
                    <div className="bg-gray-800 bg-opacity-70 backdrop-blur-xl p-8 rounded-xl shadow-2xl max-w-lg w-full text-center relative border border-gray-700">
                        <button
                            onClick={closeGameDetails}
                            className="absolute top-4 right-4 p-2 rounded-full bg-red-600 text-white text-lg hover:bg-red-700 transition-all duration-300"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        <img
                            src={selectedGameDetails.image}
                            alt={selectedGameDetails.name}
                            className="w-48 h-32 object-cover rounded-lg mx-auto mb-4 shadow-lg"
                        />
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedGameDetails.name}</h2>
                        <p className="text-lg text-gray-300 mb-2">Genre: <span className="font-semibold text-blue-300">{selectedGameDetails.genre}</span></p>
                        <p className="text-md text-gray-400 mb-2">Developer: <span className="font-semibold">{selectedGameDetails.developer}</span></p>
                        <p className="text-md text-gray-400 mb-4">Rating: <span className="font-semibold text-yellow-400">{selectedGameDetails.rating} / 5</span></p>
                        <button
                            onClick={() => launchGame(selectedGameDetails.url)}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition duration-300"
                        >
                            Play Now <i className="fas fa-play ml-2"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Secret Message Display */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 glass-effect p-4 rounded-lg text-center transition-opacity duration-500 ${secretMessageVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                {secretMessage}
            </div>

            {/* Info Trigger for Hidden Message */}
            <button
                onClick={() => showMessage("You've uncovered a hidden dimension! Welcome, seeker.", 5000)}
                className="fixed bottom-4 right-4 z-[1000] p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300"
                aria-label="Show Info"
            >
                <i className="fas fa-info"></i>
            </button>

            {/* Lucky Charm Trigger */}
            <div
                onClick={handleLuckyCharmClick}
                className="fixed top-4 left-4 w-8 h-8 rounded-md bg-green-500 opacity-20 hover:opacity-50 transition-opacity duration-300 cursor-pointer z-50"
                title="Click me for a surprise!"
            ></div>

            {/* Player Name Input Modal */}
            {isPlayerNameModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1002]">
                    <div className="bg-gray-800 bg-opacity-70 backdrop-blur-xl p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative border border-gray-700">
                        <h3 className="text-2xl font-bold text-white mb-4">Set Your Player Name</h3>
                        <input
                            type="text"
                            id="playerNameInput"
                            placeholder="Enter your name"
                            maxLength="20"
                            value={playerName}
                            onChange={handlePlayerNameChange}
                            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />
                        <button
                            onClick={closePlayerNameModal}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition duration-300"
                        >
                            Save Name
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// This is the standard way to render a React app into the DOM in React 18+
// This part should remain here in src/index.js as it's the entry point for rendering.
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <AuthProvider>
                <App />
            </AuthProvider>
        </React.StrictMode>
    );
} else {
    console.error("Root element with ID 'root' not found in the document.");
}

// Export AppProvider as default if this file is treated as the main entry for a build system
// This line is primarily for the Canvas environment's internal rendering,
// it's not strictly necessary for a standard Create React App build if App is rendered directly.
export default AppProvider;
