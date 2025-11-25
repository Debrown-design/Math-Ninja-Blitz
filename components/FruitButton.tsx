import React, { useState, useEffect } from 'react';
import { Answer } from '../types';

interface FruitButtonProps {
  answer: Answer;
  onSlice: (answer: Answer) => void;
  index: number;
  disabled: boolean;
  isSlicing: boolean; // Passed from game loop to know if user is currently "slashing"
}

const COLORS = [
  'bg-green-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500'
];

const BORDERS = [
  'border-green-300',
  'border-orange-300',
  'border-yellow-300',
  'border-red-300',
  'border-purple-300'
];

const FruitButton: React.FC<FruitButtonProps> = ({ answer, onSlice, index, disabled, isSlicing }) => {
  const [isSliced, setIsSliced] = useState(false);

  const colorClass = COLORS[index % COLORS.length];
  const borderClass = BORDERS[index % BORDERS.length];

  const triggerSlice = () => {
    if (disabled || isSliced) return;
    setIsSliced(true);
    onSlice(answer);
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (disabled || isSliced) return;
    // If global slicing is active (mouse down)
    if (isSlicing) {
      triggerSlice();
    }
  };
  
  const handlePointerDown = () => {
      triggerSlice();
  }

  return (
    <div 
      className={`relative w-36 h-36 flex items-center justify-center select-none transition-opacity duration-300 ${disabled ? 'opacity-30' : 'opacity-100'}`}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
    >
      {/* Container for the fruit parts */}
      <div className="relative w-full h-full">
          
          {/* LEFT HALF */}
          <div 
             className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${isSliced ? '-translate-x-8 -translate-y-2 -rotate-12 opacity-0' : ''}`}
             style={{ clipPath: 'polygon(0 0, 55% 0, 45% 100%, 0 100%)' }}
          >
             <div className={`w-28 h-28 rounded-full ${colorClass} border-4 ${borderClass} shadow-lg flex items-center justify-center`}>
                {/* Inner content repeated but clipped */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-ninja text-white drop-shadow-md translate-x-0">{answer.text}</span>
                </div>
                 <div className="absolute top-3 left-5 w-6 h-3 bg-white/30 rounded-full rotate-[-15deg]"></div>
             </div>
          </div>

          {/* RIGHT HALF */}
          <div 
             className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${isSliced ? 'translate-x-8 translate-y-2 rotate-12 opacity-0' : ''}`}
             style={{ clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 45% 100%)' }}
          >
             <div className={`w-28 h-28 rounded-full ${colorClass} border-4 ${borderClass} shadow-lg flex items-center justify-center`}>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-ninja text-white drop-shadow-md translate-x-0">{answer.text}</span>
                </div>
             </div>
          </div>

          {/* SPLASH EFFECT (When sliced) */}
          {isSliced && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
               <div className={`w-full h-1 bg-white absolute rotate-[-10deg] animate-ping`}></div>
               <div className={`w-32 h-32 rounded-full ${colorClass} opacity-50 blur-xl animate-ping`}></div>
            </div>
          )}
      </div>
    </div>
  );
};

export default FruitButton;