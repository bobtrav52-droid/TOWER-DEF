import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameState, 
  TowerType, 
  EnemyType, 
  ElementType,
  Enemy, 
  Position, 
  MapId,
  Difficulty,
  WeatherType
} from '../types';
import { 
  GRID_COLS, 
  GRID_ROWS, 
  TILE_SIZE, 
  TOWER_STATS, 
  ENEMY_CONFIGS, 
  MAX_MANA,
  MANA_REGEN,
  MAPS,
  generateAdaptiveWave,
  DIFFICULTY_SETTINGS
} from '../constants';
import { getStrategicAdvice } from '../services/geminiService';

interface GameCanvasProps {
  selectedTowerType: TowerType | null;
  onStateUpdate: (state: GameState) => void;
  onAIAdvice: (advice: string) => void;
  initialState: GameState;
  gameStateRef: React.MutableRefObject<GameState>;
  onTowerClick: (towerId: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  selectedTowerType, 
  onStateUpdate, 
  onAIAdvice,
  initialState,
  gameStateRef,
  onTowerClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const waveEnemyIndexRef = useRef<number>(0);
  const [hoverPos, setHoverPos] = useState<Position | null>(null);

  // --- Utility Functions ---

  const getDistance = (p1: Position, p2: Position) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const spawnParticle = (pos: Position, color: string, count: number, sizeMod: number = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      gameStateRef.current.particles.push({
        id: Math.random().toString(),
        position: { ...pos },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color: color,
        size: (Math.random() * 3 + 1) * sizeMod
      });
    }
  };

  // --- Game Loop Update ---

  const update = () => {
    const state = gameStateRef.current;
    if (state.isGameOver) return;
    
    const mapConfig = MAPS[state.mapId];
    const diffSettings = DIFFICULTY_SETTINGS[state.difficulty];

    // Mana Regen & Location Power Unlock
    if (state.isPlaying) {
        if (state.mana < MAX_MANA) state.mana = Math.min(state.mana + MANA_REGEN, MAX_MANA);
        if (state.wave >= 10 && !state.locationPowerUnlocked) {
            state.locationPowerUnlocked = true; // Unlock Map Power
        }
        
        // WEATHER CYCLE (Every 600 frames ~ 10s change for demo, usually longer)
        state.weatherTimer++;
        if (state.weatherTimer > 900) {
            state.weatherTimer = 0;
            const weathers = Object.values(WeatherType);
            const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
            state.activeWeather = randomWeather;
        }
    }

    if (!state.isPlaying) return;

    // 1. Spawning (Adaptive)
    const waveResult = generateAdaptiveWave(state.wave, state.difficulty, state.towers);
    // Update state context for UI
    if (state.conductorAdaptation !== waveResult.adaptation) {
        state.conductorAdaptation = waveResult.adaptation;
        state.activeEvent = waveResult.event;
    }

    let totalEnemiesSpawned = 0;
    let currentSegment = null;
    
    for (const seg of waveResult.segments) {
      if (waveEnemyIndexRef.current < totalEnemiesSpawned + seg.count) {
          currentSegment = seg;
          break;
      }
      totalEnemiesSpawned += seg.count;
    }

    if (currentSegment) {
      spawnTimerRef.current++;
      if (spawnTimerRef.current >= currentSegment.interval) {
        spawnTimerRef.current = 0;
        const conf = ENEMY_CONFIGS[currentSegment.type];
        
        let pathId = 0;
        if (mapConfig.paths.length > 1) {
             pathId = Math.floor(Math.random() * mapConfig.paths.length);
        }
        const startNode = mapConfig.paths[pathId][0];
        
        const maxHp = conf.health * diffSettings.hpMod * (1 + (state.wave * 0.08)); 

        state.enemies.push({
          id: Math.random().toString(),
          position: { x: startNode.x * TILE_SIZE + TILE_SIZE/2, y: startNode.y * TILE_SIZE + TILE_SIZE/2 },
          type: currentSegment.type,
          health: maxHp,
          maxHealth: maxHp,
          speed: conf.speed,
          baseSpeed: conf.speed,
          pathIndex: 0,
          pathId: pathId,
          bounty: conf.bounty,
          armorType: conf.armor as any,
          isEthereal: false,
          statusEffects: [],
          armor: conf.armor === 'HEAVY' ? 20 : 0
        });
        waveEnemyIndexRef.current++;
      }
    } else if (state.enemies.length === 0) {
       // Wave Complete
       state.isPlaying = false;
       state.wave++;
       
       // Interest System
       const interest = Math.min(state.money * 0.03, 200);
       state.money += (100 + (state.wave * 15)) * diffSettings.goldMod + interest;
       
       state.mana += 20;
       waveEnemyIndexRef.current = 0;
       spawnTimerRef.current = 0;
       
       getStrategicAdvice(state).then(onAIAdvice);
    }

    // 2. Enemy Logic
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      const path = mapConfig.paths[enemy.pathId];
      
      // Status Effects
      let speedMod = 1.0;
      let dotDamage = 0;
      for (let s = enemy.statusEffects.length - 1; s >= 0; s--) {
        const effect = enemy.statusEffects[s];
        effect.duration--;
        if (effect.type === ElementType.ICE) speedMod *= 0.7;
        if (effect.type === ElementType.FIRE) dotDamage += effect.magnitude;
        if (effect.type === ElementType.POISON) dotDamage += effect.magnitude;
        if (effect.duration <= 0) enemy.statusEffects.splice(s, 1);
      }
      
      // Weather: Acid Rain armor shred
      if (state.activeWeather === WeatherType.ACID_RAIN && enemy.armor && enemy.armor > 0) {
          if (state.weatherTimer % 60 === 0) enemy.armor = Math.max(0, enemy.armor - 2);
      }

      enemy.health -= dotDamage;
      enemy.speed = enemy.baseSpeed * speedMod;

      // Weaver logic
      if (enemy.type === EnemyType.WEAVER) {
         if (Math.floor(Date.now() / 3000) % 2 === 0) enemy.isEthereal = true;
         else enemy.isEthereal = false;
      }

      // Movement
      const targetNode = path[enemy.pathIndex + 1];
      if (!targetNode) {
        state.lives--;
        if (enemy.type === EnemyType.THIEF) state.money = Math.max(0, state.money - 5);
        state.enemies.splice(i, 1);
        if (state.lives <= 0) {
             state.isGameOver = true;
             state.isPlaying = false;
        }
        continue;
      }

      const targetPos = { x: targetNode.x * TILE_SIZE + TILE_SIZE/2, y: targetNode.y * TILE_SIZE + TILE_SIZE/2 };
      const dist = getDistance(enemy.position, targetPos);
      
      if (dist <= enemy.speed) {
        enemy.pathIndex++;
      } else {
        const dx = targetPos.x - enemy.position.x;
        const dy = targetPos.y - enemy.position.y;
        const angle = Math.atan2(dy, dx);
        enemy.position.x += Math.cos(angle) * enemy.speed;
        enemy.position.y += Math.sin(angle) * enemy.speed;
      }

      if (enemy.health <= 0) {
        state.money += enemy.bounty * diffSettings.goldMod;
        
        // SOUL ESSENCE Drop (Elites)
        if ([EnemyType.BRUTE, EnemyType.LEECH, EnemyType.AMALGAMATION, EnemyType.RENDER].includes(enemy.type)) {
            state.soulEssence += 1;
        }

        // Map Power: Permafrost (Ice Spire)
        if (state.mapId === MapId.ICE_SPIRE && state.locationPowerUnlocked) {
             // Explode on death
             state.enemies.forEach(other => {
                 if (other.id !== enemy.id && getDistance(enemy.position, other.position) < 60) {
                     other.health -= 20;
                     other.statusEffects.push({ type: ElementType.ICE, duration: 60, magnitude: 0.5 });
                 }
             });
             spawnParticle(enemy.position, '#00f3ff', 20);
        }

        spawnParticle(enemy.position, '#b5a642', 10);
        state.enemies.splice(i, 1);
      }
    }

    // 3. Toens Logic
    state.towers.forEach(tower => {
      if (tower.cooldownTimer > 0) tower.cooldownTimer--;
      if (tower.abilityCooldown > 0) tower.abilityCooldown--;
      if (tower.malfunctionTimer && tower.malfunctionTimer > 0) {
          tower.malfunctionTimer--;
          return; // Skip turn
      }
      
      // Weather: Geomagnetic Storm Malfunction
      if (state.activeWeather === WeatherType.GEOMAGNETIC_STORM && Math.random() < 0.005) {
          tower.malfunctionTimer = 120; // 2 seconds down
          spawnParticle(tower.position, '#555555', 5);
      }

      const conf = TOWER_STATS[tower.type];
      
      // Calculate Stats based on Upgrades & Weather
      let range = conf.range * (1 + (tower.level - 1) * 0.15); // +15% per level
      
      // Weather Modifiers
      if (state.activeWeather === WeatherType.ETHEREAL_MIST) range *= 0.6;
      
      // Module effects
      if (tower.modules.includes('RANGE_FINDER')) range *= 1.2;
      if (tower.modules.includes('OVERCLOCK')) tower.cooldownTimer -= 1; // Fake speed up
      
      const targets = state.enemies.filter(e => getDistance(tower.position, e.position) <= range);

      // Resonator logic
      if (tower.type === TowerType.RESONATOR && tower.cooldownTimer <= 0) {
         if (targets.length > 0) {
             state.enemies.forEach(e => {
                 if (getDistance(tower.position, e.position) <= range) {
                    applyDamage(e, conf.damage * tower.level, ElementType.SONIC, tower.infusion);
                 }
             });
             spawnParticle(tower.position, conf.color, 15, 2);
             tower.cooldownTimer = conf.cooldown;
         }
         return;
      }

      if (tower.type === TowerType.CHRONO) {
        targets.forEach(e => {
            e.statusEffects.push({ type: ElementType.ICE, duration: 2, magnitude: 0.5 });
        });
        return;
      }
      
      if (targets.length > 0 && tower.cooldownTimer <= 0) {
         const target = targets[0]; 
         
         // Weather: Quantum Flux (Crit/Miss)
         let damageMult = 1.0;
         if (state.activeWeather === WeatherType.QUANTUM_FLUX) {
             const roll = Math.random();
             if (roll < 0.1) damageMult = 3.0; // Crit
             else if (roll < 0.2) damageMult = 0.0; // Miss
         }

         // Map Power: Earth's Wrath (Maw)
         if (state.mapId === MapId.BURNING_MAW && state.locationPowerUnlocked) {
             if (Math.random() < 0.1) { // 10% chance
                 applyDamage(target, 50, ElementType.MAGMA);
                 spawnParticle(target.position, '#ef4444', 15);
             }
         }

         tower.cooldownTimer = conf.cooldown / (tower.level > 1 ? 1.2 : 1); // Speed up with levels
         if (state.activeWeather === WeatherType.ETHEREAL_MIST && (tower.type === TowerType.GOLEM || tower.type === TowerType.TESLA)) {
             tower.cooldownTimer *= 0.66; // Faster melee
         }

         if (damageMult === 0) {
             spawnParticle(tower.position, '#888888', 3); // Miss puff
             return;
         }

         if (tower.type === TowerType.BEACON) {
             state.projectiles.push({
                 id: Math.random().toString(),
                 position: { ...tower.position },
                 targetId: target.id,
                 damage: conf.damage * tower.level * damageMult,
                 speed: 999,
                 color: conf.color,
                 element: tower.infusion || ElementType.UV,
                 hasHit: false,
                 type: 'BEAM'
             });
         } else if (tower.type === TowerType.TESLA) {
             state.projectiles.push({
                 id: Math.random().toString(),
                 position: { ...tower.position },
                 targetId: target.id,
                 damage: conf.damage * tower.level * damageMult,
                 speed: 999,
                 color: conf.color,
                 element: tower.infusion || ElementType.LIGHTNING,
                 hasHit: false,
                 type: 'CHAIN',
                 chainRemaining: 2 + (tower.level - 1)
             });
         } else {
             state.projectiles.push({
                 id: Math.random().toString(),
                 position: { ...tower.position },
                 targetId: target.id,
                 damage: conf.damage * tower.level * damageMult,
                 speed: 12,
                 color: conf.color,
                 element: tower.infusion || ElementType.PHYSICAL,
                 hasHit: false,
                 type: tower.type === TowerType.SENTINEL ? 'MISSILE' : 'BULLET'
             });
         }
      }
    });

    // 4. Projectile Logic
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        if (p.type === 'BEAM' || p.type === 'CHAIN') {
            const target = state.enemies.find(e => e.id === p.targetId);
            if (target) {
                applyDamage(target, p.damage, p.element);
                if (p.type === 'CHAIN' && p.chainRemaining && p.chainRemaining > 0) {
                     const nextTarget = state.enemies.find(e => e.id !== target.id && getDistance(target.position, e.position) < 100);
                     if (nextTarget) {
                         state.projectiles.push({ ...p, id: Math.random().toString(), position: { ...target.position }, targetId: nextTarget.id, chainRemaining: p.chainRemaining - 1 });
                     }
                }
            }
            state.projectiles.splice(i, 1);
            continue;
        }
        const target = state.enemies.find(e => e.id === p.targetId);
        if (!target) { state.projectiles.splice(i, 1); continue; }
        const dist = getDistance(p.position, target.position);
        if (dist <= p.speed) {
            applyDamage(target, p.damage, p.element);
            spawnParticle(target.position, p.color, 5);
            state.projectiles.splice(i, 1);
        } else {
            const dx = target.position.x - p.position.x;
            const dy = target.position.y - p.position.y;
            const angle = Math.atan2(dy, dx);
            p.position.x += Math.cos(angle) * p.speed;
            p.position.y += Math.sin(angle) * p.speed;
        }
    }

    // 5. Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.life--;
        p.position.x += p.velocity.x;
        p.position.y += p.velocity.y;
        if (p.life <= 0) state.particles.splice(i, 1);
    }

    onStateUpdate({ ...state });
  };

  const applyDamage = (enemy: Enemy, rawDamage: number, element: ElementType, secondaryElement?: ElementType) => {
      const state = gameStateRef.current;
      let dmg = rawDamage;
      
      if (enemy.armorType === 'HEAVY' && element === ElementType.PHYSICAL) dmg *= 0.5;
      if (enemy.armorType === 'MAGIC_RESIST' && element !== ElementType.PHYSICAL) dmg *= 0.5;
      if (enemy.isEthereal && element === ElementType.PHYSICAL) dmg = 0;
      
      // Weather Mods
      if (state.activeWeather === WeatherType.SOLAR_FLARE) {
          if (element === ElementType.FIRE) dmg *= 1.25;
          if (element === ElementType.ICE) dmg *= 0.75;
      }

      // Status Application
      if (element === ElementType.FIRE) enemy.statusEffects.push({ type: ElementType.FIRE, duration: 120, magnitude: 0.5 });
      if (element === ElementType.POISON) enemy.statusEffects.push({ type: ElementType.POISON, duration: 300, magnitude: 0.2 });
      if (element === ElementType.ICE) enemy.statusEffects.push({ type: ElementType.ICE, duration: 60, magnitude: 0.3 });
      
      enemy.health -= dmg;
  };

  // --- Rendering ---

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const mapConfig = MAPS[state.mapId];

    // Clear
    ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height); // Let CSS background show

    // Grid Overlay
    ctx.strokeStyle = mapConfig.gridColor;
    ctx.globalAlpha = 0.1;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * TILE_SIZE, 0); ctx.lineTo(i * TILE_SIZE, GRID_ROWS * TILE_SIZE); ctx.stroke();
    }
    for (let i = 0; i <= GRID_ROWS; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * TILE_SIZE); ctx.lineTo(GRID_COLS * TILE_SIZE, i * TILE_SIZE); ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Render ALL Paths
    mapConfig.paths.forEach(path => {
        // Shadow/Base
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = TILE_SIZE;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (path.length > 0) {
            const p0 = path[0];
            ctx.moveTo(p0.x * TILE_SIZE + TILE_SIZE/2, p0.y * TILE_SIZE + TILE_SIZE/2);
            for (let i = 1; i < path.length; i++) {
                const p = path[i];
                ctx.lineTo(p.x * TILE_SIZE + TILE_SIZE/2, p.y * TILE_SIZE + TILE_SIZE/2);
            }
        }
        ctx.stroke();
        
        // Glow (Map Theme Color)
        ctx.strokeStyle = mapConfig.gridColor;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = TILE_SIZE * 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        
        // Center Line
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Towers
    state.towers.forEach(t => {
        const conf = TOWER_STATS[t.type];
        const cx = t.position.x; const cy = t.position.y;
        const isSelected = state.selectedTowerId === t.id;
        
        // Level Indicator (Rings)
        if (t.level > 1) {
             ctx.strokeStyle = '#ffd700';
             ctx.lineWidth = 1;
             ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke();
        }
        if (t.level > 2) {
             ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.stroke();
        }

        ctx.fillStyle = '#1a1a24';
        ctx.strokeStyle = isSelected ? '#ffffff' : mapConfig.gridColor; 
        ctx.lineWidth = 2;
        ctx.fillRect(cx - 16, cy - 16, 32, 32);
        ctx.strokeRect(cx - 16, cy - 16, 32, 32);
        
        // Malfunction Visual
        if (t.malfunctionTimer && t.malfunctionTimer > 0) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '12px sans-serif';
            ctx.fillText('⚠', cx-5, cy-20);
        }

        ctx.fillStyle = conf.color;
        // Simple shape diffs
        ctx.beginPath(); ctx.arc(cx, cy, 10 + (t.level), 0, Math.PI * 2); ctx.fill();

        if (t.infusion) { 
            ctx.fillStyle = '#ffffff'; 
            ctx.beginPath(); ctx.arc(cx + 10, cy - 10, 4, 0, Math.PI * 2); ctx.fill(); 
        }
        
        if (isSelected) { 
            const range = conf.range * (1 + (t.level - 1) * 0.15);
            ctx.strokeStyle = conf.color; 
            ctx.globalAlpha = 0.3; 
            ctx.beginPath(); ctx.arc(cx, cy, range, 0, Math.PI * 2); ctx.stroke(); 
            ctx.globalAlpha = 1.0; 
        }
    });

    // Enemies
    state.enemies.forEach(e => {
        const conf = ENEMY_CONFIGS[e.type];
        ctx.fillStyle = conf.color;
        // Basic Status Coloring
        if (e.statusEffects.some(s => s.type === ElementType.ICE)) ctx.fillStyle = '#a0e0ff';
        
        ctx.beginPath();
        ctx.arc(e.position.x, e.position.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // HP Bar
        const hpPct = Math.max(0, e.health / e.maxHealth);
        ctx.fillStyle = '#ff0000'; ctx.fillRect(e.position.x - 10, e.position.y - 16, 20, 3);
        ctx.fillStyle = '#00ff00'; ctx.fillRect(e.position.x - 10, e.position.y - 16, 20 * hpPct, 3);
    });

    // Projectiles & Particles (Standard)
    state.projectiles.forEach(p => {
        ctx.strokeStyle = p.color; ctx.fillStyle = p.color;
        if (p.type === 'BEAM' || p.type === 'CHAIN') {
            const target = state.enemies.find(e => e.id === p.targetId);
            if (target) { ctx.lineWidth = p.type === 'BEAM' ? 4 : 2; ctx.beginPath(); ctx.moveTo(p.position.x, p.position.y); ctx.lineTo(target.position.x, target.position.y); ctx.stroke(); }
        } else { ctx.beginPath(); ctx.arc(p.position.x, p.position.y, 4, 0, Math.PI * 2); ctx.fill(); }
    });

    state.particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife; ctx.beginPath(); ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0;
    });

    // Hover Ghost
    if (hoverPos && selectedTowerType && !state.isGameOver) {
        const conf = TOWER_STATS[selectedTowerType];
        const gx = Math.floor(hoverPos.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        const gy = Math.floor(hoverPos.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
        
        // Diminishing Returns Cost Calc
        const count = state.towers.filter(t => t.type === selectedTowerType).length;
        const baseCost = conf.cost * DIFFICULTY_SETTINGS[state.difficulty].costMod;
        const finalCost = Math.floor(baseCost * (1 + (count * 0.15)));

        const canAfford = state.money >= finalCost;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = canAfford ? conf.color : '#ff0000';
        ctx.beginPath(); ctx.arc(gx, gy, conf.range, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(gx - 15, gy - 15, 30, 30);
        
        // Draw Cost tooltip
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${finalCost}g`, gx - 10, gy - 20);
        
        ctx.globalAlpha = 1.0;
    }
  };

  const loop = useCallback(() => {
      update();
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) draw(ctx);
      requestRef.current = requestAnimationFrame(loop);
  }, []); 

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  // --- Interaction ---
  const handleClick = (e: React.MouseEvent) => {
      if (!hoverPos) return;
      const state = gameStateRef.current;
      const gridX = Math.floor(hoverPos.x / TILE_SIZE);
      const gridY = Math.floor(hoverPos.y / TILE_SIZE);
      
      const existing = state.towers.find(t => 
          Math.abs(t.position.x - (gridX * TILE_SIZE + TILE_SIZE/2)) < 10 &&
          Math.abs(t.position.y - (gridY * TILE_SIZE + TILE_SIZE/2)) < 10
      );

      if (existing) {
          state.selectedTowerId = existing.id;
          onTowerClick(existing.id);
          onStateUpdate({...state});
          return;
      } else {
          state.selectedTowerId = null;
      }

      if (!selectedTowerType) { onStateUpdate({...state}); return; }
      if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return;
      
      // Simple path collision check (simplified for multi-map)
      const mapConfig = MAPS[state.mapId];
      let onPath = false;
      for (const path of mapConfig.paths) {
          for (let i=0; i < path.length-1; i++) {
              const p1 = path[i]; const p2 = path[i+1];
              if (p1.y === p2.y) {
                  if (gridY === p1.y && gridX >= Math.min(p1.x, p2.x) && gridX <= Math.max(p1.x, p2.x)) onPath = true;
              } else {
                  if (gridX === p1.x && gridY >= Math.min(p1.y, p2.y) && gridY <= Math.max(p1.y, p2.y)) onPath = true;
              }
          }
      }
      if (onPath) return;

      const conf = TOWER_STATS[selectedTowerType];
      const diff = DIFFICULTY_SETTINGS[state.difficulty];
      
      // Economy 2.0: Diminishing Returns
      const count = state.towers.filter(t => t.type === selectedTowerType).length;
      const cost = Math.floor(conf.cost * diff.costMod * (1 + (count * 0.15)));

      if (state.money >= cost) {
          state.money -= cost;
          state.towers.push({
              id: Math.random().toString(),
              type: selectedTowerType,
              position: { x: gridX * TILE_SIZE + TILE_SIZE/2, y: gridY * TILE_SIZE + TILE_SIZE/2 },
              cooldownTimer: 0,
              level: 1,
              infusion: undefined,
              modules: [],
              totalDamageDealt: 0,
              abilityCooldown: 0,
              maxAbilityCooldown: 600 // 10s default
          });
          spawnParticle({ x: gridX * TILE_SIZE + TILE_SIZE/2, y: gridY * TILE_SIZE + TILE_SIZE/2 }, conf.color, 20);
          onStateUpdate({...state});
      }
  };

  return (
    <canvas 
      ref={canvasRef}
      width={GRID_COLS * TILE_SIZE}
      height={GRID_ROWS * TILE_SIZE}
      className="cursor-crosshair steampunk-border shadow-2xl rounded opacity-90"
      onMouseMove={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setHoverPos(null)}
      onClick={handleClick}
    />
  );
};