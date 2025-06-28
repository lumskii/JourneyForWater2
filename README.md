# Journey for Water - 2D/2.5D Platformer Prototype

A browser-based platformer game that simulates the daily journey to collect clean water, built with Three.js, vanilla JavaScript, and Tailwind CSS.

## 🎮 Game Overview

Journey for Water is an educational platformer that raises awareness about water scarcity by putting players in the shoes of someone who must walk daily to collect clean water for their family.

## 🎯 Game Flow

1. **Splash Screen** - Introduction with charity: water branding
2. **Morning Prep** - Mission briefing and objectives
3. **Journey Level** - Side-scrolling platformer to water source
4. **Water Collection Mini-game** - Skill-based water filling challenge
5. **Return Journey** - Platformer level back home
6. **Day Summary** - Results and achievements
7. **Leaderboard** - Compare scores and donate to charity: water

## 🎮 Gameplay Features

### Platformer Mechanics
- **Movement**: Arrow keys or WASD for left/right movement
- **Jumping**: Spacebar or W/Up arrow for jumping
- **Mobile Controls**: Touch buttons for mobile devices
- **Physics**: Gravity, collision detection, and platform jumping

### Water Collection
- **Jerry Cans**: Click yellow jerry cans scattered throughout the level
- **Points**: Each can collected adds 1 water point
- **Visual Feedback**: Cans flash green when collected

### Mini-game
- **Water Filling**: Click "Stop" when the marker is in the green zone
- **Scoring**: Perfect timing = 30-50 points, Good = 15-30 points, Miss = 5-15 points
- **Skill-based**: Requires timing and precision

### HUD Elements
- **Energy Bar**: Decreases over time, turns red when below 20%
- **Water Points**: Real-time counter with animation effects
- **Day Counter**: Current day number
- **Time of Day**: Morning/Afternoon indicator

## 🛠 Technical Implementation

### Technologies Used
- **Three.js**: 3D rendering for platformer levels
- **Vanilla JavaScript**: Game logic and state management
- **Tailwind CSS**: Responsive UI and styling
- **HTML5**: Game structure and canvas elements

### Key Components

#### App.js
- Main game controller
- Screen transitions and state management
- HUD updates and animations
- Mini-game logic

#### JourneyLevel.js
- Three.js scene setup and rendering
- Player physics and movement
- Collision detection
- Jerry can collection system
- Camera following and side-scrolling

#### index.css
- Custom animations and transitions
- Responsive design utilities
- Game-specific styling

## 🎨 Design Features

### Brand Alignment
- **charity: water Colors**: Blue (#00B4FF) for UI accents, Yellow (#FFD800) for jerry cans
- **Earth Tones**: Brown backgrounds representing the journey environment
- **Accessibility**: High contrast and focus indicators

### Responsive Design
- **Mobile-First**: Touch controls and responsive layout
- **Desktop Optimized**: Keyboard controls and larger viewport
- **Cross-Platform**: Works on all modern browsers

### Visual Effects
- **Smooth Transitions**: Fade and slide animations between screens
- **Particle Effects**: Water points pop animation
- **Color Feedback**: Energy bar color changes, jerry can flashing

## 🚀 How to Run

1. **Clone or Download** the project files
2. **Open** `index.html` in a modern web browser
3. **Start Playing** by clicking "Start Journey"

### Local Development
```bash
# If you have a local server (optional)
python -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000` in your browser.

## 🎯 Game Objectives

### Educational Goals
- **Awareness**: Highlight the daily challenges of water collection
- **Empathy**: Put players in the shoes of those affected by water scarcity
- **Action**: Encourage donations to charity: water

### Gameplay Goals
- **Engagement**: Fun platformer mechanics with meaningful context
- **Skill Development**: Timing and precision in mini-game
- **Progression**: Clear feedback and achievement system

## 🔧 Customization

### Adding New Levels
1. Modify `JourneyLevel.js` to create different level layouts
2. Adjust platform positions and jerry can placement
3. Update level completion conditions

### Modifying Game Balance
- **Energy Drain**: Adjust energy consumption rate
- **Point Values**: Change jerry can and mini-game point values
- **Difficulty**: Modify platform spacing and jump requirements

### Branding Updates
- **Colors**: Update CSS variables for new brand colors
- **Logos**: Replace charity: water branding
- **Content**: Modify text and messaging

## 🌟 Future Enhancements

### Potential Features
- **Multiple Days**: Progressive difficulty and story elements
- **Character Customization**: Different avatars and abilities
- **Environmental Hazards**: Obstacles and challenges
- **Sound Effects**: Audio feedback and ambient sounds
- **Local Storage**: Save progress and high scores
- **Multiplayer**: Compare scores with friends

### Technical Improvements
- **Performance**: Optimize Three.js rendering
- **Mobile**: Enhanced touch controls and gestures
- **Accessibility**: Screen reader support and keyboard navigation
- **Analytics**: Track gameplay metrics and engagement

## 📱 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Touch controls supported

## 🤝 Contributing

This is a prototype for educational purposes. Feel free to:
- Report bugs or issues
- Suggest improvements
- Fork and modify for your own projects
- Share with others to raise awareness

## 📄 License

This project is created for educational and awareness purposes. The game concept and mechanics are original, while the charity: water branding and mission are used with respect to their cause.

## 🙏 Acknowledgments

- **charity: water** for their mission to bring clean water to everyone
- **Three.js** community for the excellent 3D library
- **Tailwind CSS** for the utility-first CSS framework

---

**Play the game and experience the daily journey for water! 💧** 