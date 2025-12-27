import React from 'react';
import { calculateAlternativeScenario } from '../utils/carbonCalculator';
import { lowCarbonAlternatives, sustainabilityTips } from '../data/emissionFactors';

const LowCarbonAlternatives = ({ emissions, tripData, ecoMode }) => {
  if (!emissions || !tripData) return null;
  
  const alternativeScenario = calculateAlternativeScenario(
    tripData.transportData,
    tripData.accommodationData
  );
  
  const getRecommendations = () => {
    const recommendations = [];
    const { transportData, accommodationData } = tripData;
    
    if (lowCarbonAlternatives.transport[transportData.mode]) {
      const alt = lowCarbonAlternatives.transport[transportData.mode];
      recommendations.push({
        type: 'Transport',
        title: alt.message,
        reduction: alt.reduction,
        icon: '🚆',
        color: 'eco-primary',
        savings: (emissions.transport * (alt.reduction / 100)).toFixed(1)
      });
    }
    
    if (lowCarbonAlternatives.accommodation[accommodationData.type]) {
      const alt = lowCarbonAlternatives.accommodation[accommodationData.type];
      recommendations.push({
        type: 'Accommodation',
        title: alt.message,
        reduction: alt.reduction,
        icon: '🌿',
        color: 'eco-light',
        savings: (emissions.accommodation * (alt.reduction / 100)).toFixed(1)
      });
    }
    
    if (emissions.total > 100) {
      recommendations.push({
        type: 'Activities',
        title: 'Choose Walking Tours & Cycling',
        reduction: 30,
        icon: '🚴',
        color: 'accent-blue',
        savings: (emissions.activities * 0.3).toFixed(1)
      });
    }
    
    return recommendations;
  };
  
  const recommendations = getRecommendations();

  return (
    <div className="space-y-6 animate-slideUp delay-400">
      {/* Hero Improvement Banner - Apple Glass Style */}
      <div className={`glass-card p-12 text-center hover-lift ${
        ecoMode ? 'glow-green' : 'glow-blue'
      }`}>
        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 glass-card flex items-center justify-center floating glow-green">
            <span className="text-6xl">🎯</span>
          </div>
        </div>
        <h3 className="text-4xl font-bold text-text-primary mb-4 text-glow-white">
          Next Visit Improvement Score
        </h3>
        <div className={`text-8xl font-bold mb-4 floating ${
          ecoMode ? 'text-eco-primary text-glow-green' : 'text-accent-blue'
        }`}>
          {alternativeScenario.percentage}%
        </div>
        <p className="text-text-secondary text-xl mb-3">
          Potential CO₂ reduction: <strong className="text-eco-primary text-glow-green">
            {alternativeScenario.savings} kg
          </strong>
        </p>
        <p className="text-text-muted">
          By switching to train travel and eco-resort accommodation
        </p>
        
        {/* Animated Progress Ring */}
        <div className="mt-8 flex justify-center">
          <svg width="200" height="200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke={ecoMode ? "#22C55E" : "#38BDF8"}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${2 * Math.PI * 80 * (1 - alternativeScenario.percentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{ 
                filter: ecoMode ? 'drop-shadow(0 0 10px #22C55E)' : 'drop-shadow(0 0 10px #38BDF8)'
              }}
            />
          </svg>
        </div>
      </div>
      
      {/* Recommendations Grid */}
      <div className="glass-card p-8 hover-lift">
        <h2 className="text-3xl font-bold text-text-primary mb-6 flex items-center text-glow-white">
          <span className="mr-3 floating">🌱</span>
          Low-Carbon Alternatives
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {recommendations.map((rec, index) => (
            <div 
              key={index} 
              className={`glass-card p-6 hover-lift group ${
                ecoMode ? 'glow-green' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-16 h-16 glass-card flex items-center justify-center text-4xl floating ${
                  ecoMode ? 'glow-green' : ''
                }`}>
                  {rec.icon}
                </div>
                <div className={`glass-card px-4 py-2 ${ecoMode ? 'glow-green' : ''}`}>
                  <span className={`font-bold text-lg ${
                    ecoMode ? 'text-eco-primary' : 'text-accent-blue'
                  }`}>
                    -{rec.reduction}%
                  </span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-text-primary mb-3">
                {rec.title}
              </h3>
              
              <div className="space-y-3">
                <div className="glass-card p-3 flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Category</span>
                  <span className="text-sm text-text-primary font-semibold">{rec.type}</span>
                </div>
                <div className="glass-card p-3 flex items-center justify-between">
                  <span className="text-sm text-text-secondary">CO₂ Savings</span>
                  <span className={`text-sm font-bold ${
                    ecoMode ? 'text-eco-primary text-glow-green' : 'text-accent-blue'
                  }`}>
                    {rec.savings} kg
                  </span>
                </div>
              </div>
              
              {/* Savings Bar */}
              <div className="mt-4 h-2 glass-card rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    ecoMode ? 'bg-eco-primary glow-green' : 'bg-accent-blue'
                  }`}
                  style={{ width: `${rec.reduction}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Sustainability Tips - Apple Grid */}
        <div className="glass-card p-6">
          <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
            <span className="mr-3 floating">💡</span>
            <span className={ecoMode ? 'text-glow-green' : ''}>Sustainable Tourism Best Practices</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sustainabilityTips.map((tip, index) => (
              <div 
                key={index} 
                className="glass-card p-4 flex items-start space-x-3 hover-lift"
              >
                <span className={`font-bold text-xl flex-shrink-0 ${
                  ecoMode ? 'text-eco-primary' : 'text-accent-blue'
                }`}>
                  ✓
                </span>
                <span className="text-sm text-text-secondary leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LowCarbonAlternatives;
