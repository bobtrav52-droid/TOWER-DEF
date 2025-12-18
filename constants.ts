import { TowerType, TowerConfig, EnemyType, Position, ElementType, MapId, MapConfig, Difficulty, Tower, WeatherType } from './types';

export const GRID_COLS = 24;
export const GRID_ROWS = 14;
export const TILE_SIZE = 40; 
export const FPS = 60;

// --- TRANSLATIONS ---

export const TRANSLATIONS = {
  EN: {
    // Menu
    TITLE: "AETHERFORGE TOENS",
    SELECT_SECTOR: "SELECT SECTOR",
    THREAT_LEVEL: "THREAT LEVEL",
    INITIALIZE: "INITIALIZE DEFENSE",
    
    // Stats
    GOLD: "GOLD",
    LIVES: "LIVES",
    MANA: "MANA",
    SOUL: "SOUL ESSENCE",
    
    // Actions
    ENGAGE: "ENGAGE",
    HALT: "HALT",
    MENU: "MENU",
    REQ_TACTICS: "REQ. TACTICS",
    
    // Upgrades
    CORE_UPGRADES: "CORE UPGRADES",
    INFUSION: "ELEMENTAL INFUSION",
    ABILITY: "ABILITY SLOT",
    MODULES: "MODULES",
    UPGRADE_TIER: "Upgrade to Tier",
    MAX_LEVEL: "MAX LEVEL REACHED",
    REQUIRES_TIER_2: "Requires Tier 2",
    UNLOCK_TIER_3: "Unlock at Tier 3",
    ACTIVATE: "ACTIVATE",
    COST: "Cost",
    SALVAGE: "SALVAGE",
    
    // Abilities
    REPAIR: "REPAIR",
    SPEED: "SPEED",
    NUKE: "NUKE",
    
    // AI
    AI_PROCESSING: "Processing...",
    AI_THREAT: "THREAT",
    AI_EVENT: "EVENT",
    
    // Misc
    SECTOR: "Sector",
    WAVE: "Wave",
    EXIT: "EXIT",
    SETTINGS: "SETTINGS",
    LANGUAGE: "LANGUAGE",
    WEATHER: "WEATHER",
    TOENS: "Toens"
  },
  RU: {
    TITLE: "ЭФИРНЫЕ TOENS",
    SELECT_SECTOR: "ВЫБОР СЕКТОРА",
    THREAT_LEVEL: "УРОВЕНЬ УГРОЗЫ",
    INITIALIZE: "НАЧАТЬ ЗАЩИТУ",
    
    GOLD: "ЗОЛОТО",
    LIVES: "ЖИЗНИ",
    MANA: "МАНА",
    SOUL: "ДУШИ",
    
    ENGAGE: "В БОЙ",
    HALT: "СТОП",
    MENU: "МЕНЮ",
    REQ_TACTICS: "ТАКТИКА",
    
    CORE_UPGRADES: "ОСНОВНЫЕ УЛУЧШЕНИЯ",
    INFUSION: "СТИХИЙНАЯ ИНФУЗИЯ",
    ABILITY: "СЛОТ СПОСОБНОСТИ",
    MODULES: "МОДУЛИ",
    UPGRADE_TIER: "Улучшить до Ур.",
    MAX_LEVEL: "МАКС. УРОВЕНЬ",
    REQUIRES_TIER_2: "Требуется Ур. 2",
    UNLOCK_TIER_3: "Откр. на Ур. 3",
    ACTIVATE: "АКТИВИРОВАТЬ",
    COST: "Цена",
    SALVAGE: "ПРОДАТЬ",
    
    REPAIR: "РЕМОНТ",
    SPEED: "СКОРОСТЬ",
    NUKE: "УДАР",
    
    AI_PROCESSING: "Анализ...",
    AI_THREAT: "УГРОЗА",
    AI_EVENT: "СОБЫТИЕ",
    
    SECTOR: "Сектор",
    WAVE: "Волна",
    EXIT: "ВЫХОД",
    SETTINGS: "НАСТРОЙКИ",
    LANGUAGE: "ЯЗЫК",
    WEATHER: "ПОГОДА",
    TOENS: "Toens"
  }
};

export const WEATHER_CONFIG = {
  [WeatherType.CLEAR]: { name: "Clear Skies", desc: "Optimal conditions. No modifiers." },
  [WeatherType.ACID_RAIN]: { name: "Acidic Rain", desc: "Armor shreds over time." },
  [WeatherType.ETHEREAL_MIST]: { name: "Ethereal Mist", desc: "-40% Range, +50% Melee Speed." },
  [WeatherType.GEOMAGNETIC_STORM]: { name: "Geomagnetic Storm", desc: "Toens malfunction occasionally." },
  [WeatherType.SOLAR_FLARE]: { name: "Solar Flare", desc: "+25% Fire Dmg, -25% Ice Dmg." },
  [WeatherType.QUANTUM_FLUX]: { name: "Quantum Flux", desc: "Attacks may crit (300%) or miss." },
};

// --- MAP CONFIGURATIONS ---

export const MAPS: Record<MapId, MapConfig> = {
  [MapId.ETHERFIELDS]: {
    id: MapId.ETHERFIELDS,
    name: "Arcanian Etherfields",
    theme: "Magical Meadow",
    description: "Winding trails through glowing flora. Mana blooms aid defense.",
    difficultyLabel: "Balanced",
    backgroundClass: "bg-gradient-to-br from-green-900 via-[#052e16] to-[#0f172a]",
    gridColor: "#4ade80", // Green
    modifiers: ["Mana Blooms (+Mana)", "Illusory Mist (-Range)"],
    locationPowerName: "Awaken Spirits",
    locationPowerDesc: "35% chance for a Spirit Warden to spawn when a Toens falls (or 5% on kill).",
    paths: [
      [{x:0,y:2}, {x:4,y:2}, {x:4,y:8}, {x:10,y:8}, {x:10,y:4}, {x:16,y:4}, {x:16,y:10}, {x:23,y:10}]
    ]
  },
  [MapId.ICE_SPIRE]: {
    id: MapId.ICE_SPIRE,
    name: "Eternal Ice Spire",
    theme: "Black Ice Castle",
    description: "A narrow, slippery path atop a mountain. Blizzards obscure vision.",
    difficultyLabel: "Tactical",
    backgroundClass: "bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#334155]",
    gridColor: "#cbd5e1", // Ice Blue/White
    modifiers: ["Glacial Stone (+Slow Potency)", "Blizzard (-Range)"],
    locationPowerName: "Permafrost",
    locationPowerDesc: "Frozen enemies explode on death.",
    paths: [
      [{x:0,y:6}, {x:6,y:6}, {x:6,y:3}, {x:18,y:3}, {x:18,y:9}, {x:23,y:9}] // Narrow zig zag
    ]
  },
  [MapId.BURNING_MAW]: {
    id: MapId.BURNING_MAW,
    name: "Ignis' Burning Maw",
    theme: "Volcanic Core",
    description: "Superheated platforms. Paths converge over lava lakes.",
    difficultyLabel: "High Risk",
    backgroundClass: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900 via-orange-900 to-black",
    gridColor: "#f59e0b", // Amber
    modifiers: ["Geothermal Power (+Fire Dmg)", "Lava Surges (Area Dmg)"],
    locationPowerName: "Earth's Wrath",
    locationPowerDesc: "Every 10th attack triggers a lava burst.",
    paths: [
      [{x:0,y:2}, {x:8,y:2}, {x:12,y:6}, {x:23,y:6}], // Top fork
      [{x:0,y:11}, {x:8,y:11}, {x:12,y:7}, {x:23,y:7}] // Bottom fork
    ]
  },
  [MapId.XEROS]: {
    id: MapId.XEROS,
    name: "Lost City of Xeros",
    theme: "Desert Ruins",
    description: "Ancient mazes where time flows strangely. Enemies engage from hidden catacombs.",
    difficultyLabel: "Complex",
    backgroundClass: "bg-[#2a1b0e]", // Deep Sand
    gridColor: "#d4d4d8", // Silver/Sand
    modifiers: ["Time Warps", "Hidden Catacombs (Spawn skipping)"],
    locationPowerName: "Sands of Time",
    locationPowerDesc: "Chance to rewind enemy positions slightly on hit.",
    paths: [
       [{x:0,y:1}, {x:22,y:1}, {x:22,y:12}, {x:2,y:12}, {x:2,y:6}, {x:23,y:6}] // Huge Loop
    ]
  }
};

// --- DIFFICULTY SETTINGS ---

export const DIFFICULTY_SETTINGS = {
  [Difficulty.APPRENTICE]: { hpMod: 0.7, goldMod: 0.625, costMod: 0.85 },
  [Difficulty.ENGINEER]: { hpMod: 1.0, goldMod: 0.5, costMod: 1.0 }, 
  [Difficulty.MASTER]: { hpMod: 1.25, goldMod: 0.4, costMod: 1.0 },
  [Difficulty.VOID_TOUCHED]: { hpMod: 1.6, goldMod: 0.3, costMod: 1.0 }
};

export const INITIAL_MONEY = 450; // Slight bump for new mechanics
export const INITIAL_LIVES = 20;
export const INITIAL_MANA = 100;
export const MAX_MANA = 200;
export const MANA_REGEN = 0.05;

// --- TOENS STATS & UPGRADES ---

export const TOWER_STATS: Record<TowerType, TowerConfig> = {
  [TowerType.CANNON]: {
    type: TowerType.CANNON,
    name: "Aether Toens",
    cost: 100,
    range: 3.5 * TILE_SIZE,
    damage: 15,
    cooldown: 35,
    color: '#b5a642',
    description: "Rapid-firing ballistic Toens.",
    allowedInfusions: [ElementType.FIRE, ElementType.ICE, ElementType.LIGHTNING]
  },
  [TowerType.SENTINEL]: {
    type: TowerType.SENTINEL,
    name: "Arcane Sentinel",
    cost: 150,
    range: 6 * TILE_SIZE,
    damage: 35,
    cooldown: 50,
    color: '#b026ff',
    description: "Fires homing arcane bolts.",
    allowedInfusions: [ElementType.NECROTIC, ElementType.HOLY, ElementType.CHAOS]
  },
  [TowerType.TESLA]: {
    type: TowerType.TESLA,
    name: "Tesla Spire",
    cost: 200,
    range: 3 * TILE_SIZE,
    damage: 20,
    cooldown: 45,
    color: '#00f3ff',
    description: "Arcs electricity to nearby enemies.",
    allowedInfusions: [ElementType.WATER, ElementType.METAL, ElementType.WIND]
  },
  [TowerType.CHRONO]: {
    type: TowerType.CHRONO,
    name: "Chrono-Toens",
    cost: 180,
    range: 4 * TILE_SIZE,
    damage: 0,
    cooldown: 10,
    color: '#ffffff',
    description: "Slows enemies in range.",
    allowedInfusions: [ElementType.CRYSTAL, ElementType.VOID, ElementType.ARCANE]
  },
  [TowerType.GOLEM]: {
    type: TowerType.GOLEM,
    name: "Forge Golem",
    cost: 250,
    range: 1.5 * TILE_SIZE,
    damage: 80,
    cooldown: 60,
    color: '#cd7f32',
    description: "Heavy melee damage to close enemies.",
    allowedInfusions: [ElementType.MAGMA, ElementType.STONE, ElementType.KINETIC]
  },
  [TowerType.RESONATOR]: {
    type: TowerType.RESONATOR,
    name: "Symphonic Resonator",
    cost: 300,
    range: 3.5 * TILE_SIZE,
    damage: 10,
    cooldown: 120,
    color: '#ff4444',
    description: "Pulses aura damage periodically.",
    allowedInfusions: [ElementType.SONIC, ElementType.POISON, ElementType.FEAR]
  },
  [TowerType.BEACON]: {
    type: TowerType.BEACON,
    name: "Prismatic Beacon",
    cost: 500,
    range: 7 * TILE_SIZE,
    damage: 4,
    cooldown: 5,
    color: '#ffd700',
    description: "Fires a continuous adaptive beam.",
    allowedInfusions: [ElementType.UV, ElementType.GAMMA, ElementType.INFRARED]
  }
};

export const UPGRADE_COSTS = {
  LEVEL_2: 1.8, // Multiplier of base cost
  LEVEL_3: 3.0,
  INFUSION: 1.5 // of current total value
};

export const SUPPORT_MODULES = [
  { id: 'TARGETING', name: 'Smart Targeting', desc: 'Prioritizes lowest HP enemies.', cost: 50 },
  { id: 'OVERCLOCK', name: 'Overclock', desc: '+15% Attack Speed.', cost: 100 },
  { id: 'RANGE_FINDER', name: 'Range Finder', desc: '+20% Range.', cost: 75 }
];

export const ENEMY_CONFIGS = {
  [EnemyType.SCUTTLER]: { speed: 2.2, health: 30, bounty: 8, armor: 'NONE', color: '#a0a0a0' },
  [EnemyType.GRUNT]: { speed: 1.2, health: 60, bounty: 12, armor: 'LIGHT', color: '#8b4513' },
  [EnemyType.THIEF]: { speed: 3.0, health: 25, bounty: 15, armor: 'NONE', color: '#ffd700' },
  [EnemyType.BRUTE]: { speed: 0.7, health: 200, bounty: 25, armor: 'HEAVY', color: '#4a4a4a' },
  [EnemyType.WEAVER]: { speed: 1.5, health: 80, bounty: 20, armor: 'NONE', color: '#e6e6fa' },
  [EnemyType.SPREADER]: { speed: 0.9, health: 120, bounty: 22, armor: 'NONE', color: '#006400' },
  [EnemyType.DRONE]: { speed: 2.0, health: 50, bounty: 18, armor: 'LIGHT', color: '#87ceeb' },
  [EnemyType.LEECH]: { speed: 1.8, health: 70, bounty: 30, armor: 'NONE', color: '#9400d3' },
  [EnemyType.SIEGE]: { speed: 0.5, health: 400, bounty: 50, armor: 'FORTIFIED', color: '#2f4f4f' },
  [EnemyType.DOPPEL]: { speed: 1.3, health: 60, bounty: 25, armor: 'NONE', color: '#ff69b4' },
  [EnemyType.CHRONO_SOLDIER]: { speed: 1.5, health: 90, bounty: 28, armor: 'LIGHT', color: '#f0f8ff' },
  [EnemyType.AMALGAMATION]: { speed: 0.4, health: 2000, bounty: 300, armor: 'HEAVY', color: '#8b0000' },
  [EnemyType.RENDER]: { speed: 1.8, health: 1500, bounty: 400, armor: 'MAGIC_RESIST', color: '#4b0082' },
  [EnemyType.TYRANT]: { speed: 0.6, health: 3000, bounty: 500, armor: 'HEAVY', color: '#b8860b' },
  [EnemyType.WRAITH]: { speed: 1.0, health: 5000, bounty: 1000, armor: 'SHIFTING', color: '#000000' },
};

// --- ADAPTIVE WAVE GENERATOR ---

export interface WaveSegment {
    type: EnemyType;
    count: number;
    interval: number;
}

export const generateAdaptiveWave = (wave: number, difficulty: Difficulty, towers: Tower[]): { segments: WaveSegment[], adaptation: string, event: string | null } => {
    const diff = DIFFICULTY_SETTINGS[difficulty];
    const segments: WaveSegment[] = [];
    let adaptation = "Standard Protocol";
    let event = null;

    // 1. Analyze Player Defense
    let totalDmg = 0;
    let magicDmg = 0;
    let physDmg = 0;
    let aoePotential = 0;

    towers.forEach(t => {
        const conf = TOWER_STATS[t.type];
        totalDmg += conf.damage;
        if (t.type === TowerType.SENTINEL || t.infusion) magicDmg += conf.damage;
        else physDmg += conf.damage;
        
        if (t.type === TowerType.TESLA || t.type === TowerType.RESONATOR || t.type === TowerType.BEACON) aoePotential++;
    });

    const isMagicHeavy = magicDmg > physDmg * 1.5;
    const isPhysHeavy = physDmg > magicDmg * 1.5;
    const isAoEHeavy = aoePotential > towers.length * 0.4;

    // 2. Determine Event
    if (wave === 5) event = "Mini-Boss: Brute Alpha";
    if (wave === 10) event = "Swarm";
    if (wave === 15) event = "Silence Wave";
    if (wave === 20) event = "BOSS: The Amalgamation";
    
    // 3. Construct Wave
    // Boss Waves
    if (wave % 10 === 0) {
        const bossType = wave === 10 ? EnemyType.AMALGAMATION : (wave === 20 ? EnemyType.RENDER : EnemyType.WRAITH);
        segments.push({ type: bossType, count: 1, interval: 300 });
        segments.push({ type: EnemyType.SCUTTLER, count: 10 + wave, interval: 30 });
        adaptation = "Boss Encounter";
    } 
    // Event Waves
    else if (event === "Swarm") {
        segments.push({ type: EnemyType.SCUTTLER, count: 40, interval: 15 });
        adaptation = "Overwhelming Numbers";
    }
    // Adaptive Logic
    else {
        // Core meat
        let mainType = EnemyType.GRUNT;
        if (isPhysHeavy) {
            mainType = EnemyType.BRUTE; // Counter Phys with Armor
            adaptation = "Reinforced Armor (Countering Physical)";
        } else if (isMagicHeavy) {
            mainType = EnemyType.WEAVER; // Counter Magic
            adaptation = "Anti-Magic Fields (Countering Magic)";
        }

        // Add core
        segments.push({ type: mainType, count: 4 + Math.floor(wave/2), interval: 60 });

        // Add flankers
        if (isAoEHeavy) {
            segments.push({ type: EnemyType.THIEF, count: 3 + Math.floor(wave/3), interval: 100 }); // Spaced out
            adaptation += " + Dispersed Flankers";
        } else {
            segments.push({ type: EnemyType.SCUTTLER, count: 8 + wave, interval: 20 }); // Clumped
        }

        // Elites later on
        if (wave > 7) {
             segments.push({ type: EnemyType.LEECH, count: 2 + Math.floor(wave/5), interval: 120 });
        }
    }
    
    return { segments, adaptation, event };
};
