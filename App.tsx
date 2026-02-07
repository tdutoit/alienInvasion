
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Globe from './components/Globe';
import GameOverlay from './components/GameOverlay';
import { GameState, City, ActionType, GlobalActionType } from './types';
import { CITIES, ACTIONS, GLOBAL_ACTIONS, INITIAL_ENERGY, INITIAL_TROOPS, REGEN_RATE_ENERGY, REGEN_RATE_TROOPS, HUMAN_BASE_REGEN, HUMAN_ACTION_COSTS, HUMAN_INITIAL_RESOURCES } from './constants';
import { generateNarrative } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    energy: INITIAL_ENERGY,
    troops: INITIAL_TROOPS,
    awareness: 0,
    timeScale: 1,
    dayCount: 1,
    activeCityId: null,
    history: ["Mothership anchoring protocol complete. Acheron-Class Parasite active on lunar orbit."],
    saucerCount: 0,
    humanResources: HUMAN_INITIAL_RESOURCES,
    humanReadiness: 1,
  });

  const [cities, setCities] = useState<City[]>(CITIES);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [lastFiringEvent, setLastFiringEvent] = useState<{ cityId: string; timestamp: number } | null>(null);
  
  const lastHumanActionTime = useRef(0);
  const lastSamFireTime = useRef(0);
  const lastNarrativeTime = useRef(0);

  const triggerNarrative = async (event: string, awareness: number) => {
    const now = Date.now();
    if (now - lastNarrativeTime.current < 4000) return;
    lastNarrativeTime.current = now;
    
    const narrative = await generateNarrative(event, awareness);
    setGameState(prev => ({ ...prev, history: [...prev.history, narrative].slice(-5) }));
  };

  // Resource Regeneration
  useEffect(() => {
    if (gameState.timeScale === 0) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        const awarenessMult = 1 + (prev.awareness / 8); 
        const humanRegen = HUMAN_BASE_REGEN * awarenessMult * prev.timeScale;
        
        return {
          ...prev,
          energy: Math.min(2500, prev.energy + REGEN_RATE_ENERGY * prev.timeScale),
          troops: Math.min(1500, prev.troops + REGEN_RATE_TROOPS * prev.timeScale),
          humanResources: Math.min(10000, prev.humanResources + humanRegen),
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameState.timeScale]);

  // Day Counter
  useEffect(() => {
    if (gameState.timeScale === 0) return;
    const interval = setInterval(() => {
      setGameState(prev => ({ ...prev, dayCount: prev.dayCount + 1 }));
    }, 10000 / gameState.timeScale);
    return () => clearInterval(interval);
  }, [gameState.timeScale]);

  // SAM Site Firing Logic (Automated)
  useEffect(() => {
    if (gameState.timeScale === 0 || gameState.saucerCount <= 0) return;
    const interval = setInterval(() => {
      const activeCities = cities.filter(c => c.samSites > 0 && c.status !== 'captured');
      if (activeCities.length === 0) return;

      const now = Date.now();
      // Humans fire more aggressively as awareness increases
      const fireInterval = Math.max(800, 3000 - (gameState.awareness * 20)) / gameState.timeScale;
      
      if (now - lastSamFireTime.current < fireInterval) return;

      const firingCost = HUMAN_ACTION_COSTS.SAM_FIRE_COST;
      
      setGameState(prev => {
        if (prev.humanResources < firingCost) return prev;

        // Pick a city to fire from
        const firingCity = activeCities[Math.floor(Math.random() * activeCities.length)];
        
        // Update refs and sub-state outside functional update normally, 
        // but since we need the firingCity for the visual event:
        setTimeout(() => setLastFiringEvent({ cityId: firingCity.id, timestamp: now }), 0);
        lastSamFireTime.current = now;

        // Calculate hit chance based on total battery density
        const totalBatteries = activeCities.reduce((acc, c) => acc + c.samSites, 0);
        const hitChance = Math.min(0.92, 0.25 + (totalBatteries * 0.04));

        if (Math.random() < hitChance) {
          triggerNarrative(`Target lock acquired. Kinetic impact on primary saucer unit.`, prev.awareness);
          return {
            ...prev,
            saucerCount: Math.max(0, prev.saucerCount - 1),
            humanResources: prev.humanResources - firingCost
          };
        }
        
        return {
          ...prev,
          humanResources: prev.humanResources - firingCost
        };
      });
    }, 500 / gameState.timeScale); // Check more frequently
    return () => clearInterval(interval);
  }, [gameState.timeScale, gameState.saucerCount, cities, gameState.awareness]);

  // Human AI Response Logic
  useEffect(() => {
    if (gameState.timeScale === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastHumanActionTime.current < 3000 / gameState.timeScale) return;

      setGameState(prev => {
        const canAffordFighter = prev.humanResources >= HUMAN_ACTION_COSTS.FIGHTER_INTERCEPT;
        const canAffordArmy = prev.humanResources >= HUMAN_ACTION_COSTS.ARMY_DEPLOYMENT;
        const canAffordSam = prev.humanResources >= HUMAN_ACTION_COSTS.SAM_SITE;
        
        if (prev.saucerCount > 2 && prev.awareness > 35 && canAffordFighter) {
          lastHumanActionTime.current = now;
          const destroyed = 1 + Math.floor(Math.random() * 2);
          triggerNarrative(`UNSC air wings engaging. Multiple bogies splashed.`, prev.awareness);
          return { ...prev, saucerCount: Math.max(0, prev.saucerCount - destroyed), humanResources: prev.humanResources - HUMAN_ACTION_COSTS.FIGHTER_INTERCEPT };
        }

        if (prev.awareness > 10 && canAffordSam) {
           const candidateCity = cities.find(c => c.status !== 'captured' && c.samSites < 5);
           if (candidateCity) {
              lastHumanActionTime.current = now;
              setCities(currentCities => currentCities.map(c => c.id === candidateCity.id ? { ...c, samSites: c.samSites + 1 } : c));
              triggerNarrative(`Planetary defense battery online at ${candidateCity.name}.`, prev.awareness);
              return { ...prev, humanResources: prev.humanResources - HUMAN_ACTION_COSTS.SAM_SITE };
           }
        }

        if (prev.awareness > 25 && canAffordArmy) {
          const threatenedCity = cities.find(c => c.status !== 'captured' && c.militaryStrength < 80);
          if (threatenedCity) {
            lastHumanActionTime.current = now;
            setCities(currentCities => currentCities.map(c => c.id === threatenedCity.id ? { ...c, militaryStrength: Math.min(100, c.militaryStrength + 15), defenseBonus: c.defenseBonus + 1 } : c));
            triggerNarrative(`Tactical armor arriving at ${threatenedCity.name}. Perimeter reinforced.`, prev.awareness);
            return { ...prev, humanResources: prev.humanResources - HUMAN_ACTION_COSTS.ARMY_DEPLOYMENT };
          }
        }
        return prev;
      });
    }, 1500 / gameState.timeScale);
    return () => clearInterval(interval);
  }, [gameState.timeScale, cities]);

  const handleCityClick = (cityId: string) => {
    setGameState(prev => ({ 
      ...prev, 
      activeCityId: prev.activeCityId === cityId ? null : cityId 
    }));
  };

  const executeAction = async (type: ActionType) => {
    if (isProcessingAction) return;
    const action = ACTIONS[type];
    const city = cities.find(c => c.id === gameState.activeCityId);
    if (!city) return;

    let extraEnergy = 0;
    let extraTroops = 0;
    if (city.samSites > 0 && (type === ActionType.BOMB || type === ActionType.TERROR || type === ActionType.BEAM)) {
      extraEnergy = city.samSites * 40; 
      extraTroops = city.samSites * 8;
    }

    if (gameState.energy < (action.energyCost + extraEnergy) || gameState.troops < (action.troopCost + extraTroops)) return;

    setGameState(prev => ({
      ...prev,
      energy: prev.energy - (action.energyCost + extraEnergy),
      troops: prev.troops - (action.troopCost + extraTroops),
      awareness: Math.min(100, prev.awareness + action.awarenessImpact),
    }));

    setIsProcessingAction(true);

    let newStatus = city.status;
    let newMilStrength = city.militaryStrength;
    const resistance = (city.defenseBonus * 5) + (city.samSites * 10);

    if (type === ActionType.SCOUT) newStatus = 'scouted';
    if (type === ActionType.INFILTRATE) newStatus = 'infiltrated';
    
    const effectivenessMult = 1 / (1 + (resistance / 100));

    if (type === ActionType.ABDUCTION) newMilStrength = Math.max(0, newMilStrength - (2 * effectivenessMult));
    if (type === ActionType.BOMB) { newStatus = 'under-attack'; newMilStrength = Math.max(0, newMilStrength - (20 * effectivenessMult)); }
    if (type === ActionType.TERROR) { newStatus = 'under-attack'; newMilStrength = Math.max(0, newMilStrength - (10 * effectivenessMult)); }
    if (type === ActionType.BEAM) { 
       if (Math.random() * 100 > (newMilStrength + (resistance / 2))) {
         newStatus = 'captured'; 
         newMilStrength = 0; 
       } else {
         newStatus = 'under-attack';
       }
    }

    setCities(prev => prev.map(c => c.id === city.id ? { ...c, status: newStatus, militaryStrength: newMilStrength } : c));

    try {
      await triggerNarrative(`${action.label} in progress at ${city.name}.`, gameState.awareness);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const executeGlobalAction = async (type: GlobalActionType) => {
    if (isProcessingAction) return;
    const action = GLOBAL_ACTIONS[type];
    if (gameState.energy < action.energyCost || gameState.troops < action.troopCost) return;

    const saucerIncrement = type === GlobalActionType.SAUCER_SWARM ? 5 : 0;
    setGameState(prev => ({ 
      ...prev, 
      energy: prev.energy - action.energyCost, 
      troops: prev.troops - action.troopCost, 
      awareness: Math.min(100, prev.awareness + action.awarenessImpact), 
      saucerCount: prev.saucerCount + saucerIncrement 
    }));

    setIsProcessingAction(true);
    try {
      await triggerNarrative(`Global Directive: ${action.label} initiated.`, gameState.awareness);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const activeCity = cities.find(c => c.id === gameState.activeCityId) || null;

  return (
    <div className="relative w-full h-screen bg-[#020202] select-none overflow-hidden font-sans">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-full text-cyan-400 font-mono text-sm tracking-[0.5em] uppercase">
          <div className="mb-4 animate-pulse">Establishing Sub-Space Uplink</div>
          <div className="w-48 h-0.5 bg-white/5 overflow-hidden"><div className="w-full h-full bg-cyan-500 animate-[loading_2s_infinite]" /></div>
        </div>
      }>
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 2]} onPointerDown={(e) => { if (e.target === (e.currentTarget as any)) setGameState(prev => ({ ...prev, activeCityId: null })); }}>
          <Globe 
            cities={cities} 
            onCityClick={handleCityClick} 
            timeScale={gameState.timeScale}
            activeCityId={gameState.activeCityId}
            saucerCount={gameState.saucerCount}
            humanReadiness={gameState.awareness / 100}
            lastFiringEvent={lastFiringEvent}
          />
          <OrbitControls enablePan={false} minDistance={1.2} maxDistance={8} makeDefault rotateSpeed={0.5} dampingFactor={0.05} enableDamping />
        </Canvas>
      </Suspense>
      <GameOverlay gameState={gameState} activeCity={activeCity} onExecuteAction={executeAction} onExecuteGlobalAction={executeGlobalAction} onTimeChange={(scale) => setGameState(prev => ({ ...prev, timeScale: scale }))} onClosePanel={() => setGameState(prev => ({ ...prev, activeCityId: null }))} />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,1)]" />
      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};

export default App;
