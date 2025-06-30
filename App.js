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
        
        this.init();
    }
    
    init() {
        this.setupScreens();
        this.setupEventListeners();
        this.updateHUD();
    }
    
    setupScreens() {
        // Get all screen elements
        this.screens = {
            splash: document.getElementById('splashScreen'),
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
                } else {
                    bar.classList.remove('energy-warning');
                }
            }
        });
    }
    
    addWaterPoints(points) {
        this.gameState.waterPoints += points;
        this.updateHUD();
        
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
    
    updateEnergy(change) {
        const oldEnergy = this.gameState.energy;
        this.gameState.energy = Math.max(0, Math.min(100, this.gameState.energy + change));
        this.updateHUD();
        
        // Visual feedback for energy changes
        if (change > 0) {
            // Energy gained - show positive feedback
            this.showEnergyFeedback('+' + change, '#10b981');
        } else if (change < 0) {
            // Energy lost - show negative feedback
            this.showEnergyFeedback(change.toString(), '#ef4444');
        }
        
        // Check for critical energy levels
        if (this.gameState.energy <= 10 && oldEnergy > 10) {
            this.showLowEnergyWarning();
        }
    }
    
    showEnergyFeedback(text, color) {
        // Create floating text feedback
        const feedback = document.createElement('div');
        feedback.textContent = text;
        feedback.style.position = 'absolute';
        feedback.style.top = '20%';
        feedback.style.left = '50%';
        feedback.style.transform = 'translate(-50%, -50%)';
        feedback.style.color = color;
        feedback.style.fontSize = '24px';
        feedback.style.fontWeight = 'bold';
        feedback.style.pointerEvents = 'none';
        feedback.style.zIndex = '1000';
        feedback.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        
        document.body.appendChild(feedback);
        
        // Animate the feedback
        let opacity = 1;
        let yOffset = 0;
        const animate = () => {
            opacity -= 0.02;
            yOffset -= 1;
            feedback.style.opacity = opacity;
            feedback.style.transform = `translate(-50%, calc(-50% + ${yOffset}px))`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(feedback);
            }
        };
        animate();
    }
    
    showLowEnergyWarning() {
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
        
        // Remove warning after 3 seconds
        setTimeout(() => {
            if (document.body.contains(warning)) {
                document.body.removeChild(warning);
            }
        }, 3000);
    }
    
    completeJourney() {
        this.showScreen('daySummary');
        this.updateDaySummary();
    }
    
    completeReturnJourney() {
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
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.journeyForWaterApp = new JourneyForWaterApp();
}); 