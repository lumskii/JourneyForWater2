// Sprite Animation System for Journey for Water
// Handles 2D sprite sheet animations for game characters

class SpriteAnimation {
    constructor(imagePath, frameWidth, frameHeight, framesPerRow, totalFrames) {
        this.imagePath = imagePath;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.framesPerRow = framesPerRow;
        this.totalFrames = totalFrames;
        
        this.image = new Image();
        this.imageLoaded = false;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.animationSpeed = 100; // milliseconds per frame
        this.isPlaying = false;
        this.loop = true;
        
        // Animation sequences
        this.sequences = {};
        this.currentSequence = null;
        
        this.loadImage();
    }
    
    loadImage() {
        this.image.onload = () => {
            this.imageLoaded = true;
            console.log(`Sprite sheet loaded: ${this.imagePath}`);
        };
        
        this.image.onerror = () => {
            console.error(`Failed to load sprite sheet: ${this.imagePath}`);
        };
        
        this.image.src = this.imagePath;
    }
    
    // Define animation sequences
    addSequence(name, frames, speed = 100, loop = true) {
        this.sequences[name] = {
            frames: frames,
            speed: speed,
            loop: loop,
            currentFrame: 0
        };
    }
    
    // Play a specific animation sequence
    playSequence(name) {
        if (this.sequences[name]) {
            this.currentSequence = name;
            this.sequences[name].currentFrame = 0;
            this.animationSpeed = this.sequences[name].speed;
            this.loop = this.sequences[name].loop;
            
            // Special handling for idle - don't animate single frame sequences
            if (name === 'idle' && this.sequences[name].frames.length === 1) {
                this.isPlaying = false;
                this.currentFrame = this.sequences[name].frames[0];
            } else {
                this.isPlaying = true;
            }
            
            this.frameTimer = 0;
        }
    }
    
    // Update animation
    update(deltaTime) {
        if (!this.isPlaying || !this.imageLoaded) return;
        
        this.frameTimer += deltaTime;
        
        if (this.frameTimer >= this.animationSpeed) {
            this.frameTimer = 0;
            
            if (this.currentSequence) {
                const sequence = this.sequences[this.currentSequence];
                sequence.currentFrame++;
                
                if (sequence.currentFrame >= sequence.frames.length) {
                    if (sequence.loop) {
                        sequence.currentFrame = 0;
                    } else {
                        sequence.currentFrame = sequence.frames.length - 1;
                        this.isPlaying = false;
                    }
                }
                
                this.currentFrame = sequence.frames[sequence.currentFrame];
            } else {
                // Default frame-by-frame animation
                this.currentFrame++;
                if (this.currentFrame >= this.totalFrames) {
                    if (this.loop) {
                        this.currentFrame = 0;
                    } else {
                        this.currentFrame = this.totalFrames - 1;
                        this.isPlaying = false;
                    }
                }
            }
        }
    }
    
    // Get current frame position in sprite sheet
    getCurrentFramePosition() {
        const row = Math.floor(this.currentFrame / this.framesPerRow);
        const col = this.currentFrame % this.framesPerRow;
        
        return {
            x: col * this.frameWidth,
            y: row * this.frameHeight,
            width: this.frameWidth,
            height: this.frameHeight
        };
    }
    
    // Draw the current frame
    draw(ctx, x, y, width = this.frameWidth, height = this.frameHeight) {
        if (!this.imageLoaded) return;
        
        const framePos = this.getCurrentFramePosition();
        
        ctx.drawImage(
            this.image,
            framePos.x, framePos.y, framePos.width, framePos.height,
            x, y, width, height
        );
    }
    
    // Control methods
    play() {
        this.isPlaying = true;
    }
    
    pause() {
        this.isPlaying = false;
    }
    
    stop() {
        this.isPlaying = false;
        this.currentFrame = 0;
        if (this.currentSequence) {
            this.sequences[this.currentSequence].currentFrame = 0;
        }
    }
    
    // Force set to specific frame and stop animation
    setFrameAndStop(frame) {
        this.isPlaying = false;
        this.currentFrame = frame;
        if (this.currentSequence) {
            this.sequences[this.currentSequence].currentFrame = 0;
        }
    }
    
    setFrame(frame) {
        if (frame >= 0 && frame < this.totalFrames) {
            this.currentFrame = frame;
        }
    }
    
    setSpeed(speed) {
        this.animationSpeed = speed;
    }
}

// Character Animation Controller
class CharacterAnimator {
    constructor(spriteSheet) {
        this.spriteSheet = spriteSheet;
        this.facing = 'right'; // 'left' or 'right'
        this.isMoving = false;
        this.isJumping = false;
        
        this.setupAnimations();
    }
    
    setupAnimations() {
        // Based on the 8-frame sprite sheet (2 rows, 4 columns)
        // Top row: frames 0-3, Bottom row: frames 4-7
        
        // Breathing/Idle animation - use only first frame for now to stop constant cycling
        this.spriteSheet.addSequence('idle', [0], 1000, true);
        this.spriteSheet.addSequence('breathing', [0], 1000, true);
        
        // Walking animation using select frames for smoother walk
        this.spriteSheet.addSequence('walk', [1, 2, 3, 4], 200, true);
        
        // Running animation using movement frames
        this.spriteSheet.addSequence('run', [1, 2, 3, 4, 5, 6], 120, true);
        
        // Start/Stop run transitions
        this.spriteSheet.addSequence('startRun', [0, 1, 2], 120, false);
        this.spriteSheet.addSequence('stopRun', [6, 4, 0], 120, false);
        
        // Jump arc animations
        this.spriteSheet.addSequence('jumpStart', [1, 2], 100, false); // Crouch and push off
        this.spriteSheet.addSequence('jumpAir', [3, 4], 200, true);     // Mid-air poses
        this.spriteSheet.addSequence('jumpLand', [5, 6, 0], 100, false); // Landing and recovery
        
        // Fall animation (different from jump)
        this.spriteSheet.addSequence('fall', [4, 5], 200, true);
        this.spriteSheet.addSequence('hit', [7], 300, false); // Hit reaction
        
        // Crouch/Duck
        this.spriteSheet.addSequence('crouch', [1], 300, true);
        this.spriteSheet.addSequence('duck', [1, 2], 400, true);
        
        // Climb/Vault animations
        this.spriteSheet.addSequence('climb', [2, 3, 4], 150, false);
        this.spriteSheet.addSequence('vault', [3, 4, 5], 120, false);
        
        // Turn/Pivot - quick direction change
        this.spriteSheet.addSequence('turnLeft', [0, 7], 80, false);
        this.spriteSheet.addSequence('turnRight', [0, 1], 80, false);
        
        // Collect/Interact
        this.spriteSheet.addSequence('collect', [2, 3], 200, false);
        this.spriteSheet.addSequence('interact', [1, 2, 1], 150, false);
        
        // Celebrate/Victory
        this.spriteSheet.addSequence('celebrate', [0, 3, 0, 4, 0], 200, false);
        this.spriteSheet.addSequence('victory', [3, 4, 3, 4], 300, true);
        
        // Death/Game Over
        this.spriteSheet.addSequence('death', [7, 6, 1], 400, false);
        this.spriteSheet.addSequence('collapse', [0, 1, 2, 1], 500, false);
    }
    
    update(deltaTime, gameState = {}) {
        // Extract game state properties
        const {
            isMoving = false,
            isRunning = false,
            isJumping = false,
            isFalling = false,
            isOnGround = true,
            isCollecting = false,
            isCrouching = false,
            facingDirection = 'right',
            previousFacingDirection = 'right',
            isHit = false,
            isDead = false,
            isVictorious = false,
            justLanded = false,
            justStartedMoving = false,
            justStoppedMoving = false
        } = gameState;
        
        this.isMoving = isMoving;
        
        // Update sprite animation
        this.spriteSheet.update(deltaTime);
        
        // Simplified state machine for animation selection
        let targetSequence = 'idle';
        
        // Basic movement-based animation selection
        if (isMoving) {
            if (isRunning) {
                targetSequence = 'run';
            } else {
                targetSequence = 'walk';
            }
        } else {
            targetSequence = 'idle';
        }
        
        // Apply animation if different from current
        if (this.spriteSheet.currentSequence !== targetSequence) {
            console.log(`Animation change: ${this.spriteSheet.currentSequence} -> ${targetSequence}`);
            this.spriteSheet.playSequence(targetSequence);
        }
    }
    
    draw(ctx, x, y, width, height, flipHorizontal = false) {
        if (flipHorizontal) {
            ctx.save();
            ctx.scale(-1, 1);
            this.spriteSheet.draw(ctx, -x - width, y, width, height);
            ctx.restore();
        } else {
            this.spriteSheet.draw(ctx, x, y, width, height);
        }
    }
    
    setFacing(direction) {
        this.facing = direction;
    }
}

// Example usage for HTML5 Canvas
class CanvasCharacterDemo {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        if (!this.canvas || !this.ctx) {
            console.error('Canvas not found or context not available');
            return;
        }
        
        // Character setup - 1024x1024 sprite sheet with 3x2 grid (6 frames)
        this.characterSprite = new SpriteAnimation('assets/char25d.png', 341, 512, 3, 6);
        this.characterAnimator = new CharacterAnimator(this.characterSprite);
        
        // Character properties - adjusted for larger sprite frames
        this.character = {
            x: this.canvas.width / 2 - 60, // Center horizontally, offset for sprite width
            y: this.canvas.height - 180, // Near bottom, accounting for sprite height
            width: 120,  // Scaled down from 341 to fit canvas nicely
            height: 180, // Scaled down from 512 to fit canvas nicely
            speed: 3,
            isMoving: false,
            isRunning: false,
            facingLeft: false
        };
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Animation loop
        this.lastTime = 0;
        this.isRunning = false;
        
        // Wait for sprite to load before starting animation
        this.waitForSpriteLoad();
    }
    
    waitForSpriteLoad() {
        console.log('Waiting for sprite to load...');
        const checkLoad = () => {
            if (this.characterSprite.imageLoaded) {
                console.log('Sprite loaded! Starting animation loop...');
                this.isRunning = true;
                this.animationLoop();
            } else {
                setTimeout(checkLoad, 100);
            }
        };
        checkLoad();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    update(deltaTime) {
        // Handle movement
        let isMoving = false;
        let isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        let speed = isRunning ? this.character.speed * 2 : this.character.speed;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.character.x -= speed;
            this.character.facingLeft = true;
            isMoving = true;
        }
        
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.character.x += speed;
            this.character.facingLeft = false;
            isMoving = true;
        }
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.character.y -= speed;
            isMoving = true;
        }
        
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.character.y += speed;
            isMoving = true;
        }
        
        // Keep character on screen
        this.character.x = Math.max(0, Math.min(this.canvas.width - this.character.width, this.character.x));
        this.character.y = Math.max(0, Math.min(this.canvas.height - this.character.height, this.character.y));
        
        // Update character state
        this.character.isMoving = isMoving;
        this.character.isRunning = isRunning;
        
        // Update animator
        this.characterAnimator.update(deltaTime, isMoving, isRunning);
    }
    
    draw() {
        if (!this.isRunning) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(1, '#B0E0E6'); // Powder blue
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#DEB887'; // Burlywood
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Draw character shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(
            this.character.x + 10, 
            this.character.y + this.character.height - 10, 
            this.character.width - 20, 
            15
        );
        
        // Draw character bounds for debugging
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.character.x, this.character.y, this.character.width, this.character.height);
        
        // Draw character
        if (this.characterSprite.imageLoaded) {
            this.characterAnimator.draw(
                this.ctx,
                this.character.x,
                this.character.y,
                this.character.width,
                this.character.height,
                this.character.facingLeft
            );
        } else {
            // Show loading message
            this.ctx.fillStyle = '#000';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Loading character sprite...', this.character.x, this.character.y + this.character.height/2);
        }
        
        // Draw instructions
        this.ctx.fillStyle = '#000';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Use Arrow Keys or WASD to move', 10, 20);
        this.ctx.fillText('Hold Shift to run', 10, 40);
        
        // Draw debug info
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Sprite loaded: ${this.characterSprite.imageLoaded}`, 10, this.canvas.height - 60);
        this.ctx.fillText(`Animation: ${this.characterSprite.currentSequence || 'default'}`, 10, this.canvas.height - 45);
        this.ctx.fillText(`Frame: ${this.characterSprite.currentFrame}`, 10, this.canvas.height - 30);
        this.ctx.fillText(`Position: (${Math.round(this.character.x)}, ${Math.round(this.character.y)})`, 10, this.canvas.height - 15);
    }
    
    animationLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.animationLoop(time));
    }
}
