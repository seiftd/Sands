import React, { useState, useEffect } from 'react';

interface DiceProps {
  value: number;
  rolling: boolean;
  onRoll: () => void;
  disabled: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, rolling, onRoll, disabled }) => {
  const [displayValue, setDisplayValue] = useState(1);

  useEffect(() => {
    if (rolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [rolling, value]);

  // Dice dot positions with the new theme colors
  // Theme: Cream (#fdf6e3) bg, Gold (#d97706) border, Dark Blue (#1e3a8a) dots
  const renderDots = (val: number) => {
    const dots = [];
    const dotClass = "bg-[#1e3a8a] rounded-full w-2.5 h-2.5 absolute shadow-sm"; // Dark blue dots
    
    if(val % 2 !== 0) dots.push(<div key="c" className={`${dotClass} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}/>);
    if(val > 1) {
        dots.push(<div key="tl" className={`${dotClass} top-2 left-2`}/>);
        dots.push(<div key="br" className={`${dotClass} bottom-2 right-2`}/>);
    }
    if(val > 3) {
        dots.push(<div key="tr" className={`${dotClass} top-2 right-2`}/>);
        dots.push(<div key="bl" className={`${dotClass} bottom-2 left-2`}/>);
    }
    if(val === 6) {
        dots.push(<div key="ml" className={`${dotClass} top-1/2 left-2 transform -translate-y-1/2`}/>);
        dots.push(<div key="mr" className={`${dotClass} top-1/2 right-2 transform -translate-y-1/2`}/>);
    }
    return dots;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* The Result Die (Animated) */}
      <div className={`w-16 h-16 bg-[#fdf6e3] border-4 border-[#d97706] rounded-xl relative shadow-xl transition-all duration-100 ${rolling ? 'animate-bounce rotate-12' : 'rotate-0'}`}>
        {renderDots(displayValue)}
      </div>

      {/* The Roll Button using the Asset */}
      <button 
        onClick={onRoll} 
        disabled={disabled || rolling}
        className={`group relative w-32 h-16 transition-transform active:scale-95 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
        aria-label="Roll Dice"
      >
        {/* 1. Try to load the asset */}
        <img 
          src="/assets/ui/dice_button.png" 
          alt="Roll" 
          className="absolute inset-0 w-full h-full object-contain z-10 drop-shadow-lg"
          onError={(e) => {
            // Hide image on error so fallback SVG shows
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* 2. Fallback CSS/SVG recreation of the asset (Gold Border, Blue BG, Dice Icon) */}
        <div className="absolute inset-0 w-full h-full bg-[#0f172a] rounded-xl border-4 border-[#b45309] flex items-center justify-center shadow-lg overflow-hidden">
             {/* Decorative inner border */}
             <div className="absolute inset-1 border border-[#fbbf24] rounded-lg opacity-50"></div>
             
             {/* Corner flourishes */}
             <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#fbbf24] rounded-tl"></div>
             <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#fbbf24] rounded-tr"></div>
             <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#fbbf24] rounded-bl"></div>
             <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#fbbf24] rounded-br"></div>

             {/* Center Icons (Two Dice) */}
             <div className="flex gap-1 transform rotate-6">
                <div className="w-6 h-6 bg-[#fdf6e3] rounded flex items-center justify-center border border-[#d97706]">
                    <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full"></div>
                </div>
                <div className="w-6 h-6 bg-[#fdf6e3] rounded flex items-center justify-center border border-[#d97706] relative">
                    <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full absolute top-1 left-1"></div>
                    <div className="w-1.5 h-1.5 bg-[#1e3a8a] rounded-full absolute bottom-1 right-1"></div>
                </div>
             </div>
        </div>
      </button>
    </div>
  );
};

export default Dice;
