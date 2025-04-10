# Puyo Puyo vs. CPU Game

A browser-based competitive puzzle game inspired by the classic "Puyo Puyo."  
This project implements a two-player battle between a human player and a CPU opponent, where matched chain reactions damage the opponent’s HP. The game is built using React, HTML Canvas, and Tailwind CSS, with responsiveness and on-screen mobile controls to ensure playability on both desktop and mobile devices.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation & Usage](#installation--usage)
- [Project Structure](#project-structure)
- [Gameplay](#gameplay)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## Overview

This project is a simplified, yet fun, take on the Puyo Puyo formula:
- **Dual Playing Fields**: One for the player and one for the CPU opponent.
- **Chain Reactions**: Matching four or more connected pieces triggers their removal, dealing damage to the opponent.
- **Responsive Design**: The game adapts to various screen sizes. Mobile users are provided with on-screen control buttons, while desktop users can use the keyboard.
- **Basic CPU AI**: A simple randomized algorithm simulates CPU moves.

## Features

- **Falling Pieces**  
  Pieces fall at regular intervals (gravity), and collision detection ensures they’re fixed in place on the board.

- **Chain Reaction Detection**  
  When four or more adjacent pieces of the same color are connected, they disappear.

- **Damage Calculation**  
  Chain reactions inflict damage using a basic formula (e.g., *chain count × 50 + popped pieces × 2*).

- **Responsive Canvas Rendering**  
  Game boards are drawn with HTML Canvas. Tailwind CSS provides a responsive layout for various screen sizes.

- **Multiple Control Options**  
  Keyboard (arrow keys) on desktop; on-screen buttons for mobile.

## Technologies Used

- **React** – Builds the user interface and manages game state.  
- **HTML Canvas API** – Draws the game board and pieces.  
- **Tailwind CSS** – Provides responsive styling.  
- **GitHub Pages** – Hosts the static site via the `gh-pages` package.

## Installation & Usage

1. **Clone the repository**  
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<REPOSITORY_NAME>.git
   cd <REPOSITORY_NAME>
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Run the development server**  
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to play the game locally.

4. **Deploy to GitHub Pages**  
   ```bash
   npm run deploy
   ```
   The app will be built and deployed to the `gh-pages` branch. After a short wait, it becomes accessible at:
   ```
   https://<YOUR_USERNAME>.github.io/<REPOSITORY_NAME>/
   ```

## Project Structure

```
puyopuyo-game/
├── package.json
├── public/
│   └── index.html
└── src/
    ├── App.js           // Main layout and game restart controls
    ├── index.js         // Entry point for the React application
    └── components/
        └── DualBoard.js // Game logic for Player vs. CPU
```

## Gameplay

- **Objective**  
  Build chain reactions to damage your opponent. The side that reduces the other’s HP to 0 first wins.

- **Controls**  
  - **Desktop (Keyboard)**  
    - **Arrow Left/Right**: Move the falling piece sideways  
    - **Arrow Up**: Rotate the piece  
    - **Arrow Down**: Quick-drop the piece  
  - **Mobile (On-Screen Buttons)**  
    - Same functionality as keyboard, displayed on small screens

## Future Improvements

- **Advanced CPU AI**  
  Enhance the CPU’s strategy for more competitive play.

- **Enhanced Animations & Sound**  
  Add smoother transitions and sound effects (e.g., using GSAP).

- **Multiplayer Options**  
  Explore online multiplayer or local versus modes.

- **UI Polish**  
  Further refine the user interface for a more engaging experience.

## Contributing

Contributions, bug reports, and feature requests are welcome. Please open an issue or submit a pull request to help improve this project.

## License

This project is licensed under the [MIT License](LICENSE).
