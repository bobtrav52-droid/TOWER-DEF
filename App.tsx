import React, { useState, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameState, TowerType, ElementType, GamePhase, Difficulty, MapId, Language, WeatherType } from './types';
import { 
    INITIAL_MONEY, 
    INITIAL_LIVES, 
    INITIAL_MANA,
    TOWER_STATS, 
    MAPS,
    DIFFICULTY_SETTINGS,
    UPGRADE_COSTS,
    SUPPORT_MODULES,
    TRANSLATIONS,
    WEATHER_CONFIG
} from './constants';
import { 
    Zap, Heart, Shield, Play, Pause, Cpu, Hammer, 
    Skull, Sparkles, Crosshair, Music, Radio, Wind, 
    Map as MapIcon, Globe, ArrowUp, X, LogOut, Settings,
    CloudRain, Ghost
} from 'lucide-react';
import { getStrategicAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType | null>(null);
  const [activeTowerId, setActiveTowerId] = useState<string | null>(null); // For upgrade menu
  const [aiAdvice, setAiAdvice] = useState<string>("Aetherlink Establishing...");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lang, setLang] = useState<Language>(Language.EN);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    money: INITIAL_MONEY,
    lives: INITIAL_LIVES,
    mana: INITIAL_MANA,
    soulEssence: 0,
    maxMana: 200,
    wave: 1,
    phase: GamePhase.MENU,
    difficulty: Difficulty.ENGINEER,
    mapId: MapId.ETHERFIELDS,
    isPlaying: false,
    isGameOver: false,
    gameSpeed: 1,
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    selectedTowerId: null,
    activeEvent: null,
    conductorAdaptation: null,
    locationPowerUnlocked: false,
    activeWeather: WeatherType.CLEAR,
    weatherTimer: 0
  });

  const gameStateRef = useRef<GameState>(gameState);

  // Translation Helper
  const t = (key: keyof typeof TRANSLATIONS['EN']) => {
      return TRANSLATIONS[lang][key] || TRANSLATIONS['EN'][key] || key;
  };
  
  const handleStateUpdate = (newState: GameState) => {
      setGameState({...newState}); 
  };

  const startGame = () => {
     const freshState: GameState = {
         ...gameState,
         money: INITIAL_MONEY,
         lives: INITIAL_LIVES,
         mana: INITIAL_MANA + (MAPS[gameState.mapId].startManaBonus || 0),
         soulEssence: 0,
         wave: 1,
         phase: GamePhase.PLAYING,
         isPlaying: false,
         isGameOver: false,
         towers: [],
         enemies: [],
         projectiles: [],
         particles: [],
         activeEvent: null,
         conductorAdaptation: null,
         locationPowerUnlocked: false,
         activeWeather: WeatherType.CLEAR,
         weatherTimer: 0
     };
     gameStateRef.current = freshState;
     setGameState(freshState);
  };

  const togglePlay = () => {
    if (gameStateRef.current.isGameOver) {
        setGameState({...gameState, phase: GamePhase.MENU});
        return;
    }
    gameStateRef.current.isPlaying = !gameStateRef.current.isPlaying;
    handleStateUpdate(gameStateRef.current);
  };

  const exitLevel = () => {
    setGameState({...gameState, phase: GamePhase.MENU, isPlaying: false});
  };

  const handleManualAdvice = async () => {
    setIsAiLoading(true);
    setAiAdvice(lang === Language.RU ? "Обработка запроса..." : "Querying the Cogitator Bank...");
    const advice = await getStrategicAdvice(gameStateRef.current);
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  // --- UPGRADE LOGIC ---

  const getTowerById = (id: string) => gameState.towers.find(t => t.id === id);

  const upgradeCore = (towerId: string) => {
      const state = gameStateRef.current;
      const tower = state.towers.find(t => t.id === towerId);
      if (!tower || tower.level >= 3) return;
      
      const conf = TOWER_STATS[tower.type];
      const cost = Math.floor(conf.cost * (tower.level === 1 ? UPGRADE_COSTS.LEVEL_2 : UPGRADE_COSTS.LEVEL_3));
      
      if (state.money >= cost) {
          state.money -= cost;
          tower.level += 1;
          handleStateUpdate(state);
      }
  };

  const infuseTower = (towerId: string, element: ElementType) => {
      const state = gameStateRef.current;
      const tower = state.towers.find(t => t.id === towerId);
      if (!tower || tower.infusion) return;
      
      const conf = TOWER_STATS[tower.type];
      const cost = Math.floor(conf.cost * UPGRADE_COSTS.INFUSION); // Fixed calculation base
      
      if (state.money >= cost) {
          state.money -= cost;
          tower.infusion = element;
          handleStateUpdate(state);
      }
  };

  const addModule = (towerId: string, moduleId: string, cost: number) => {
      const state = gameStateRef.current;
      const tower = state.towers.find(t => t.id === towerId);
      if (!tower || tower.modules.includes(moduleId) || tower.modules.length >= 2) return;
      
      if (state.money >= cost) {
          state.money -= cost;
          tower.modules.push(moduleId);
          handleStateUpdate(state);
      }
  };

  const useAbility = (ability: 'REPAIR' | 'SPEED' | 'NUKE') => {
      const state = gameStateRef.current;
      if (ability === 'REPAIR' && state.mana >= 50) {
          state.mana -= 50;
          state.lives = Math.min(state.lives + 5, 50);
      }
      if (ability === 'SPEED' && state.mana >= 75) {
          state.mana -= 75;
          state.towers.forEach(t => t.cooldownTimer = 0);
      }
      if (ability === 'NUKE' && state.mana >= 100) {
          state.mana -= 100;
          state.enemies.forEach(e => e.health -= 100);
      }
      handleStateUpdate(state);
  }

  // Icons helper
  const getTowerIcon = (type: TowerType) => {
      switch(type) {
          case TowerType.CANNON: return <Crosshair size={16} />;
          case TowerType.SENTINEL: return <Sparkles size={16} />;
          case TowerType.TESLA: return <Zap size={16} />;
          case TowerType.CHRONO: return <Wind size={16} />;
          case TowerType.GOLEM: return <Hammer size={16} />;
          case TowerType.RESONATOR: return <Music size={16} />;
          case TowerType.BEACON: return <Radio size={16} />;
          default: return <Shield size={16} />;
      }
  };

  const activeTower = activeTowerId ? getTowerById(activeTowerId) : null;
  const activeTowerConfig = activeTower ? TOWER_STATS[activeTower.type] : null;

  // --- MENU RENDER ---
  if (gameState.phase === GamePhase.MENU) {
      return (
          <div className="flex h-screen w-full bg-aether-dark text-aether-gold flex-col items-center justify-center p-8 relative overflow-hidden">
               <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#b5a642 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
               
               {/* Language Toggle */}
               <div className="absolute top-4 right-4 z-50">
                   <button 
                       onClick={() => setLang(lang === Language.EN ? Language.RU : Language.EN)}
                       className="flex items-center gap-2 bg-aether-panel border border-aether-brass px-4 py-2 rounded text-aether-gold hover:bg-black"
                   >
                       <Settings size={16} /> {lang}
                   </button>
               </div>

               <h1 className="text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-aether-gold to-aether-brass mb-8 drop-shadow-lg z-10 text-center">
                   {t('TITLE')}
               </h1>

               <div className="flex gap-8 w-full max-w-6xl z-10 h-[60vh]">
                   {/* Map Select */}
                   <div className="flex-1 bg-aether-panel border-2 border-aether-brass p-6 rounded-lg shadow-2xl overflow-y-auto">
                       <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-aether-cyan"><Globe /> {t('SELECT_SECTOR')}</h2>
                       <div className="space-y-4">
                           {Object.values(MAPS).map(map => (
                               <button 
                                   key={map.id}
                                   onClick={() => setGameState({...gameState, mapId: map.id})}
                                   className={`w-full p-4 text-left border-2 transition-all relative overflow-hidden group ${gameState.mapId === map.id ? 'border-aether-cyan bg-aether-cyan/10' : 'border-gray-700 hover:border-aether-gold bg-black/40'}`}
                               >
                                   <div className={`absolute inset-0 opacity-20 ${map.backgroundClass}`}></div>
                                   <div className="relative z-10">
                                      <div className="flex justify-between items-center mb-1">
                                          <div className="font-bold text-lg font-display">{map.name}</div>
                                          <div className="text-xs font-mono uppercase tracking-widest bg-black px-2 py-1 rounded border border-gray-600">{map.difficultyLabel}</div>
                                      </div>
                                      <div className="text-sm text-gray-300 italic mb-2">{map.theme}</div>
                                      <div className="text-xs text-gray-400 mb-3">{map.description}</div>
                                      <div className="flex flex-wrap gap-2">
                                          {map.modifiers.map(mod => <span key={mod} className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-aether-cyan border border-aether-cyan/30">{mod}</span>)}
                                      </div>
                                   </div>
                               </button>
                           ))}
                       </div>
                   </div>

                   {/* Difficulty Select */}
                   <div className="w-1/3 bg-aether-panel border-2 border-aether-brass p-6 rounded-lg shadow-2xl flex flex-col">
                       <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-aether-red"><Shield /> {t('THREAT_LEVEL')}</h2>
                       <div className="space-y-3 flex-1">
                           {Object.keys(DIFFICULTY_SETTINGS).map((diff) => (
                               <button 
                                   key={diff}
                                   onClick={() => setGameState({...gameState, difficulty: diff as Difficulty})}
                                   className={`w-full p-4 text-left border transition-all ${gameState.difficulty === diff ? 'border-aether-red bg-aether-red/10' : 'border-gray-700 hover:border-aether-gold bg-black/40'}`}
                               >
                                   <div className="font-bold text-lg">{diff}</div>
                                   <div className="text-xs text-gray-400 mt-1">
                                       HP: x{DIFFICULTY_SETTINGS[diff as Difficulty].hpMod} | {t('GOLD')}: x{DIFFICULTY_SETTINGS[diff as Difficulty].goldMod}
                                   </div>
                               </button>
                           ))}
                       </div>
                       <button 
                           onClick={startGame}
                           className="w-full py-4 mt-6 bg-aether-brass hover:bg-yellow-600 text-black font-bold text-xl rounded shadow-[0_0_20px_rgba(181,166,66,0.5)] transition-transform active:scale-95 border-2 border-aether-gold"
                       >
                           {t('INITIALIZE')}
                       </button>
                   </div>
               </div>
          </div>
      );
  }

  // --- GAME RENDER ---
  return (
    <div className="flex h-screen w-full bg-aether-dark text-aether-gold overflow-hidden font-body select-none">
      
      {/* --- Sidebar Left --- */}
      <aside className="w-72 bg-aether-panel border-r-2 border-aether-brass flex flex-col z-10 shadow-xl relative">
        <div className="p-4 border-b border-aether-brass bg-aether-dark/50">
          <h1 className="text-xl font-display font-bold text-aether-gold">AETHERFORGE</h1>
          <div className="flex flex-col gap-1 text-[10px] text-gray-400 mt-1 font-mono">
              <div className="flex justify-between"><span>{t('SECTOR')}:</span> <span className="text-white">{MAPS[gameState.mapId].name}</span></div>
              <div className="flex justify-between"><span>POWER:</span> <span className={gameState.locationPowerUnlocked ? "text-aether-cyan animate-pulse" : "text-gray-600"}>{gameState.locationPowerUnlocked ? "ONLINE" : "LOCKED (Wave 10)"}</span></div>
          </div>
          {/* Weather Display */}
          <div className="mt-3 p-2 bg-black/40 border border-gray-700 rounded flex items-center gap-2">
             <CloudRain size={16} className="text-blue-400" />
             <div className="flex flex-col">
                 <span className="text-[10px] text-gray-400 uppercase tracking-widest">{t('WEATHER')}</span>
                 <span className="text-xs font-bold text-white">{WEATHER_CONFIG[gameState.activeWeather]?.name || "Unknown"}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 bg-black/20">
          <div className="bg-aether-dark p-2 rounded border border-aether-brass/50 flex flex-col items-center">
            <span className="text-aether-gold font-display text-xl">{Math.floor(gameState.money)}</span>
            <span className="text-[10px] text-gray-400">{t('GOLD')}</span>
          </div>
          <div className="bg-aether-dark p-2 rounded border border-aether-brass/50 flex flex-col items-center">
            <span className="text-aether-red font-display text-xl">{gameState.lives}</span>
            <span className="text-[10px] text-gray-400">{t('LIVES')}</span>
          </div>
          <div className="bg-aether-dark p-2 rounded border border-aether-cyan/50 flex flex-col items-center relative overflow-hidden">
             <span className="text-aether-cyan font-display text-xl z-10">{Math.floor(gameState.mana)}</span>
             <span className="text-[10px] text-gray-400 z-10">{t('MANA')}</span>
             <Zap className="absolute -right-2 -bottom-2 text-aether-cyan/20" size={40} />
          </div>
          <div className="bg-aether-dark p-2 rounded border border-aether-purple/50 flex flex-col items-center relative overflow-hidden">
             <span className="text-aether-purple font-display text-xl z-10">{gameState.soulEssence}</span>
             <span className="text-[10px] text-gray-400 z-10">{t('SOUL')}</span>
             <Ghost className="absolute -right-2 -bottom-2 text-aether-purple/20" size={40} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {Object.values(TOWER_STATS).map((tower) => {
            // Dynamic Cost Calc for Sidebar
            const count = gameState.towers.filter(t => t.type === tower.type).length;
            const baseCost = tower.cost * DIFFICULTY_SETTINGS[gameState.difficulty].costMod;
            const currentCost = Math.floor(baseCost * (1 + (count * 0.15)));

            return (
              <button
                key={tower.type}
                onClick={() => { setSelectedTowerType(tower.type); setActiveTowerId(null); }}
                className={`w-full p-2 rounded border text-left transition-all flex items-center gap-3 ${
                  selectedTowerType === tower.type 
                    ? 'border-aether-cyan bg-aether-cyan/10' 
                    : 'border-aether-brass/30 hover:border-aether-brass bg-aether-dark/40'
                } ${gameState.money < currentCost ? 'opacity-40 grayscale' : ''}`}
              >
                <div className={`p-2 rounded bg-black/40 ${selectedTowerType === tower.type ? 'text-aether-cyan' : 'text-aether-gold'}`}>
                    {getTowerIcon(tower.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                      <span className="font-bold text-sm text-gray-200">{tower.name}</span>
                      <span className="text-aether-gold font-mono text-xs">{currentCost}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        
        <div className="p-4 border-t border-aether-brass bg-aether-panel">
          <button onClick={togglePlay} className={`w-full py-3 rounded font-display font-bold flex items-center justify-center gap-2 border border-aether-brass ${gameState.isPlaying ? 'bg-red-900/50 text-red-200' : 'bg-aether-cyan/20 text-aether-cyan'}`}>
            {gameState.isPlaying ? <><Pause size={16} /> {t('HALT')}</> : <><Play size={16} /> {gameState.isGameOver ? t('MENU') : t('ENGAGE')}</>}
          </button>
        </div>
      </aside>

      {/* --- Main Game Area --- */}
      <main className="flex-1 relative flex flex-col bg-black">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none">
          {/* Top Left: Exit Button */}
          <div className="pointer-events-auto">
              <button 
                  onClick={exitLevel} 
                  className="bg-black/80 border border-aether-red/50 text-aether-red hover:bg-aether-red/20 hover:border-aether-red p-3 rounded-full transition-all shadow-lg flex items-center gap-2"
                  title={t('EXIT')}
              >
                  <LogOut size={20} />
              </button>
          </div>

          {/* Center/Right: AI / Event HUD */}
          <div className="bg-aether-panel/90 backdrop-blur-md border border-aether-purple/50 rounded-lg p-3 shadow-2xl flex items-start gap-4 pointer-events-auto max-w-xl w-full mx-4">
             <div className={`p-2 rounded-full bg-black border border-aether-purple ${isAiLoading ? 'animate-spin-slow' : ''}`}>
               <Cpu className="text-aether-purple" size={20} />
             </div>
             <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                 {/* REMOVED: High Artificer (AI) text */}
                 <button onClick={handleManualAdvice} className="text-[10px] bg-black px-2 py-0.5 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-aether-purple transition-all">
                     {t('REQ_TACTICS')}
                 </button>
               </div>
               <p className="text-sm text-gray-300 font-mono leading-tight mb-2">{isAiLoading ? t('AI_PROCESSING') : `"${aiAdvice}"`}</p>
               {gameState.conductorAdaptation && (
                   <div className="text-[10px] text-red-400 border-t border-gray-700 pt-1">
                       ⚠ {t('AI_THREAT')}: {gameState.conductorAdaptation}
                       {gameState.activeEvent && <span className="block font-bold text-red-500 animate-pulse">{t('AI_EVENT')}: {gameState.activeEvent}</span>}
                   </div>
               )}
             </div>
          </div>

          {/* Player Abilities */}
          <div className="pointer-events-auto flex gap-2">
             <button onClick={() => useAbility('REPAIR')} className="w-12 h-12 rounded border border-aether-cyan/50 bg-black/80 flex items-center justify-center hover:bg-aether-cyan/20 relative" disabled={gameState.mana < 50}>
                <Heart size={20} className={gameState.mana >= 50 ? "text-aether-cyan" : "text-gray-600"} />
                <span className="absolute -bottom-4 text-[10px] bg-black px-1 border border-gray-700">50</span>
             </button>
             <button onClick={() => useAbility('SPEED')} className="w-12 h-12 rounded border border-aether-cyan/50 bg-black/80 flex items-center justify-center hover:bg-aether-cyan/20 relative" disabled={gameState.mana < 75}>
                <Zap size={20} className={gameState.mana >= 75 ? "text-aether-cyan" : "text-gray-600"} />
                <span className="absolute -bottom-4 text-[10px] bg-black px-1 border border-gray-700">75</span>
             </button>
             <button onClick={() => useAbility('NUKE')} className="w-12 h-12 rounded border border-aether-red/50 bg-black/80 flex items-center justify-center hover:bg-aether-red/20 relative" disabled={gameState.mana < 100}>
                <Skull size={20} className={gameState.mana >= 100 ? "text-aether-red" : "text-gray-600"} />
                <span className="absolute -bottom-4 text-[10px] bg-black px-1 border border-gray-700">100</span>
             </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-[#0a0a0f] to-[#121218]">
           {/* Dynamic Background */}
           <div className={`absolute inset-0 opacity-100 ${MAPS[gameState.mapId].backgroundClass}`}></div>
           <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
           
           <GameCanvas 
             selectedTowerType={selectedTowerType}
             onStateUpdate={handleStateUpdate}
             onAIAdvice={setAiAdvice}
             initialState={gameState}
             gameStateRef={gameStateRef}
             onTowerClick={(id) => { setActiveTowerId(id); setSelectedTowerType(null); }}
           />
        </div>

        {/* --- UPGRADE MENU (Radial/Quadrant Style) --- */}
        {activeTower && activeTowerConfig && (
            <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center backdrop-blur-sm" onClick={() => setActiveTowerId(null)}>
                <div className="relative w-[600px] h-[500px] bg-aether-panel border-2 border-aether-brass rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] grid grid-cols-2 grid-rows-2 p-1 gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setActiveTowerId(null)} className="absolute top-2 right-2 z-50 text-gray-400 hover:text-white"><X /></button>
                    
                    {/* CENTER: Info */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-black rounded-full border-4 border-aether-brass z-20 flex flex-col items-center justify-center text-center shadow-xl">
                        <div className="text-aether-gold font-display font-bold text-sm leading-tight">{activeTowerConfig.name}</div>
                        <div className="text-xs text-aether-cyan">LVL {activeTower.level}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Kill Count: --</div>
                    </div>

                    {/* TOP LEFT: Core Upgrades */}
                    <div className="col-start-1 row-start-1 bg-black/40 border border-gray-800 rounded-tl-lg p-4 flex flex-col justify-start items-start">
                        <h3 className="text-aether-gold font-bold mb-2 flex items-center gap-2"><ArrowUp size={16} /> {t('CORE_UPGRADES')}</h3>
                        <div className="space-y-2 w-full">
                            {activeTower.level < 3 ? (
                                <button 
                                    onClick={() => upgradeCore(activeTower.id)}
                                    className="w-full bg-aether-brass/20 border border-aether-brass hover:bg-aether-brass/40 p-2 rounded flex justify-between items-center disabled:opacity-30"
                                    disabled={gameState.money < Math.floor(activeTowerConfig.cost * (activeTower.level === 1 ? UPGRADE_COSTS.LEVEL_2 : UPGRADE_COSTS.LEVEL_3))}
                                >
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-white">{t('UPGRADE_TIER')} {activeTower.level + 1}</div>
                                        <div className="text-[10px] text-gray-400">+Damage, +Range</div>
                                    </div>
                                    <div className="text-aether-gold font-mono">{Math.floor(activeTowerConfig.cost * (activeTower.level === 1 ? UPGRADE_COSTS.LEVEL_2 : UPGRADE_COSTS.LEVEL_3))}g</div>
                                </button>
                            ) : (
                                <div className="text-aether-cyan text-sm text-center border border-aether-cyan p-2 rounded bg-aether-cyan/10">{t('MAX_LEVEL')}</div>
                            )}
                        </div>
                    </div>

                    {/* TOP RIGHT: Infusions */}
                    <div className="col-start-2 row-start-1 bg-black/40 border border-gray-800 rounded-tr-lg p-4 flex flex-col items-end">
                        <h3 className="text-aether-purple font-bold mb-2 flex items-center gap-2">{t('INFUSION')} <Zap size={16} /></h3>
                        {activeTower.level >= 2 ? (
                            <div className="grid grid-cols-3 gap-2 w-full">
                                {activeTowerConfig.allowedInfusions.map(el => (
                                    <button
                                        key={el}
                                        onClick={() => infuseTower(activeTower.id, el)}
                                        disabled={gameState.money < Math.floor(activeTowerConfig.cost * UPGRADE_COSTS.INFUSION) || !!activeTower.infusion}
                                        className={`p-2 rounded border text-center transition-all ${
                                            activeTower.infusion === el 
                                            ? 'bg-aether-purple text-white border-aether-purple' 
                                            : 'bg-black border-gray-700 hover:border-white text-gray-400'
                                        }`}
                                    >
                                        <div className="text-[10px] font-bold">{el.substring(0,3)}</div>
                                    </button>
                                ))}
                                <div className="col-span-3 text-right text-[10px] text-gray-500 mt-1">{t('COST')}: {Math.floor(activeTowerConfig.cost * UPGRADE_COSTS.INFUSION)}g</div>
                            </div>
                        ) : (
                            <div className="text-gray-500 text-sm text-center w-full italic">{t('REQUIRES_TIER_2')}</div>
                        )}
                    </div>

                    {/* BOTTOM LEFT: Ability */}
                    <div className="col-start-1 row-start-2 bg-black/40 border border-gray-800 rounded-bl-lg p-4 flex flex-col justify-end items-start">
                        <h3 className="text-aether-cyan font-bold mb-2">{t('ABILITY')}</h3>
                        {activeTower.level >= 3 ? (
                            <button className="w-full h-12 bg-aether-cyan/20 border border-aether-cyan text-aether-cyan hover:bg-aether-cyan/40 rounded flex items-center justify-center font-bold tracking-widest">
                                {t('ACTIVATE')}: OVERCHARGE
                            </button>
                        ) : (
                             <div className="text-gray-500 text-sm italic">{t('UNLOCK_TIER_3')}</div>
                        )}
                    </div>

                    {/* BOTTOM RIGHT: Modules */}
                    <div className="col-start-2 row-start-2 bg-black/40 border border-gray-800 rounded-br-lg p-4 flex flex-col justify-end items-end">
                        <h3 className="text-aether-brass font-bold mb-2">{t('MODULES')} (Max 2)</h3>
                        <div className="space-y-1 w-full">
                            {SUPPORT_MODULES.map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => addModule(activeTower.id, mod.id, mod.cost)}
                                    disabled={activeTower.modules.includes(mod.id) || activeTower.modules.length >= 2 || gameState.money < mod.cost}
                                    className={`w-full flex justify-between px-2 py-1 text-xs border rounded ${activeTower.modules.includes(mod.id) ? 'border-green-500 text-green-500' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                >
                                    <span>{mod.name}</span>
                                    <span>{mod.cost}g</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="h-6 bg-aether-panel border-t border-aether-brass/50 flex items-center justify-between px-4 text-[10px] text-gray-500 font-mono uppercase">
            <div>{t('SECTOR')} {gameState.mapId} // {gameState.difficulty}</div>
            <div>{t('WAVE')} {gameState.wave}</div>
        </div>
      </main>
    </div>
  );
};

export default App;
