
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Question, Answer, GameState, WeaponType } from '../types';
import { generateMathQuestion } from '../services/geminiService';
import { updateGameHistory, loseLife, getLives, getStats } from '../services/storageService';
import FruitButton from './FruitButton';
import IntroFruit, { FruitVariant } from './IntroFruit';
import confetti from 'canvas-confetti';
import { Heart, XCircle, CheckCircle, Home, History as HistoryIcon, Sword as SwordIcon, Clock, Timer, Lock, Trophy, Star } from 'lucide-react';

// --- ASSETS ---
const KATANA_URL = "https://img.icons8.com/color/96/katana.png";
const GOLD_SWORD_URL = "https://img.icons8.com/fluency/96/sword.png"; // Transparent Gold Sword
const DIAMOND_SWORD_URL = "https://img.icons8.com/color/96/minecraft-sword.png";

// --- SWORD CURSOR COMPONENT ---
const SwordCursor = ({ weapon }: { weapon: WeaponType }) => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [angle, setAngle] = useState(0);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
       const dx = e.clientX - lastPos.current.x;
       const dy = e.clientY - lastPos.current.y;
       
       // Calculate angle based on movement direction
       if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
           // Base rotation: -45 degrees to orient the sword sprite correctly
           const rotation = Math.atan2(dy, dx) * (180 / Math.PI) + 45; 
           setAngle(rotation);
       }
       
       setPos({ x: e.clientX, y: e.clientY });
       lastPos.current = { x: e.clientX, y: e.clientY };
    };
    
    // Hide default cursor
    document.body.style.cursor = 'none';
    
    window.addEventListener('mousemove', handleMove);
    return () => {
        window.removeEventListener('mousemove', handleMove);
        document.body.style.cursor = 'default';
    };
  }, []);

  // Determine Image Source based on Weapon
  let imgSrc = KATANA_URL;
  let glowClass = "";
  
  if (weapon === WeaponType.DIAMOND_SWORD) {
      imgSrc = DIAMOND_SWORD_URL;
      glowClass = "drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]";
  } else if (weapon === WeaponType.GOLD_SWORD) {
      imgSrc = GOLD_SWORD_URL;
      glowClass = "drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]";
  } else {
      // Basic Katana styling
      glowClass = "drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]";
  }

  return (
    <div 
      className="fixed pointer-events-none z-[100] w-32 h-32"
      style={{ 
        left: pos.x, 
        top: pos.y, 
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        transition: 'transform 0.1s ease-out' 
      }}
    >
       <img 
         src={imgSrc} 
         alt={weapon} 
         className={`w-full h-full object-contain ${glowClass}`} 
       />
    </div>
  );
};

// --- BLADE COMPONENT ---
const Blade = ({ isSlicing, color }: { isSlicing: boolean, color?: 'cyan' | 'gold' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<{x: number, y: number, life: number}[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Handle resize
    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const addPoint = (x: number, y: number) => {
       points.current.push({ x, y, life: 1.0 });
    };

    const handleMouseMove = (e: MouseEvent) => {
       addPoint(e.clientX, e.clientY);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        addPoint(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    const render = () => {
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       
       // Decay points
       points.current = points.current.map(p => ({ ...p, life: p.life - 0.15 })).filter(p => p.life > 0);

       if (points.current.length > 1) {
           ctx.beginPath();
           ctx.lineCap = 'round';
           ctx.lineJoin = 'round';
           
           // Draw blade trail
           for (let i = 0; i < points.current.length - 1; i++) {
               const p1 = points.current[i];
               const p2 = points.current[i+1];
               
               ctx.moveTo(p1.x, p1.y);
               ctx.lineTo(p2.x, p2.y);
               
               // Width depends on life
               ctx.lineWidth = p1.life * 8;
           }

           // Determine stroke style based on color prop
           if (color === 'cyan') {
             ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
             ctx.shadowColor = '#22d3ee';
             ctx.shadowBlur = 15;
           } else if (color === 'gold') {
             ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
             ctx.shadowColor = '#facc15';
             ctx.shadowBlur = 15;
           } else {
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
             ctx.shadowColor = 'white';
             ctx.shadowBlur = 10;
           }

           ctx.stroke();
       }

       animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationRef.current);
    };
  }, [color]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

// --- MAIN GAME LOOP ---

interface GameLoopProps {
  onExit: () => void;
}

const GameLoop: React.FC<GameLoopProps> = ({ onExit }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO_FRUIT);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(getLives());
  const [isSlicing, setIsSlicing] = useState(false);
  const [weapon, setWeapon] = useState<WeaponType>(WeaponType.BASIC_KATANA);
  const [round, setRound] = useState(1); // Track current round
  const [currentGrade, setCurrentGrade] = useState(1);

  // Intro Fruit State
  const [introFruits, setIntroFruits] = useState<{id: string, variant: FruitVariant, x: number, y: number, vx: number, vy: number, isSliced: boolean}[]>([]);
  const [stageTimer, setStageTimer] = useState(60); // Shared timer for Intro and Question phases
  const introAnimationFrame = useRef<number>(0);

  // Load initial question
  useEffect(() => {
    const stats = getStats();
    setCurrentGrade(stats.gradeLevel || 1);
    loadNextQuestion(stats.gradeLevel || 1);
  }, []);

  // Countdown Timer
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (gameState === GameState.INTRO_FRUIT || gameState === GameState.PLAYING) {
          interval = setInterval(() => {
              setStageTimer(prev => {
                  if (prev <= 1) {
                      // Timeout triggered, handled by effect below
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [gameState]);

  // Handle Timeout (0 seconds)
  useEffect(() => {
      if (stageTimer === 0) {
          if (gameState === GameState.INTRO_FRUIT) {
              handleIntroTimeout();
          } else if (gameState === GameState.PLAYING) {
              handleQuestionTimeout();
          }
      }
  }, [stageTimer, gameState]);

  // Physics for Intro Fruit
  const updatePhysics = useCallback(() => {
      if (gameState !== GameState.INTRO_FRUIT) return;

      setIntroFruits(prevFruits => {
          return prevFruits.map(fruit => {
              if (fruit.isSliced) return fruit;

              let newX = fruit.x + fruit.vx;
              let newY = fruit.y + fruit.vy;
              let newVx = fruit.vx;
              let newVy = fruit.vy;

              // Bounce off walls (percentages)
              if (newX <= 5 || newX >= 85) newVx = -newVx;
              if (newY <= 5 || newY >= 85) newVy = -newVy;

              return { ...fruit, x: newX, y: newY, vx: newVx, vy: newVy };
          });
      });

      introAnimationFrame.current = requestAnimationFrame(updatePhysics);
  }, [gameState]);

  useEffect(() => {
      if (gameState === GameState.INTRO_FRUIT) {
          introAnimationFrame.current = requestAnimationFrame(updatePhysics);
      } else {
          cancelAnimationFrame(introAnimationFrame.current);
      }
      return () => cancelAnimationFrame(introAnimationFrame.current);
  }, [gameState, updatePhysics]);

  const handleIntroTimeout = () => {
      const newLives = loseLife(lives);
      setLives(newLives);
      setScore(prev => Math.max(0, prev - 5)); // Penalty -5 for fruits
      setStreak(0);
      setWeapon(WeaponType.BASIC_KATANA);
      
      // Reset Fruits
      spawnIntroFruits();

      if (newLives === 0) {
          setGameState(GameState.GAME_OVER);
      } else {
          // Show timeout message temporarily
          const originalState = gameState;
          setGameState(GameState.FEEDBACK_WRONG); 
          setTimeout(() => {
              setGameState(GameState.INTRO_FRUIT);
          }, 1000);
      }
  };

  const handleQuestionTimeout = () => {
      const newLives = loseLife(lives);
      setLives(newLives);
      setScore(prev => Math.max(0, prev - 1)); // Penalty -1 for question timeout
      setStreak(0);
      setWeapon(WeaponType.BASIC_KATANA);

      updateGameHistory(score, 0, round);

      setGameState(GameState.FEEDBACK_WRONG);

      if (newLives === 0) {
          setTimeout(() => setGameState(GameState.GAME_OVER), 1000);
      } else {
          setTimeout(() => {
              proceedToNextStage();
          }, 1000);
      }
  };

  const spawnIntroFruits = () => {
      const variants: FruitVariant[] = ['watermelon', 'orange', 'lemon', 'apple', 'peach'];
      
      // 10 Fruits
      const fruits = Array.from({ length: 10 }).map((_, i) => ({
          id: `fruit-${Date.now()}-${i}`,
          variant: variants[Math.floor(Math.random() * variants.length)],
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          isSliced: false
      }));

      // 3 Bombs
      const bombs = Array.from({ length: 3 }).map((_, i) => ({
          id: `bomb-${Date.now()}-${i}`,
          variant: 'bomb' as FruitVariant,
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
          vx: (Math.random() - 0.5) * 0.4, // Bombs slightly faster?
          vy: (Math.random() - 0.5) * 0.4,
          isSliced: false
      }));

      setIntroFruits([...fruits, ...bombs]);
      setStageTimer(60);
  };

  const loadNextQuestion = async (gradeOverride?: number) => {
    // 1. Generate Question (API or Fallback)
    const diff = score > 1000 ? 'hard' : score > 500 ? 'medium' : 'easy';
    const grade = gradeOverride ?? currentGrade;
    
    const q = await generateMathQuestion(diff, grade);
    setCurrentQuestion(q);
    
    // 2. Reset State for new round
    spawnIntroFruits();
    setGameState(GameState.INTRO_FRUIT);
  };

  const proceedToNextStage = () => {
      // Infinite rounds: Just increment and continue
      setRound(r => r + 1);
      loadNextQuestion();
  };

  const handleIntroSlice = (id: string) => {
      // Identify if fruit or bomb
      const item = introFruits.find(f => f.id === id);
      
      if (item?.variant === 'bomb') {
          // BOMB HIT: Penalty -10, No Life Lost
          setScore(s => Math.max(0, s - 10));
      } else {
          // FRUIT HIT: +10
          setScore(s => s + 10);
      }
      
      setIntroFruits(prev => {
          const updated = prev.map(f => f.id === id ? { ...f, isSliced: true } : f);
          
          // Check if all FRUITS are sliced (ignoring bombs)
          const remainingFruits = updated.filter(f => f.variant !== 'bomb' && !f.isSliced);

          if (remainingFruits.length === 0) {
              setTimeout(() => {
                  setGameState(GameState.PLAYING);
                  setStageTimer(60); // Reset timer for question
              }, 500);
          }
          return updated;
      });
  };

  const handleAnswer = (answer: Answer) => {
    if (gameState !== GameState.PLAYING) return;

    if (answer.isCorrect) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  };

  const handleCorrectAnswer = () => {
    setGameState(GameState.FEEDBACK_CORRECT);
    setScore(s => s + 10);
    
    const newStreak = streak + 1;
    setStreak(newStreak);
    
    // Confetti
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FACC15', '#22C55E', '#ffffff']
    });

    // Weapon Progression
    // Streak 3 -> Gold Sword
    // Streak 6 -> Diamond Sword
    let nextWeapon = weapon;
    let showReward = false;

    if (newStreak === 3 && weapon !== WeaponType.GOLD_SWORD && weapon !== WeaponType.DIAMOND_SWORD) {
        nextWeapon = WeaponType.GOLD_SWORD;
        showReward = true;
    } else if (newStreak === 6 && weapon !== WeaponType.DIAMOND_SWORD) {
        nextWeapon = WeaponType.DIAMOND_SWORD;
        showReward = true;
    }

    setWeapon(nextWeapon);

    // Save stats
    updateGameHistory(score + 10, 1, round);

    setTimeout(() => {
       if (showReward) {
           setGameState(GameState.REWARD);
       } else {
           proceedToNextStage();
       }
    }, 800);
  };

  const handleRewardClaim = () => {
      proceedToNextStage();
  };

  const handleWrongAnswer = () => {
    setGameState(GameState.FEEDBACK_WRONG);
    const newLives = loseLife(lives);
    setLives(newLives);
    setStreak(0); // Reset streak
    setScore(s => Math.max(0, s - 5)); // Penalty
    
    // Reset Weapon to Basic on wrong answer
    setWeapon(WeaponType.BASIC_KATANA);

    updateGameHistory(score, 0, round);

    if (newLives === 0) {
        setTimeout(() => setGameState(GameState.GAME_OVER), 1000);
    } else {
        setTimeout(() => {
            proceedToNextStage();
        }, 1000);
    }
  };

  // Input handling for "Slicing" mechanic
  const handlePointerDown = () => setIsSlicing(true);
  const handlePointerUp = () => setIsSlicing(false);
  
  // Attach global pointer up listener
  useEffect(() => {
      window.addEventListener('pointerup', handlePointerUp);
      return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  // --- RENDER HELPERS ---

  const renderHUD = () => (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-40 font-ninja tracking-widest">
       {/* Left: Lives & Score */}
       <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
             {[1, 2, 3].map(i => (
                 <Heart key={i} className={`w-8 h-8 drop-shadow-md ${i <= lives ? 'fill-ninja-red text-ninja-red' : 'fill-gray-800 text-gray-800'}`} />
             ))}
          </div>
          <div className="text-4xl text-ninja-yellow drop-shadow-[2px_2px_0_#000] text-stroke">
              SCORE: {score}
          </div>
          <div className="flex flex-col items-start gap-1">
             <div className="text-2xl text-white drop-shadow-md bg-black/40 px-2 rounded inline-block">
                ROUND {round}
             </div>
             <div className="text-lg text-yellow-300 drop-shadow-md bg-black/40 px-2 rounded inline-block uppercase">
                Grade {currentGrade}
             </div>
          </div>
       </div>

       {/* Center: Timer (Shared) */}
       {(gameState === GameState.INTRO_FRUIT || gameState === GameState.PLAYING) && (
           <div className={`flex flex-col items-center transition-all duration-300 ${stageTimer <= 10 ? 'scale-110' : ''}`}>
                <div className={`text-6xl drop-shadow-lg ${stageTimer <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {stageTimer}
                </div>
                <div className="text-sm text-gray-300 bg-black/50 px-2 rounded">
                    {gameState === GameState.INTRO_FRUIT ? 'SEC TO SLICE' : 'SEC TO ANSWER'}
                </div>
           </div>
       )}

       {/* Right: Tool Box & Home Button */}
       <div className="flex flex-col items-end gap-2">
           {/* HOME BUTTON */}
           <button 
              onClick={onExit}
              className="pointer-events-auto flex items-center gap-2 bg-white/10 hover:bg-ninja-red hover:text-white text-gray-300 px-4 py-2 rounded-lg backdrop-blur-md border border-white/10 transition-all group mb-2 hover:border-red-500/50"
           >
               <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
               <span className="font-ninja tracking-wider text-sm">HOME</span>
           </button>

           <div className="bg-black/60 p-3 rounded-xl border-2 border-white/20 backdrop-blur-sm">
               <div className="text-xs text-gray-400 mb-1 uppercase text-center">Tool Box</div>
               <div className="flex gap-2">
                   {/* Basic Katana Slot */}
                   <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center relative transition-all ${weapon === WeaponType.BASIC_KATANA ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'border-white/10 bg-white/5'}`}>
                       <img src={KATANA_URL} className={`w-12 h-12 ${weapon !== WeaponType.BASIC_KATANA ? 'opacity-50 grayscale' : ''}`} alt="Katana" />
                   </div>

                   {/* Gold Sword Slot */}
                   <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center relative transition-all ${weapon === WeaponType.GOLD_SWORD ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'border-white/10 bg-white/5'}`}>
                       <img src={GOLD_SWORD_URL} className={`w-12 h-12 object-contain ${weapon !== WeaponType.GOLD_SWORD ? 'opacity-30 grayscale blur-[1px]' : ''}`} alt="Gold" />
                       {weapon !== WeaponType.GOLD_SWORD && streak < 3 && <Lock className="absolute w-4 h-4 text-white/50 bottom-1 right-1" />}
                   </div>

                   {/* Diamond Sword Slot */}
                   <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center relative transition-all ${weapon === WeaponType.DIAMOND_SWORD ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'border-white/10 bg-white/5'}`}>
                       <img src={DIAMOND_SWORD_URL} className={`w-12 h-12 object-contain ${weapon !== WeaponType.DIAMOND_SWORD ? 'opacity-30 grayscale blur-[1px]' : ''}`} alt="Diamond" />
                       {weapon !== WeaponType.DIAMOND_SWORD && streak < 6 && <Lock className="absolute w-4 h-4 text-white/50 bottom-1 right-1" />}
                   </div>
               </div>
           </div>
           <div className="text-xl text-white drop-shadow-md">
               Streak: <span className={`${streak >= 6 ? 'text-cyan-400' : streak >= 3 ? 'text-yellow-400' : 'text-white'}`}>{streak}</span> 🔥
           </div>
       </div>
    </div>
  );

  return (
    <div 
        className="relative w-full h-screen overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-neutral-900 cursor-none"
        onPointerDown={handlePointerDown}
    >
      {/* Custom Cursor & Blade Trail */}
      {isSlicing && <Blade isSlicing={isSlicing} color={weapon === WeaponType.DIAMOND_SWORD ? 'cyan' : weapon === WeaponType.GOLD_SWORD ? 'gold' : undefined} />}
      <SwordCursor weapon={weapon} />

      {renderHUD()}

      {/* GAME STATES */}
      
      {/* 1. INTRO FRUIT STATE */}
      {gameState === GameState.INTRO_FRUIT && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <h2 className="text-4xl font-ninja text-white mb-8 animate-pulse drop-shadow-lg pointer-events-none">
                  SLICE FRUITS! AVOID BOMBS!
              </h2>
              {/* Floating Fruits handled by state mapping */}
              {introFruits.map(fruit => (
                  !fruit.isSliced && (
                      <IntroFruit 
                        key={fruit.id}
                        id={fruit.id}
                        variant={fruit.variant}
                        x={fruit.x}
                        y={fruit.y}
                        rotation={0} // Rotation handled by css animation or could be state if physics needed rotation
                        onSlice={handleIntroSlice}
                        isSlicing={isSlicing}
                      />
                  )
              ))}
          </div>
      )}

      {/* 2. PLAYING STATE (Question) */}
      {gameState === GameState.PLAYING && currentQuestion && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
           {/* Question Board */}
           <div className="bg-[#5d4037] border-4 border-[#3e2723] p-8 rounded-lg shadow-2xl mb-16 rotate-1 transform hover:rotate-0 transition-transform duration-300">
              <h2 className="text-6xl font-ninja text-white drop-shadow-[0_3px_0_#000]">{currentQuestion.text}</h2>
           </div>

           {/* Answers (Fruits) */}
           <div className="flex gap-8 pointer-events-auto">
              {currentQuestion.answers.map((ans, idx) => (
                  <FruitButton 
                    key={ans.id} 
                    answer={ans} 
                    index={idx} 
                    onSlice={handleAnswer} 
                    disabled={false}
                    isSlicing={isSlicing}
                  />
              ))}
           </div>
        </div>
      )}

      {/* 3. FEEDBACK STATES */}
      {(gameState === GameState.FEEDBACK_CORRECT || gameState === GameState.FEEDBACK_WRONG) && (
          <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${gameState === GameState.FEEDBACK_CORRECT ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
             <div className="transform scale-150">
                 {gameState === GameState.FEEDBACK_CORRECT ? (
                     <div className="flex flex-col items-center animate-bounce">
                         <CheckCircle className="w-32 h-32 text-ninja-green drop-shadow-[0_0_20px_rgba(34,197,94,0.8)] fill-white" />
                         <span className="font-ninja text-5xl text-ninja-yellow mt-4 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] text-stroke">+10 Points</span>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center animate-bounce">
                        <XCircle className="w-32 h-32 text-ninja-red drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] fill-white" />
                        <span className="font-ninja text-3xl text-white mt-4 drop-shadow-md">
                            {stageTimer === 0 && currentQuestion ? "Time's Up! -1" : "Time Penalty -5"}
                        </span>
                     </div>
                 )}
             </div>
          </div>
      )}

      {/* 4. REWARD STATE */}
      {gameState === GameState.REWARD && (
          <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center animate-fade-in pointer-events-auto">
              <h2 className="text-5xl font-ninja text-yellow-400 mb-8 drop-shadow-lg text-center">
                  {weapon === WeaponType.GOLD_SWORD ? "GOLD SWORD UNLOCKED!" : "DIAMOND SWORD UNLOCKED!"}
              </h2>
              <div className="relative group cursor-pointer" onClick={handleRewardClaim}>
                  <div className={`absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse ${weapon === WeaponType.GOLD_SWORD ? 'bg-yellow-500' : 'bg-cyan-500'}`}></div>
                  <img 
                    src={weapon === WeaponType.GOLD_SWORD ? GOLD_SWORD_URL : DIAMOND_SWORD_URL} 
                    className="w-48 h-48 object-contain relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform" 
                    alt="Reward"
                  />
                  <p className="text-white font-ninja text-2xl mt-4 text-center animate-bounce">Click to Claim!</p>
              </div>
          </div>
      )}

      {/* 5. GAME OVER STATE */}
      {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center pointer-events-auto">
             <h1 className="text-7xl font-ninja text-ninja-red mb-4 drop-shadow-[0_5px_0_#fff]">GAME OVER</h1>
             <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-md text-center border border-white/20 mb-8">
                <p className="text-gray-300 text-xl uppercase mb-2">Final Score</p>
                <p className="text-6xl font-ninja text-white">{score}</p>
                <p className="text-gray-400 mt-4">Lives regenerating...</p>
             </div>
             <button 
                onClick={onExit}
                className="flex items-center gap-2 bg-ninja-yellow text-black px-8 py-4 rounded-xl font-ninja text-2xl hover:scale-105 transition-transform"
             >
                <Home className="w-6 h-6" />
                Return to Home
             </button>
          </div>
      )}

      {/* 6. VICTORY STATE */}
      {gameState === GameState.VICTORY && (
          <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center pointer-events-auto animate-fade-in">
             <h1 className="text-7xl font-ninja text-ninja-yellow mb-4 drop-shadow-[0_5px_0_#fff] animate-bounce">MISSION COMPLETE!</h1>
             <div className="flex gap-4 mb-8">
                 <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-spin-slow" />
                 <Star className="w-16 h-16 text-yellow-400 fill-yellow-400 animate-bounce" />
                 <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-spin-slow" />
             </div>
             <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-md text-center border border-white/20 mb-8">
                <p className="text-gray-300 text-xl uppercase mb-2">Total Score</p>
                <p className="text-6xl font-ninja text-white">{score}</p>
                <p className="text-cyan-400 mt-2 font-ninja text-xl">All Rounds Cleared!</p>
             </div>
             <button 
                onClick={onExit}
                className="flex items-center gap-2 bg-ninja-green text-white px-8 py-4 rounded-xl font-ninja text-2xl hover:scale-105 transition-transform border-b-4 border-green-700"
             >
                <Trophy className="w-6 h-6" />
                Claim Victory
             </button>
          </div>
      )}
    </div>
  );
};

export default GameLoop;
