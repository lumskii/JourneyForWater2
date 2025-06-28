# Sprite Animation System - Usage Guide

## Overview
The sprite animation system converts your 6-frame character sprite sheet into a fully functional animated character suitable for JavaScript games. The system supports both 2D Canvas and 3D Three.js environments.

## Files Created
- `SpriteAnimation.js` - Core sprite animation system
- `ThreeJSSpriteIntegration.js` - Three.js integration
- `sprite-demo.html` - Standalone demo
- `README-SpriteAnimation.md` - This guide

## Sprite Sheet Details
- **Image**: `assets/char25d.png`
- **Dimensions**: 6 frames in a 2x3 grid (3 columns, 2 rows)
- **Frame Size**: 64x64 pixels each
- **Animation**: Walking/running cycle with water container

## Quick Start

### 1. Basic Canvas Implementation
```javascript
// Create sprite animation
const characterSprite = new SpriteAnimation('assets/char25d.png', 64, 64, 3, 6);
const characterAnimator = new CharacterAnimator(characterSprite);

// In your game loop
function update(deltaTime) {
    const isMoving = /* your movement logic */;
    const isRunning = /* your running logic */;
    characterAnimator.update(deltaTime, isMoving, isRunning);
}

function draw(ctx, x, y) {
    const facingLeft = /* your direction logic */;
    characterAnimator.draw(ctx, x, y, 64, 64, facingLeft);
}
```

### 2. Three.js Integration
```javascript
// Add to existing JourneyLevel
JourneyLevelSpriteIntegration.addSpriteCharacterToLevel(journeyLevel);

// Or create manually
const spriteCharacter = new ThreeJSSpriteCharacter(scene, spriteAnimation);
```

## Animation Sequences

### Built-in Sequences
- **idle**: Single frame (frame 0)
- **walk**: All 6 frames at normal speed (120ms per frame)
- **run**: All 6 frames at fast speed (80ms per frame)

### Custom Sequences
```javascript
// Add custom animation sequence
spriteAnimation.addSequence('customWalk', [0, 2, 4], 150, true);
spriteAnimation.playSequence('customWalk');
```

## Features

### ✅ Core Features
- 6-frame smooth walking animation
- Idle, walk, and run states
- Horizontal flipping for directional movement
- Configurable animation speeds
- Loop and one-shot animations
- Canvas and WebGL compatibility

### ✅ Advanced Features
- Sequence-based animation system
- Three.js sprite integration
- Dynamic texture updates
- Memory-efficient rendering
- Mobile-friendly controls

## Demo Instructions

### Running the Demo
1. Open `sprite-demo.html` in a web browser
2. Use Arrow Keys or WASD to move the character
3. Hold Shift to run (faster animation)
4. Release keys to see idle animation

### Controls
- **Arrow Keys / WASD**: Move character
- **Shift**: Run mode (faster movement and animation)
- **No input**: Idle animation

## Integration with Existing Game

### Method 1: Automatic Integration
```javascript
// Add this after JourneyLevel is created
JourneyLevelSpriteIntegration.addSpriteCharacterToLevel(journeyLevel);
```

### Method 2: Manual Integration
```javascript
// In your JourneyLevel constructor
this.characterSprite = new SpriteAnimation('assets/char25d.png', 64, 64, 3, 6);
this.characterAnimator = new CharacterAnimator(this.characterSprite);

// In your update method
const isMoving = Math.abs(this.playerVelocity.x) > 0.01;
const isRunning = Math.abs(this.playerVelocity.x) > this.moveSpeed * 1.5;
const facingLeft = this.playerVelocity.x < 0;
this.characterAnimator.update(deltaTime, isMoving, isRunning);

// In your render method (for 2D overlay)
this.characterAnimator.draw(ctx, playerX, playerY, 64, 64, facingLeft);
```

## Technical Details

### Sprite Sheet Layout
```
Frame 0  Frame 1  Frame 2
Frame 3  Frame 4  Frame 5
```

### Performance Considerations
- Uses requestAnimationFrame for smooth animation
- Efficient canvas-based texture updates for Three.js
- Minimal memory footprint
- Optimized for 60fps gameplay

### Browser Compatibility
- Modern browsers with Canvas 2D support
- WebGL support for Three.js integration
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement approach

## Customization

### Animation Speed
```javascript
characterAnimator.spriteSheet.setSpeed(100); // milliseconds per frame
```

### Custom Frame Sequences
```javascript
// Define custom walking pattern
spriteSheet.addSequence('slowWalk', [0, 1, 3, 4], 200, true);
```

### Scale and Positioning
```javascript
// For Canvas
characterAnimator.draw(ctx, x, y, 128, 128, facingLeft); // Double size

// For Three.js
spriteCharacter.setScale(3); // Triple size
spriteCharacter.setPosition(x, y, z);
```

## Troubleshooting

### Common Issues
1. **Image not loading**: Check file path and CORS policy
2. **Animation not smooth**: Ensure consistent deltaTime updates
3. **Three.js integration issues**: Verify Three.js is loaded before sprites

### Debug Mode
```javascript
// Enable debug logging
console.log('Current frame:', spriteAnimation.currentFrame);
console.log('Current sequence:', spriteAnimation.currentSequence);
console.log('Image loaded:', spriteAnimation.imageLoaded);
```

## Future Enhancements
- Multiple character sprite sheets
- Animation blending and transitions
- Particle effects integration
- Sound synchronization
- Inverse kinematics for realistic movement

## Credits
- Character sprite sheet: Journey for Water game assets
- Animation system: Custom JavaScript implementation
- Three.js integration: Compatible with Three.js r158+
