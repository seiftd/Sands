
import { eventBus } from './eventBus.js';

export const GameState = {
  turn: 1,
  currentPlayer: 0,
  players: [
    { id: 0, name: "Player 1", color: 0xff0000, position: 0 },
    { id: 1, name: "Player 2", color: 0x0000ff, position: 0 }
  ],
  isRolling: false,

  init() {
    console.log("GameState Initialized");
    this.setupListeners();
  },

  setupListeners() {
    eventBus.on('DICE_ROLLED', (value) => {
      console.log(`Logic: Dice landed on ${value}`);
      this.handleMove(value);
    });
  },

  handleMove(steps) {
    // Placeholder for movement logic
    const player = this.players[this.currentPlayer];
    const oldPos = player.position;
    player.position = (player.position + steps) % 20; // 20 tiles
    
    console.log(`${player.name} moves from ${oldPos} to ${player.position}`);
    
    // Switch turn logic (simplified)
    this.isRolling = false;
    eventBus.emit('TURN_CHANGED', this.currentPlayer);
  }
};
