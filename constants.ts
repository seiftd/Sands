import { Tile, TileType, CharacterConfig, CharacterRole } from './types';

export const BOARD_SIZE = 20;
export const WINNING_GOLD = 2500;

export const INITIAL_RESOURCES = {
  gold: 500,
  water: 100,
  energy: 50,
  materials: 20
};

export const CHARACTERS_CONFIG: CharacterConfig[] = [
  { 
    id: CharacterRole.BUILDER, 
    nameAr: 'المقاول (The Builder)', 
    descAr: 'خبير في البناء والتطوير', 
    bonus: 'خصم 20% على الشراء والتطوير',
    color: 'bg-orange-600'
  },
  { 
    id: CharacterRole.EXPLORER, 
    nameAr: 'المستكشف (The Explorer)', 
    descAr: 'يعشق المغامرة والمجهول', 
    bonus: '+50% موارد من الواحات والأحداث',
    color: 'bg-green-600' 
  },
  { 
    id: CharacterRole.MERCHANT, 
    nameAr: 'التاجر (The Merchant)', 
    descAr: 'سيد التجارة والمال', 
    bonus: '+50% ذهب عند المرور بالبداية',
    color: 'bg-purple-600' 
  },
  { 
    id: CharacterRole.POLITICIAN, 
    nameAr: 'السياسي (The Politician)', 
    descAr: 'ذو نفوذ وعلاقات', 
    bonus: 'حصانة 50% من الضرائب',
    color: 'bg-red-600' 
  }
];

// Define a board of 20 tiles
export const INITIAL_BOARD: Tile[] = [
  { id: 0, type: TileType.START, name: 'البداية (Start)', description: 'Collect Salary' },
  { id: 1, type: TileType.CITY, name: 'دمشق', price: 100, rent: 20, level: 1 },
  { id: 2, type: TileType.EVENT, name: 'عاصفة رملية', description: 'Event' },
  { id: 3, type: TileType.CITY, name: 'بغداد', price: 120, rent: 25, level: 1 },
  { id: 4, type: TileType.OASIS, name: 'واحة النخيل', description: 'Gain Water' },
  { id: 5, type: TileType.CITY, name: 'القاهرة', price: 150, rent: 30, level: 1 },
  { id: 6, type: TileType.TAX, name: 'ضريبة السلطان', description: 'Pay Gold' },
  { id: 7, type: TileType.CITY, name: 'الإسكندرية', price: 140, rent: 28, level: 1 },
  { id: 8, type: TileType.ORACLE, name: 'الحكيم', description: 'AI Oracle' },
  { id: 9, type: TileType.CITY, name: 'الرياض', price: 160, rent: 35, level: 1 },
  { id: 10, type: TileType.JAIL, name: 'السجن', description: 'Skip Turn' },
  { id: 11, type: TileType.CITY, name: 'دبي', price: 200, rent: 50, level: 1 },
  { id: 12, type: TileType.EVENT, name: 'قافلة تجارية', description: 'Trade' },
  { id: 13, type: TileType.CITY, name: 'الدوحة', price: 180, rent: 40, level: 1 },
  { id: 14, type: TileType.OASIS, name: 'البئر القديم', description: 'Refill Energy' },
  { id: 15, type: TileType.CITY, name: 'مسقط', price: 130, rent: 26, level: 1 },
  { id: 16, type: TileType.ORACLE, name: 'المكتبة', description: 'Seek Knowledge' },
  { id: 17, type: TileType.CITY, name: 'البتراء', price: 150, rent: 30, level: 1 },
  { id: 18, type: TileType.TAX, name: 'ضريبة المياه', description: 'Lose Water' },
  { id: 19, type: TileType.CITY, name: 'مكة', price: 250, rent: 60, level: 1 }
];
