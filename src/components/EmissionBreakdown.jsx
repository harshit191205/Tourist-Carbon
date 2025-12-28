import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const EnhancedEmissionBreakdown = ({ emissions, tripData }) => {
  const [activeView, setActiveView] = useState('overview');

  if (!emissions) return null;

  const componentData = [
    {
      name: 'Transport',
      value: parseFloat(emissions.transport),
      color: '#EF4444',
      gradient: 'from-red-500 to-red-600',
      icon: '✈️',
      percentage: emissions.transportPercentage,
      perDay: (parseFloat(emissions.transport) / emissions.days).toFixed(1),
      methodology: emissions.transportMethodology,
      details: emissions.transportDetails
    },
    {
      name: 'Accommodation',
      value: parseFloat(emissions.accommodation),
      color: '#F59E0B',
      gradient: 'from-amber-500 to-amber-600',
      icon: '🏨',
      percentage: emissions.accommodationPercentage,
      perDay: (parseFloat(emissions.accommodation) / emissions.days).toFixed(1),
      methodology: emissions.accommodationMethodology,
      details: emissions.accommodationDetails
    },
    {
      name: 'Activities & Food',
      value: parseFloat(emissions.activities),
      color: '#3B82F6',
      gradient: 'from-blue-500 to-blue-600',
      icon: '🎯',
      percentage: emissions.activitiesPercentage,
      perDay: (parseFloat(emissions.activities) / emissions.days).toFixed(1),
      methodology: 'Activity & Diet-based',
      details: emissions.activityDetails
    }
  ].filter(comp => comp.value > 0);

  const total = parseFloat(emissions.total);

  const VisualBreakdownBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-slate-100">
          🔍 Visual Impact Breakdown
        </h3>
        <div className="text-right">
          <div className="text-4xl font-bold gradient-text">{total.toFixed(0)} kg</div>
          <div className="text-sm text-slate-400">Total CO₂e</div>
        </div>
      </div>
      
      <div className="relative mb-6">
        <div className="flex h-24 rounded-2xl overflow-hidden shadow-2xl bg-slate-800/50">
          {componentData.map((comp, i) => (
            <div
              key={i}
              className={`group relative bg-gradient-to-br ${comp.gradient} flex items-center justify-center transition-all duration-500 hover:scale-105 hover:z-10 cursor-pointer`}
              style={{ 
                width: `${(comp.value / total) * 100}%`,
                animation: `slideInWidth 0.8s ease-out ${i * 0.2}s both`
              }}
            >
              <span className="text-4xl group-hover:scale-150 transition-transform duration-300 drop-shadow-lg">
                {comp.icon}
              </span>
              
              <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none">
                <div className="bg-slate-900 rounded-xl p-5 shadow-2xl border border-slate-700 min-w-[300px]">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{comp.icon}</span>
                    <div>
                      <div className="font-bold text-lg text-slate-100">{comp.name}</div>
                      <div className="text-xs text-slate-400">{comp.methodology}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Emissions:</span>
                      <span className="font-bold text-slate-100">{comp.value.toFixed(1)} kg CO₂e</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Per Day Average:</span>
                      <span className="font-semibold text-emerald-400">{comp.perDay} kg/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">% of Total Trip:</span>
                      <span className="font-bold text-amber-400">{comp.percentage}%</span>
                    </div>
                  </div>
                  
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex mt-3">
          {componentData.map((comp, i) => (
            <div
              key={i}
              className="text-center text-xs font-semibold text-slate-300"
              style={{ width: `${(comp.value / total) * 100}%` }}
            >
              {comp.percentage > 8 && `${comp.percentage}%`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const DetailedCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {componentData.map((comp, index) => (
        <div
          key={index}
          className="card hover:scale-105 transition-all duration-300 border-l-4 overflow-hidden relative group"
          style={{ borderLeftColor: comp.color }}
        >
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${comp.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
          ></div>
          
          <div className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-4xl">{comp.icon}</span>
                  <h4 className="text-lg font-bold text-slate-100">{comp.name}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{comp.methodology}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div 
                className="text-5xl font-bold mb-1"
                style={{ color: comp.color }}
              >
                {comp.value.toFixed(1)}
              </div>
              <div className="text-sm text-slate-400">kg CO₂e</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Per Day</div>
                <div className="text-xl font-bold text-emerald-400">{comp.perDay}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">% Share</div>
                <div className="text-xl font-bold" style={{ color: comp.color }}>
                  {comp.percentage}%
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${comp.gradient} transition-all duration-1000 ease-out`}
                  style={{ 
                    width: `${comp.percentage}%`,
                    animation: 'expandWidth 1s ease-out'
                  }}
                ></div>
              </div>
            </div>
            
            {comp.details && Object.keys(comp.details).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="text-xs text-slate-400 space-y-1">
                  {Object.entries(comp.details).slice(0, 2).map(([key, value], i) => (
                    <div key={i} className="flex justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-semibold text-slate-300">{String(value).substring(0, 30)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const ComparisonView = () => {
    const perDayEmission = parseFloat(emissions.perDay);
    
    const benchmarks = [
      { name: 'Your Trip', value: perDayEmission, color: '#EF4444', icon: '✈️' },
      { name: 'Global Avg Tourist', value: 45.2, color: '#F59E0B', icon: '🌍' },
      { name: 'Sustainable Target', value: 28.5, color: '#22C55E', icon: '🎯' },
      { name: 'Low Carbon Goal', value: 15.0, color: '#10B981', icon: '🌱' }
    ];

    const maxValue = Math.max(...benchmarks.map(b => b.value));

    return (
      <div className="card p-6 mb-8">
        <h3 className="text-2xl font-bold mb-6 gradient-text flex items-center gap-2">
          <span>📊</span> How Do You Compare?
        </h3>
        
        <div className="space-y-4">
          {benchmarks.map((benchmark, i) => {
            const isYourTrip = benchmark.name === 'Your Trip';
            const widthPercent = (benchmark.value / maxValue) * 100;
            
            return (
              <div key={i} className={isYourTrip ? 'p-4 bg-slate-800/50 rounded-xl' : ''}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{benchmark.icon}</span>
                    <span className={`text-sm font-semibold ${isYourTrip ? 'text-slate-100' : 'text-slate-300'}`}>
                      {benchmark.name}
                    </span>
                  </div>
                  <span 
                    className="text-lg font-bold"
                    style={{ color: benchmark.color }}
                  >
                    {benchmark.value.toFixed(1)} kg/day
                  </span>
                </div>
                <div className="relative h-8 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 flex items-center"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: benchmark.color,
                      animation: 'expandWidth 1s ease-out'
                    }}
                  >
                    {widthPercent > 15 && (
                      <div className="ml-auto pr-3 text-white text-xs font-bold">
                        {benchmark.value.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className={`mt-6 p-5 rounded-xl border-2 ${
          perDayEmission <= 28.5 
            ? 'bg-emerald-500/10 border-emerald-500' 
            : perDayEmission <= 45.2
            ? 'bg-amber-500/10 border-amber-500'
            : 'bg-red-500/10 border-red-500'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl">
              {perDayEmission <= 28.5 ? '🌟' : perDayEmission <= 45.2 ? '⚠️' : '🔴'}
            </span>
            <div className="flex-1">
              <div className="font-bold text-lg mb-1 text-slate-100">
                {perDayEmission <= 15 
                  ? 'Outstanding! Low Carbon Champion' 
                  : perDayEmission <= 28.5 
                  ? 'Excellent! Sustainable Traveler' 
                  : perDayEmission <= 45.2
                  ? 'Average Impact - Room for Improvement'
                  : 'High Impact - Action Needed'}
              </div>
              <div className="text-sm text-slate-300">
                {perDayEmission <= 28.5
                  ? `You're ${((28.5 - perDayEmission) / 28.5 * 100).toFixed(0)}% below the sustainable target! Keep up the excellent work.`
                  : `You're ${((perDayEmission - 28.5) / 28.5 * 100).toFixed(0)}% above the sustainable target. Check personalized recommendations to reduce your impact.`}
              </div>
              
              <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                <div className="text-xs font-semibold text-emerald-400 mb-1">💡 Quick Win:</div>
                <div className="text-xs text-slate-300">
                  {emissions.transportPercentage > 60
                    ? 'Your transport is the biggest impact. Consider train or bus for shorter distances.'
                    : emissions.accommodationPercentage > 40
                    ? 'Try eco-certified hotels or shared accommodations to reduce emissions.'
                    : 'Great balance! Small changes in diet and activities can further reduce impact.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DailyTrendView = () => {
    const dailyData = [];
    const perDayValue = parseFloat(emissions.perDay);
    
    for (let i = 1; i <= Math.min(emissions.days, 15); i++) {
      dailyData.push({
        day: `Day ${i}`,
        emissions: perDayValue,
        cumulative: (perDayValue * i).toFixed(1)
      });
    }

    return (
      <div className="card p-6 mb-8">
        <h3 className="text-2xl font-bold mb-6 gradient-text">
          📈 Daily Emission Trend
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis 
              dataKey="day" 
              stroke="rgba(255, 255, 255, 0.5)"
              tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
            />
            <YAxis 
              stroke="rgba(255, 255, 255, 0.5)"
              tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft', fill: 'rgba(255, 255, 255, 0.7)' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Bar dataKey="emissions" fill="#3B82F6" name="Daily Emissions" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="card p-4 bg-slate-800/50">
            <div className="text-xs text-slate-400 mb-1">Per Day</div>
            <div className="text-2xl font-bold text-emerald-400">{emissions.perDay} kg</div>
          </div>
          <div className="card p-4 bg-slate-800/50">
            <div className="text-xs text-slate-400 mb-1">Total Days</div>
            <div className="text-2xl font-bold text-blue-400">{emissions.days}</div>
          </div>
          <div className="card p-4 bg-slate-800/50">
            <div className="text-xs text-slate-400 mb-1">Per Night Stay</div>
            <div className="text-2xl font-bold text-amber-400">{emissions.perNight} kg</div>
          </div>
          <div className="card p-4 bg-slate-800/50">
            <div className="text-xs text-slate-400 mb-1">Per KM Travel</div>
            <div className="text-2xl font-bold text-purple-400">{parseFloat(emissions.perKm).toFixed(3)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`
        @keyframes slideInWidth {
          from {
            width: 0%;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes expandWidth {
          from {
            width: 0%;
          }
        }
      `}</style>

      <div className="card p-2 flex gap-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'comparison', label: 'Comparison', icon: '⚖️' },
          { id: 'trend', label: 'Daily Trend', icon: '📈' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-shrink-0 py-3 px-6 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeView === tab.id
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg scale-105'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeView === 'overview' && (
        <>
          <VisualBreakdownBar />
          <DetailedCards />
        </>
      )}
      
      {activeView === 'comparison' && <ComparisonView />}
      {activeView === 'trend' && <DailyTrendView />}
    </div>
  );
};

export default EnhancedEmissionBreakdown;
