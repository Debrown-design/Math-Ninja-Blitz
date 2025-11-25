
import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, LeaderboardEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Sword, Zap, Play, History, Heart, Clock, GraduationCap, ArrowUp } from 'lucide-react';
import { getLives, saveStats } from '../services/storageService';
import confetti from 'canvas-confetti';

interface DashboardProps {
  stats: UserStats;
  onStartGame: () => void;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'NinjaZero', score: 2450, avatar: '🥷', rounds: 45 },
  { id: '2', name: 'MathMaster', score: 2100, avatar: '🦊', rounds: 38 },
  { id: '3', name: 'SliceQueen', score: 1890, avatar: '⚔️', rounds: 32 },
  { id: '4', name: 'FruitSensei', score: 1500, avatar: '🍊', rounds: 25 },
  { id: '5', name: 'BlitzKid', score: 1200, avatar: '⚡', rounds: 19 },
];

const Dashboard: React.FC<DashboardProps> = ({ stats, onStartGame }) => {
  const [lives, setLives] = useState(getLives());
  const [timeToNextLife, setTimeToNextLife] = useState<string | null>(null);
  const [currentGrade, setCurrentGrade] = useState(stats.gradeLevel || 1);

  // Dynamic Leaderboard Logic
  const leaderboardData = useMemo(() => {
    const data = [...MOCK_LEADERBOARD];
    
    // If user has 1000+ points, add them to the leaderboard
    if (stats.highestScore >= 1000) {
        data.push({
            id: 'local-player',
            name: 'YOU',
            score: stats.highestScore,
            avatar: '😎',
            rounds: stats.highestRound || 1
        });
    }
    
    // Sort by score descending
    return data.sort((a, b) => b.score - a.score);
  }, [stats.highestScore, stats.highestRound]);

  useEffect(() => {
    // Update lives and timer periodically
    const interval = setInterval(() => {
        const currentLives = getLives();
        setLives(currentLives);
        
        if (currentLives < 3) {
            const timestampStr = localStorage.getItem('math_ninja_lives_timestamp');
            if (timestampStr) {
                const lastUpdate = parseInt(timestampStr, 10);
                const elapsed = Date.now() - lastUpdate;
                const remaining = (2 * 60 * 1000) - elapsed; // Time until NEXT life (2 mins)
                if (remaining > 0) {
                    const mins = Math.floor(remaining / 60000);
                    const secs = Math.floor((remaining % 60000) / 1000);
                    setTimeToNextLife(`${mins}:${secs.toString().padStart(2, '0')}`);
                } else {
                    setTimeToNextLife('Ready');
                }
            }
        } else {
            setTimeToNextLife(null);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate required score: Grade 1 -> 1000, Grade 2 -> 2000, etc.
  const requiredScore = currentGrade * 1000;

  const handleLevelUp = () => {
    if (stats.highestScore >= requiredScore && currentGrade < 12) {
      const newGrade = currentGrade + 1;
      saveStats({ gradeLevel: newGrade });
      setCurrentGrade(newGrade);
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.8 },
        colors: ['#FACC15', '#FFFFFF', '#22C55E']
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in w-full">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-7xl font-ninja text-ninja-yellow drop-shadow-[0_5px_0_rgba(0,0,0,1)] text-stroke tracking-wide">
          MATH NINJA BLITZ
        </h1>
        <p className="text-gray-400 text-xl">Slice the numbers. Be the legend.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Sword className="w-8 h-8 text-purple-400" />} 
          label="Total Games" 
          value={stats.totalGamesPlayed} 
        />
        <StatCard 
          icon={<Zap className="w-8 h-8 text-ninja-yellow" />} 
          label="Lifetime Correct" 
          value={stats.lifetimeCorrectAnswers} 
        />
        <StatCard 
          icon={<Trophy className="w-8 h-8 text-orange-400" />} 
          label="High Score" 
          value={stats.highestScore} 
        />
        
        {/* Play Button / Lives Status */}
        <button 
            className={`relative rounded-2xl p-6 flex flex-col items-center justify-center transition-all shadow-lg overflow-hidden group border-2 ${lives > 0 ? 'bg-gradient-to-br from-ninja-green to-green-700 border-green-400 hover:scale-105 hover:shadow-green-500/30 cursor-pointer' : 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-80'}`} 
            onClick={() => lives > 0 && onStartGame()}
            disabled={lives <= 0}
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            
            {lives > 0 ? (
                <>
                    <Play className="w-12 h-12 text-white mb-2 fill-white drop-shadow-md" />
                    <span className="text-3xl font-ninja text-white uppercase tracking-wider">Start Game</span>
                    {lives < 3 && (
                         <div className="absolute top-2 right-2 flex items-center gap-1 text-xs font-bold bg-black/20 px-2 py-1 rounded">
                            <Clock className="w-3 h-3" />
                            <span>+1 in {timeToNextLife}</span>
                         </div>
                    )}
                </>
            ) : (
                <>
                    <Clock className="w-10 h-10 text-gray-400 mb-2 animate-pulse" />
                    <span className="text-2xl font-ninja text-gray-300 uppercase">Refilling Lives...</span>
                    <span className="text-sm font-bold text-ninja-yellow mt-1">{timeToNextLife} remaining</span>
                </>
            )}
            
            {/* Hearts indicator */}
            <div className="flex gap-1 mt-3">
                {[1, 2, 3].map(i => (
                    <Heart key={i} className={`w-5 h-5 ${i <= lives ? 'fill-white text-white' : 'fill-black/20 text-black/20'}`} />
                ))}
            </div>
        </button>
      </div>

      {/* Content Grid: Charts & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Performance Chart */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
             <History className="w-6 h-6 text-blue-400" />
             <h2 className="text-2xl font-ninja text-white">Performance (Last 7 Days)</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.gamesHistory}>
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {stats.gamesHistory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === stats.gamesHistory.length - 1 ? '#FACC15' : '#4ADE80'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard & Level Up */}
        <div className="flex flex-col gap-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex-1">
            <div className="flex items-center gap-2 mb-6">
               <Trophy className="w-6 h-6 text-ninja-yellow" />
               <h2 className="text-2xl font-ninja text-white">Global Leaderboard</h2>
            </div>
            <div className="space-y-3 mb-4">
              {leaderboardData.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all border group 
                      ${entry.id === 'local-player' 
                          ? 'bg-ninja-yellow/20 border-ninja-yellow scale-[1.02] shadow-[0_0_15px_rgba(250,204,21,0.2)]' 
                          : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/20'
                      }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-ninja text-2xl w-8 text-center ${index === 0 ? 'text-ninja-yellow text-3xl drop-shadow-md' : 'text-gray-500'}`}>
                      #{index + 1}
                    </span>
                    <span className="text-3xl group-hover:scale-110 transition-transform">{entry.avatar}</span>
                    <span className={`font-bold text-lg ${entry.id === 'local-player' ? 'text-ninja-yellow' : 'text-white'}`}>{entry.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                      {/* Rounds Played */}
                      <div className="flex flex-col items-end text-gray-400">
                           <span className={`font-ninja text-lg ${entry.id === 'local-player' ? 'text-white' : 'text-gray-300'}`}>{entry.rounds}</span>
                           <span className="text-[10px] uppercase font-sans tracking-wider">Rounds</span>
                      </div>
                      
                      {/* Score */}
                      <div className="font-ninja text-white text-xl tracking-wider flex flex-col items-end min-w-[80px]">
                        <span>{entry.score.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-sans">Points</span>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Level Up Section */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10 rounded-3xl p-6 shadow-lg flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-ninja-yellow p-3 rounded-xl shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                      <GraduationCap className="w-8 h-8 text-black" />
                  </div>
                  <div>
                      <h3 className="text-white font-bold text-lg">Current Mastery</h3>
                      <p className="text-ninja-yellow font-ninja text-2xl tracking-wide">Grade {currentGrade}</p>
                  </div>
              </div>

              {currentGrade < 12 ? (
                <button 
                  onClick={handleLevelUp}
                  disabled={stats.highestScore < requiredScore}
                  className={`relative z-10 px-6 py-3 rounded-xl font-ninja text-xl tracking-wider transition-all flex items-center gap-2
                    ${stats.highestScore >= requiredScore 
                      ? 'bg-ninja-green text-white hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-70'
                    }`}
                >
                  {stats.highestScore >= requiredScore ? (
                      <>
                        Level Up!
                        <ArrowUp className="w-5 h-5 animate-bounce" />
                      </>
                  ) : (
                      <span className="text-sm">Need {requiredScore.toLocaleString()} Pts</span>
                  )}
                </button>
              ) : (
                 <div className="relative z-10 bg-purple-600/20 border border-purple-500 text-purple-300 px-4 py-2 rounded-lg font-bold text-sm">
                    MAX LEVEL
                 </div>
              )}
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors backdrop-blur-sm">
        <div className="flex justify-between items-start mb-4">
            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">{label}</span>
            {icon}
        </div>
        <span className="text-5xl font-ninja text-white tracking-wide">{value}</span>
    </div>
);

export default Dashboard;
