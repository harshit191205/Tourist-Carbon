import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import carbonCalculator from "../utils/carbonCalculator";

const { calculateEcoScore } = carbonCalculator;

const SimplifiedReportPage = ({ emissions, tripData }) => {
  if (!emissions || !tripData) return null;

  const { origin, destination } = tripData.tripDetails;
  const { distance, mode, vehicleType, passengers } = tripData.transportData;
  const { type, nights, starRating } = tripData.accommodationData;
  const { mealsPerDay, activities, shoppingIntensity } = tripData.activityData;
  
  const ecoScore = calculateEcoScore(parseFloat(emissions.total), emissions.days);

  // Pie chart data for user emissions
  const userEmissionsData = [
    { name: 'Transport', value: parseFloat(emissions.transport), color: '#ef4444' },
    { name: 'Accommodation', value: parseFloat(emissions.accommodation), color: '#f59e0b' },
    { name: 'Food & Activities', value: parseFloat(emissions.activities), color: '#3b82f6' }
  ];

  // Global average data (per person per day in kg CO2e)
  // Source: Global Carbon Project averages
  const globalAveragePerDay = 30; // Global average ~11 tons/year ≈ 30 kg/day
  const globalBreakdown = [
    { name: 'Transport', value: 6, color: '#ef4444' }, // 20%
    { name: 'Housing & Energy', value: 9, color: '#f59e0b' }, // 30%
    { name: 'Food', value: 6, color: '#3b82f6' }, // 20%
    { name: 'Goods & Services', value: 9, color: '#8b5cf6' } // 30%
  ];

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Generate dynamic recommendations
  const getRecommendations = () => {
    const recommendations = [];
    const transportEmissions = parseFloat(emissions.transport);
    
    if (mode === 'flight') {
      if (distance < 500) {
        recommendations.push({
          icon: '🚆',
          title: 'Take Train Instead of Flight',
          description: `For distances under 500 km, trains emit 80-90% less CO₂. You could save approximately ${(transportEmissions * 0.85).toFixed(0)} kg CO₂e by choosing rail travel!`,
          priority: 'high',
          color: 'red'
        });
      }
      recommendations.push({
        icon: '✈️',
        title: 'Choose Direct Flights',
        description: 'Takeoffs and landings produce the most emissions. Direct flights can reduce CO₂ by 20-30% compared to connecting flights.',
        priority: 'medium',
        color: 'red'
      });
    }

    if (mode === 'car') {
      if (vehicleType === 'petrol' || vehicleType === 'diesel') {
        recommendations.push({
          icon: '⚡',
          title: 'Consider Electric or Hybrid Vehicles',
          description: `Switching to electric/hybrid could reduce emissions by 60-80%. Potential savings: ${(transportEmissions * 0.7).toFixed(0)} kg CO₂e.`,
          priority: 'high',
          color: 'red'
        });
      }
      if (passengers === 1) {
        recommendations.push({
          icon: '👥',
          title: 'Carpool with Others',
          description: 'Sharing rides splits emissions per person. With 3 passengers, you could reduce your personal footprint by 67%!',
          priority: 'medium',
          color: 'red'
        });
      }
    }

    if (type === 'hotel' && starRating >= 4) {
      recommendations.push({
        icon: '🌿',
        title: 'Choose Eco-Certified Hotels',
        description: `Luxury hotels use more energy. Eco-certified 3-star hotels could save ${(parseFloat(emissions.accommodation) * 0.4).toFixed(0)} kg CO₂e through renewable energy and efficient systems.`,
        priority: 'high',
        color: 'amber'
      });
    }

    recommendations.push({
      icon: '💧',
      title: 'Reuse Towels & Linens',
      description: 'Skipping daily laundry service can reduce hotel energy use by up to 17%. Request towel reuse during your stay.',
      priority: 'medium',
      color: 'amber'
    });

    recommendations.push({
      icon: '🌱',
      title: 'Choose Plant-Based Meals',
      description: `Plant-based meals emit 62% less CO₂. Try one extra veggie meal per day to make a significant impact.`,
      priority: 'medium',
      color: 'blue'
    });

    recommendations.push({
      icon: '🚰',
      title: 'Use Refillable Water Bottles',
      description: 'Skip single-use plastic bottles. Bring a reusable bottle and refill with filtered or tap water.',
      priority: 'medium',
      color: 'purple'
    });

    if (activities && activities.includes('sightseeing')) {
      recommendations.push({
        icon: '🚴',
        title: 'Bike or Walk for Sightseeing',
        description: 'Rent bikes or join walking tours instead of bus tours. Great for the environment and your health!',
        priority: 'medium',
        color: 'indigo'
      });
    }

    recommendations.push({
      icon: '♻️',
      title: 'Reduce, Reuse, Recycle',
      description: 'Separate your waste, avoid single-use plastics, and carry reusable utensils and bags throughout your trip.',
      priority: 'low',
      color: 'teal'
    });

    recommendations.push({
      icon: '💚',
      title: 'Offset Your Remaining Emissions',
      description: `Invest ₹${emissions.offsetCostINR} (${emissions.offsetCostUSD}) in verified carbon offset programs like tree planting or renewable energy projects to neutralize your ${emissions.total} kg CO₂e impact.`,
      priority: 'high',
      color: 'emerald'
    });

    return recommendations;
  };

  const recommendations = getRecommendations();
  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');
  const lowPriority = recommendations.filter(r => r.priority === 'low');

  const colorMap = {
    red: { bg: 'bg-red-500/5', border: 'border-red-500' },
    amber: { bg: 'bg-amber-500/5', border: 'border-amber-500' },
    blue: { bg: 'bg-blue-500/5', border: 'border-blue-500' },
    emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500' },
    purple: { bg: 'bg-purple-500/5', border: 'border-purple-500' },
    indigo: { bg: 'bg-indigo-500/5', border: 'border-indigo-500' },
    teal: { bg: 'bg-teal-500/5', border: 'border-teal-500' }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="card p-8 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            {origin} → {destination}
          </h1>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-300 mb-6">
            <span>📍 {distance} km</span>
            <span>•</span>
            <span>🗓️ {nights} nights</span>
            <span>•</span>
            <span>✈️ {mode}</span>
          </div>
          
          <div className="bg-slate-800/50 rounded-2xl p-8 inline-block">
            <div className="text-7xl font-bold gradient-text mb-2">
              {emissions.total}
            </div>
            <div className="text-2xl text-slate-400 mb-4">kg CO₂e</div>
            <div className={`inline-block px-6 py-3 rounded-full font-bold text-lg ${
              parseFloat(emissions.perDay) <= 30
                ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500' 
                : parseFloat(emissions.perDay) <= 50
                ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500'
                : 'bg-red-500/20 text-red-400 border-2 border-red-500'
            }`}>
              {emissions.category}
            </div>
          </div>
        </div>
      </div>

      {/* Emission Breakdown with Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Trip Emissions */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
            🔍 Your Trip Emissions
          </h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userEmissionsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userEmissionsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value) => `${value} kg CO₂e`}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ color: '#cbd5e1' }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
              <span className="text-slate-300">🚗 Transport</span>
              <span className="font-bold text-red-400">{emissions.transport} kg</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-500/10 rounded-lg">
              <span className="text-slate-300">🏨 Accommodation</span>
              <span className="font-bold text-amber-400">{emissions.accommodation} kg</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
              <span className="text-slate-300">🍽️ Food & Activities</span>
              <span className="font-bold text-blue-400">{emissions.activities} kg</span>
            </div>
          </div>
        </div>

        {/* Global Average Comparison */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
            🌍 Global Average (Per Day)
          </h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={globalBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {globalBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value) => `${value} kg CO₂e`}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ color: '#cbd5e1' }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">Global Daily Average</div>
              <div className="text-3xl font-bold text-slate-200">{globalAveragePerDay} kg CO₂e</div>
              <div className="mt-3 text-xs text-slate-400">
                Your trip average: <span className={`font-bold ${parseFloat(emissions.perDay) > globalAveragePerDay ? 'text-red-400' : 'text-emerald-400'}`}>{emissions.perDay} kg/day</span>
              </div>
              {parseFloat(emissions.perDay) > globalAveragePerDay ? (
                <div className="mt-2 text-xs text-red-400">
                  ⚠️ {((parseFloat(emissions.perDay) / globalAveragePerDay - 1) * 100).toFixed(0)}% above global average
                </div>
              ) : (
                <div className="mt-2 text-xs text-emerald-400">
                  ✅ {((1 - parseFloat(emissions.perDay) / globalAveragePerDay) * 100).toFixed(0)}% below global average!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-emerald-400">{emissions.perDay}</div>
          <div className="text-sm text-slate-400 mt-1">kg CO₂e per day</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-blue-400">{emissions.perNight}</div>
          <div className="text-sm text-slate-400 mt-1">kg CO₂e per night</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-bold text-purple-400">{ecoScore}</div>
          <div className="text-sm text-slate-400 mt-1">Eco Score (out of 100)</div>
        </div>
        <div className="card p-5 text-center hover:scale-105 transition-transform cursor-pointer group">
          <div className="text-3xl font-bold text-amber-400">₹{emissions.offsetCostINR}</div>
          <div className="text-sm text-slate-400 mt-1">Carbon Offset Cost</div>
          <div className="text-xs text-slate-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            ≈ {emissions.offsetCostUSD}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card p-8">
        <h2 className="text-3xl font-bold gradient-text mb-6 text-center">
          💡 How to Reduce Your Impact
        </h2>
        
        {/* High Priority */}
        {highPriority.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <span>🔴</span> High Impact Actions
            </h3>
            <div className="space-y-4">
              {highPriority.map((rec, index) => (
                <div key={index} className={`card p-5 ${colorMap[rec.color].bg} border-l-4 ${colorMap[rec.color].border}`}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0">{rec.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-100 mb-2">{rec.title}</h4>
                      <p className="text-sm text-slate-300">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medium Priority */}
        {mediumPriority.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <span>🟡</span> Moderate Impact Actions
            </h3>
            <div className="space-y-4">
              {mediumPriority.map((rec, index) => (
                <div key={index} className={`card p-5 ${colorMap[rec.color].bg} border-l-4 ${colorMap[rec.color].border}`}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0">{rec.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-100 mb-2">{rec.title}</h4>
                      <p className="text-sm text-slate-300">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Priority */}
        {lowPriority.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <span>🔵</span> Easy Wins
            </h3>
            <div className="space-y-4">
              {lowPriority.map((rec, index) => (
                <div key={index} className={`card p-5 ${colorMap[rec.color].bg} border-l-4 ${colorMap[rec.color].border}`}>
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0">{rec.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-100 mb-2">{rec.title}</h4>
                      <p className="text-sm text-slate-300">{rec.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pb-8">
        <button
          onClick={() => window.location.href = '/'}
          className="btn-secondary px-8 py-4 text-lg hover:scale-105 transition-transform"
        >
          ← Calculate Another Trip
        </button>
        
        <button
          onClick={() => window.print()}
          className="btn-primary px-8 py-4 text-lg hover:scale-105 transition-transform"
        >
          🖨️ Print Report
        </button>

        <button
          onClick={() => {
            const text = `My trip from ${origin} to ${destination} generated ${emissions.total} kg CO₂e. Check out your carbon footprint at [Your Website URL]`;
            navigator.clipboard.writeText(text);
            alert('Report summary copied to clipboard!');
          }}
          className="btn-primary px-8 py-4 text-lg hover:scale-105 transition-transform bg-gradient-to-r from-blue-500 to-purple-500"
        >
          📋 Share Report
        </button>
      </div>
    </div>
  );
};

export default SimplifiedReportPage;
