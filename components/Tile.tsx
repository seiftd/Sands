import React from 'react';
import { Tile as TileType, TileType as TType } from '../types';
import { Home, Zap, Droplet, Star, Skull, HelpCircle, MapPin, Building2, Building } from 'lucide-react';

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
        if ((tile.level || 1) > 1) return <Building2 className={isOwnedBy !== undefined ? "text-gray-800" : "text-amber-600"} />;
        return <Building className={isOwnedBy !== undefined ? "text-gray-800" : "text-amber-600"} />;
      case TType.EVENT: return <Star className="text-purple-500" />;
      case TType.TAX: return <Skull className="text-red-600" />;
      case TType.JAIL: return <div className="text-2xl">🔒</div>;
      case TType.OASIS: return <Droplet className="text-blue-500" />;
      case TType.ORACLE: return <Zap className="text-yellow-500" />;
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
        default: return 'bg-white';
    }
  };

  // Render Stars for upgrade level
  const renderLevel = () => {
      if (tile.type !== TType.CITY || !isOwnedBy) return null;
      return (
          <div className="flex justify-center -mt-1 mb-1">
              {[...Array(tile.level || 1)].map((_, i) => (
                  <span key={i} className="text-[8px] text-yellow-500">⭐</span>
              ))}
          </div>
      );
  };

  return (
    <div className={`relative w-full h-24 border-2 border-amber-200 rounded-lg flex flex-col items-center justify-between p-1 text-xs text-center shadow-sm transition-transform hover:scale-105 ${getBgClass()}`}>
      
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

      {/* Owner Bar */}
      {isOwnedBy !== undefined && (
        <div className={`absolute bottom-0 left-0 w-full h-1 ${playerColors[isOwnedBy]}`} />
      )}
    </div>
  );
};

export default Tile;
