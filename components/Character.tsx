import React, { useState } from 'react';
import { CharacterState, CharacterRole } from '../types';

interface CharacterProps {
  role: CharacterRole;
  state: CharacterState;
  className?: string;
  showEmojiOverlay?: boolean;
}

const Character: React.FC<CharacterProps> = ({ role, state, className, showEmojiOverlay = true }) => {
  const [imgError, setImgError] = useState(false);

  // EXACT PATH REQUIREMENT: assets/characters/<character_name>_<state>.png
  const assetPath = `assets/characters/${role}_${state}.png`;

  const getEmotionEmoji = () => {
    switch(state) {
      case CharacterState.HAPPY: return '🤩';
      case CharacterState.SAD: return '😢';
      default: return '😐';
    }
  };

  const getBgColor = () => {
     switch(role) {
       case CharacterRole.BUILDER: return 'bg-orange-100 border-orange-500';
       case CharacterRole.EXPLORER: return 'bg-green-100 border-green-500';
       case CharacterRole.MERCHANT: return 'bg-purple-100 border-purple-500';
       case CharacterRole.POLITICIAN: return 'bg-red-100 border-red-500';
       default: return 'bg-gray-100 border-gray-500';
     }
  };

  return (
    <div className={`relative rounded-full border-2 ${getBgColor()} p-1 shadow-lg ${className}`}>
      {/* 
         Attempt to load the requested asset. 
         If it fails (because user hasn't added files yet), we show a fallback avatar.
      */}
      {!imgError ? (
        <img 
          src={assetPath} 
          alt={`${role} ${state}`} 
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center rounded-full bg-white opacity-80 text-2xl">
           {/* Fallback Icon based on role */}
           {role === CharacterRole.BUILDER && '👷🏽'}
           {role === CharacterRole.EXPLORER && '🤠'}
           {role === CharacterRole.MERCHANT && '👳🏽‍♂️'}
           {role === CharacterRole.POLITICIAN && '🤴🏽'}
        </div>
      )}
      
      {/* Emotion Overlay (Requested Feature) */}
      {showEmojiOverlay && (
        <div className="absolute bottom-0 right-0 bg-white rounded-full w-1/3 h-1/3 flex items-center justify-center text-[10px] md:text-xs shadow-md border border-gray-200">
          {getEmotionEmoji()}
        </div>
      )}
    </div>
  );
};

export default Character;
