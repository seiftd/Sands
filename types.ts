export enum TileType {
  START = 'START',
  CITY = 'CITY',
  EVENT = 'EVENT',
  TAX = 'TAX',
  JAIL = 'JAIL',
  ORACLE = 'ORACLE', // AI Powered tile
  OASIS = 'OASIS',
  SWAMP = 'SWAMP',
  TREASURE = 'TREASURE'
}

export enum CharacterState {
  IDLE = 'idle',
  HAPPY = 'happy',
  SAD = 'sad'
}

export enum CharacterRole {
  BUILDER = 'builder',
  EXPLORER = 'explorer',
  MERCHANT = 'merchant',
  POLITICIAN = 'politician'
}

export enum GameScreen {
  HOME = 'HOME',
  MODE_SELECT = 'MODE_SELECT',
  LOBBY = 'LOBBY', // For Online Code
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  SETTINGS = 'SETTINGS',
  SHOP = 'SHOP',
  SOCIAL = 'SOCIAL', // Chat & Alliance
  GUIDE = 'GUIDE',
  ALLIANCE = 'ALLIANCE',
  EVENTS = 'EVENTS'
}

export type Language = 'ar' | 'en';
export type GameMode = 'pve' | 'local_pvp' | 'online_pvp';

export interface Resources {
  gold: number;
  water: number;
  energy: number;
  materials: number;
}

export interface Player {
  id: number;
  name: string;
  role: CharacterRole;
  characterId: string; // Used for asset path
  position: number;
  resources: Resources;
  properties: number[]; // Array of Tile IDs owned
  inJail: boolean;
  jailTurns: number;
  movementModifier: number; // Modifies the next dice roll (e.g., -2 for sandstorm)
  mood: CharacterState;
  color: string;
  isAi: boolean;
  skin?: string;
}

export interface Tile {
  id: number;
  type: TileType;
  name: string; // Key for translation or raw string
  price?: number; // Cost to buy
  rent?: number; // Cost to land on if owned
  level?: number; // Upgrade level (1-3)
  ownerId?: number; // Player ID who owns it
  description?: string;
}

export interface CharacterConfig {
  id: CharacterRole;
  name: { ar: string; en: string };
  desc: { ar: string; en: string };
  bonus: { ar: string; en: string };
  color: string;
}

export interface ShopItem {
  id: string;
  type: 'skin' | 'map';
  name: { ar: string; en: string };
  cost: number;
  icon: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface Alliance {
  name: string;
  level: number;
  members: number;
  maxMembers: number;
  exp: number;
  nextLevelExp: number;
  treasury: number;
  tech: {
    trade: number;
    defense: number;
  };
}

export interface LogEntry {
  id: string;
  turn: number;
  text: string;
  type: 'info' | 'positive' | 'negative' | 'event';
}