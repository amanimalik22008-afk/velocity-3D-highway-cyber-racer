import { PlayerProfile, GameSettings } from '../types';
import { DEFAULT_PLAYER_PROFILE, DEFAULT_GAME_SETTINGS } from './carsData';

const PROFILE_STORAGE_KEY = 'velocity3d_player_profile_v1';
const SETTINGS_STORAGE_KEY = 'velocity3d_game_settings_v1';

let inMemoryProfile: PlayerProfile = { ...DEFAULT_PLAYER_PROFILE };
let inMemorySettings: GameSettings = { ...DEFAULT_GAME_SETTINGS };

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER_PROFILE };
    const parsed = JSON.parse(raw);
    
    // Merge with defaults in case of schema updates
    return {
      ...DEFAULT_PLAYER_PROFILE,
      ...parsed,
      highScores: {
        ...DEFAULT_PLAYER_PROFILE.highScores,
        ...(parsed.highScores || {}),
      },
      bestDistances: {
        ...DEFAULT_PLAYER_PROFILE.bestDistances,
        ...(parsed.bestDistances || {}),
      },
      missions: DEFAULT_PLAYER_PROFILE.missions.map((m) => {
        const savedMission = (parsed.missions || []).find((sm: any) => sm.id === m.id);
        return savedMission ? { ...m, ...savedMission } : m;
      }),
    };
  } catch (e) {
    console.warn('LocalStorage unavailable for profile, using memory fallback', e);
    return inMemoryProfile;
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  inMemoryProfile = profile;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to persist player profile to localStorage', e);
  }
}

export function loadGameSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GAME_SETTINGS };
    return {
      ...DEFAULT_GAME_SETTINGS,
      ...JSON.parse(raw),
    };
  } catch (e) {
    console.warn('LocalStorage unavailable for settings, using memory fallback', e);
    return inMemorySettings;
  }
}

export function saveGameSettings(settings: GameSettings): void {
  inMemorySettings = settings;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to persist game settings to localStorage', e);
  }
}
