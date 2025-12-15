
import { GameScene } from './three/scene.js';
import { Board } from './three/board.js';
import { DiceManager } from './three/dice.js';
import { Hud } from './ui/hud.js';
import { GameState } from './core/gameState.js';
import { eventBus } from './core/eventBus.js';

class App {
  constructor() {
    console.log("Initializing 3D Board Game...");
    
    // Core
    GameState.init();

    // 3D
    this.gameScene = new GameScene('game-container');
    this.board = new Board(this.gameScene.scene);
    this.diceManager = new DiceManager(this.gameScene.scene);

    // UI
    this.hud = new Hud();

    // Logic Binding
    eventBus.on('REQUEST_ROLL', () => {
      this.diceManager.rollDice();
    });

    // Start Loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update Physics & Objects
    this.diceManager.update();

    // Render
    this.gameScene.render();
  }
}

// Start
new App();
