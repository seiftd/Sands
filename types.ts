export enum TileType {
  START = 'START',
  CITY = 'CITY',
  EVENT = 'EVENT',
  TAX = 'TAX',
  JAIL = 'JAIL',
  ORACLE = 'ORACLE', // AI Powered tile
  OASIS = 'OASIS'
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
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

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
  mood: CharacterState;
  color: string;
}

export interface Tile {
  id: number;
  type: TileType;
  name: string;
  price?: number; // Cost to buy
  rent?: number; // Cost to land on if owned
  level?: number; // Upgrade level (1-3)
  ownerId?: number; // Player ID who owns it
  description?: string;
}

export interface CharacterConfig {
  id: CharacterRole;
  nameAr: string;
  descAr: string;
  bonus: string;
  color: string;
}
