import React from 'react';
import { Tile as TileType, TileType as TType } from '../types';
import { Home, Zap, Droplet, Star, Skull, HelpCircle, MapPin, Building2, Building, AlertTriangle, Gem } from 'lucide-react';

interface TileProps {
  tile: TileType;
  playersOnTile: number[];
  playerColors: Record<number, string>;
  isOwnedBy?: number;
}

const Tile: React.FC<TileProps> = ({ tile, playersOnTile, playerColors, isOwnedBy }) => {
  
  const getIcon = () => {
    switch (tile.type) {
      case TType.START: return <MapPin className="text-green-600" />;
      case TType.CITY: 
        if ((tile.level || 1) >= 3) return <Building2 className={isOwnedBy !== undefined ? "text-yellow-600 drop-shadow-md" : "text-amber-600"} size={28} />;
        if ((tile.level || 1) === 2) return <Building2 className={isOwnedBy !== undefined ? "text-gray-600" : "text-amber-600"} />;
        return <Building className={isOwnedBy !== undefined ? "text-amber-900" : "text-amber-600"} />;
      case TType.EVENT: return <Star className="text-purple-500" />;
      case TType.TAX: return <Skull className="text-red-600" />;
      case TType.JAIL: return <div className="text-2xl">🔒</div>;
      case TType.OASIS: return <Droplet className="text-blue-500" />;
      case TType.ORACLE: return <Zap className="text-yellow-500" />;
      case TType.SWAMP: return <AlertTriangle className="text-green-800" />;
      case TType.TREASURE: return <Gem className="text-teal-500 animate-pulse" />;
      default: return <HelpCircle />;
    }
  };

  const getBgClass = () => {
    if (isOwnedBy !== undefined) return playerColors[isOwnedBy].replace('bg-', 'bg-opacity-20 bg-');
    switch(tile.type) {
        case TType.START: return 'bg-green-100';
        case TType.CITY: return 'bg-amber-50';
        case TType.JAIL: return 'bg-gray-300';
        case TType.ORACLE: return 'bg-indigo-100';
        case TType.SWAMP: return 'bg-green-200 border-green-700 border-dashed';
        case TType.TREASURE: return 'bg-teal-50 border-teal-300';
        default: return 'bg-white';
    }
  };

  // Glow effect for upgrades
  const getGlowEffect = () => {
      if (tile.type !== TType.CITY || !isOwnedBy) return '';
      if (tile.level === 3) return 'shadow-[0_0_15px_rgba(234,179,8,0.6)] border-yellow-400 border-2'; // Gold
      if (tile.level === 2) return 'shadow-[0_0_10px_rgba(59,130,246,0.4)] border-blue-300'; // Silver/Blueish
      return '';
  };

  // Render Stars for upgrade level
  const renderLevel = () => {
      if (tile.type !== TType.CITY || !isOwnedBy) return null;
      return (
          <div className="flex justify-center -mt-1 mb-1 gap-0.5">
              {[...Array(tile.level || 1)].map((_, i) => (
                  <span key={i} className="text-[10px] drop-shadow-sm">
                      {i === 2 ? '👑' : i === 1 ? '🏙️' : '🏠'}
                  </span>
              ))}
          </div>
      );
  };

  return (
    <div className={`relative w-full h-24 border border-amber-200 rounded-lg flex flex-col items-center justify-between p-1 text-xs text-center transition-transform hover:scale-105 ${getBgClass()} ${getGlowEffect()}`}>
      
      {/* Name */}
      <div className="font-bold text-gray-800 w-full truncate px-1 text-[10px] md:text-xs">{tile.name}</div>
      
      {/* Icon */}
      <div className="flex-grow flex flex-col items-center justify-center">
        {getIcon()}
        {renderLevel()}
      </div>

      {/* Info */}
      {tile.type === TType.CITY && (
        <div className="text-[9px] text-gray-500 font-mono">
          {isOwnedBy !== undefined ? `Rent: ${tile.rent}` : `Buy: ${tile.price}`}
        </div>
      )}

      {/* Players */}
      <div className="absolute top-1 right-1 flex space-x-1 space-x-reverse">
        {playersOnTile.map(pid => (
          <div key={pid} className={`w-3 h-3 rounded-full border border-white shadow ${playerColors[pid]}`} />
        ))}
      </div>

      {/* Owner Bar (if not high level with border) */}
      {isOwnedBy !== undefined && !getGlowEffect() && (
        <div className={`absolute bottom-0 left-0 w-full h-1 ${playerColors[isOwnedBy]}`} />
      )}
    </div>
  );
};

export default Tile;