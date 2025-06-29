// Three.js Integration for Sprite Animation
// Allows 2D sprite animations to be used in 3D Three.js scenes

class ThreeJSSpriteCharacter {
    constructor(scene, spriteAnimation, position = { x: 0, y: 0, z: 0 }) {
        this.scene = scene;
        this.spriteAnimation = spriteAnimation;
        this.position = position;
        
        // Three.js components
        this.canvas = null;
        this.ctx = null;
        this.texture = null;
        this.material = null;
        this.geometry = null;
        this.mesh = null;
        
        // Animation state
        this.facingLeft = false;
        this.isMoving = false;
        this.isRunning = false;
        
        this.init();
    }
    
    init() {
        // Create canvas for dynamic texture - larger canvas for higher quality sprite
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;  // Even larger canvas for better quality
        this.canvas.height = 1024;
        this.ctx = this.canvas.getContext('2d');
        
        // Create Three.js texture from canvas
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.magFilter = THREE.LinearFilter; // Better filtering for scaling
        this.texture.minFilter = THREE.LinearFilter;
        
        // Create material with transparency
        this.material = new THREE.SpriteMaterial({
            map: this.texture,
            transparent: true,
            alphaTest: 0.1
        });
        
        // Create sprite
        this.sprite = new THREE.Sprite(this.material);
        this.sprite.position.set(this.position.x, this.position.y, this.position.z);
        this.sprite.scale.set(2.5, 3, 1); // Balanced scale for good visibility without overwhelming the scene
        
        // Add to scene
        this.scene.add(this.sprite);
        
        // Setup character animator
        this.characterAnimator = new CharacterAnimator(this.spriteAnimation);
    }
    
    update(deltaTime, isMoving = false, isRunning = false, facingLeft = false) {
        this.isMoving = isMoving;
        this.isRunning = isRunning;
        this.facingLeft = facingLeft;
        
        // Update animation
        this.characterAnimator.update(deltaTime, isMoving, isRunning);
        
        // Clear canvas with transparent background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw character centered on canvas - using more of the canvas space
        const charWidth = 600;  // Larger size for 1024x1024 canvas - using more of the original sprite dimensions
        const charHeight = 800; // Larger size for 1024x1024 canvas - closer to original 341x512 aspect ratio
        const x = (this.canvas.width - charWidth) / 2;
        const y = (this.canvas.height - charHeight) / 2;
        
        // Add a subtle background for better visibility
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(x - 10, y - 10, charWidth + 20, charHeight + 20);
        
        this.characterAnimator.draw(this.ctx, x, y, charWidth, charHeight, facingLeft);
        
        // Update texture
        this.texture.needsUpdate = true;
    }
    
    setPosition(x, y, z) {
        this.sprite.position.set(x, y, z);
    }
    
    getPosition() {
        return this.sprite.position;
    }
    
    setScale(scale) {
        this.sprite.scale.set(scale, scale, 1);
    }
    
    dispose() {
        if (this.sprite) {
            this.scene.remove(this.sprite);
        }
        if (this.texture) {
            this.texture.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
    }
}

// Helper function to integrate with existing JourneyLevel class
class JourneyLevelSpriteIntegration {
    static addSpriteCharacterToLevel(journeyLevel, spritePath = 'assets/char25d.png') {
        // Create sprite animation
        const spriteAnimation = new SpriteAnimation(spritePath, 64, 64, 3, 6);
        
        // Wait for image to load before creating Three.js sprite
        const checkImageLoaded = () => {
            if (spriteAnimation.imageLoaded) {
                // Replace or enhance the existing player with sprite animation
                const spriteCharacter = new ThreeJSSpriteCharacter(
                    journeyLevel.scene,
                    spriteAnimation,
                    journeyLevel.player ? journeyLevel.player.position : { x: 0, y: 2, z: 0 }
                );
                
                // Store reference for updates
                journeyLevel.spriteCharacter = spriteCharacter;
                
                // Enhance the existing update method
                const originalUpdate = journeyLevel.update.bind(journeyLevel);
                journeyLevel.update = function() {
                    // Call original update
                    originalUpdate();
                    
                    // Update sprite character
                    if (this.spriteCharacter) {
                        const isMoving = Math.abs(this.playerVelocity.x) > 0.01;
                        const isRunning = Math.abs(this.playerVelocity.x) > this.moveSpeed * 1.5;
                        const facingLeft = this.playerVelocity.x < 0;
                        
                        this.spriteCharacter.update(16, isMoving, isRunning, facingLeft);
                        
                        // Sync position with 3D player
                        if (this.player) {
                            this.spriteCharacter.setPosition(
                                this.player.position.x,
                                this.player.position.y + 1, // Slightly above the 3D player
                                this.player.position.z
                            );
                        }
                    }
                };
                
                console.log('Sprite character integrated with Journey Level!');
            } else {
                setTimeout(checkImageLoaded, 100);
            }
        };
        
        checkImageLoaded();
    }
}

// Export for use with existing game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThreeJSSpriteCharacter,
        JourneyLevelSpriteIntegration
    };
}
