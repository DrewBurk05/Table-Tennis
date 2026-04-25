# 🏓 Table Tennis Game

A fully-featured Table Tennis game built with vanilla JavaScript and HTML5 Canvas, featuring three difficulty levels with AI opponents.

## 🎮 Features

### Three Difficulty Levels
- **Easy**: Slow ball (4 px/frame), predictable AI, minimal spin
- **Medium**: Moderate speed (6 px/frame), balanced gameplay
- **Hard**: Fast ball (8 px/frame), intelligent AI, advanced spin mechanics

### Realistic Table Tennis Rules
✅ Win at 11 points with 2-point minimum lead  
✅ Proper net and table boundaries  
✅ Spin mechanics affecting ball trajectory  
✅ Standard table dimensions (800x400)  
✅ Ball physics with friction and velocity caps  
✅ Paddle collision detection with spin application  

### Gameplay Mechanics
- Intelligent AI opponent with difficulty-based reaction times
- Ball trajectory prediction for AI movement
- Smooth 60 FPS gameplay
- Pause/Resume functionality
- Live scoreboard with real-time updates
- Win condition detection with automatic game-over

## 🎮 Controls

| Key | Action |
|-----|--------|
| **Arrow Up** or **W** | Move paddle up |
| **Arrow Down** or **S** | Move paddle down |
| **Space** | Pause/Resume game |

## 🚀 How to Play

1. Open `index.html` in your web browser
2. Select a difficulty level (Easy, Medium, or Hard)
3. Use arrow keys or WASD to move your paddle
4. First to 11 points with a 2-point lead wins!
5. Press Space to pause at any time

## 🎯 Game Physics

### Ball Mechanics
- **Spin**: Applied based on where the ball hits the paddle (top/bottom)
- **Friction**: Ball gradually slows down (0.99 multiplier per frame)
- **Velocity Cap**: Maximum ball speed prevents runaway physics
- **Collision Detection**: Accurate paddle and wall bouncing

### AI Behavior
- Predicts ball trajectory based on current velocity and spin
- Reaction time varies by difficulty (100ms → 20ms)
- Prediction accuracy scales from 60% to 95%
- Adapts paddle speed based on ball speed

## 📁 File Structure

```
Table-Tennis/
├── index.html      # Main HTML page with UI
├── style.css       # Complete styling and responsive design
├── game.js         # Game logic, physics, and AI
└── README.md       # This file
```

## 🔧 Technical Details

### Technologies Used
- **HTML5** - Page structure
- **CSS3** - Styling with gradients and animations
- **Vanilla JavaScript** - Game loop and physics engine
- **Canvas API** - Rendering

### Key Components
- `gameState` - Tracks game progress and settings
- `playerPaddle` / `aiPaddle` - Paddle objects with position/velocity
- `ball` - Ball physics with spin and friction
- `aiState` - AI prediction and reaction system
- `DIFFICULTY_SETTINGS` - Configurable parameters per difficulty
- `GAME_RULES` - Enforces table tennis regulations

## 🎓 Learning Resources

This project demonstrates:
- Canvas rendering and animation loops
- 2D collision detection
- Physics simulation (velocity, friction, spin)
- AI decision-making and pathfinding
- Event handling and keyboard input
- Game state management
- Responsive UI design

## 📊 Difficulty Comparison

| Aspect | Easy | Medium | Hard |
|--------|------|--------|------|
| Ball Speed | 4 px/frame | 6 px/frame | 8 px/frame |
| AI Reaction | 100ms | 50ms | 20ms |
| Prediction Accuracy | 60% | 75% | 95% |
| Spin Multiplier | 0.5x | 0.75x | 1.0x |

## 🐛 Known Issues

None currently. Report any bugs by opening an issue!

## 📝 License

Open source - feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Feel free to submit pull requests with improvements.

---

**Enjoy the game! 🏓**