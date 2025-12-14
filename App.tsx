import React, { useState, useEffect, useRef } from 'react';
import { Tile as TileModel, Player, TileType, CharacterState, GameScreen, CharacterRole } from './types';
import { INITIAL_BOARD, INITIAL_RESOURCES, CHARACTERS_CONFIG, BOARD_SIZE, WINNING_GOLD } from './constants';
import Tile from './components/Tile';
import Dice from './components/Dice';
import Character from './components/Character';
import { getOracleWisdom } from './services/geminiService';
import { Coins, Droplet, Zap, Hammer, Trophy, Settings, Play } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [screen, setScreen] = useState<GameScreen>(GameScreen.HOME);
  const [board, setBoard] = useState<TileModel[]>(INITIAL_BOARD);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [message, setMessage] = useState<string>("Welcome to Civilization of Sands!");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  
  // --- MODAL HELPERS ---
  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  // Audio Refs (Placeholders for assets/audio/...)
  const playSound = (type: 'roll' | 'coin' | 'click' | 'event') => {
    // const audio = new Audio(`assets/audio/${type}.wav`);
    // audio.play().catch(e => console.log('Audio placeholder'));
  };

  // --- HELPERS ---

  const getPlayer = (idx: number) => players[idx];
  const getCurrentPlayer = () => players[currentPlayerIdx];

  const updatePlayer = (id: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const modResource = (pid: number, type: keyof typeof INITIAL_RESOURCES, amount: number) => {
    setPlayers(prev => prev.map(p => {
        if (p.id !== pid) return p;
        const currentAmount = p.resources[type];
        const newAmount = Math.max(0, currentAmount + amount);
        
        // Character Mood Logic
        let newMood = p.mood;
        if (type === 'gold') {
            if (amount > 0) newMood = CharacterState.HAPPY;
            if (amount < 0) newMood = CharacterState.SAD;
        }
        
        // Reset mood after delay
        setTimeout(() => updatePlayer(pid, { mood: CharacterState.IDLE }), 2000);

        return { 
            ...p, 
            resources: { ...p.resources, [type]: newAmount },
            mood: newMood
        };
    }));
  };

  // --- GAME LOGIC ---

  const startGame = (role: CharacterRole) => {
      const config = CHARACTERS_CONFIG.find(c => c.id === role)!;
      
      const humanPlayer: Player = {
          id: 0,
          name: 'You',
          role: role,
          characterId: role, // Used for assets path
          position: 0,
          resources: { ...INITIAL_RESOURCES },
          properties: [],
          inJail: false,
          jailTurns: 0,
          mood: CharacterState.IDLE,
          color: config.color
      };

      // Create a Rival (Random Role)
      const rivalConfig = CHARACTERS_CONFIG.filter(c => c.id !== role)[Math.floor(Math.random() * 3)];
      const rivalPlayer: Player = {
          id: 1,
          name: 'Rival',
          role: rivalConfig.id,
          characterId: rivalConfig.id,
          position: 0,
          resources: { ...INITIAL_RESOURCES },
          properties: [],
          inJail: false,
          jailTurns: 0,
          mood: CharacterState.IDLE,
          color: rivalConfig.color
      };

      setPlayers([humanPlayer, rivalPlayer]);
      setBoard(INITIAL_BOARD); // Reset board
      setCurrentPlayerIdx(0);
      setScreen(GameScreen.PLAYING);
      setMessage(`Game Started! You are the ${config.nameAr.split(' ')[0]}`);
  };

  const handleRollDice = () => {
    if (isRolling || showModal) return;
    
    // Jail Logic
    const player = getCurrentPlayer();
    if (player.inJail) {
        if (player.jailTurns > 0) {
            setMessage(`${player.name} is in Jail! (${player.jailTurns} turns left)`);
            updatePlayer(player.id, { jailTurns: player.jailTurns - 1 });
            setTimeout(endTurn, 1000);
            return;
        } else {
            updatePlayer(player.id, { inJail: false });
            setMessage(`${player.name} is free!`);
        }
    }

    playSound('roll');
    setIsRolling(true);
    
    setTimeout(() => {
        const roll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(roll);
        setIsRolling(false);
        movePlayer(roll);
    }, 800);
  };

  const movePlayer = (steps: number) => {
    const player = getCurrentPlayer();
    let newPos = (player.position + steps) % BOARD_SIZE;
    
    // PASSING START
    if (newPos < player.position) {
        let salary = 100;
        // MERCHANT ABILITY: +50% salary
        if (player.role === CharacterRole.MERCHANT) {
            salary = 150;
            setMessage(`${player.name} (Merchant) earns bonus salary! +150 Gold`);
        } else {
            setMessage(`${player.name} passed Start! +100 Gold`);
        }
        modResource(player.id, 'gold', salary);
        playSound('coin');
    }

    updatePlayer(player.id, { position: newPos });
    setTimeout(() => handleTileEvent(newPos), 500);
  };

  const handleTileEvent = async (tileIdx: number) => {
    const tile = board[tileIdx];
    const player = getCurrentPlayer();
    
    console.log(`${player.name} landed on ${tile.name}`);

    switch (tile.type) {
        case TileType.CITY:
            if (tile.ownerId === undefined) {
                // BUY LOGIC
                // BUILDER ABILITY: 20% Discount
                let cost = tile.price || 100;
                if (player.role === CharacterRole.BUILDER) {
                    cost = Math.floor(cost * 0.8);
                }

                if (player.resources.gold >= cost) {
                    openModal(
                        <div className="text-center p-4">
                            <h3 className="text-xl font-bold mb-2 text-amber-800">Buy Property?</h3>
                            <div className="text-4xl mb-2">🏠</div>
                            <p className="font-bold text-lg">{tile.name}</p>
                            <p className="mb-4 text-gray-600">
                                {player.role === CharacterRole.BUILDER ? <span className="text-green-600 font-bold">Builder Discount! </span> : ''}
                                Cost: {cost} Gold
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => buyProperty(tileIdx, cost)} className="bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-green-700">Buy</button>
                                <button onClick={endTurn} className="bg-gray-400 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-gray-500">Pass</button>
                            </div>
                        </div>
                    );
                    return; 
                } else {
                    setMessage(`Cannot afford ${tile.name} (${cost} Gold).`);
                }
            } else if (tile.ownerId === player.id) {
                // UPGRADE LOGIC
                if ((tile.level || 1) < 3) {
                    let upgradeCost = 100 * (tile.level || 1);
                    // BUILDER ABILITY: 20% Discount
                    if (player.role === CharacterRole.BUILDER) {
                        upgradeCost = Math.floor(upgradeCost * 0.8);
                    }
                    if (player.resources.gold >= upgradeCost) {
                        openModal(
                            <div className="text-center p-4">
                                <h3 className="text-xl font-bold mb-2 text-blue-800">Upgrade City?</h3>
                                <p className="mb-4">Level {tile.level} ➔ {tile.level! + 1}</p>
                                <p className="mb-4 text-sm">Cost: {upgradeCost} Gold</p>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => upgradeProperty(tileIdx, upgradeCost)} className="bg-blue-600 text-white px-4 py-2 rounded-full">Upgrade</button>
                                    <button onClick={endTurn} className="bg-gray-400 text-white px-4 py-2 rounded-full">Skip</button>
                                </div>
                            </div>
                        );
                        return;
                    }
                }
            } else {
                // PAY RENT
                const rent = (tile.rent || 20) * (tile.level || 1);
                const owner = players.find(p => p.id === tile.ownerId);
                setMessage(`Pay rent of ${rent} to ${owner?.name}`);
                modResource(player.id, 'gold', -rent);
                modResource(tile.ownerId!, 'gold', rent);
                playSound('coin');
            }
            break;

        case TileType.TAX:
            // POLITICIAN ABILITY: 50% Tax immunity
            let tax = 50;
            if (player.role === CharacterRole.POLITICIAN) {
                tax = 25;
                setMessage("Politician uses influence: Tax reduced!");
            } else {
                setMessage("Tax Collector demands payment!");
            }
            modResource(player.id, 'gold', -tax);
            break;

        case TileType.EVENT:
        case TileType.OASIS:
            playSound('event');
            let gain = Math.floor(Math.random() * 50) + 20;
            
            // EXPLORER ABILITY: +50% Resources
            if (player.role === CharacterRole.EXPLORER) {
                gain = Math.floor(gain * 1.5);
                setMessage(`Explorer Bonus! Found ${gain} resources.`);
            } else {
                setMessage(`Found ${gain} resources!`);
            }
            
            const resType = tile.type === TileType.OASIS ? 'water' : 'gold';
            modResource(player.id, resType, gain);
            break;

        case TileType.ORACLE:
            const wisdom = await getOracleWisdom(player);
            openModal(
                <div className="text-center p-4">
                     <div className="text-5xl mb-2">🔮</div>
                     <h3 className="text-xl font-bold mb-2 text-indigo-700">The Oracle Speaks</h3>
                     <p className="italic text-lg mb-4 text-gray-700 font-serif">"{wisdom.text}"</p>
                     <p className="font-bold text-sm text-gray-500 border-t pt-2">{wisdom.reward}</p>
                     <button onClick={() => {
                         if (wisdom.delta) {
                             Object.keys(wisdom.delta).forEach(key => {
                                 // @ts-ignore
                                 modResource(player.id, key as any, wisdom.delta[key]);
                             });
                         }
                         endTurn();
                     }} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg">Accept Fate</button>
                </div>
            );
            return;

        case TileType.JAIL:
             // POLITICIAN ABILITY: Less Jail Time? (Already has tax bonus, maybe skip this for simplicity or add later)
             setMessage("Locked in the Dungeon! Skip 2 turns.");
             updatePlayer(player.id, { inJail: true, jailTurns: 2, mood: CharacterState.SAD });
             break;
    }

    if (!showModal) {
        setTimeout(endTurn, 1500);
    }
  };

  const buyProperty = (tileIdx: number, cost: number) => {
      modResource(currentPlayerIdx, 'gold', -cost);
      setBoard(prev => prev.map(t => t.id === tileIdx ? { ...t, ownerId: currentPlayerIdx, level: 1 } : t));
      const player = getCurrentPlayer();
      updatePlayer(player.id, { properties: [...player.properties, tileIdx] });
      playSound('coin');
      closeModal();
      endTurn();
  };

  const upgradeProperty = (tileIdx: number, cost: number) => {
      modResource(currentPlayerIdx, 'gold', -cost);
      setBoard(prev => prev.map(t => t.id === tileIdx ? { ...t, level: (t.level || 1) + 1 } : t));
      playSound('coin');
      closeModal();
      endTurn();
  };

  const endTurn = () => {
      closeModal();
      
      const player = getCurrentPlayer();

      // VICTORY CHECK
      if (player.resources.gold >= WINNING_GOLD) {
          setScreen(GameScreen.GAME_OVER);
          return;
      }
      // BANKRUPTCY CHECK
      if (player.resources.gold < 0) {
          // Simple Restart for now
          alert(`${player.name} went bankrupt!`);
          window.location.reload();
          return;
      }

      // NEXT TURN
      const nextIdx = (currentPlayerIdx + 1) % players.length;
      setCurrentPlayerIdx(nextIdx);
      setMessage(`It's ${players[nextIdx].name}'s turn.`);
  };

  // --- RENDER SCREENS ---

  const renderLanding = () => (
      <div className="flex flex-col items-center justify-center h-screen bg-[#fdf6e3] text-center px-4">
          <div className="mb-8 p-6 rounded-full bg-amber-100 border-4 border-amber-500 shadow-2xl">
              <Trophy size={64} className="text-amber-600" />
          </div>
          <h1 className="text-5xl font-black text-amber-900 mb-2 font-serif">Civilization of Sands</h1>
          <p className="text-2xl text-amber-700 mb-8 font-serif" dir="rtl">حضارة الرمال</p>
          <div className="space-y-4 w-full max-w-xs">
              <button 
                  onClick={() => setScreen(GameScreen.CHARACTER_SELECT)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2"
              >
                  <Play size={24} /> ابدأ اللعبة (Start Game)
              </button>
              <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl shadow transform transition flex items-center justify-center gap-2">
                  <Settings size={20} /> الإعدادات (Settings)
              </button>
          </div>
          <p className="mt-8 text-gray-400 text-xs">A Strategic Board Game</p>
      </div>
  );

  const renderCharacterSelect = () => (
      <div className="min-h-screen bg-[#fdf6e3] p-4 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-amber-900 mb-6 mt-4">Choose Your Leader</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {CHARACTERS_CONFIG.map((char) => (
                  <button 
                    key={char.id}
                    onClick={() => startGame(char.id)}
                    className={`flex items-center p-4 bg-white rounded-xl shadow-md border-2 hover:border-amber-500 hover:shadow-xl transition-all text-left group`}
                  >
                      <Character role={char.id} state={CharacterState.IDLE} className="w-20 h-20 flex-shrink-0 mr-4" showEmojiOverlay={false} />
                      <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800">{char.nameAr}</h3>
                          <p className="text-sm text-gray-600">{char.descAr}</p>
                          <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-bold text-white ${char.color}`}>
                              {char.bonus}
                          </div>
                      </div>
                  </button>
              ))}
          </div>
          <button onClick={() => setScreen(GameScreen.HOME)} className="mt-8 text-gray-500 underline">Back</button>
      </div>
  );

  const renderGameOver = () => (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-6">
          <Trophy size={80} className="text-yellow-400 mb-6 animate-bounce" />
          <h1 className="text-5xl font-bold mb-4">VICTORY!</h1>
          <p className="text-2xl mb-8">{getCurrentPlayer().name} has built the greatest civilization.</p>
          <div className="bg-gray-800 p-6 rounded-xl mb-8 w-full max-w-md">
              <h3 className="text-xl font-bold border-b border-gray-600 pb-2 mb-4">Final Stats</h3>
              <div className="flex justify-between mb-2">
                  <span>Gold</span>
                  <span className="text-yellow-400">{getCurrentPlayer().resources.gold}</span>
              </div>
              <div className="flex justify-between">
                  <span>Properties</span>
                  <span className="text-green-400">{getCurrentPlayer().properties.length}</span>
              </div>
          </div>
          <button 
              onClick={() => window.location.reload()}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-110"
          >
              Play Again
          </button>
      </div>
  );

  const renderBoard = () => (
    <div className="min-h-screen flex flex-col items-center p-2 md:p-4 max-w-4xl mx-auto pb-32">
        {/* Header */}
        <header className="w-full flex justify-between items-center mb-4 bg-white p-3 rounded-xl shadow-sm border-b-4 border-amber-300">
            <div>
                <h1 className="text-lg md:text-xl font-extrabold text-amber-800">Civilization of Sands</h1>
                <p className="text-[10px] text-gray-500">Target: {WINNING_GOLD} Gold</p>
            </div>
            <div className="text-center">
                <div className="text-[10px] text-gray-400">TURN</div>
                <div className={`font-bold ${getCurrentPlayer().id === 0 ? 'text-blue-600' : 'text-pink-600'}`}>
                    {getCurrentPlayer().name}
                </div>
            </div>
        </header>

        {/* Board */}
        <main className="w-full grid grid-cols-5 gap-2 relative">
            {board.map((tile) => (
                <Tile 
                    key={tile.id} 
                    tile={tile} 
                    playersOnTile={players.filter(p => p.position === tile.id).map(p => p.id)}
                    playerColors={players.reduce((acc, p) => ({...acc, [p.id]: p.color}), {})}
                    isOwnedBy={tile.ownerId}
                />
            ))}
        </main>

        {/* HUD */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-xl p-3 md:p-4 flex items-center justify-between z-20 gap-2">
            <div className="flex items-center gap-3 flex-1">
                <Character 
                    role={getCurrentPlayer().role} 
                    state={getCurrentPlayer().mood} 
                    className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0"
                />
                <div className="flex flex-col w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{getCurrentPlayer().name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-300 uppercase">{getCurrentPlayer().role}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 md:gap-2 text-[10px] md:text-xs mt-1">
                        <div className="res-badge bg-yellow-50 text-yellow-800 border-yellow-200">
                            <Coins size={10} className="mr-1"/>{getCurrentPlayer().resources.gold}
                        </div>
                        <div className="res-badge bg-blue-50 text-blue-800 border-blue-200">
                            <Droplet size={10} className="mr-1"/>{getCurrentPlayer().resources.water}
                        </div>
                        <div className="res-badge bg-purple-50 text-purple-800 border-purple-200">
                            <Zap size={10} className="mr-1"/>{getCurrentPlayer().resources.energy}
                        </div>
                        <div className="res-badge bg-gray-50 text-gray-800 border-gray-200">
                            <Hammer size={10} className="mr-1"/>{getCurrentPlayer().resources.materials}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <div className="hidden md:block text-right w-24">
                     <p className="text-[10px] text-gray-400">STATUS</p>
                     <p className="text-xs font-bold text-amber-600 truncate">{message}</p>
                 </div>
                 <Dice 
                    value={diceValue} 
                    rolling={isRolling} 
                    onRoll={handleRollDice} 
                    disabled={currentPlayerIdx !== 0 || showModal} 
                 />
            </div>
        </div>

        {/* Mobile Toast */}
        <div className="md:hidden fixed top-24 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-90 text-white px-4 py-2 rounded-lg text-xs z-30 pointer-events-none text-center shadow-lg w-auto max-w-[80%]">
            {message}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                    {modalContent}
                </div>
            </div>
        )}

        <style>{`
            .res-badge { display: flex; align-items: center; justify-content: center; padding: 2px 4px; border-radius: 4px; border-width: 1px; font-weight: bold; }
            @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .animate-scale-in { animation: scale-in 0.2s ease-out; }
        `}</style>
    </div>
  );

  // --- AI TURN EFFECT ---
  useEffect(() => {
      if (screen === GameScreen.PLAYING && currentPlayerIdx === 1 && !showModal && !isRolling) {
          setTimeout(() => handleRollDice(), 2000);
      }
      // eslint-disable-next-line
  }, [currentPlayerIdx, screen, showModal, isRolling]);


  // --- MAIN RENDER ---
  if (screen === GameScreen.HOME) return renderLanding();
  if (screen === GameScreen.CHARACTER_SELECT) return renderCharacterSelect();
  if (screen === GameScreen.GAME_OVER) return renderGameOver();
  return renderBoard();
};

export default App;