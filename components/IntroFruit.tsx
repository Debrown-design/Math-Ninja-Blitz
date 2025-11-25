
import React, { useState } from 'react';
import { Bomb, Skull } from 'lucide-react';

export type FruitVariant = 'watermelon' | 'orange' | 'lemon' | 'apple' | 'peach' | 'bomb';

interface IntroFruitProps {
  id: string;
  variant: FruitVariant;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  rotation: number;
  onSlice: (id: string) => void;
  isSlicing: boolean;
}

const IntroFruit: React.FC<IntroFruitProps> = ({ id, variant, x, y, rotation, onSlice, isSlicing }) => {
  const [isSliced, setIsSliced] = useState(false);

  const triggerSlice = () => {
    if (isSliced) return;
    setIsSliced(true);
    // Delay callback slightly to show animation
    setTimeout(() => {
        onSlice(id);
    }, 300);
  };

  const handlePointerEnter = () => {
    if (isSlicing) {
      triggerSlice();
    }
  };

  const handlePointerDown = () => {
      triggerSlice();
  }

  // Variant Styles
  const getStyles = () => {
    switch (variant) {
      case 'orange':
        return {
           rind: 'bg-orange-600 border-orange-800',
           flesh: 'bg-orange-400 border-orange-200',
           seeds: 'opacity-0' 
        };
      case 'lemon':
        return {
           rind: 'bg-yellow-600 border-yellow-800',
           flesh: 'bg-yellow-300 border-white',
           seeds: 'bg-white opacity-40'
        };
      case 'apple':
        return {
           rind: 'bg-green-600 border-green-800',
           flesh: 'bg-yellow-50 border-green-100',
           seeds: 'bg-black opacity-60'
        };
      case 'peach':
        return {
            rind: 'bg-rose-500 border-rose-700',
            flesh: 'bg-amber-200 border-rose-300',
            seeds: 'bg-rose-900 opacity-40'
        };
      case 'bomb':
        return {
            rind: 'bg-zinc-900 border-black',
            flesh: 'bg-zinc-800 border-red-900',
            seeds: 'hidden'
        };
      case 'watermelon':
      default:
        return {
           rind: 'bg-green-600 border-green-800',
           flesh: 'bg-red-500 border-white',
           seeds: 'bg-black opacity-60'
        };
    }
  };

  const style = getStyles();
  const isBomb = variant === 'bomb';

  return (
    <div 
      className="absolute w-32 h-32 flex items-center justify-center select-none z-30 cursor-crosshair touch-none will-change-transform"
      style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${rotation}deg)` }}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
    >
      <div className="relative w-full h-full filter drop-shadow-2xl">
          
          {/* BOMB RENDERING */}
          {isBomb ? (
              <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br from-gray-800 to-black border-4 border-gray-900 shadow-inner flex items-center justify-center transition-all duration-200 ${isSliced ? 'scale-125 opacity-0' : ''}`}>
                  {/* Fuse */}
                  <div className="absolute -top-6 right-1/2 w-2 h-8 bg-amber-700 rounded-sm rotate-12 z-[-1]"></div>
                  <div className="absolute -top-8 right-[45%] w-4 h-4 bg-orange-500 rounded-full animate-ping"></div>
                  <div className="absolute -top-8 right-[45%] w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>

                  {/* Icon */}
                  <div className="text-red-500/80 animate-pulse">
                      <Bomb className="w-16 h-16" />
                  </div>

                  {/* Shine */}
                  <div className="absolute top-4 left-4 w-8 h-4 bg-white/10 rounded-full rotate-[-45deg]"></div>
              </div>
          ) : (
            /* FRUIT RENDERING */
            <>
                {/* LEFT HALF */}
                <div 
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${isSliced ? '-translate-x-6 -translate-y-6 -rotate-12 opacity-0' : ''}`}
                    style={{ clipPath: 'polygon(0 0, 45% 0, 55% 100%, 0 100%)' }}
                >
                    <div className={`w-28 h-28 rounded-full ${style.rind} border-4 shadow-inner flex items-center justify-center overflow-hidden relative`}>
                        <div className={`w-24 h-24 rounded-full ${style.flesh} border-2 flex items-center justify-center relative`}>
                            <div className={`absolute top-6 left-6 w-2 h-3 rounded-full rotate-45 ${style.seeds}`}></div>
                            <div className={`absolute bottom-6 right-8 w-2 h-3 rounded-full -rotate-12 ${style.seeds}`}></div>
                        </div>
                    </div>
                </div>

                {/* RIGHT HALF */}
                <div 
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${isSliced ? 'translate-x-6 translate-y-6 rotate-12 opacity-0' : ''}`}
                    style={{ clipPath: 'polygon(45% 0, 100% 0, 100% 100%, 55% 100%)' }}
                >
                    <div className={`w-28 h-28 rounded-full ${style.rind} border-4 shadow-inner flex items-center justify-center overflow-hidden relative`}>
                        <div className={`w-24 h-24 rounded-full ${style.flesh} border-2 flex items-center justify-center`}>
                            <div className={`absolute top-8 left-8 w-2 h-3 rounded-full rotate-[-45deg] ${style.seeds}`}></div>
                        </div>
                    </div>
                </div>
            </>
          )}

          {/* SPLASH / EXPLOSION EFFECT */}
          {isSliced && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
               {isBomb ? (
                   // Bomb Explosion
                   <>
                     <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-80"></div>
                     <div className="absolute inset-0 bg-red-600 rounded-full animate-ping delay-75 opacity-60"></div>
                     <Skull className="absolute text-black w-16 h-16 animate-bounce z-50" />
                     <div className="absolute -top-16 text-5xl font-ninja text-red-600 drop-shadow-[0_2px_0_#fff] animate-bounce-custom whitespace-nowrap z-50">
                        -10
                     </div>
                   </>
               ) : (
                   // Fruit Splash
                   <>
                     <div className="w-32 h-1 bg-white absolute rotate-[15deg] animate-slash"></div>
                     <div className={`w-24 h-24 rounded-full ${variant === 'watermelon' ? 'bg-red-500' : variant === 'apple' ? 'bg-white' : 'bg-yellow-500'} opacity-60 blur-xl animate-ping`}></div>
                     
                     {/* Score Popup */}
                     <div className="absolute -top-10 text-4xl font-ninja text-yellow-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] animate-bounce-custom whitespace-nowrap z-50">
                         +10
                     </div>
                   </>
               )}
            </div>
          )}
      </div>
    </div>
  );
};

export default IntroFruit;
