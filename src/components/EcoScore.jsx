import React from 'react';

const EcoScore = ({ emissions, ecoMode }) => {
  if (!emissions) return null;
  
  const calculateEcoScore = () => {
    const maxEmissions = 500;
    const score = Math.max(0, Math.min(100, 100 - (emissions.total / maxEmissions * 100)));
    return Math.round(score);
  };
  
  const ecoScore = calculateEcoScore();
  
  const getScoreData = (score) => {
    if (score >= 80) return { 
      label: 'Excellent', 
      color: 'eco-primary', 
      message: 'Outstanding! Your trip is highly sustainable.',
      icon: '🌟',
      glow: 'glow-green'
    };
    if (score >= 60) return { 
      label: 'Good', 
      color: 'eco-light', 
      message: 'Great job! Room for minor improvements.',
      icon: '👍',
      glow: 'glow-green'
    };
    if (score >= 40) return { 
      label: 'Fair', 
      color: 'accent-yellow', 
      message: 'Consider eco-friendly alternatives.',
      icon: '⚠️',
      glow: ''
    };
    return { 
      label: 'Needs Improvement', 
      color: 'accent-red', 
      message: 'Significant carbon reduction needed.',
      icon: '⚡',
      glow: 'glow-red'
    };
  };
  
  const scoreData = getScoreData(ecoScore);
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (ecoScore / 100) * circumference;

  return (
    <div className={`glass-card p-8 hover-lift animate-scaleIn ${ecoMode ? scoreData.glow : ''}`}>
      <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center text-glow-white">
        <span className="mr-3 floating">🎯</span>
        Your Eco Score
      </h2>
      
      <div className="flex flex-col items-center">
        {/* Circular Gauge - Apple Style */}
        <div className="relative mb-6">
          <svg width="200" height="200" className="transform -rotate-90 floating">
            {/* Background Circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="16"
              fill="none"
            />
            {/* Progress Circle with Glow */}
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke={scoreData.color === 'eco-primary' ? '#22C55E' : 
                      scoreData.color === 'eco-light' ? '#4ADE80' :
                      scoreData.color === 'accent-yellow' ? '#FACC15' : '#EF4444'}
              strokeWidth="16"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ 
                filter: ecoMode ? 'drop-shadow(0 0 10px currentColor)' : 'none'
              }}
            />
          </svg>
          
          {/* Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-7xl font-bold text-${scoreData.color} ${
              ecoMode ? 'text-glow-green' : ''
            }`}>
              {ecoScore}
            </div>
            <div className="text-sm text-text-muted font-semibold">
              / 100
            </div>
          </div>
        </div>
        
        {/* Score Badge */}
        <div className={`glass-card px-6 py-3 mb-6 ${scoreData.glow}`}>
          <div className="flex items-center space-x-3">
            <span className="text-3xl floating-delayed">{scoreData.icon}</span>
            <span className={`font-bold text-xl text-${scoreData.color}`}>{scoreData.label}</span>
          </div>
        </div>
        
        <p className="text-text-secondary text-center mb-6">{scoreData.message}</p>
        
        {/* Quick Stats */}
        <div className="w-full space-y-3">
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Transport Efficiency</span>
              <span className={`text-sm font-bold text-${ecoMode ? 'eco-primary' : 'accent-blue'}`}>
                {Math.round(100 - (emissions.transport / emissions.total * 100))}%
              </span>
            </div>
            <div className="h-2 glass-card rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  ecoMode ? 'bg-eco-primary glow-green' : 'bg-accent-blue'
                }`}
                style={{ width: `${Math.min(100, 100 - (emissions.transport / emissions.total * 100))}%` }}
              />
            </div>
          </div>
          
          <div className="glass-card p-4 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Accommodation Impact</span>
              <span className="text-sm font-bold text-accent-yellow">
                {Math.round(emissions.accommodation / emissions.total * 100)}%
              </span>
            </div>
            <div className="h-2 glass-card rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-yellow rounded-full transition-all duration-1000"
                style={{ width: `${(emissions.accommodation / emissions.total * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcoScore;
