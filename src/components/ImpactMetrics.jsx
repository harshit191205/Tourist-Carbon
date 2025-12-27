import React from 'react';

const ImpactMetrics = ({ emissions, ecoMode }) => {
  if (!emissions) return null;
  
  const getScoreColor = (category) => {
    if (category === 'Low') return { color: 'eco-primary', glow: 'glow-green' };
    if (category === 'Medium') return { color: 'accent-yellow', glow: '' };
    return { color: 'accent-red', glow: 'glow-red' };
  };
  
  const scoreColors = getScoreColor(emissions.category);
  
  const metrics = [
    {
      icon: '🌍',
      label: 'Total CO₂ Emissions',
      value: emissions.total,
      unit: 'kg',
      subtext: `${emissions.days} day trip`,
      color: 'accent-red',
      glow: emissions.total > 300 ? 'glow-red' : '',
      trend: emissions.comparisonPercentage > 0 ? '↑' : '↓',
      trendValue: `${Math.abs(emissions.comparisonPercentage)}%`
    },
    {
      icon: emissions.category === 'Low' ? '🟢' : emissions.category === 'Medium' ? '🟡' : '🔴',
      label: 'Carbon Category',
      value: emissions.category,
      unit: '',
      subtext: 'Impact Level',
      color: scoreColors.color,
      glow: scoreColors.glow
    },
    {
      icon: '📊',
      label: 'Daily Average',
      value: emissions.perDay,
      unit: 'kg/day',
      subtext: 'Per day footprint',
      color: 'accent-blue',
      glow: 'glow-blue'
    },
    {
      icon: '🌳',
      label: 'Trees to Offset',
      value: emissions.treesNeeded,
      unit: 'trees',
      subtext: 'Annual offset required',
      color: 'eco-primary',
      glow: ecoMode ? 'glow-green' : ''
    }
  ];

  return (
    <div className="space-y-6 animate-slideUp">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className={`glass-card p-6 hover-lift group animate-scaleIn ${metric.glow}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Icon & Trend */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-16 h-16 glass-card flex items-center justify-center text-4xl floating ${metric.glow}`}>
                {metric.icon}
              </div>
              {metric.trend && (
                <div className={`glass-card px-3 py-1 text-xs font-bold ${
                  emissions.comparisonPercentage < 0 
                    ? 'text-eco-primary' 
                    : 'text-accent-red'
                }`}>
                  {metric.trend} {metric.trendValue}
                </div>
              )}
            </div>
            
            {/* Value */}
            <div className="mb-3">
              <div className={`text-5xl font-bold text-${metric.color} mb-2 text-glow-white`}>
                {metric.value}
                {metric.unit && <span className="text-2xl ml-1 text-text-muted">{metric.unit}</span>}
              </div>
              <div className="text-sm font-semibold text-text-secondary">
                {metric.label}
              </div>
            </div>
            
            {/* Subtext */}
            <div className="text-xs text-text-muted pt-3 border-t border-dark-border frosted-border">
              {metric.subtext}
            </div>
          </div>
        ))}
      </div>
      
      {/* Comparison Banner - Apple Glass Style */}
      <div className={`glass-card p-8 hover-lift ${ecoMode ? 'glow-green' : 'glow-blue'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className={`w-20 h-20 glass-card flex items-center justify-center floating ${
              ecoMode ? 'glow-green' : 'glow-blue'
            }`}>
              <span className="text-5xl">📈</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text-primary mb-2 text-glow-white">
                Global Average Comparison
              </h3>
              <p className="text-text-secondary">
                Your daily: <span className={`text-${ecoMode ? 'eco-primary' : 'accent-blue'} font-bold text-glow-green`}>
                  {emissions.perDay} kg
                </span> vs Global avg: <span className="text-text-primary font-semibold">45 kg</span>
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-7xl font-bold ${
              emissions.comparisonPercentage < 0 ? 'text-eco-primary text-glow-green' : 'text-accent-red'
            } floating`}>
              {emissions.comparisonPercentage > 0 ? '+' : ''}{emissions.comparisonPercentage}%
            </div>
            <div className="text-sm text-text-muted mt-2">vs global tourist</div>
          </div>
        </div>
        
        {/* Frosted Progress Bar */}
        <div className="mt-6 h-4 glass-card rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              emissions.comparisonPercentage < 0 
                ? 'bg-gradient-to-r from-eco-primary to-eco-light glow-green' 
                : 'bg-gradient-to-r from-accent-yellow to-accent-red'
            }`}
            style={{ width: `${Math.min(100, Math.abs(emissions.comparisonPercentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImpactMetrics;
