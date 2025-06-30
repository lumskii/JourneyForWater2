// Journey for Water - Main App Controller
// Handles screen transitions and game state management

class JourneyForWaterApp {
    constructor() {
        this.currentScreen = 'splash';
        this.gameState = {
            waterPoints: 0,
            energy: 100,
            day: 1,
            timeOfDay: 'Morning',
            miniGameScore: 0
        };
        
        // Whack-a-Mole game state
        this.whackMoleState = {
            isActive: false,
            timeRemaining: 30,
            cansCollected: 0,
            gameTimer: null,
            spawnTimer: null,
            activeCans: new Set(),
            holes: []
        };
        
        this.screens = {};
        this.journeyLevel = null;
        this.returnJourneyLevel = null;
        this.miniGameInterval = null;
        
        // Audio manager
        this.audioManager = null;
        
        this.init();
    }
    
    async init() {
        this.setupScreens();
        this.setupEventListeners();
        
        // Load saved game state
        this.loadGameState();
        
        this.updateHUD();
        
        // Initialize audio manager
        try {
            this.audioManager = new AudioManager();
            await this.audioManager.preloadAllAudio();
            console.log('✅ Audio system initialized');
        } catch (error) {
            console.warn('❌ Failed to initialize audio system:', error);
        }
    }
    
    setupScreens() {
        // Get all screen elements
        this.screens = {
            splash: document.getElementById('splashScreen'),
            settings: document.getElementById('settingsScreen'),
            morningPrep: document.getElementById('morningPrepScreen'),
            journeyLevel: document.getElementById('journeyLevelScreen'),
            waterCollection: document.getElementById('waterCollectionScreen'),
            returnJourney: document.getElementById('returnJourneyScreen'),
            daySummary: document.getElementById('daySummaryScreen'),
            leaderboard: document.getElementById('leaderboardScreen')
        };
    }
    
    setupEventListeners() {
        // Splash screen
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.showScreen('morningPrep');
        });
        
        // Continue game button
        document.getElementById('continueGameBtn').addEventListener('click', () => {
            this.showScreen('morningPrep');
        });
        
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showScreen('settings');
            this.setupSettingsControls();
        });
        
        // Settings screen
        document.getElementById('backToSplashBtn').addEventListener('click', () => {
            this.showScreen('splash');
        });
        
        document.getElementById('resetProgressBtn').addEventListener('click', () => {
            this.resetProgress();
        });
        
        // Morning prep screen
        document.getElementById('beginJourneyBtn').addEventListener('click', () => {
            this.showScreen('journeyLevel');
            this.startJourneyLevel();
        });
        
        // Water collection mini-game
        document.getElementById('startWhackBtn').addEventListener('click', () => {
            this.startWhackMoleGame();
        });
        
        document.getElementById('stopWhackBtn').addEventListener('click', () => {
            this.stopWhackMoleGame();
        });
        
        document.getElementById('continueJourneyBtn').addEventListener('click', () => {
            this.showScreen('returnJourney');
            this.startReturnJourney();
        });
        
        // Day summary
        document.getElementById('viewLeaderboardBtn').addEventListener('click', () => {
            this.showScreen('leaderboard');
            this.updateLeaderboard();
        });
        
        // Leaderboard
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
            this.showScreen('splash');
        });
        
        // Mobile controls for journey level
        this.setupMobileControls('leftBtn', 'rightBtn', 'jumpBtn', 'journey');
        this.setupMobileControls('returnLeftBtn', 'returnRightBtn', 'returnJumpBtn', 'return');
    }
    
    setupMobileControls(leftBtnId, rightBtnId, jumpBtnId, levelType) {
        const leftBtn = document.getElementById(leftBtnId);
        const rightBtn = document.getElementById(rightBtnId);
        const jumpBtn = document.getElementById(jumpBtnId);
        
        if (leftBtn && rightBtn && jumpBtn) {
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMobileInput('left', levelType);
            });
            
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMobileInput('right', levelType);
            });
            
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMobileInput('jump', levelType);
            });
        }
    }
    
    handleMobileInput(action, levelType) {
        if (levelType === 'journey' && this.journeyLevel) {
            this.journeyLevel.handleMobileInput(action);
        } else if (levelType === 'return' && this.returnJourneyLevel) {
            this.returnJourneyLevel.handleMobileInput(action);
        }
    }
    
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }
    
    startJourneyLevel() {
        try {
            if (this.journeyLevel) {
                this.journeyLevel.cleanup();
            }
            this.journeyLevel = new JourneyLevel('gameCanvas', this);
            this.journeyLevel.start();
            this.gameState.timeOfDay = 'Morning';
            this.updateHUD();
            
            // Start ambient music
            if (this.audioManager) {
                this.audioManager.playMusic('ambient');
            }
        } catch (error) {
            console.error('Failed to start journey level:', error);
            // Show error message to user
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                const errorContainer = document.createElement('div');
                errorContainer.style.position = 'absolute';
                errorContainer.style.top = '50%';
                errorContainer.style.left = '50%';
                errorContainer.style.transform = 'translate(-50%, -50%)';
                errorContainer.style.textAlign = 'center';
                errorContainer.style.color = '#ef4444';
                errorContainer.innerHTML = `
                    <h2 style="font-size: 20px; margin-bottom: 8px;">Failed to Start Game</h2>
                    <p style="font-size: 16px; color: #4b5563;">Please check if your browser supports WebGL and try again.</p>
                    <button onclick="location.reload()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4">
                        Retry
                    </button>
                `;
                canvas.parentNode.appendChild(errorContainer);
            }
        }
    }
    
    startReturnJourney() {
        try {
            if (this.returnJourneyLevel) {
                this.returnJourneyLevel.cleanup();
            }
            this.returnJourneyLevel = new JourneyLevel('returnGameCanvas', this, true);
            this.returnJourneyLevel.start();
            this.gameState.timeOfDay = 'Afternoon';
            this.updateHUD();
            
            // Start ambient music
            if (this.audioManager) {
                this.audioManager.playMusic('ambient');
            }
        } catch (error) {
            console.error('Failed to start return journey:', error);
            // Show error message to user
            const canvas = document.getElementById('returnGameCanvas');
            if (canvas) {
                const errorContainer = document.createElement('div');
                errorContainer.style.position = 'absolute';
                errorContainer.style.top = '50%';
                errorContainer.style.left = '50%';
                errorContainer.style.transform = 'translate(-50%, -50%)';
                errorContainer.style.textAlign = 'center';
                errorContainer.style.color = '#ef4444';
                errorContainer.innerHTML = `
                    <h2 style="font-size: 20px; margin-bottom: 8px;">Failed to Start Return Journey</h2>
                    <p style="font-size: 16px; color: #4b5563;">Please check if your browser supports WebGL and try again.</p>
                    <button onclick="location.reload()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4">
                        Retry
                    </button>
                `;
                canvas.parentNode.appendChild(errorContainer);
            }
        }
    }
    
    startMiniGame() {
        this.showScreen('waterCollection');
        
        // Reset UI
        const resultDiv = document.getElementById('miniGameResult');
        const continueBtn = document.getElementById('continueJourneyBtn');
        const startBtn = document.getElementById('startWhackBtn');
        const stopBtn = document.getElementById('stopWhackBtn');
        
        resultDiv.classList.add('hidden');
        continueBtn.classList.add('hidden');
        startBtn.classList.add('hidden'); // Hide start button - auto-start
        stopBtn.classList.add('hidden'); // Hide stop button for single attempt
        
        // Reset whack-a-mole state
        this.whackMoleState.isActive = false;
        this.whackMoleState.timeRemaining = 30;
        this.whackMoleState.cansCollected = 0;
        this.whackMoleState.activeCans.clear();
        
        // Update display
        document.getElementById('gameTimer').textContent = '30s';
        document.getElementById('cansCollected').textContent = '0';
        document.getElementById('gameStatus').textContent = 'Get ready! Water collection starts in...';
        
        // Set up hole event listeners
        this.setupWhackMoleHoles();
        
        // Auto-start the game after a brief countdown
        this.startGameCountdown();
    }
    
    startGameCountdown() {
        let countdown = 3;
        const statusElement = document.getElementById('gameStatus');
        
        const countdownInterval = setInterval(() => {
            if (countdown > 0) {
                statusElement.textContent = `Get ready! Starting in ${countdown}...`;
                countdown--;
            } else {
                statusElement.textContent = 'GO! Click the jerry cans!';
                clearInterval(countdownInterval);
                // Start the actual game
                this.startWhackMoleGame();
            }
        }, 1000);
    }
    
    setupWhackMoleHoles() {
        const holes = document.querySelectorAll('.hole');
        this.whackMoleState.holes = Array.from(holes);
        
        holes.forEach((hole, index) => {
            // Remove any existing listeners
            hole.replaceWith(hole.cloneNode(true));
        });
        
        // Re-get holes after cloning and add new listeners
        const newHoles = document.querySelectorAll('.hole');
        this.whackMoleState.holes = Array.from(newHoles);
        
        newHoles.forEach((hole, index) => {
            hole.addEventListener('click', () => this.hitJerryCan(index));
        });
    }
    
    startWhackMoleGame() {
        this.whackMoleState.isActive = true;
        this.whackMoleState.timeRemaining = 30;
        this.whackMoleState.cansCollected = 0;
        
        document.getElementById('gameStatus').textContent = 'Quick! Click the jerry cans!';
        
        // Start game timer
        this.whackMoleState.gameTimer = setInterval(() => {
            this.whackMoleState.timeRemaining--;
            const timerElement = document.getElementById('gameTimer');
            timerElement.textContent = this.whackMoleState.timeRemaining + 's';
            
            // Add warning animation when time is running low
            if (this.whackMoleState.timeRemaining <= 10 && this.whackMoleState.timeRemaining > 0) {
                timerElement.classList.add('timer-warning');
            } else {
                timerElement.classList.remove('timer-warning');
            }
            
            if (this.whackMoleState.timeRemaining <= 0) {
                this.stopWhackMoleGame();
            }
        }, 1000);
        
        // Start spawning jerry cans
        this.spawnJerryCan();
        this.whackMoleState.spawnTimer = setInterval(() => {
            this.spawnJerryCan();
        }, 800); // Spawn a new can every 800ms
    }
    
    spawnJerryCan() {
        if (!this.whackMoleState.isActive) return;
        
        // Find available holes
        const availableHoles = this.whackMoleState.holes
            .map((hole, index) => index)
            .filter(index => !this.whackMoleState.activeCans.has(index));
        
        if (availableHoles.length === 0) return;
        
        // Pick random hole
        const randomIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
        const hole = this.whackMoleState.holes[randomIndex];
        const jerryCan = hole.querySelector('.jerry-can');
        
        if (jerryCan) {
            // Show jerry can with pop-up animation
            this.whackMoleState.activeCans.add(randomIndex);
            jerryCan.classList.remove('hidden');
            jerryCan.style.transform = 'translateY(100%)';
            
            // Animate up
            setTimeout(() => {
                jerryCan.style.transition = 'transform 0.3s ease-out';
                jerryCan.style.transform = 'translateY(0%)';
            }, 50);
            
            // Auto-hide after random time (1-3 seconds)
            const hideTime = Math.random() * 2000 + 1000;
            setTimeout(() => {
                this.hideJerryCan(randomIndex);
            }, hideTime);
        }
    }
    
    hideJerryCan(holeIndex) {
        if (!this.whackMoleState.activeCans.has(holeIndex)) return;
        
        const hole = this.whackMoleState.holes[holeIndex];
        const jerryCan = hole.querySelector('.jerry-can');
        
        if (jerryCan) {
            // Animate down
            jerryCan.style.transition = 'transform 0.3s ease-in';
            jerryCan.style.transform = 'translateY(100%)';
            
            setTimeout(() => {
                jerryCan.classList.add('hidden');
                jerryCan.style.transition = '';
                jerryCan.style.transform = '';
                this.whackMoleState.activeCans.delete(holeIndex);
            }, 300);
        }
    }
    
    hitJerryCan(holeIndex) {
        if (!this.whackMoleState.isActive || !this.whackMoleState.activeCans.has(holeIndex)) return;
        
        // Audio feedback for successful hit
        if (this.audioManager) {
            this.audioManager.playCollectJerry();
        }
        
        // Successful hit!
        this.whackMoleState.cansCollected++;
        document.getElementById('cansCollected').textContent = this.whackMoleState.cansCollected;
        
        // Visual feedback
        const hole = this.whackMoleState.holes[holeIndex];
        const jerryCan = hole.querySelector('.jerry-can');
        
        if (jerryCan) {
            // Flash effect
            jerryCan.style.background = 'radial-gradient(circle, #10f700, #ffff00)';
            jerryCan.style.transform = 'scale(1.2)';
            
            // Create splash effect
            this.createSplashEffect(hole);
            
            setTimeout(() => {
                this.hideJerryCan(holeIndex);
            }, 200);
        }
    }
    
    createSplashEffect(hole) {
        const splash = document.createElement('div');
        splash.innerHTML = '💧';
        splash.style.position = 'absolute';
        splash.style.top = '50%';
        splash.style.left = '50%';
        splash.style.transform = 'translate(-50%, -50%)';
        splash.style.fontSize = '2rem';
        splash.style.pointerEvents = 'none';
        splash.style.zIndex = '1000';
        
        hole.appendChild(splash);
        
        // Animate splash
        let scale = 1;
        let opacity = 1;
        const animate = () => {
            scale += 0.1;
            opacity -= 0.05;
            splash.style.transform = `translate(-50%, -50%) scale(${scale})`;
            splash.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                hole.removeChild(splash);
            }
        };
        animate();
    }
    
    stopWhackMoleGame() {
        this.whackMoleState.isActive = false;
        
        // Clear timers
        if (this.whackMoleState.gameTimer) {
            clearInterval(this.whackMoleState.gameTimer);
        }
        if (this.whackMoleState.spawnTimer) {
            clearInterval(this.whackMoleState.spawnTimer);
        }
        
        // Hide all jerry cans
        this.whackMoleState.activeCans.forEach(holeIndex => {
            this.hideJerryCan(holeIndex);
        });
        
        const resultDiv = document.getElementById('miniGameResult');
        const resultMessage = document.getElementById('resultMessage');
        const waterCollected = document.getElementById('waterCollected');
        
        // Calculate score and show brief results
        const score = this.whackMoleState.cansCollected * 5; // 5 points per can
        let message = '';
        
        if (this.whackMoleState.cansCollected >= 20) {
            message = 'Incredible! Lightning-fast water collection!';
            resultMessage.className = 'text-2xl font-bold mb-4 text-green-600';
        } else if (this.whackMoleState.cansCollected >= 15) {
            message = 'Excellent job! Great water collection skills!';
            resultMessage.className = 'text-2xl font-bold mb-4 text-blue-600';
        } else if (this.whackMoleState.cansCollected >= 10) {
            message = 'Good work! You collected a decent amount of water.';
            resultMessage.className = 'text-2xl font-bold mb-4 text-orange-600';
        } else {
            message = 'Keep practicing! Every drop counts.';
            resultMessage.className = 'text-2xl font-bold mb-4 text-gray-600';
        }
        
        this.gameState.miniGameScore = score;
        this.gameState.waterPoints += score;
        
        // Audio feedback for game completion
        if (this.audioManager) {
            this.audioManager.playSuccess();
        }
        
        // Add bloom effect for success
        this.bloomEffect();
        
        resultMessage.textContent = message;
        waterCollected.textContent = `+${score} water points collected! (${this.whackMoleState.cansCollected} jerry cans)`;
        
        document.getElementById('gameStatus').textContent = `Water collection complete! Collected ${this.whackMoleState.cansCollected} jerry cans!`;
        
        // Show results briefly then auto-continue
        resultDiv.classList.remove('hidden');
        
        this.updateHUD();
        
        // Auto-continue to return journey after showing results for 3 seconds
        setTimeout(() => {
            this.proceedToReturnJourney();
        }, 3000);
    }
    
    proceedToReturnJourney() {
        // Show transition message
        document.getElementById('gameStatus').textContent = 'Starting return journey...';
        
        // Brief pause then proceed to return journey
        setTimeout(() => {
            this.showScreen('returnJourney');
            this.startReturnJourney();
        }, 1000);
    }
    
    stopMiniGame() {
        // Legacy method - now handled by stopWhackMoleGame
        this.stopWhackMoleGame();
    }
    
    updateHUD() {
        // Update journey level HUD
        document.getElementById('waterPoints').textContent = this.gameState.waterPoints;
        document.getElementById('energyBar').style.width = this.gameState.energy + '%';
        document.getElementById('dayCounter').textContent = this.gameState.day;
        document.getElementById('timeOfDay').textContent = this.gameState.timeOfDay;
        
        // Update return journey HUD
        document.getElementById('returnWaterPoints').textContent = this.gameState.waterPoints;
        document.getElementById('returnEnergyBar').style.width = this.gameState.energy + '%';
        document.getElementById('returnDayCounter').textContent = this.gameState.day;
        document.getElementById('returnTimeOfDay').textContent = this.gameState.timeOfDay;
        
        // Update energy bar color if low
        const energyBars = [document.getElementById('energyBar'), document.getElementById('returnEnergyBar')];
        energyBars.forEach(bar => {
            if (bar) {
                if (this.gameState.energy < 20) {
                    bar.classList.add('energy-warning');
                    if (this.gameState.energy <= 10) {
                        bar.classList.add('low-energy-pulse');
                    } else {
                        bar.classList.remove('low-energy-pulse');
                    }
                } else {
                    bar.classList.remove('energy-warning', 'low-energy-pulse');
                }
            }
        });
    }
    
    addWaterPoints(points) {
        this.gameState.waterPoints += points;
        this.updateHUD();
        
        // Save game state
        this.saveGameState();
        
        // Audio feedback for water collection
        if (this.audioManager) {
            this.audioManager.playCollectJerry();
        }
        
        // Create particle effect at random position
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.25;
        this.createParticleEffect(x, y, 'collect');
        
        // Animate water points display
        const waterPointsElements = [
            document.getElementById('waterPoints'),
            document.getElementById('returnWaterPoints')
        ];
        
        waterPointsElements.forEach(element => {
            if (element) {
                element.classList.add('water-points-pop');
                setTimeout(() => {
                    element.classList.remove('water-points-pop');
                }, 300);
            }
        });
    }
    
    updateEnergy(change, opts = {}) {
        const oldEnergy = this.gameState.energy;
        this.gameState.energy = Math.max(0, Math.min(100, this.gameState.energy + change));
        
        // Save game state
        this.saveGameState();

        // Only play sound if energy is lost due to collision or health is extremely low
        if (this.audioManager) {
            if (change > 0) {
                // Energy gained - play positive sound
                this.audioManager.playCollectOrb();
            } else if (change < 0) {
                // Only play sound if opts.collision is true or health is now <= 10
                if (opts.collision || this.gameState.energy <= 10) {
                    this.audioManager.playHit();
                }
            }
        }

        // Remove visual floating feedback for energy changes
        // (No call to showEnergyFeedback for energy loss)
        if (change > 0) {
            // Energy gained - show positive feedback (optional, can keep or remove)
            // this.showEnergyFeedback('+' + change, '#10b981');
        }
        // No negative feedback for energy loss

        // Check for critical energy levels
        if (this.gameState.energy <= 10 && oldEnergy > 10) {
            this.showLowEnergyWarning();
        }
    }
    
    showLowEnergyWarning() {
        // Audio warning for low energy
        if (this.audioManager) {
            this.audioManager.playLowEnergy();
        }
        
        // Show warning when energy is critically low
        const warning = document.createElement('div');
        warning.innerHTML = '⚠️ Low Energy! Find yellow orbs to replenish!';
        warning.style.position = 'fixed';
        warning.style.top = '50%';
        warning.style.left = '50%';
        warning.style.transform = 'translate(-50%, -50%)';
        warning.style.backgroundColor = '#fef3c7';
        warning.style.color = '#92400e';
        warning.style.padding = '16px 24px';
        warning.style.borderRadius = '8px';
        warning.style.fontSize = '18px';
        warning.style.fontWeight = 'bold';
        warning.style.zIndex = '1001';
        warning.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        warning.style.animation = 'pulse 1s infinite';
        
        document.body.appendChild(warning);
        
        // Add screen shake effect
        this.screenShake();
        
        // Add energy bar flash
        this.flashEnergyBar();
        
        // Remove warning after 3 seconds
        setTimeout(() => {
            if (document.body.contains(warning)) {
                document.body.removeChild(warning);
            }
        }, 3000);
    }
    
    screenShake() {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.classList.add('screen-shake');
            setTimeout(() => {
                gameContainer.classList.remove('screen-shake');
            }, 300);
        }
    }
    
    flashEnergyBar() {
        const energyBars = [document.getElementById('energyBar'), document.getElementById('returnEnergyBar')];
        energyBars.forEach(bar => {
            if (bar) {
                bar.classList.add('energy-flash');
                setTimeout(() => {
                    bar.classList.remove('energy-flash');
                }, 300);
            }
        });
    }
    
    createParticleEffect(x, y, type = 'collect') {
        const particle = document.createElement('div');
        particle.innerHTML = type === 'collect' ? '💧' : '✨';
        particle.style.position = 'fixed';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.fontSize = '24px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        particle.classList.add('particle-burst');
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            if (document.body.contains(particle)) {
                document.body.removeChild(particle);
            }
        }, 600);
    }
    
    bloomEffect() {
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.classList.add('bloom-effect');
            setTimeout(() => {
                gameContainer.classList.remove('bloom-effect');
            }, 500);
        }
    }
    
    completeJourney() {
        // Play completion sound
        if (this.audioManager) {
            this.audioManager.playDayComplete();
        }
        
        this.showScreen('daySummary');
        this.updateDaySummary();
    }
    
    completeReturnJourney() {
        // Play completion sound
        if (this.audioManager) {
            this.audioManager.playDayComplete();
        }
        
        this.showScreen('daySummary');
        this.updateDaySummary();
    }
    
    updateDaySummary() {
        document.getElementById('finalWaterPoints').textContent = this.gameState.waterPoints;
        document.getElementById('finalEnergy').textContent = this.gameState.energy;
        
        // Update achievements based on performance
        const achievements = [
            document.getElementById('achievement1'),
            document.getElementById('achievement2'),
            document.getElementById('achievement3')
        ];
        
        achievements.forEach(achievement => {
            if (achievement) {
                achievement.style.color = '#10b981';
            }
        });
    }
    
    updateLeaderboard() {
        document.getElementById('playerScore').textContent = this.gameState.waterPoints;
    }
    
    resetGame() {
        this.gameState = {
            waterPoints: 0,
            energy: 100,
            day: 1,
            timeOfDay: 'Morning',
            miniGameScore: 0
        };
        
        if (this.journeyLevel) {
            this.journeyLevel.cleanup();
            this.journeyLevel = null;
        }
        
        if (this.returnJourneyLevel) {
            this.returnJourneyLevel.cleanup();
            this.returnJourneyLevel = null;
        }
        
        this.updateHUD();
    }
    
    setupSettingsControls() {
        if (!this.audioManager) return;
        
        // Set initial values from audio manager
        const masterVolumeSlider = document.getElementById('masterVolume');
        const musicVolumeSlider = document.getElementById('musicVolume');
        const sfxVolumeSlider = document.getElementById('sfxVolume');
        const musicToggle = document.getElementById('musicToggle');
        const sfxToggle = document.getElementById('sfxToggle');
        
        // Set initial values
        masterVolumeSlider.value = this.audioManager.settings.masterVolume * 100;
        musicVolumeSlider.value = this.audioManager.settings.musicVolume * 100;
        sfxVolumeSlider.value = this.audioManager.settings.sfxVolume * 100;
        musicToggle.checked = this.audioManager.settings.musicEnabled;
        sfxToggle.checked = this.audioManager.settings.sfxEnabled;
        
        // Update display values
        document.getElementById('masterVolumeValue').textContent = Math.round(this.audioManager.settings.masterVolume * 100) + '%';
        document.getElementById('musicVolumeValue').textContent = Math.round(this.audioManager.settings.musicVolume * 100) + '%';
        document.getElementById('sfxVolumeValue').textContent = Math.round(this.audioManager.settings.sfxVolume * 100) + '%';
        
        // Add event listeners
        masterVolumeSlider.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.audioManager.setMasterVolume(value);
            document.getElementById('masterVolumeValue').textContent = e.target.value + '%';
        });
        
        musicVolumeSlider.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.audioManager.setMusicVolume(value);
            document.getElementById('musicVolumeValue').textContent = e.target.value + '%';
        });
        
        sfxVolumeSlider.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.audioManager.setSFXVolume(value);
            document.getElementById('sfxVolumeValue').textContent = e.target.value + '%';
        });
        
        musicToggle.addEventListener('change', (e) => {
            this.audioManager.toggleMusic(e.target.checked);
        });
        
        sfxToggle.addEventListener('change', (e) => {
            this.audioManager.toggleSFX(e.target.checked);
        });
    }
    
    resetProgress() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            // Clear all saved data
            localStorage.removeItem('journeyForWater_audioSettings');
            localStorage.removeItem('journeyForWater_gameState');
            
            // Reset game state
            this.resetGame();
            
            // Hide continue game section
            const continueSection = document.getElementById('continueGameSection');
            const startBtn = document.getElementById('startGameBtn');
            if (continueSection && startBtn) {
                continueSection.classList.add('hidden');
                startBtn.textContent = 'Start Journey';
            }
            
            // Reset audio settings
            if (this.audioManager) {
                this.audioManager.settings = {
                    masterVolume: 0.7,
                    musicVolume: 0.6,
                    sfxVolume: 0.8,
                    musicEnabled: true,
                    sfxEnabled: true
                };
                this.audioManager.updateVolumes();
                this.setupSettingsControls();
            }
            
            alert('Progress reset successfully!');
        }
    }
    
    loadGameState() {
        try {
            const savedState = localStorage.getItem('journeyForWater_gameState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.gameState = { ...this.gameState, ...parsedState };
                console.log('✅ Loaded saved game state');
                
                // Show continue game section if there's progress
                if (this.gameState.waterPoints > 0 || this.gameState.day > 1) {
                    this.showContinueGameSection();
                }
            }
        } catch (error) {
            console.warn('Failed to load game state:', error);
        }
    }
    
    showContinueGameSection() {
        const continueSection = document.getElementById('continueGameSection');
        const startBtn = document.getElementById('startGameBtn');
        
        if (continueSection && startBtn) {
            continueSection.classList.remove('hidden');
            startBtn.textContent = 'New Game';
            
            // Update continue game info
            document.getElementById('continueDayNumber').textContent = this.gameState.day;
            document.getElementById('continueWaterPoints').textContent = this.gameState.waterPoints;
            document.getElementById('continueEnergy').textContent = this.gameState.energy;
        }
    }
    
    saveGameState() {
        try {
            localStorage.setItem('journeyForWater_gameState', JSON.stringify(this.gameState));
            console.log('✅ Saved game state');
        } catch (error) {
            console.warn('Failed to save game state:', error);
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.journeyForWaterApp = new JourneyForWaterApp();
}); 