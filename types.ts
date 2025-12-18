export enum TowerType {
  CANNON = 'CANNON',         
  SENTINEL = 'SENTINEL',     
  TESLA = 'TESLA',           
  CHRONO = 'CHRONO',         
  GOLEM = 'GOLEM',           
  RESONATOR = 'RESONATOR',   
  BEACON = 'BEACON'          
}

export enum EnemyType {
  // Basic
  SCUTTLER = 'SCUTTLER',
  GRUNT = 'GRUNT',
  THIEF = 'THIEF',
  // Elite
  BRUTE = 'BRUTE', // Armor
  WEAVER = 'WEAVER', // Magic
  SPREADER = 'SPREADER', // Swarm
  DRONE = 'DRONE', // Fast
  // Specialist
  LEECH = 'LEECH', // Mana steal
  SIEGE = 'SIEGE', // Building resist
  DOPPEL = 'DOPPEL', // Clone
  CHRONO_SOLDIER = 'CHRONO_SOLDIER', // Fast/Time
  // Boss
  AMALGAMATION = 'AMALGAMATION',
  RENDER = 'RENDER',
  TYRANT = 'TYRANT',
  WRAITH = 'WRAITH'
}

export enum ElementType {
  PHYSICAL = 'PHYSICAL',
  FIRE = 'FIRE',
  ICE = 'ICE',
  LIGHTNING = 'LIGHTNING',
  NECROTIC = 'NECROTIC',
  HOLY = 'HOLY',
  CHAOS = 'CHAOS',
  WATER = 'WATER',
  METAL = 'METAL',
  WIND = 'WIND',
  CRYSTAL = 'CRYSTAL',
  VOID = 'VOID',
  ARCANE = 'ARCANE',
  MAGMA = 'MAGMA',
  STONE = 'STONE',
  KINETIC = 'KINETIC',
  SONIC = 'SONIC',
  POISON = 'POISON',
  FEAR = 'FEAR',
  UV = 'UV',
  GAMMA = 'GAMMA',
  INFRARED = 'INFRARED'
}

export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT'
}

export enum Difficulty {
  APPRENTICE = 'APPRENTICE',
  ENGINEER = 'ENGINEER',
  MASTER = 'MASTER',
  VOID_TOUCHED = 'VOID_TOUCHED'
}

export enum MapId {
  ETHERFIELDS = 'ETHERFIELDS',
  ICE_SPIRE = 'ICE_SPIRE',
  BURNING_MAW = 'BURNING_MAW',
  XEROS = 'XEROS'
}

export enum Language {
  EN = 'EN',
  RU = 'RU'
}

export enum WeatherType {
  CLEAR = 'CLEAR',
  ACID_RAIN = 'ACID_RAIN', // Armor shred
  ETHEREAL_MIST = 'ETHEREAL_MIST', // Range down, Melee Speed up
  GEOMAGNETIC_STORM = 'GEOMAGNETIC_STORM', // Malfunction chance
  SOLAR_FLARE = 'SOLAR_FLARE', // Fire buff, Ice nerf
  QUANTUM_FLUX = 'QUANTUM_FLUX' // Random crit/miss
}

export interface Position {
  x: number;
  y: number;
}

export interface MapConfig {
  id: MapId;
  name: string;
  theme: string; // Description for AI
  description: string;
  difficultyLabel: string;
  paths: Position[][]; 
  backgroundClass: string; // CSS class for gradient/image
  gridColor: string;
  modifiers: string[];
  locationPowerName: string;
  locationPowerDesc: string;
  startManaBonus?: number;
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  cost: number;
  range: number;
  damage: number;
  cooldown: number;
  color: string;
  description: string;
  allowedInfusions: ElementType[];
}

export interface Entity {
  id: string;
  position: Position;
}

export interface SupportModule {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export interface Tower extends Entity {
  type: TowerType;
  cooldownTimer: number;
  level: number; // 1, 2, 3
  infusion?: ElementType;
  modules: string[]; // Module IDs
  totalDamageDealt: number;
  abilityCooldown: number;
  maxAbilityCooldown: number;
  malfunctionTimer?: number; // For weather
}

export interface StatusEffect {
  type: ElementType;
  duration: number; 
  magnitude: number; 
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  speed: number;
  baseSpeed: number;
  pathIndex: number;
  pathId: number; 
  bounty: number;
  armorType: 'NONE' | 'LIGHT' | 'HEAVY' | 'FORTIFIED' | 'MAGIC_RESIST' | 'SHIFTING';
  isEthereal: boolean; 
  statusEffects: StatusEffect[];
  shield?: number;
  armor?: number; // Dynamic armor value
}

export interface Projectile extends Entity {
  targetId: string;
  damage: number;
  speed: number;
  color: string;
  element: ElementType;
  hasHit: boolean;
  type: 'BULLET' | 'MISSILE' | 'BEAM' | 'CHAIN' | 'PULSE';
  chainRemaining?: number;
  aoeRadius?: number;
}

export interface Particle extends Entity {
  velocity: Position;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  money: number;
  lives: number;
  mana: number;
  soulEssence: number; // New Resource
  maxMana: number;
  wave: number;
  phase: GamePhase;
  difficulty: Difficulty;
  mapId: MapId;
  isPlaying: boolean;
  isGameOver: boolean;
  gameSpeed: number;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  selectedTowerId: string | null;
  
  // New Mechanics
  activeEvent: string | null;
  conductorAdaptation: string | null;
  locationPowerUnlocked: boolean;
  
  activeWeather: WeatherType;
  weatherTimer: number;
}