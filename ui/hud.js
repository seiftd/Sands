
import { eventBus } from '../core/eventBus.js';

export class Hud {
  constructor() {
    this.container = document.getElementById('ui-layer');
    this.render();
    this.setupListeners();
  }

  render() {
    this.container.innerHTML = `
      <div style="position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <div id="dice-result" style="font-size: 24px; color: white; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Ready</div>
        <button id="roll-btn" class="interactive" style="
          background: linear-gradient(to bottom, #d97706, #b45309);
          border: 2px solid white;
          color: white;
          padding: 15px 40px;
          font-size: 20px;
          border-radius: 30px;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          font-family: inherit;
        ">Roll Dice</button>
      </div>
    `;

    this.rollBtn = document.getElementById('roll-btn');
    this.resultText = document.getElementById('dice-result');

    this.rollBtn.addEventListener('click', () => {
      eventBus.emit('REQUEST_ROLL', null);
    });
  }

  setupListeners() {
    eventBus.on('DICE_ROLLED', (value) => {
      this.resultText.innerText = `Result: ${value}`;
      this.rollBtn.disabled = false;
      this.rollBtn.style.opacity = '1';
    });

    eventBus.on('REQUEST_ROLL', () => {
      this.resultText.innerText = 'Rolling...';
      this.rollBtn.disabled = true;
      this.rollBtn.style.opacity = '0.7';
    });
  }
}
