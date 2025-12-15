import React, { useState, useEffect, useRef } from 'react';
import { Tile as TileModel, Player, TileType, CharacterState, GameScreen, CharacterRole, Resources, Language, GameMode, ShopItem, ChatMessage, Alliance, LogEntry } from './types';
import { INITIAL_BOARD, INITIAL_RESOURCES, CHARACTERS_CONFIG, BOARD_SIZE, WINNING_GOLD, TRANSLATIONS, SHOP_ITEMS } from './constants';
import Tile from './components/Tile';
import Dice from './components/Dice';
import Character from './components/Character';
import { getOracleWisdom } from './services/geminiService';
import { 
    Coins, Droplet, Zap, Hammer, Trophy, Settings, Play, Wind, Tent, Skull, 
    Volume2, VolumeX, ArrowLeft, Check, Users, Cpu, Globe, ShoppingBag, 
    MessageCircle, BookOpen, Shield, Copy, Send, Lock, Calendar, Star, TrendingUp, Heart, List, RefreshCcw, Hand, AlertTriangle, ArrowUpCircle, Swords, Gem
} from 'lucide-react';

// --- SUB-COMPONENT: GameLayout (Reusable Board View) ---
interface GameLayoutProps {
    perspectiveId: number; // 0 for P1, 1 for P2 (or generic)
    players: Player[];
    board: TileModel[];
    currentPlayerIdx: number;
    diceValue: number;
    isRolling: boolean;
    onRoll: () => void;
    message: string;
    t: (key: string) => string;
    onSettingsClick: () => void;
    gameSettings: { winningGold: number };
    showLog: boolean;
    setShowLog: (show: boolean) => void;
    gameLog: LogEntry[];
    compact?: boolean; // For split screen scaling
}

const GameLayout: React.FC<GameLayoutProps> = ({ 
    perspectiveId, players, board, currentPlayerIdx, diceValue, isRolling, 
    onRoll, message, t, onSettingsClick, gameSettings, showLog, setShowLog, gameLog, compact 
}) => {
    const logContainerRef = useRef<HTMLDivElement>(null);
    const currentPlayer = players[currentPlayerIdx];
    const isMyTurn = currentPlayer.id === perspectiveId;
    const viewPlayer = players.find(p => p.id === perspectiveId) || players[0];

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [gameLog, showLog]);

    return (
        <div className={`relative h-full flex flex-col justify-between ${compact ? 'text-[10px]' : ''}`}>
             {/* Header */}
             <header className={`w-full flex justify-between items-center p-2 bg-white/90 backdrop-blur shadow-sm border-b-2 border-amber-300 relative z-30 ${compact ? 'h-12' : 'mb-4'}`}>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onSettingsClick} 
                        className="w-8 h-8 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full flex items-center justify-center transition-colors shadow-sm"
                    >
                        <Settings size={compact ? 16 : 20} />
                    </button>
                    <div>
                        <h1 className={`font-extrabold text-amber-800 ${compact ? 'text-sm' : 'text-lg'}`}>{t('gameTitle')}</h1>
                        {!compact && <p className="text-[10px] text-gray-500">{t('targetGold')}: {gameSettings.winningGold}</p>}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-gray-400">{t('turn')}</div>
                    <div className={`font-bold ${currentPlayer.id === 0 ? 'text-blue-600' : 'text-pink-600'}`}>
                        {currentPlayer.name}
                    </div>
                </div>
            </header>

            {/* Board Grid: Changed to grid-cols-4 for better fit with 32 tiles, scaling to 6 or 8 on large screens */}
            <main className={`w-full grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1 md:gap-2 p-2 relative flex-1 content-start overflow-y-auto ${compact ? 'max-w-2xl mx-auto' : 'max-w-5xl mx-auto'}`}>
                {board.map((tile) => (
                    <div key={tile.id} className={compact ? 'h-16' : ''}>
                        <Tile 
                            tile={{...tile, name: t(tile.name)}} 
                            playersOnTile={players.filter(p => p.position === tile.id).map(p => p.id)}
                            playerColors={players.reduce((acc, p) => ({...acc, [p.id]: p.color}), {})}
                            isOwnedBy={tile.ownerId}
                        />
                    </div>
                ))}
            </main>

            {/* Log Toggle */}
            <div className={`absolute rtl:right-2 ltr:left-2 top-16 z-20 transition-all ${showLog ? 'w-48' : 'w-8'}`}>
                 {showLog && (
                    <div className="bg-white/95 backdrop-blur rounded-lg shadow-xl border border-gray-200 overflow-hidden h-32 flex flex-col">
                         <div className="bg-amber-100 p-1 text-[10px] font-bold flex justify-between items-center text-amber-900">
                             <span>{t('gameLog')}</span>
                             <button onClick={() => setShowLog(false)} className="hover:bg-amber-200 rounded px-1">✕</button>
                         </div>
                         <div ref={logContainerRef} className="flex-1 overflow-y-auto p-1 space-y-1 text-[9px]">
                             {gameLog.map(log => (
                                 <div key={log.id} className={`border-b border-gray-100 pb-0.5 ${log.type === 'positive' ? 'text-green-600' : log.type === 'negative' ? 'text-red-600' : 'text-gray-600'}`}>
                                     {log.text}
                                 </div>
                             ))}
                         </div>
                    </div>
                )}
                <button onClick={() => setShowLog(!showLog)} className="bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition border border-white"><List size={14} /></button>
            </div>

            {/* Footer / Controls */}
            <div className={`bg-white border-t border-gray-200 shadow-xl p-2 flex items-center justify-between z-20 gap-2 ${compact ? 'h-20' : ''}`}>
                <div className="flex items-center gap-2 flex-1">
                    <Character role={viewPlayer.role} state={viewPlayer.mood} className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} flex-shrink-0`} />
                    <div className="flex flex-col w-full">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold text-gray-800 ${compact ? 'text-xs' : 'text-sm'}`}>{viewPlayer.name}</span>
                            {!compact && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-300 uppercase">{viewPlayer.role}</span>}
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-[10px] mt-1">
                            <div className="res-badge bg-yellow-50 text-yellow-800 border-yellow-200"><Coins size={8} className="mr-1"/>{viewPlayer.resources.gold}</div>
                            <div className="res-badge bg-blue-50 text-blue-800 border-blue-200"><Droplet size={8} className="mr-1"/>{viewPlayer.resources.water}</div>
                            <div className="res-badge bg-purple-50 text-purple-800 border-purple-200"><Zap size={8} className="mr-1"/>{viewPlayer.resources.energy}</div>
                            <div className="res-badge bg-gray-50 text-gray-800 border-gray-200"><Hammer size={8} className="mr-1"/>{viewPlayer.resources.materials}</div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                     {!compact && (
                         <div className="text-right w-20 hidden md:block">
                             <p className="text-[10px] text-gray-400">{t('status')}</p>
                             <p className="text-xs font-bold text-amber-600 truncate">{message}</p>
                         </div>
                     )}
                     <div className={!isMyTurn ? "opacity-50 grayscale pointer-events-none" : ""}>
                         <Dice 
                            value={diceValue} 
                            rolling={isRolling} 
                            onRoll={onRoll} 
                            disabled={isRolling || !isMyTurn || (currentPlayer.isAi)} 
                        />
                     </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  // ... (State setup remains same)
  const [screen, setScreen] = useState<GameScreen>(GameScreen.HOME);
  const [board, setBoard] = useState<TileModel[]>(INITIAL_BOARD);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [message, setMessage] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  
  const [p1Selection, setP1Selection] = useState<CharacterRole | null>(null);

  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [equippedSkin, setEquippedSkin] = useState<string | null>(null);
  const [playerGold, setPlayerGold] = useState<number>(5000); 
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [newAllianceName, setNewAllianceName] = useState("");
  
  const [gameLog, setGameLog] = useState<LogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [gameSettings, setGameSettings] = useState({
      winningGold: WINNING_GOLD,
      soundEnabled: true,
      language: 'ar' as Language,
      gameMode: 'pve' as GameMode
  });
  
  useEffect(() => {
    document.documentElement.lang = gameSettings.language;
    document.documentElement.dir = gameSettings.language === 'ar' ? 'rtl' : 'ltr';
  }, [gameSettings.language]);

  const t = (key: string) => {
    // @ts-ignore
    return TRANSLATIONS[gameSettings.language][key] || key;
  };

  const getName = (obj: any) => {
     return obj[gameSettings.language] || obj['en'];
  };

  const addToLog = (text: string, type: 'info' | 'positive' | 'negative' | 'event' = 'info') => {
      setGameLog(prev => [
          ...prev, 
          { id: Date.now().toString() + Math.random(), turn: currentPlayerIdx, text, type }
      ]);
  };

  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  const playSound = (type: 'roll' | 'coin' | 'click' | 'event') => {
    if (!gameSettings.soundEnabled) return;
  };

  const getCurrentPlayer = () => players[currentPlayerIdx];

  const updatePlayer = (id: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const modResource = (pid: number, type: keyof typeof INITIAL_RESOURCES, amount: number) => {
    setPlayers(prev => prev.map(p => {
        if (p.id !== pid) return p;
        const currentAmount = p.resources[type];
        const newAmount = Math.max(0, currentAmount + amount);
        
        let newMood = p.mood;
        if (type === 'gold') {
            if (amount > 0) newMood = CharacterState.HAPPY;
            if (amount < 0) newMood = CharacterState.SAD;
        }
        setTimeout(() => updatePlayer(pid, { mood: CharacterState.IDLE }), 2000);

        return { 
            ...p, 
            resources: { ...p.resources, [type]: newAmount },
            mood: newMood
        };
    }));
  };

  const handleRestartClick = () => {
    if (players.length === 0) return; 

    if (gameSettings.gameMode === 'pve') {
        startGame(players[0].role); 
        addToLog(t('gameResetInfo'), 'info');
        setScreen(GameScreen.PLAYING); 
    } else {
        openModal(
            <div className="text-center p-4">
                <h3 className="text-xl font-bold mb-4">{t('voteResetTitle')}</h3>
                <p className="mb-6 text-gray-600">{t('voteResetMsg')}</p>
                <div className="flex justify-center gap-4">
                     <button onClick={() => {
                         startGame(players[0].role, players[1].role);
                         setScreen(GameScreen.PLAYING);
                         addToLog(t('gameResetInfo'), 'info');
                         closeModal();
                     }} className="bg-green-600 text-white px-6 py-2 rounded-full font-bold">{t('agree')}</button>
                     <button onClick={() => {
                         addToLog(t('voteRejected'), 'negative');
                         closeModal();
                     }} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold">{t('decline')}</button>
                </div>
            </div>
        );
    }
  };

  // --- GAME LOGIC ---

  const handleModeSelect = (mode: GameMode) => {
      setGameSettings(s => ({ ...s, gameMode: mode }));
      if (mode === 'online_pvp') {
          setScreen(GameScreen.LOBBY);
      } else {
          setScreen(GameScreen.CHARACTER_SELECT);
          setP1Selection(null); 
      }
  };

  const createRoom = () => {
      const code = Math.random().toString(36).substring(2, 7).toUpperCase();
      setRoomCode(code);
      setTimeout(() => {
          startGame(CharacterRole.MERCHANT);
      }, 5000);
  };

  const joinRoom = () => {
      if (inputCode.length > 0) {
          startGame(CharacterRole.MERCHANT);
      }
  };

  const createAlliance = () => {
      if (!newAllianceName.trim()) return;
      setAlliance({
          name: newAllianceName,
          level: 1,
          members: 1,
          maxMembers: 10,
          exp: 0,
          nextLevelExp: 1000,
          treasury: 0,
          tech: { trade: 0, defense: 0 }
      });
  };

  const handleCharacterChoice = (role: CharacterRole) => {
      if (gameSettings.gameMode === 'local_pvp') {
          if (!p1Selection) {
              setP1Selection(role);
              return;
          }
          startGame(p1Selection, role);
      } else {
          startGame(role);
      }
  };

  const startGame = (p1Role: CharacterRole, p2Role?: CharacterRole) => {
      const p1Config = CHARACTERS_CONFIG.find(c => c.id === p1Role)!;
      const isPvP = gameSettings.gameMode === 'local_pvp' || gameSettings.gameMode === 'online_pvp';
      
      const p1: Player = {
          id: 0,
          name: isPvP ? 'Player 1' : t('gameTitle'),
          role: p1Role,
          characterId: p1Role,
          position: 0,
          resources: { ...INITIAL_RESOURCES },
          properties: [],
          inJail: false,
          jailTurns: 0,
          movementModifier: 0,
          mood: CharacterState.IDLE,
          color: p1Config.color,
          isAi: false,
          skin: equippedSkin || undefined
      };

      let p2Config;
      if (p2Role) {
          p2Config = CHARACTERS_CONFIG.find(c => c.id === p2Role)!;
      } else {
          p2Config = CHARACTERS_CONFIG.filter(c => c.id !== p1Role)[Math.floor(Math.random() * 3)];
      }

      const p2: Player = {
          id: 1,
          name: isPvP ? 'Player 2' : 'AI Rival',
          role: p2Config.id,
          characterId: p2Config.id,
          position: 0,
          resources: { ...INITIAL_RESOURCES },
          properties: [],
          inJail: false,
          jailTurns: 0,
          movementModifier: 0,
          mood: CharacterState.IDLE,
          color: p2Config.color,
          isAi: !isPvP
      };

      setPlayers([p1, p2]);
      setBoard(INITIAL_BOARD);
      setCurrentPlayerIdx(0);
      setGameLog([]);
      setScreen(GameScreen.PLAYING);
      setMessage(t('gameTitle'));
      setP1Selection(null); 
      addToLog("Game Started!", "info");
  };

  const handleRollDice = () => {
    if (isRolling || showModal) return;
    const player = getCurrentPlayer();
    
    // Jail Logic
    if (player.inJail) {
        if (player.jailTurns > 0) {
            const msg = `${player.name} ${t('jailMsg')} (${player.jailTurns})`;
            setMessage(msg);
            addToLog(msg, "negative");
            updatePlayer(player.id, { jailTurns: player.jailTurns - 1 });
            setTimeout(endTurn, 1000);
            return;
        } else {
            updatePlayer(player.id, { inJail: false });
            setMessage(`${player.name} ${t('freeMsg')}`);
            addToLog(`${player.name} ${t('freeMsg')}`, "positive");
        }
    }

    playSound('roll');
    setIsRolling(true);
    
    setTimeout(() => {
        let roll = Math.floor(Math.random() * 6) + 1;
        if (player.movementModifier !== 0) {
            roll = Math.max(1, roll + player.movementModifier);
            updatePlayer(player.id, { movementModifier: 0 });
        }
        setDiceValue(roll);
        addToLog(`${player.name} ${t('rolled')} ${roll}`, "info");
        
        movePlayerStepByStep(player.id, roll);
    }, 800);
  };

  const movePlayerStepByStep = (playerId: number, steps: number) => {
    let stepsLeft = steps;

    const moveStep = () => {
        setPlayers(prev => {
            const p = prev.find(pl => pl.id === playerId)!;
            const nextPos = (p.position + 1) % BOARD_SIZE;
            
            // Pass Start Bonus
            if (nextPos === 0) {
                const bonus = p.role === CharacterRole.MERCHANT ? 150 : 100;
                return prev.map(pl => {
                    if (pl.id === playerId) {
                        return { 
                            ...pl, 
                            position: nextPos, 
                            resources: { ...pl.resources, gold: pl.resources.gold + bonus } 
                        };
                    }
                    return pl;
                });
            }
            
            return prev.map(pl => pl.id === playerId ? { ...pl, position: nextPos } : pl);
        });
        
        stepsLeft--;
        if (stepsLeft > 0) {
            playSound('click'); 
            setTimeout(moveStep, 300);
        } else {
             setIsRolling(false);
             setPlayers(currentPlayers => {
                 const p = currentPlayers.find(pl => pl.id === playerId)!;
                 setTimeout(() => handleTileEvent(p.position), 500);
                 return currentPlayers;
             });
        }
    };
    
    setTimeout(moveStep, 300);
  };

  const handleTileEvent = async (tileIdx: number) => {
      const tile = board[tileIdx];
      const player = getCurrentPlayer();
      const isAi = player.isAi;
      const tileName = t(tile.name) || tile.name;

      // PvP Check
      const opponentsOnTile = players.filter(p => p.id !== player.id && p.position === tileIdx);
      if (tile.type !== TileType.START && tile.type !== TileType.JAIL && opponentsOnTile.length > 0) {
         const opponent = opponentsOnTile[0]; 
         if (!isAi) {
             openModal(
                 <div className="text-center p-4">
                     <Swords className="mx-auto mb-4 text-red-600 animate-pulse" size={48} />
                     <h3 className="text-xl font-bold mb-2">{t('duel')}!</h3>
                     <p className="mb-4">You landed on {opponent.name}. Roll to steal gold!</p>
                     <button onClick={() => {
                         const myRoll = Math.floor(Math.random() * 6) + 1;
                         const opRoll = Math.floor(Math.random() * 6) + 1;
                         let duelMsg = "";
                         
                         if (player.role === CharacterRole.POLITICIAN) {
                             modResource(player.id, 'gold', 100);
                             modResource(opponent.id, 'gold', -100);
                             duelMsg = `${t('duelWon')} (+100 Gold) [Politician Bonus]`;
                         } else if (myRoll >= opRoll) {
                             modResource(player.id, 'gold', 50);
                             modResource(opponent.id, 'gold', -50);
                             duelMsg = `${t('duelWon')} (${myRoll} vs ${opRoll})`;
                         } else {
                             modResource(player.id, 'gold', -50);
                             modResource(opponent.id, 'gold', 50);
                             duelMsg = `${t('duelLost')} (${myRoll} vs ${opRoll})`;
                         }
                         
                         addToLog(`${player.name} vs ${opponent.name}: ${duelMsg}`, "event");
                         closeModal();
                         handleTileEffect(tile, player, isAi);
                     }} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold">{t('rollDice')}</button>
                 </div>
             );
             return; 
         } else {
             const myRoll = Math.floor(Math.random() * 6) + 1;
             const opRoll = Math.floor(Math.random() * 6) + 1;
             if (myRoll >= opRoll) {
                 modResource(player.id, 'gold', 50);
                 modResource(opponent.id, 'gold', -50);
                 addToLog(`${player.name} won duel against ${opponent.name}`, "event");
             } else {
                 modResource(player.id, 'gold', -50);
                 modResource(opponent.id, 'gold', 50);
                 addToLog(`${player.name} lost duel against ${opponent.name}`, "negative");
             }
         }
      }

      handleTileEffect(tile, player, isAi);
  };

  const handleTileEffect = async (tile: TileModel, player: Player, isAi: boolean) => {
      const tileName = t(tile.name) || tile.name;

      if (tile.type === TileType.CITY) {
          if (tile.ownerId === undefined) {
              const cost = tile.price || 100;
              const finalCost = player.role === CharacterRole.BUILDER ? Math.floor(cost * 0.7) : cost;

              if (player.resources.gold >= finalCost) {
                  if (isAi) {
                      if (Math.random() > 0.4) {
                           modResource(player.id, 'gold', -finalCost);
                           setBoard(prev => prev.map(t => t.id === tile.id ? { ...t, ownerId: player.id, level: 1 } : t));
                           updatePlayer(player.id, { properties: [...player.properties, tile.id] });
                           addToLog(`${player.name} bought ${tileName}`, "positive");
                      }
                      setTimeout(endTurn, 1000);
                  } else {
                      openModal(
                          <div className="text-center p-4">
                              <h3 className="text-xl font-bold mb-2">{t('buy')}?</h3>
                              <div className="text-4xl mb-2">🏠</div>
                              <p>{tileName}</p>
                              <div className="text-sm font-bold text-amber-600 mb-4">{finalCost} {t('gold')}</div>
                              <div className="flex justify-center gap-4 mt-4">
                                  <button onClick={() => {
                                      modResource(player.id, 'gold', -finalCost);
                                      setBoard(prev => prev.map(t => t.id === tile.id ? { ...t, ownerId: player.id, level: 1 } : t));
                                      updatePlayer(player.id, { properties: [...player.properties, tile.id] });
                                      addToLog(`${player.name} bought ${tileName}`, "positive");
                                      closeModal();
                                      endTurn();
                                  }} className="bg-green-600 text-white px-6 py-2 rounded-full">{t('buy')}</button>
                                  <button onClick={endTurn} className="bg-gray-400 text-white px-6 py-2 rounded-full">{t('pass')}</button>
                              </div>
                          </div>
                      );
                  }
                  return;
              } else {
                  addToLog(`${player.name} cannot afford ${tileName}`, "info");
              }
          } else if (tile.ownerId !== player.id) {
              const baseRent = tile.rent || 20;
              const multiplier = tile.level || 1;
              const rent = Math.floor(baseRent * (Math.pow(1.5, multiplier - 1))); 
              
              modResource(player.id, 'gold', -rent);
              modResource(tile.ownerId!, 'gold', rent);
              setMessage(`${t('payRent')} ${rent}`);
              addToLog(`${player.name} paid ${rent} rent to Player ${tile.ownerId! + 1}`, "negative");
          } else {
              const currentLevel = tile.level || 1;
              if (currentLevel < 3) {
                  const baseCost = tile.price || 100;
                  const upgradeCost = Math.floor(baseCost * (currentLevel * 0.8)); 
                  const finalUpgradeCost = player.role === CharacterRole.BUILDER ? Math.floor(upgradeCost * 0.7) : upgradeCost;

                  if (player.resources.gold >= finalUpgradeCost) {
                      if (!isAi) {
                          openModal(
                              <div className="text-center p-4">
                                  <h3 className="text-xl font-bold mb-2">{t('upgrade')}?</h3>
                                  <ArrowUpCircle className="mx-auto mb-2 text-blue-500" size={32} />
                                  <p>{tileName}</p>
                                  <div className="flex justify-center gap-4 my-2 text-sm">
                                      <span>{t('level')} {currentLevel} ➔ <span className="text-green-600 font-bold">{currentLevel + 1}</span></span>
                                  </div>
                                  <div className="text-sm font-bold text-amber-600 mb-4">{finalUpgradeCost} {t('gold')}</div>
                                  <div className="flex justify-center gap-4 mt-4">
                                      <button onClick={() => {
                                          modResource(player.id, 'gold', -finalUpgradeCost);
                                          setBoard(prev => prev.map(t => t.id === tile.id ? { ...t, level: currentLevel + 1 } : t));
                                          addToLog(`${player.name} upgraded ${tileName}`, "positive");
                                          closeModal();
                                          endTurn();
                                      }} className="bg-blue-600 text-white px-6 py-2 rounded-full">{t('upgrade')}</button>
                                      <button onClick={endTurn} className="bg-gray-400 text-white px-6 py-2 rounded-full">{t('pass')}</button>
                                  </div>
                              </div>
                          );
                          return;
                      } else {
                           if (Math.random() > 0.3) {
                               modResource(player.id, 'gold', -finalUpgradeCost);
                               setBoard(prev => prev.map(t => t.id === tile.id ? { ...t, level: currentLevel + 1 } : t));
                               addToLog(`${player.name} upgraded ${tileName}`, "positive");
                           }
                      }
                  }
              }
          }
      } else if (tile.type === TileType.SWAMP) {
          if (player.role !== CharacterRole.EXPLORER) {
              updatePlayer(player.id, { movementModifier: -2 });
              addToLog(`${player.name} ${t('stuckSwamp')}`, "negative");
              setMessage(t('swampEffect'));
          } else {
              addToLog(`${player.name} avoided Swamp (Explorer)`, "positive");
          }
      } else if (tile.type === TileType.TREASURE) {
          const reward = Math.floor(Math.random() * 300) + 100;
          modResource(player.id, 'gold', reward);
          openModal(
              <div className="text-center p-4">
                  <Gem className="mx-auto mb-4 text-teal-500 animate-bounce" size={64} />
                  <h3 className="text-xl font-bold mb-2">{t('treasureFound')}!</h3>
                  <p>{t('treasureMsg')}</p>
                  <div className="text-2xl font-bold text-yellow-500 mt-2">+{reward} {t('gold')}</div>
                  <button onClick={endTurn} className="mt-6 bg-teal-600 text-white px-6 py-2 rounded-full">{t('claim') || "OK"}</button>
              </div>
          );
          addToLog(`${player.name} found treasure (${reward}g)`, "positive");
          return;
      } else if (tile.type === TileType.ORACLE) {
          const wisdom = await getOracleWisdom(player);
          openModal(
              <div className="text-center p-4">
                  <div className="text-5xl mb-2">🔮</div>
                  <p className="italic mb-4">"{wisdom.text}"</p>
                  <p className="font-bold text-sm text-gray-500">{wisdom.reward}</p>
                  <button onClick={() => {
                      if (wisdom.delta) { 
                          Object.keys(wisdom.delta).forEach(key => modResource(player.id, key as any, wisdom.delta[key])); 
                      }
                      addToLog("Oracle: " + wisdom.reward, "event");
                      endTurn();
                  }} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-full">{t('acceptFate')}</button>
              </div>
          );
          return;
      } else {
          if (tile.type === TileType.OASIS) {
               modResource(player.id, 'water', 20);
               addToLog(`${player.name} found water`, "positive");
          }
          if (tile.type === TileType.TAX) {
               modResource(player.id, 'gold', -50);
               addToLog(`${player.name} paid tax`, "negative");
          }
          if (tile.type === TileType.JAIL) {
               updatePlayer(player.id, { inJail: true, jailTurns: 2 });
               addToLog(`${player.name} went to jail`, "negative");
          }
          setMessage(`${tileName}`);
      }
      setTimeout(endTurn, 1000);
  };

  const endTurn = () => {
      closeModal();
      const player = getCurrentPlayer();
      if (player.resources.gold >= gameSettings.winningGold) { setScreen(GameScreen.GAME_OVER); return; }
      const nextIdx = (currentPlayerIdx + 1) % players.length;
      setCurrentPlayerIdx(nextIdx);
      setMessage(`${t('turn')}: ${players[nextIdx].name}`);
  };

  useEffect(() => {
    const player = getCurrentPlayer();
    if (screen === GameScreen.PLAYING && player?.isAi && !showModal && !isRolling) {
        setTimeout(handleRollDice, 1500);
    }
  }, [currentPlayerIdx, screen, showModal, isRolling]);


  // --- RENDER HELPERS ---

  const renderBoard = () => {
    const commonProps = {
        players, board, currentPlayerIdx, diceValue, isRolling, onRoll: handleRollDice, 
        message, t, onSettingsClick: () => setScreen(GameScreen.SETTINGS), 
        gameSettings, showLog, setShowLog, gameLog
    };

    if (gameSettings.gameMode === 'local_pvp') {
        return (
            <div className="h-screen w-full flex flex-col bg-[#fdf6e3]">
                {/* Top Half: Player 2 (Rotated) */}
                <div className="flex-1 border-b-4 border-amber-900/20 relative overflow-hidden bg-amber-50/50 rotate-180">
                     <GameLayout {...commonProps} perspectiveId={1} compact={true} />
                </div>
                {/* Bottom Half: Player 1 (Normal) */}
                <div className="flex-1 relative overflow-hidden bg-amber-50">
                     <GameLayout {...commonProps} perspectiveId={0} compact={true} />
                </div>
                {renderGlobalModal()}
            </div>
        );
    }

    // Default Single View
    return (
        <div className="min-h-screen bg-[#fdf6e3] relative">
            <div className="h-screen flex flex-col max-w-5xl mx-auto">
                 <GameLayout {...commonProps} perspectiveId={0} />
            </div>
            {renderGlobalModal()}
        </div>
    );
  };

  // ... (Other renders remain same, just ensuring modal rendering and switch)
  
  const renderGlobalModal = () => (
      <>
        {gameSettings.gameMode !== 'local_pvp' && (
             <div className="md:hidden fixed top-24 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-90 text-white px-4 py-2 rounded-lg text-xs z-30 pointer-events-none text-center shadow-lg w-auto max-w-[80%]">{message}</div>
        )}
        
        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">{modalContent}</div>
            </div>
        )}
      </>
  );

  // ... (Rest of render functions: Home, Shop, etc. preserved)
  const renderHome = () => (
      <div className="flex flex-col h-screen bg-[#fdf6e3]">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="mb-4 p-6 rounded-full bg-amber-100 border-4 border-amber-500 shadow-2xl animate-pulse">
                  <Trophy size={64} className="text-amber-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-amber-900 mb-2 font-serif">{t('gameTitle')}</h1>
              <p className="text-xl text-amber-700 mb-8 font-serif">{t('subTitle')}</p>
              
              <div className="w-full max-w-xs space-y-3">
                  <button onClick={() => setScreen(GameScreen.MODE_SELECT)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2">
                      <Play size={24} /> {t('play')}
                  </button>
                  <button onClick={() => setScreen(GameScreen.EVENTS)} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md transform transition hover:scale-105 flex items-center justify-center gap-2">
                      <Calendar size={20} /> {t('events')}
                  </button>
                  <button onClick={() => setScreen(GameScreen.ALLIANCE)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md transform transition hover:scale-105 flex items-center justify-center gap-2">
                      <Shield size={20} /> {t('alliance')}
                  </button>
              </div>
          </div>
          <div className="bg-white border-t border-gray-200 flex justify-around p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <button onClick={() => setScreen(GameScreen.SHOP)} className="flex flex-col items-center text-gray-500 hover:text-amber-600"><ShoppingBag size={24} /><span className="text-xs mt-1 font-bold">{t('shop')}</span></button>
              <button onClick={() => setScreen(GameScreen.SOCIAL)} className="flex flex-col items-center text-gray-500 hover:text-blue-600"><MessageCircle size={24} /><span className="text-xs mt-1 font-bold">{t('social')}</span></button>
              <button onClick={() => setScreen(GameScreen.GUIDE)} className="flex flex-col items-center text-gray-500 hover:text-green-600"><BookOpen size={24} /><span className="text-xs mt-1 font-bold">{t('guide')}</span></button>
              <button onClick={() => setScreen(GameScreen.SETTINGS)} className="flex flex-col items-center text-gray-500 hover:text-gray-800"><Settings size={24} /><span className="text-xs mt-1 font-bold">{t('settings')}</span></button>
          </div>
      </div>
  );

  const renderCharacterSelect = () => {
      let title = t('chooseLeader');
      if (gameSettings.gameMode === 'local_pvp') {
          title = !p1Selection ? "Player 1: " + t('chooseLeader') : "Player 2: " + t('chooseLeader');
      }

      return (
          <div className="min-h-screen bg-[#fdf6e3] p-4 flex flex-col items-center">
              <h2 className="text-3xl font-bold text-amber-900 mb-6 mt-4">{title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                  {CHARACTERS_CONFIG.map((char) => {
                      // Disable selected char for P2
                      const isDisabled = p1Selection === char.id;
                      return (
                          <button 
                              key={char.id} 
                              onClick={() => !isDisabled && handleCharacterChoice(char.id)} 
                              disabled={isDisabled}
                              className={`flex items-center p-4 bg-white rounded-xl shadow-md border-2 transition-all text-left group
                                  ${isDisabled ? 'opacity-50 cursor-not-allowed border-gray-200' : 'hover:border-amber-500 hover:shadow-xl'}
                              `}
                          >
                              <Character role={char.id} state={CharacterState.IDLE} className="w-20 h-20 flex-shrink-0 ltr:mr-4 rtl:ml-4" showEmojiOverlay={false} />
                              <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-800">{getName(char.name)}</h3>
                                  <p className="text-sm text-gray-600">{getName(char.desc)}</p>
                                  <div className={`mt-2 inline-block px-2 py-1 rounded text-xs font-bold text-white ${char.color}`}>{getName(char.bonus)}</div>
                              </div>
                              {p1Selection === char.id && <div className="text-gray-400 font-bold px-2">P1</div>}
                          </button>
                      );
                  })}
              </div>
              <button onClick={() => setScreen(GameScreen.HOME)} className="mt-8 text-gray-500 underline">{t('back')}</button>
          </div>
      );
  };

  const renderGameOver = () => (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-6">
          <Trophy size={80} className="text-yellow-400 mb-6 animate-bounce" />
          <h1 className="text-5xl font-bold mb-4">{t('win')}</h1>
          <p className="text-2xl mb-8">{getCurrentPlayer().name}</p>
          <div className="bg-gray-800 p-6 rounded-xl mb-8 w-full max-w-md">
              <h3 className="text-xl font-bold border-b border-gray-600 pb-2 mb-4">{t('finalStats')}</h3>
              <div className="flex justify-between mb-2"><span>{t('gold')}</span><span className="text-yellow-400">{getCurrentPlayer().resources.gold}</span></div>
              <div className="flex justify-between"><span>{t('properties')}</span><span className="text-green-400">{getCurrentPlayer().properties.length}</span></div>
          </div>
          <button onClick={() => setScreen(GameScreen.HOME)} className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-110">{t('playAgain')}</button>
      </div>
  );

  const renderSettings = () => (
      <div className="min-h-screen bg-[#fdf6e3] flex flex-col items-center p-6 justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden relative">
              {/* Header */}
              <div className="bg-amber-600 p-4 text-white flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <Settings size={24} />
                    <h2 className="text-xl font-bold">{t('settings')}</h2>
                  </div>
                  <button onClick={() => setScreen(players.length > 0 ? GameScreen.PLAYING : GameScreen.HOME)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                      <ArrowLeft size={20} className="rtl:rotate-180" />
                  </button>
              </div>

              <div className="p-6 space-y-6">
                  
                  {/* Sound Toggle (Requested) */}
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${gameSettings.soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                             {gameSettings.soundEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
                          </div>
                          <span className="font-bold text-gray-700">{t('sound')}</span>
                      </div>
                      <button onClick={() => setGameSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))} className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${gameSettings.soundEnabled ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                          <div className="bg-white w-5 h-5 rounded-full shadow-md" />
                      </button>
                  </div>

                  {/* Other Settings (Language/Gold) - Kept but compact */}
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('language')}</label>
                          <div className="flex bg-gray-100 rounded-lg p-1">{(['ar', 'en'] as const).map(lang => (<button key={lang} onClick={() => setGameSettings(s => ({ ...s, language: lang }))} className={`flex-1 py-1.5 text-sm rounded-md font-bold transition-all ${gameSettings.language === lang ? 'bg-white shadow text-amber-600' : 'text-gray-400'}`}>{lang === 'ar' ? 'العربية' : 'English'}</button>))}</div>
                      </div>
                      {/* Show target gold only if not playing to avoid confusion */}
                      {players.length === 0 && (
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('targetGold')}</label>
                              <div className="flex gap-2">{[1500, 2500, 5000].map(val => (<button key={val} onClick={() => setGameSettings(s => ({ ...s, winningGold: val }))} className={`flex-1 py-1.5 text-sm rounded-lg border-2 font-bold transition-all ${gameSettings.winningGold === val ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-500'}`}>{val}</button>))}</div>
                          </div>
                      )}
                  </div>
                  
                  {/* Restart Game (Requested) */}
                  {players.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                           <button onClick={handleRestartClick} className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-red-200 transition-colors group">
                               <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" /> {t('resetGame')}
                           </button>
                      </div>
                  )}
              </div>
              
              {/* Footer Back Button */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button onClick={() => setScreen(players.length > 0 ? GameScreen.PLAYING : GameScreen.HOME)} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                      <ArrowLeft size={18} className="rtl:rotate-180" /> {t('back')}
                  </button>
              </div>
          </div>
      </div>
  );

  const renderModeSelect = () => (
      <div className="min-h-screen bg-[#fdf6e3] p-6 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-bold text-amber-900 mb-8">{t('modeSelect')}</h2>
          <div className="w-full max-w-sm space-y-4">
              <button onClick={() => handleModeSelect('pve')} className="w-full bg-white p-4 rounded-xl shadow border-2 border-transparent hover:border-blue-500 flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Cpu /></div>
                  <div className="text-left rtl:text-right"><div className="font-bold text-lg">{t('modePvE')}</div></div>
              </button>
              <button onClick={() => handleModeSelect('local_pvp')} className="w-full bg-white p-4 rounded-xl shadow border-2 border-transparent hover:border-green-500 flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full text-green-600"><Users /></div>
                  <div className="text-left rtl:text-right"><div className="font-bold text-lg">{t('modeLocalPvP')}</div></div>
              </button>
              <button onClick={() => handleModeSelect('online_pvp')} className="w-full bg-white p-4 rounded-xl shadow border-2 border-transparent hover:border-purple-500 flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full text-purple-600"><Globe /></div>
                  <div className="text-left rtl:text-right"><div className="font-bold text-lg">{t('modeOnlinePvP')}</div></div>
              </button>
          </div>
          <button onClick={() => setScreen(GameScreen.HOME)} className="mt-8 text-gray-500">{t('back')}</button>
      </div>
  );

  const renderLobby = () => (
      <div className="min-h-screen bg-[#fdf6e3] p-6 flex flex-col items-center justify-center text-center">
          {!roomCode ? (
              <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-xl">
                  <h2 className="text-2xl font-bold mb-6 text-purple-800">{t('modeOnlinePvP')}</h2>
                  <div className="mb-6">
                      <button onClick={createRoom} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold mb-4 hover:bg-purple-700">{t('createRoom')}</button>
                      <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-300"></div><span className="flex-shrink mx-4 text-gray-400">OR</span><div className="flex-grow border-t border-gray-300"></div></div>
                  </div>
                  <div className="text-left rtl:text-right">
                      <label className="text-sm font-bold text-gray-600 block mb-2">{t('enterCode')}</label>
                      <div className="flex gap-2">
                          <input type="text" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 font-mono uppercase text-center" placeholder="CODE" />
                          <button onClick={joinRoom} className="bg-gray-800 text-white px-4 rounded-lg"><ArrowLeft className="rtl:rotate-180"/></button>
                      </div>
                  </div>
              </div>
          ) : (
              <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-xl">
                  <div className="animate-spin text-purple-600 mb-4 mx-auto"><Globe size={40}/></div>
                  <h3 className="text-xl font-bold mb-2">{t('waitingForPlayer')}</h3>
                  <div className="bg-gray-100 p-4 rounded-xl mb-4 border-2 border-dashed border-gray-300">
                      <p className="text-xs text-gray-500 mb-1">{t('roomCode')}</p>
                      <div className="text-3xl font-mono font-black tracking-widest text-purple-800 flex items-center justify-center gap-2">{roomCode} <Copy size={16} className="text-gray-400 cursor-pointer"/></div>
                  </div>
                  <p className="text-sm text-gray-500">{t('shareCode')}</p>
              </div>
          )}
          <button onClick={() => { setRoomCode(""); setScreen(GameScreen.MODE_SELECT); }} className="mt-8 text-gray-500">{t('back')}</button>
      </div>
  );

  const renderShop = () => (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
          <header className="flex justify-between items-center mb-6">
              <button onClick={() => setScreen(GameScreen.HOME)}><ArrowLeft className="text-gray-600 rtl:rotate-180"/></button>
              <h2 className="text-xl font-bold text-gray-800">{t('shopTitle')}</h2>
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"><Coins size={14}/> {playerGold}</div>
          </header>
          <div className="space-y-6">
              <section>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 px-1">{t('skins')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                      {SHOP_ITEMS.filter(i => i.type === 'skin').map(item => {
                          const isOwned = ownedItems.includes(item.id);
                          const isEquipped = equippedSkin === item.id;
                          return (
                              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center text-center">
                                  <div className="text-4xl mb-2">{item.icon}</div>
                                  <div className="font-bold text-sm mb-1">{getName(item.name)}</div>
                                  {isOwned ? (
                                      <button onClick={() => setEquippedSkin(item.id)} className={`mt-2 text-xs px-4 py-1.5 rounded-full font-bold w-full ${isEquipped ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{isEquipped ? t('equipped') : t('equip')}</button>
                                  ) : (
                                      <button onClick={() => { if (playerGold >= item.cost) { setPlayerGold(p => p - item.cost); setOwnedItems(prev => [...prev, item.id]); } }} disabled={playerGold < item.cost} className="mt-2 text-xs bg-amber-500 text-white px-4 py-1.5 rounded-full font-bold w-full disabled:opacity-50">{item.cost} <Coins size={10} className="inline"/></button>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </section>
          </div>
      </div>
  );

  const renderSocial = () => (
      <div className="min-h-screen bg-gray-50 flex flex-col">
          <div className="bg-blue-600 p-4 text-white pb-8 rounded-b-3xl shadow-lg">
               <div className="flex justify-between items-center mb-4"><button onClick={() => setScreen(GameScreen.HOME)}><ArrowLeft className="rtl:rotate-180"/></button><h2 className="text-xl font-bold">{t('globalChat')}</h2><div className="w-6"></div></div>
          </div>
          <div className="flex-1 -mt-4 px-4 flex flex-col pb-6">
              <div className="bg-white rounded-2xl shadow-lg flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                      {chatMessages.length === 0 && <div className="text-center text-gray-400 text-sm mt-10">Welcome to Global Chat!</div>}
                      {chatMessages.map(msg => (
                          <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}>
                              {!msg.isSystem && <span className="text-[10px] text-gray-500 font-bold">{msg.sender}</span>}
                              <div className={`px-3 py-2 rounded-lg text-sm ${msg.isSystem ? 'bg-gray-200 text-gray-600 text-xs' : 'bg-white shadow-sm text-gray-800'}`}>{msg.text}</div>
                          </div>
                      ))}
                  </div>
                  <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                      <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none" onKeyPress={(e) => { if (e.key === 'Enter' && chatInput) { setChatMessages([...chatMessages, { id: Date.now().toString(), sender: 'You', text: chatInput, time: 'Now' }]); setChatInput(''); } }} />
                      <button className="bg-blue-600 text-white p-2 rounded-full"><Send size={16} className="rtl:rotate-180"/></button>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderGuide = () => (
      <div className="min-h-screen bg-[#fdf6e3] p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6"><button onClick={() => setScreen(GameScreen.HOME)}><ArrowLeft className="text-gray-600 rtl:rotate-180"/></button><h2 className="text-2xl font-bold text-amber-900">{t('howToPlay')}</h2><div className="w-6"></div></div>
          <div className="space-y-4 max-w-lg mx-auto">
              <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4"><div className="bg-amber-100 p-3 rounded-full text-amber-600"><Play size={24}/></div><p className="font-bold text-gray-700">{t('rule1')}</p></div>
              <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4"><div className="bg-green-100 p-3 rounded-full text-green-600"><Hammer size={24}/></div><p className="font-bold text-gray-700">{t('rule2')}</p></div>
              <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4"><div className="bg-red-100 p-3 rounded-full text-red-600"><Skull size={24}/></div><p className="font-bold text-gray-700">{t('rule3')}</p></div>
              <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4"><div className="bg-purple-100 p-3 rounded-full text-purple-600"><Zap size={24}/></div><p className="font-bold text-gray-700">{t('rule4')}</p></div>
          </div>
      </div>
  );

  const renderAlliance = () => {
      if (!alliance) {
          return (
              <div className="min-h-screen bg-[#fdf6e3] p-6 flex flex-col items-center justify-center">
                  <h2 className="text-3xl font-bold text-amber-900 mb-8">{t('alliance')}</h2>
                  <div className="w-full max-w-sm space-y-6">
                      <div className="bg-white p-6 rounded-2xl shadow-xl">
                          <h3 className="text-xl font-bold mb-4 text-center">{t('createAlliance')}</h3>
                          <input className="w-full border-2 border-gray-200 rounded-lg p-2 mb-4" placeholder={t('allianceName')} value={newAllianceName} onChange={e => setNewAllianceName(e.target.value)} />
                          <button onClick={createAlliance} className="w-full bg-amber-600 text-white py-3 rounded-lg font-bold">{t('createAlliance')}</button>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-xl">
                          <h3 className="text-xl font-bold mb-4 text-center">{t('joinAlliance')}</h3>
                          <div className="space-y-2">
                              {['Sand Kings', 'Desert Hawks', 'Oasis Guardians'].map((name, i) => (
                                  <div key={i} className="flex justify-between items-center p-2 border-b">
                                      <span>{name}</span>
                                      <button onClick={() => setAlliance({ name, level: 3, members: 12, maxMembers: 50, exp: 2400, nextLevelExp: 5000, treasury: 5000, tech: { trade: 2, defense: 1 } })} className="bg-gray-200 hover:bg-green-500 hover:text-white px-3 py-1 rounded-full text-xs">Join</button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                  <button onClick={() => setScreen(GameScreen.HOME)} className="mt-8 text-gray-500">{t('back')}</button>
              </div>
          );
      }
      return (
          <div className="min-h-screen bg-gray-50 pb-20">
              <div className="bg-gradient-to-b from-blue-900 to-blue-700 text-white p-6 pb-12 rounded-b-3xl shadow-xl">
                   <div className="flex justify-between items-start mb-4">
                       <button onClick={() => setScreen(GameScreen.HOME)}><ArrowLeft className="rtl:rotate-180"/></button>
                       <button onClick={() => setAlliance(null)} className="text-xs bg-red-500/20 px-3 py-1 rounded-full text-red-100">{t('leaveAlliance')}</button>
                   </div>
                   <div className="flex flex-col items-center">
                       <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg mb-3">🛡️</div>
                       <h2 className="text-3xl font-bold">{alliance.name}</h2>
                       <div className="flex gap-4 mt-2 text-blue-200 text-sm">
                           <span className="flex items-center gap-1"><Star size={14}/> {t('level')} {alliance.level}</span>
                           <span className="flex items-center gap-1"><Users size={14}/> {alliance.members}/{alliance.maxMembers}</span>
                       </div>
                       <div className="w-full max-w-xs mt-4">
                           <div className="flex justify-between text-xs mb-1 opacity-80"><span>XP</span><span>{alliance.exp} / {alliance.nextLevelExp}</span></div>
                           <div className="w-full bg-blue-900 rounded-full h-2"><div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(alliance.exp / alliance.nextLevelExp) * 100}%` }}></div></div>
                       </div>
                   </div>
              </div>
              <div className="-mt-6 px-4 space-y-6">
                  <div className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center">
                      <div><div className="text-gray-500 text-xs font-bold uppercase">{t('treasury')}</div><div className="text-2xl font-bold text-amber-600 flex items-center gap-1"><Coins size={20}/> {alliance.treasury}</div></div>
                      <button onClick={() => { if (playerGold >= 500) { setPlayerGold(p => p - 500); setAlliance(prev => prev ? ({...prev, treasury: prev.treasury + 500}) : null); } }} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition"><Heart size={16}/> {t('donate')}</button>
                  </div>
                  <div>
                      <h3 className="text-gray-500 font-bold mb-2 ml-1">{t('technology')}</h3>
                      <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                              <div className="flex justify-between items-start mb-2"><TrendingUp className="text-blue-500"/><span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Lvl {alliance.tech.trade}</span></div>
                              <div className="font-bold text-sm">{t('techTrade')}</div>
                              <button className="mt-2 w-full bg-gray-100 text-gray-600 text-xs py-1.5 rounded hover:bg-blue-600 hover:text-white transition">{t('upgrade')}</button>
                          </div>
                          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
                              <div className="flex justify-between items-start mb-2"><Shield className="text-red-500"/><span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">Lvl {alliance.tech.defense}</span></div>
                              <div className="font-bold text-sm">{t('techDefense')}</div>
                              <button className="mt-2 w-full bg-gray-100 text-gray-600 text-xs py-1.5 rounded hover:bg-red-600 hover:text-white transition">{t('upgrade')}</button>
                          </div>
                      </div>
                  </div>
                  <div>
                      <h3 className="text-gray-500 font-bold mb-2 ml-1">{t('allianceEvents')}</h3>
                      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div className="p-4 border-b flex justify-between items-center"><div className="font-bold">{t('mission1')}</div><span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">In Progress</span></div>
                          <div className="p-4 flex justify-between items-center"><div className="font-bold">{t('mission2')}</div><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span></div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderEvents = () => (
      <div className="min-h-screen bg-[#fdf6e3] p-4 flex flex-col">
          <div className="flex justify-between items-center mb-6">
              <button onClick={() => setScreen(GameScreen.HOME)}><ArrowLeft className="text-gray-600 rtl:rotate-180"/></button>
              <h2 className="text-2xl font-bold text-amber-900">{t('eventsTitle')}</h2>
              <div className="w-6"></div>
          </div>
          <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2"><Wind className="text-white/80"/><span className="font-bold uppercase tracking-wider text-xs">Limited Time</span></div>
                      <h3 className="text-2xl font-bold mb-2">{t('eventStorm')} Challenge</h3>
                      <p className="text-sm opacity-90 mb-4">Survive 50 turns without going to jail.</p>
                      <button className="bg-white text-purple-600 px-6 py-2 rounded-full font-bold shadow hover:bg-gray-100">Enter Event</button>
                  </div>
                  <Wind size={120} className="absolute -bottom-4 -right-4 opacity-20 text-white"/>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10">
                       <div className="flex items-center gap-2 mb-2"><Tent className="text-white/80"/><span className="font-bold uppercase tracking-wider text-xs">Weekend Event</span></div>
                      <h3 className="text-2xl font-bold mb-2">The Great Caravan</h3>
                      <p className="text-sm opacity-90 mb-4">Double gold from all trades!</p>
                      <button className="bg-white text-amber-600 px-6 py-2 rounded-full font-bold shadow hover:bg-gray-100">Play Now</button>
                  </div>
                  <Tent size={120} className="absolute -bottom-4 -right-4 opacity-20 text-white"/>
              </div>
          </div>
      </div>
  );

  switch (screen) {
      case GameScreen.HOME: return renderHome();
      case GameScreen.MODE_SELECT: return renderModeSelect();
      case GameScreen.LOBBY: return renderLobby();
      case GameScreen.CHARACTER_SELECT: return renderCharacterSelect();
      case GameScreen.PLAYING: return renderBoard();
      case GameScreen.GAME_OVER: return renderGameOver();
      case GameScreen.SETTINGS: return renderSettings();
      case GameScreen.SHOP: return renderShop();
      case GameScreen.SOCIAL: return renderSocial();
      case GameScreen.GUIDE: return renderGuide();
      case GameScreen.ALLIANCE: return renderAlliance();
      case GameScreen.EVENTS: return renderEvents();
      default: return renderHome();
  }
};

export default App;