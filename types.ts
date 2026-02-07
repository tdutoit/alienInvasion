
export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  population: number;
  status: 'hidden' | 'scouted' | 'infiltrated' | 'under-attack' | 'captured';
  militaryStrength: number;
  defenseBonus: number; // Human reinforcements (armies)
  samSites: number;    // Anti-air missile batteries
}

export interface GameState {
  energy: number;
  troops: number;
  awareness: number; // 0 to 100
  timeScale: number;
  dayCount: number;
  activeCityId: string | null;
  history: string[];
  saucerCount: number;
  humanResources: number; // Terrestrial mobilization resources
  humanReadiness: number; // Speed of human response
}

export enum ActionType {
  SCOUT = 'SCOUT',
  INFILTRATE = 'INFILTRATE',
  ABDUCTION = 'ABDUCTION',
  BOMB = 'BOMB',
  TERROR = 'TERROR',
  BEAM = 'BEAM'
}

export enum GlobalActionType {
  SAUCER_SWARM = 'SAUCER_SWARM',
  OCEAN_TOXIN = 'OCEAN_TOXIN',
  AIR_CORRUPTION = 'AIR_CORRUPTION',
  INTERCEPT_FLIGHTS = 'INTERCEPT_FLIGHTS',
  COMM_BLACKOUT = 'COMM_BLACKOUT'
}

export interface Action {
  type: ActionType | GlobalActionType;
  label: string;
  energyCost: number;
  troopCost: number;
  awarenessImpact: number;
  description: string;
}
