
import React from 'react';
import { GameState, City, Action, ActionType, GlobalActionType } from '../types';
import { ACTIONS, GLOBAL_ACTIONS } from '../constants';

interface GameOverlayProps {
  gameState: GameState;
  activeCity: City | null;
  onExecuteAction: (actionType: ActionType) => void;
  onExecuteGlobalAction: (actionType: GlobalActionType) => void;
  onTimeChange: (scale: number) => void;
  onClosePanel: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ 
  gameState, 
  activeCity, 
  onExecuteAction, 
  onExecuteGlobalAction,
  onTimeChange, 
  onClosePanel 
}) => {
  const awarenessColor = gameState.awareness < 30 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : gameState.awareness < 70 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-red-600 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)]';

  const formatPopulation = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hidden': return 'text-gray-500';
      case 'scouted': return 'text-cyan-400';
      case 'infiltrated': return 'text-purple-400';
      case 'under-attack': return 'text-orange-500 animate-pulse';
      case 'captured': return 'text-pink-500 font-black';
      default: return 'text-white';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 overflow-hidden">
      {/* HUD Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-1">
          <div className="bg-black/85 backdrop-blur-2xl px-6 py-4 rounded border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex gap-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
            <StatItem label="ENERGY" value={Math.floor(gameState.energy)} color="text-cyan-400" />
            <StatItem label="TROOPS" value={Math.floor(gameState.troops)} color="text-emerald-400" />
            <StatItem label="SAUCERS" value={gameState.saucerCount} color="text-pink-400" />
            <StatItem label="ORBIT" value={`DAY ${gameState.dayCount}`} color="text-white" />
          </div>
          <div className="flex gap-2 items-center px-4 py-1 text-[9px] font-black tracking-widest text-white/30 uppercase">
             <div className="w-1 h-1 rounded-full bg-cyan-500 animate-ping" />
             Sub-Space Link: Active
          </div>
        </div>

        <div className="flex flex-col gap-3 items-end">
          <div className="w-80 bg-black/85 backdrop-blur-2xl p-5 rounded border border-white/10 relative">
            <div className="flex justify-between text-[10px] font-black tracking-[0.2em] text-white/60 mb-3 uppercase">
              <span>Human Defense Readiness</span>
              <span className={gameState.awareness > 70 ? 'text-red-500' : 'text-cyan-400'}>{gameState.awareness}%</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${awarenessColor}`} 
                style={{ width: `${gameState.awareness}%` }}
              />
            </div>
          </div>
          
          <div className="bg-red-950/20 backdrop-blur-md px-5 py-3 rounded border border-red-500/20 flex gap-8 items-center">
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-red-500 tracking-[0.3em] uppercase">Tactical Threat</span>
               <div className="flex gap-1.5 mt-1.5">
                 {Array.from({length: 6}).map((_, i) => (
                   <div key={i} className={`h-1.5 w-4 rounded-sm ${gameState.humanResources > (i * 300) ? 'bg-red-500 animate-pulse' : 'bg-white/5'}`} />
                 ))}
               </div>
             </div>
             <div className="text-[11px] font-mono font-bold text-red-500/90 uppercase tracking-widest">
                DEFCON {gameState.awareness > 80 ? '1' : gameState.awareness > 60 ? '2' : gameState.awareness > 40 ? '3' : gameState.awareness > 20 ? '4' : '5'}
             </div>
          </div>
        </div>
      </div>

      {/* Center Narrative Feed */}
      <div className="flex-1 flex flex-col items-center justify-start pt-16">
        <div className="w-full max-w-2xl px-6">
          <div className="space-y-2">
            {gameState.history.slice(-1).map((msg, i) => (
              <div key={msg + i} className="relative bg-black/40 backdrop-blur-md border border-cyan-500/20 px-8 py-3 rounded text-center animate-in fade-in zoom-in-95 duration-700">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-3 py-0.5 border border-cyan-500/40 text-[9px] font-black text-cyan-400 tracking-[0.4em] uppercase">
                  Incoming Transmission
                </div>
                <div className="text-sm font-medium tracking-wide text-cyan-50/90">
                  {msg}
                </div>
                <div className="absolute bottom-1 right-2 text-[8px] font-mono text-cyan-500/30">
                  AUTH_CODE: X-{Math.floor(Math.random() * 9000) + 1000}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Tactical Interface */}
      <div className="flex justify-between items-end pointer-events-auto">
        <div className="bg-black/85 backdrop-blur-2xl p-5 rounded border border-white/10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]" />
            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-white/80">Time Stream Control</span>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 5].map((scale) => (
              <button
                key={scale}
                onClick={() => onTimeChange(scale)}
                className={`px-5 py-3 text-[11px] font-black rounded-sm transition-all border ${
                  gameState.timeScale === scale 
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
                }`}
              >
                {scale === 0 ? 'HALT' : `${scale}X`}
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Directive Sliding Panel */}
        <div className={`fixed right-8 top-1/2 -translate-y-1/2 w-80 max-h-[75vh] bg-black/90 backdrop-blur-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-500 rounded-lg overflow-hidden`}>
          <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
          <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
            {activeCity ? (
              <>
                <div className="mb-6 border-b border-white/10 pb-5">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{activeCity.name}</h2>
                    <button onClick={onClosePanel} className="p-1 hover:bg-white/10 rounded-full transition-colors">✕</button>
                  </div>
                  <div className={`text-[12px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${getStatusColor(activeCity.status)}`}>
                    <div className={`w-2 h-2 rounded-full bg-current ${activeCity.status === 'under-attack' ? 'animate-ping' : ''}`} />
                    {activeCity.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <StatPanel label="Population" value={formatPopulation(activeCity.population)} />
                  <StatPanel 
                    label="Ground Strength" 
                    value={`${activeCity.militaryStrength}%`} 
                    subValue={activeCity.defenseBonus > 0 ? `+${activeCity.defenseBonus * 5}%` : undefined}
                    accent={activeCity.militaryStrength > 50 ? 'red' : 'orange'}
                  />
                  <div className="bg-white/5 p-4 rounded col-span-2 border border-white/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-[10px] font-bold text-white/30 mb-1 uppercase tracking-widest">Defense Batteries</div>
                        <div className="text-xl font-mono text-red-500 font-black">{activeCity.samSites} SAM ARRAYS</div>
                      </div>
                      {activeCity.samSites > 0 && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <div className="text-[11px] font-black text-cyan-500 tracking-[0.4em] mb-3 uppercase border-b border-cyan-900/50 pb-2">Localized Tactics</div>
                  {Object.values(ACTIONS).map((action) => {
                    const isAttack = action.type === ActionType.BOMB || action.type === ActionType.TERROR || action.type === ActionType.BEAM;
                    const samE = (isAttack && activeCity.samSites > 0) ? activeCity.samSites * 50 : 0;
                    const samT = (isAttack && activeCity.samSites > 0) ? activeCity.samSites * 10 : 0;
                    
                    const canAfford = gameState.energy >= (action.energyCost + samE) && gameState.troops >= (action.troopCost + samT);
                    const isVisible = activeCity.status !== 'hidden' || action.type === ActionType.SCOUT;
                    if (!isVisible) return null;

                    return (
                      <ActionCard 
                        key={action.type} 
                        action={action} 
                        canAfford={canAfford} 
                        onClick={() => onExecuteAction(action.type as ActionType)} 
                        energy={gameState.energy}
                        troops={gameState.troops}
                        extraEnergy={samE}
                        extraTroops={samT}
                      />
                    );
                  })}
                </div>
                
                <button onClick={onClosePanel} className="mt-8 py-4 bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all rounded">
                  Dismiss Overlay
                </button>
              </>
            ) : (
              <>
                <div className="mb-6 border-b border-white/10 pb-5">
                  <h2 className="text-4xl font-black text-purple-400 tracking-tighter uppercase leading-none">Global Directives</h2>
                  <div className="text-[11px] font-bold text-white/40 tracking-[0.3em] mt-3 uppercase">Planetary Harvest Mode</div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <div className="text-[11px] font-black text-purple-500 tracking-[0.4em] mb-3 uppercase border-b border-purple-900/50 pb-2">Strategic Operations</div>
                  {Object.values(GLOBAL_ACTIONS).map((action) => {
                    const canAfford = gameState.energy >= action.energyCost && gameState.troops >= action.troopCost;
                    return (
                      <ActionCard 
                        key={action.type} 
                        action={action} 
                        canAfford={canAfford} 
                        onClick={() => onExecuteGlobalAction(action.type as GlobalActionType)} 
                        energy={gameState.energy}
                        troops={gameState.troops}
                        accent="purple"
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
};

const StatPanel: React.FC<{ label: string; value: string; subValue?: string; accent?: 'red' | 'orange' | 'cyan' }> = ({ label, value, subValue, accent }) => (
  <div className="bg-white/5 p-4 rounded border border-white/5">
    <div className="text-[10px] font-bold text-white/30 mb-1 uppercase tracking-widest">{label}</div>
    <div className={`text-xl font-mono font-black leading-none ${accent === 'red' ? 'text-red-500' : accent === 'orange' ? 'text-orange-400' : 'text-white'}`}>
      {value}
      {subValue && <span className="text-[11px] ml-1.5 opacity-60 font-medium">{subValue}</span>}
    </div>
  </div>
);

interface ActionCardProps {
  action: Action;
  canAfford: boolean;
  onClick: () => void;
  energy: number;
  troops: number;
  extraEnergy?: number;
  extraTroops?: number;
  accent?: 'cyan' | 'purple';
}

const ActionCard: React.FC<ActionCardProps> = ({ 
  action, 
  canAfford, 
  onClick, 
  energy, 
  troops, 
  extraEnergy = 0,
  extraTroops = 0,
  accent = 'cyan' 
}) => {
  const totalE = action.energyCost + extraEnergy;
  const totalT = action.troopCost + extraTroops;
  const accentColor = accent === 'purple' ? 'border-purple-500/50 hover:bg-purple-600/20' : 'border-cyan-500/50 hover:bg-cyan-600/20';

  return (
    <button
      disabled={!canAfford}
      onClick={onClick}
      className={`group relative flex flex-col p-4 rounded border transition-all text-left ${
        canAfford 
        ? `bg-white/5 border-white/10 ${accentColor} hover:border-current hover:scale-[1.01] shadow-xl` 
        : 'bg-transparent border-white/5 opacity-20 cursor-not-allowed'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-black text-[11px] uppercase tracking-widest">{action.label}</span>
        <div className="flex gap-3 text-[10px] font-mono font-bold">
          <span className={energy < totalE ? 'text-red-600' : 'text-cyan-400'}>
            ⚡ {totalE}
          </span>
          {totalT > 0 && (
            <span className={troops < totalT ? 'text-red-600' : 'text-emerald-400'}>
              👾 {totalT}
            </span>
          )}
        </div>
      </div>
      <p className="text-[10px] leading-relaxed opacity-50 group-hover:opacity-100">{action.description}</p>
    </button>
  );
};

const StatItem: React.FC<{ label: string; value: number | string; color: string }> = ({ label, value, color }) => (
  <div className="flex flex-col min-w-[70px]">
    <span className="text-[10px] text-white/30 font-black tracking-[0.2em] uppercase mb-1">{label}</span>
    <span className={`text-2xl font-black font-mono leading-none ${color}`}>{value}</span>
  </div>
);

export default GameOverlay;
