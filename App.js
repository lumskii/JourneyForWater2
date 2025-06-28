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
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopMiniGame();
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
        
        const fillBar = document.getElementById('fillBar');
        const marker = document.getElementById('marker');
        const stopBtn = document.getElementById('stopBtn');
        const resultDiv = document.getElementById('miniGameResult');
        const continueBtn = document.getElementById('continueJourneyBtn');
        
        // Reset UI
        fillBar.style.width = '0%';
        marker.style.left = '0%';
        marker.classList.add('marker-moving');
        stopBtn.disabled = false;
        resultDiv.classList.add('hidden');
        continueBtn.classList.add('hidden');
        
        // Start marker movement
        let direction = 1;
        let position = 0;
        
        this.miniGameInterval = setInterval(() => {
            position += direction * 2;
            
            if (position >= 100) {
                direction = -1;
                position = 100;
            } else if (position <= 0) {
                direction = 1;
                position = 0;
            }
            
            marker.style.left = position + '%';
        }, 50);
    }
    
    stopMiniGame() {
        if (this.miniGameInterval) {
            clearInterval(this.miniGameInterval);
            this.miniGameInterval = null;
        }
        
        const marker = document.getElementById('marker');
        const resultDiv = document.getElementById('miniGameResult');
        const resultMessage = document.getElementById('resultMessage');
        const waterCollected = document.getElementById('waterCollected');
        const continueBtn = document.getElementById('continueJourneyBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        marker.classList.remove('marker-moving');
        stopBtn.disabled = true;
        
        // Calculate score based on marker position
        const position = parseFloat(marker.style.left);
        let score = 0;
        let message = '';
        
        if (position >= 30 && position <= 70) {
            // Perfect zone
            score = Math.floor(Math.random() * 20) + 30; // 30-50 points
            message = 'Perfect! Excellent water collection!';
            resultMessage.className = 'text-2xl font-bold mb-4 text-green-600';
        } else if (position >= 20 && position <= 80) {
            // Good zone
            score = Math.floor(Math.random() * 15) + 15; // 15-30 points
            message = 'Good job! You collected some water.';
            resultMessage.className = 'text-2xl font-bold mb-4 text-blue-600';
        } else {
            // Miss
            score = Math.floor(Math.random() * 10) + 5; // 5-15 points
            message = 'You missed the perfect zone, but got some water.';
            resultMessage.className = 'text-2xl font-bold mb-4 text-orange-600';
        }
        
        this.gameState.miniGameScore = score;
        this.gameState.waterPoints += score;
        
        resultMessage.textContent = message;
        waterCollected.textContent = `+${score} water points collected!`;
        
        resultDiv.classList.remove('hidden');
        continueBtn.classList.remove('hidden');
        
        this.updateHUD();
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