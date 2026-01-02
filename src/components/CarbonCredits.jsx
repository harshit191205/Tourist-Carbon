import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserTrips } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import {
  calculateUserLevel,
  calculateUserStats,
  getUnlockedAchievements,
  getLockedAchievements,
  calculateTreesEquivalent,
  calculateCarMilesEquivalent
} from '../utils/carbonCreditSystem';

const CarbonCredits = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [userLevel, setUserLevel] = useState(null);
  const [achievements, setAchievements] = useState({ unlocked: [], locked: [] });

  const loadCarbonCredits = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const result = await getUserTrips(currentUser.uid);
      
      if (result.success) {
        const stats = calculateUserStats(result.trips);
        const level = calculateUserLevel(stats.totalCredits);
        const unlocked = getUnlockedAchievements(stats);
        const locked = getLockedAchievements(stats);
        
        setUserStats(stats);
        setUserLevel(level);
        setAchievements({ unlocked, locked });
      }
    } catch (error) {
      console.error('Error loading carbon credits:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadCarbonCredits();
  }, [loadCarbonCredits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">💎</div>
          <p className="text-slate-300 text-xl">Loading your carbon credits...</p>
        </div>
      </div>
    );
  }

  if (!userStats || !userLevel) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="card p-12">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-3xl font-bold text-slate-300 mb-4">
            Start Your Carbon Credit Journey!
          </h2>
          <p className="text-slate-400 mb-6">
            Calculate your first trip to start earning carbon credits and unlock achievements.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-8 py-3"
          >
            Calculate Your First Trip
          </button>
        </div>
      </div>
    );
  }

  const getLevelColor = (color) => {
    const colors = {
      slate: 'from-slate-500 to-slate-700',
      green: 'from-green-500 to-green-700',
      emerald: 'from-emerald-500 to-emerald-700',
      teal: 'from-teal-500 to-teal-700',
      blue: 'from-blue-500 to-blue-700',
      purple: 'from-purple-500 to-purple-700',
      yellow: 'from-yellow-500 to-yellow-700'
    };
    return colors[color] || colors.slate;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold gradient-text mb-4">
          💎 Carbon Credits Dashboard
        </h1>
        <p className="text-xl text-slate-300">
          Your journey to sustainable travel
        </p>
      </div>

      {/* Level Card */}
      <div className={`card p-8 mb-8 bg-gradient-to-r ${getLevelColor(userLevel.color)}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="text-8xl">{userLevel.badge}</div>
            <div>
              <div className="text-sm text-white/80 mb-1">Current Level</div>
              <h2 className="text-4xl font-bold text-white mb-2">
                {userLevel.name}
              </h2>
              <div className="text-2xl font-bold text-white">
                Level {userLevel.level}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {userStats.totalCredits.toLocaleString()}
            </div>
            <div className="text-white/80">Carbon Credits</div>
          </div>
        </div>

        {/* Progress to Next Level */}
        {userLevel.nextLevel && (
          <div className="mt-6">
            <div className="flex justify-between text-white/80 text-sm mb-2">
              <span>Progress to {userLevel.nextLevel.name}</span>
              <span>{userLevel.progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${userLevel.progress}%` }}
              />
            </div>
            <div className="text-white/80 text-sm mt-2">
              {userLevel.creditsToNext.toLocaleString()} credits to next level
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {userStats.totalTrips}
          </div>
          <div className="text-sm text-slate-400">Total Trips</div>
        </div>

        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">💨</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {userStats.totalEmissions.toFixed(0)}
          </div>
          <div className="text-sm text-slate-400">Total CO₂ (kg)</div>
        </div>

        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">💚</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {userStats.totalSavings.toFixed(0)}
          </div>
          <div className="text-sm text-slate-400">CO₂ Saved (kg)</div>
        </div>

        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {userStats.averageEmissions.toFixed(0)}
          </div>
          <div className="text-sm text-slate-400">Avg per Trip (kg)</div>
        </div>
      </div>

      {/* Impact Equivalents */}
      <div className="card p-8 mb-8">
        <h3 className="text-2xl font-bold gradient-text mb-6 text-center">
          🌍 Your Environmental Impact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
            <div className="text-5xl">🌳</div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">
                {calculateTreesEquivalent(userStats.totalSavings)}
              </div>
              <div className="text-sm text-slate-400">
                Trees planted equivalent (1 year absorption)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
            <div className="text-5xl">🚗</div>
            <div>
              <div className="text-3xl font-bold text-blue-400">
                {calculateCarMilesEquivalent(userStats.totalSavings)}
              </div>
              <div className="text-sm text-slate-400">
                Car miles avoided
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold gradient-text mb-6">
          🏆 Achievements
        </h3>

        {/* Unlocked Achievements */}
        {achievements.unlocked.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-slate-300 mb-4">
              Unlocked ({achievements.unlocked.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievements.unlocked.map((achievement) => (
                <div
                  key={achievement.id}
                  className="card p-4 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{achievement.badge}</div>
                    <div>
                      <div className="font-bold text-slate-100">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {achievements.locked.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-slate-300 mb-4">
              Locked ({achievements.locked.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievements.locked.map((achievement) => (
                <div
                  key={achievement.id}
                  className="card p-4 opacity-50 grayscale"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{achievement.badge}</div>
                    <div>
                      <div className="font-bold text-slate-100">
                        {achievement.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transport Stats */}
      <div className="card p-8 mb-8">
        <h3 className="text-2xl font-bold gradient-text mb-6 text-center">
          🚀 Transport Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">✈️</div>
            <div className="text-2xl font-bold text-slate-100">
              {userStats.flightTrips}
            </div>
            <div className="text-sm text-slate-400">Flights</div>
          </div>
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">🚆</div>
            <div className="text-2xl font-bold text-slate-100">
              {userStats.trainTrips}
            </div>
            <div className="text-sm text-slate-400">Trains</div>
          </div>
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">🚌</div>
            <div className="text-2xl font-bold text-slate-100">
              {userStats.busTrips}
            </div>
            <div className="text-sm text-slate-400">Buses</div>
          </div>
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-2xl font-bold text-slate-100">
              {userStats.carTrips}
            </div>
            <div className="text-sm text-slate-400">Cars</div>
          </div>
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">🚴</div>
            <div className="text-2xl font-bold text-slate-100">
              {userStats.bicycleTrips}
            </div>
            <div className="text-sm text-slate-400">Bicycles</div>
          </div>
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">🏡</div>
            <div className="text-2xl font-bold text-slate-100">
              {userStats.ecoAccommodations}
            </div>
            <div className="text-sm text-slate-400">Eco Stays</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="btn-primary flex-1 py-4"
        >
          ➕ Calculate New Trip
        </button>
        <button
          onClick={() => navigate('/history')}
          className="btn-secondary flex-1 py-4"
        >
          📊 View Trip History
        </button>
      </div>
    </div>
  );
};

export default CarbonCredits;
