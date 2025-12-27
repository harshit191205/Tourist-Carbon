import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const EmissionBreakdown = ({ emissions, ecoMode }) => {
  if (!emissions) return null;
  
  const pieData = [
    { name: 'Transport', value: parseFloat(emissions.transport), color: '#EF4444' },
    { name: 'Accommodation', value: parseFloat(emissions.accommodation), color: '#FACC15' },
    { name: 'Activities', value: parseFloat(emissions.activities), color: '#38BDF8' }
  ];
  
  const dailyData = [];
  const dailyEmission = parseFloat(emissions.perDay);
  const totalDays = parseInt(emissions.days);
  
  for (let i = 1; i <= totalDays; i++) {
    dailyData.push({
      day: i,
      emissions: dailyEmission.toFixed(2),
      cumulative: (dailyEmission * i).toFixed(2)
    });
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 glow-green">
          <p className="text-text-primary font-semibold">{payload[0].name}</p>
          <p className={`font-bold ${ecoMode ? 'text-eco-primary' : 'text-accent-blue'}`}>
            {payload[0].value} kg CO₂
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-slideUp delay-200">
      <div className="glass-card p-8 hover-lift">
        <h2 className="text-3xl font-bold text-text-primary mb-6 text-glow-white">
          📊 Emission Breakdown & Analysis
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donut Chart */}
          <div className="glass-card p-6 hover-lift">
            <h3 className="text-lg font-semibold text-text-secondary mb-4 text-center">
              Distribution by Category
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={false}
                  filter={ecoMode ? "url(#glow)" : ""}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="glass-card p-3 hover-lift flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ 
                        backgroundColor: item.color,
                        boxShadow: ecoMode ? `0 0 10px ${item.color}` : 'none'
                      }} 
                    />
                    <span className="text-sm text-text-secondary">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{item.value} kg</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Area Chart */}
          <div className="glass-card p-6 hover-lift">
            <h3 className="text-lg font-semibold text-text-secondary mb-4 text-center">
              Cumulative Emissions Over {totalDays} Days
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorEmission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ecoMode ? "#22C55E" : "#38BDF8"} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={ecoMode ? "#22C55E" : "#38BDF8"} stopOpacity={0}/>
                  </linearGradient>
                  <filter id="areaGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255, 255, 255, 0.5)"
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                />
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.5)"
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke={ecoMode ? "#22C55E" : "#38BDF8"} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEmission)"
                  filter={ecoMode ? "url(#areaGlow)" : ""}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {pieData.map((item, index) => (
            <div 
              key={index}
              className="glass-card p-6 hover-lift border-l-4"
              style={{ 
                borderLeftColor: item.color,
                boxShadow: ecoMode ? `0 0 20px ${item.color}40` : ''
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-secondary">{item.name}</span>
                <span className="text-4xl floating">
                  {item.name === 'Transport' ? '🚗' : item.name === 'Accommodation' ? '🏨' : '🎯'}
                </span>
              </div>
              <div className="text-4xl font-bold mb-2 text-glow-white" style={{ color: item.color }}>
                {item.value} kg
              </div>
              <div className="text-xs text-text-muted">
                {((item.value / emissions.total) * 100).toFixed(1)}% of total emissions
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmissionBreakdown;
