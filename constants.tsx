
import { Action, ActionType, GlobalActionType, City } from './types';

export const INITIAL_ENERGY = 1200;
export const INITIAL_TROOPS = 600;
export const REGEN_RATE_ENERGY = 0.6; 
export const REGEN_RATE_TROOPS = 0.15;

export const HUMAN_INITIAL_RESOURCES = 200;
export const HUMAN_BASE_REGEN = 0.35; // Increased for more activity
export const HUMAN_ACTION_COSTS = {
  FIGHTER_INTERCEPT: 100,
  SAM_SITE: 120,
  ARMY_DEPLOYMENT: 250,
  SAM_FIRE_COST: 4 // Lowered from 8 for more frequent firing
};

export const ACTIONS: Record<ActionType, Action> = {
  [ActionType.SCOUT]: {
    type: ActionType.SCOUT,
    label: 'Deep Scan',
    energyCost: 30,
    troopCost: 0,
    awarenessImpact: 1,
    description: 'Orbital reconnaissance of civilian and military infrastructure.'
  },
  [ActionType.INFILTRATE]: {
    type: ActionType.INFILTRATE,
    label: 'Infiltrate',
    energyCost: 100,
    troopCost: 15,
    awarenessImpact: 4,
    description: 'Deploy mimics into key administrative positions.'
  },
  [ActionType.ABDUCTION]: {
    type: ActionType.ABDUCTION,
    label: 'Bio-Abduction',
    energyCost: 120,
    troopCost: 5,
    awarenessImpact: 8,
    description: 'Harvesting biological specimens for neural mapping.'
  },
  [ActionType.BOMB]: {
    type: ActionType.BOMB,
    label: 'Kinetic Strike',
    energyCost: 250,
    troopCost: 0,
    awarenessImpact: 25,
    description: 'Precision bombardment of defense batteries.'
  },
  [ActionType.TERROR]: {
    type: ActionType.TERROR,
    label: 'Terror Wave',
    energyCost: 350,
    troopCost: 40,
    awarenessImpact: 45,
    description: 'Psychic broadcast to induce mass hysteria and civil unrest.'
  },
  [ActionType.BEAM]: {
    type: ActionType.BEAM,
    label: 'Full Invasion',
    energyCost: 600,
    troopCost: 120,
    awarenessImpact: 85,
    description: 'The final harvest. Decimate all resistance and claim the sector.'
  }
};

export const GLOBAL_ACTIONS: Record<GlobalActionType, Action> = {
  [GlobalActionType.SAUCER_SWARM]: {
    type: GlobalActionType.SAUCER_SWARM,
    label: 'Saucer Swarm',
    energyCost: 150,
    troopCost: 50,
    awarenessImpact: 15,
    description: 'Mass deployment of disc-craft over major population hubs.'
  },
  [GlobalActionType.OCEAN_TOXIN]: {
    type: GlobalActionType.OCEAN_TOXIN,
    label: 'Ocean Toxin',
    energyCost: 400,
    troopCost: 10,
    awarenessImpact: 5,
    description: 'Saturate the hydrosphere with Xeno-Pathogens.'
  },
  [GlobalActionType.AIR_CORRUPTION]: {
    type: GlobalActionType.AIR_CORRUPTION,
    label: 'Aero-Seeding',
    energyCost: 300,
    troopCost: 20,
    awarenessImpact: 8,
    description: 'Disperse microscopic biological inhibitors into the jetstream.'
  },
  [GlobalActionType.INTERCEPT_FLIGHTS]: {
    type: GlobalActionType.INTERCEPT_FLIGHTS,
    label: 'Flight Intercept',
    energyCost: 200,
    troopCost: 0,
    awarenessImpact: 20,
    description: 'Vaporize high-altitude human transport vessels.'
  },
  [GlobalActionType.COMM_BLACKOUT]: {
    type: GlobalActionType.COMM_BLACKOUT,
    label: 'Comm-Blackout',
    energyCost: 500,
    troopCost: 5,
    awarenessImpact: 12,
    description: 'Scramble global satellite and subterranean fiber networks.'
  }
};

export const CITIES: City[] = [
  { id: '1', name: 'New York', lat: 40.7128, lng: -74.0060, population: 8400000, status: 'hidden', militaryStrength: 80, defenseBonus: 0, samSites: 5 },
  { id: '2', name: 'London', lat: 51.5074, lng: -0.1278, population: 8900000, status: 'hidden', militaryStrength: 70, defenseBonus: 0, samSites: 5 },
  { id: '3', name: 'Tokyo', lat: 35.6762, lng: 139.6503, population: 14000000, status: 'hidden', militaryStrength: 90, defenseBonus: 0, samSites: 5 },
  { id: '4', name: 'Cairo', lat: 30.0444, lng: 31.2357, population: 9500000, status: 'hidden', militaryStrength: 40, defenseBonus: 0, samSites: 5 },
  { id: '5', name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, population: 6700000, status: 'hidden', militaryStrength: 30, defenseBonus: 0, samSites: 5 },
  { id: '6', name: 'Moscow', lat: 55.7558, lng: 37.6173, population: 12500000, status: 'hidden', militaryStrength: 95, defenseBonus: 0, samSites: 5 },
  { id: '7', name: 'Sydney', lat: -33.8688, lng: 151.2093, population: 5300000, status: 'hidden', militaryStrength: 50, defenseBonus: 0, samSites: 5 },
  { id: '8', name: 'Beijing', lat: 39.9042, lng: 116.4074, population: 21500000, status: 'hidden', militaryStrength: 100, defenseBonus: 0, samSites: 5 },
];
