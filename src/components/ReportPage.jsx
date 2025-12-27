import React from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { calculateAlternativeScenario, calculateEcoScore, getRecommendations } from "../utils/carbonCalculator";

const ReportPage = ({ emissions, tripData }) => {
  const navigate = useNavigate();

  if (!emissions || !tripData || !tripData.tripDetails) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2">No Report Available</h2>
        <p className="text-slate-400 mb-6">
          Please calculate a trip first to see your carbon footprint report.
        </p>
        <button onClick={() => navigate("/")} className="btn-primary">
          Go to Calculator
        </button>
      </div>
    );
  }

  const { origin, destination, purpose } = tripData.tripDetails;
  const { distance, mode } = tripData.transportData;
  const nights = tripData.accommodationData?.nights ?? 0;
  
  const alternativeScenario = calculateAlternativeScenario(
    tripData.transportData,
    tripData.accommodationData
  );
  const ecoScore = calculateEcoScore(parseFloat(emissions.total), emissions.days);
  const recommendations = getRecommendations(emissions, tripData);

  // Chart data
  const pieData = [
    { 
      name: 'Transport', 
      value: parseFloat(emissions.transport), 
      color: '#ef4444',
      percentage: emissions.transportPercentage 
    },
    { 
      name: 'Accommodation', 
      value: parseFloat(emissions.accommodation), 
      color: '#f59e0b',
      percentage: emissions.accommodationPercentage 
    },
    { 
      name: 'Activities', 
      value: parseFloat(emissions.activities), 
      color: '#3b82f6',
      percentage: emissions.activitiesPercentage 
    }
  ].filter(item => item.value > 0);

  const comparisonData = [
    { name: 'Your Trip', value: parseFloat(emissions.perDay), fill: emissions.isSustainable ? '#10b981' : '#f59e0b' },
    { name: 'Sustainable Target', value: 28.5, fill: '#10b981' },
    { name: 'Global Average', value: 45.2, fill: '#64748b' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card p-3 shadow-xl">
          <p className="text-sm font-semibold text-slate-200 mb-1">{payload[0].name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-slate-300">
              <span style={{ color: entry.color }}>●</span> {entry.name}: <strong>{entry.value}</strong> kg CO₂
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry) => {
    return `${entry.name} ${entry.percentage}%`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-5xl">{emissions.categoryIcon}</span>
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-1">
                  Carbon Footprint Analysis
                </h1>
                <p className="text-sm text-slate-400">{emissions.categoryMessage}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-slate-300">
                <span>📍</span> {origin} → {destination}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{distance} km via {mode}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{nights} nights</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 capitalize">{purpose}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className={`badge ${
              emissions.categoryColor === 'emerald' || emissions.categoryColor === 'green' ? 'badge-success' :
              emissions.categoryColor === 'amber' ? 'badge-warning' : 'badge-danger'
            }`}>
              {emissions.categoryBadge}
            </span>
            <span className="text-xs text-slate-400 text-center">{emissions.percentile}</span>
            <button onClick={() => navigate("/")} className="btn-secondary text-xs">
              New Trip
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`stat-card ${emissions.isSustainable ? 'glow-emerald' : ''}`}>
          <div className="text-5xl mb-2">🌍</div>
          <div className="stat-value text-4xl">{emissions.total}</div>
          <div className="stat-label">Total kg CO₂e</div>
          <div className="text-xs text-slate-500 mt-1">
            {emissions.equivalents.percentAnnual}% of annual footprint
          </div>
        </div>
        
        <div className="stat-card">
          <div className="text-5xl mb-2">📅</div>
          <div className="stat-value text-4xl">{emissions.perDay}</div>
          <div className="stat-label">Per Day (kg CO₂e)</div>
          <div className={`text-xs mt-1 font-semibold ${
            emissions.isSustainable ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {emissions.isSustainable ? '✓ Sustainable' : 'Above target'}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="text-5xl mb-2">🌳</div>
          <div className="stat-value text-4xl">{emissions.treesNeeded}</div>
          <div className="stat-label">Trees to Offset</div>
          <div className="text-xs text-slate-500 mt-1">
            EPA: 39 kg CO₂/tree/year
          </div>
        </div>
        
        <div className="stat-card">
          <div className="text-5xl mb-2">🎯</div>
          <div className="stat-value text-4xl">{ecoScore}</div>
          <div className="stat-label">Eco Score</div>
          <div className={`text-xs mt-1 font-semibold ${
            ecoScore >= 70 ? 'text-emerald-400' : ecoScore >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {ecoScore >= 70 ? 'Excellent' : ecoScore >= 50 ? 'Good' : 'Needs Work'}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emission Breakdown */}
        <div className="card p-6">
          <h3 className="section-label">📊 Emission Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Distribution across trip components</p>
          
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                label={renderLabel}
                labelLine={true}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-sm font-semibold text-slate-300">{item.name}</span>
                    <div className="text-xs text-slate-500">
                      {item.name === 'Transport' && `${emissions.perKm} kg/km`}
                      {item.name === 'Accommodation' && `${emissions.perNight} kg/night`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-200">{item.value.toFixed(1)} kg</div>
                  <div className="text-xs text-slate-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="card p-6">
          <h3 className="section-label">📈 Benchmark Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Daily emissions vs. targets and averages</p>
          
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparisonData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" label={{ value: 'kg CO₂e per day', position: 'bottom', fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{parseFloat(emissions.comparisonPercentage) < 0 ? '✅' : '⚠️'}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200 mb-1">
                  {parseFloat(emissions.comparisonPercentage) < 0 ? 'Below' : 'Above'} Global Average
                </p>
                <p className="text-xs text-slate-400">
                  Your daily emissions are{' '}
                  <span className={`font-bold ${parseFloat(emissions.comparisonPercentage) < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {Math.abs(parseFloat(emissions.comparisonPercentage))}%
                  </span>{' '}
                  {parseFloat(emissions.comparisonPercentage) < 0 ? 'lower than' : 'higher than'} the global tourist average of 45.2 kg/day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Scenario */}
      <div className={`card p-8 ${alternativeScenario.feasible ? 'glow-emerald' : ''}`}>
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="text-7xl">💡</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2 gradient-text">
              Eco-Friendly Alternative Analysis
            </h3>
            <p className="text-slate-300 mb-4">
              {alternativeScenario.explanation}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="stat-card bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-4xl mb-2">↓</div>
                <div className="stat-value text-3xl text-emerald-400">
                  -{alternativeScenario.savings} kg
                </div>
                <div className="stat-label">Potential Reduction</div>
              </div>
              
              <div className="stat-card bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-4xl mb-2">📊</div>
                <div className="stat-value text-3xl text-emerald-400">
                  -{alternativeScenario.percentage}%
                </div>
                <div className="stat-label">Percentage Saved</div>
              </div>
              
              <div className="stat-card bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-4xl mb-2">🌳</div>
                <div className="stat-value text-3xl text-emerald-400">
                  -{alternativeScenario.treesSaved}
                </div>
                <div className="stat-label">Fewer Trees Needed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EPA-VERIFIED Environmental Context */}
      <div className="card p-6">
        <h3 className="section-label">🌎 EPA-Verified Environmental Impact Context</h3>
        <p className="text-xs text-slate-400 mb-4">
          Your trip's {emissions.total} kg CO₂e emissions are equivalent to...
          <span className="ml-2 text-emerald-400 font-semibold">✓ EPA Verified</span>
        </p>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* EPA: Miles driven by average passenger vehicle */}
          <div className="p-4 rounded-xl bg-slate-800/50 text-center border border-slate-700/30 hover:border-emerald-500/30 transition-all">
            <div className="text-4xl mb-2">🚗</div>
            <div className="text-2xl font-bold text-slate-200 mb-1">
              {emissions.equivalents.milesDriven}
            </div>
            <div className="text-xs text-slate-400">miles driven</div>
            <div className="text-[10px] text-slate-500 mt-1">Average passenger car</div>
            <div className="text-[9px] text-emerald-400 mt-1">EPA: 400g CO₂/mile</div>
          </div>
          
          {/* EPA: Gallons of gasoline */}
          <div className="p-4 rounded-xl bg-slate-800/50 text-center border border-slate-700/30 hover:border-emerald-500/30 transition-all">
            <div className="text-4xl mb-2">⛽</div>
            <div className="text-2xl font-bold text-slate-200 mb-1">
              {emissions.equivalents.gasolineGallons}
            </div>
            <div className="text-xs text-slate-400">gallons gasoline</div>
            <div className="text-[10px] text-slate-500 mt-1">Fuel consumed</div>
            <div className="text-[9px] text-emerald-400 mt-1">EPA: 8.887 kg/gallon</div>
          </div>
          
          {/* EPA: Electricity consumption */}
          <div className="p-4 rounded-xl bg-slate-800/50 text-center border border-slate-700/30 hover:border-emerald-500/30 transition-all">
            <div className="text-4xl mb-2">💡</div>
            <div className="text-2xl font-bold text-slate-200 mb-1">
              {emissions.equivalents.electricitykWh}
            </div>
            <div className="text-xs text-slate-400">kWh electricity</div>
            <div className="text-[10px] text-slate-500 mt-1">Power consumption</div>
            <div className="text-[9px] text-emerald-400 mt-1">EPA: 0.322 kg/kWh</div>
          </div>
          
          {/* EPA: Trees needed */}
          <div className="p-4 rounded-xl bg-slate-800/50 text-center border border-slate-700/30 hover:border-emerald-500/30 transition-all">
            <div className="text-4xl mb-2">🌳</div>
            <div className="text-2xl font-bold text-slate-200 mb-1">
              {emissions.equivalents.treesNeeded}
            </div>
            <div className="text-xs text-slate-400">trees for 1 year</div>
            <div className="text-[10px] text-slate-500 mt-1">Offset absorption</div>
            <div className="text-[9px] text-emerald-400 mt-1">EPA: 39 kg/tree/year</div>
          </div>
          
          {/* EPA: Home energy use */}
          <div className="p-4 rounded-xl bg-slate-800/50 text-center border border-slate-700/30 hover:border-emerald-500/30 transition-all">
            <div className="text-4xl mb-2">🏠</div>
            <div className="text-2xl font-bold text-slate-200 mb-1">
              {emissions.equivalents.homeEnergyYears}
            </div>
            <div className="text-xs text-slate-400">years home energy</div>
            <div className="text-[10px] text-slate-500 mt-1">Household use</div>
            <div className="text-[9px] text-emerald-400 mt-1">EPA: 10,970 kg/year</div>
          </div>
          
          {/* EPA: Passenger vehicles per year */}
          <div className="p-4 rounded-xl bg-slate-800/50 text-center border border-slate-700/30 hover:border-emerald-500/30 transition-all">
            <div className="text-4xl mb-2">🚙</div>
            <div className="text-2xl font-bold text-slate-200 mb-1">
              {emissions.equivalents.vehicleYears}
            </div>
            <div className="text-xs text-slate-400">car-years</div>
            <div className="text-[10px] text-slate-500 mt-1">Annual vehicle use</div>
            <div className="text-[9px] text-emerald-400 mt-1">EPA: 4,600 kg/year</div>
          </div>
          
          {/* EPA: Tree seedlings grown for 10 years */}
          <div className="p-4 rounded-xl bg-slate-800/50 text-center border border-slate-700/30 hover:border-emerald-500/30 transition-all">
            <div className="text-4xl mb-2">🌱</div>
            <div className="text-2xl font-bold text-slate-200 mb-1">
              {emissions.equivalents.treeSeedlings10Years}
            </div>
            <div className="text-xs text-slate-400">seedlings (10yr)</div>
            <div className="text-[10px] text-slate-500 mt-1">Young tree growth</div>
            <div className="text-[9px] text-emerald-400 mt-1">EPA equivalent</div>
          </div>
          
          {/* EPA: Acres of forest */}
          <div className="p-4 rounded-xl bg-slate-800/50 text-center border border-slate-700/30 hover:border-emerald-500/30 transition-all">
            <div className="text-4xl mb-2">🌲</div>
            <div className="text-2xl font-bold text-slate-200 mb-1">
              {emissions.equivalents.acresForestYear}
            </div>
            <div className="text-xs text-slate-400">acres forest</div>
            <div className="text-[10px] text-slate-500 mt-1">One year growth</div>
            <div className="text-[9px] text-emerald-400 mt-1">EPA: 1,060 kg/acre</div>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💰</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-300 mb-1">Carbon Offset Cost</p>
              <p className="text-xs text-slate-300">
                Offset this trip through Gold Standard certified projects for approximately{' '}
                <span className="font-bold text-blue-400">${emissions.offsetCost} USD</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                Based on $18.50/ton for quality verified projects (2024 market price)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card p-6">
        <h3 className="section-label">🌱 Personalized Recommendations</h3>
        <p className="text-xs text-slate-400 mb-4">Evidence-based actions to reduce your carbon footprint</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-5 rounded-xl border-l-4 transition-all hover:scale-[1.02] ${
                rec.priority === 'high' ? 'border-red-500 bg-red-500/5' :
                rec.priority === 'medium' ? 'border-amber-500 bg-amber-500/5' :
                'border-blue-500 bg-blue-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0">{rec.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`badge ${
                      rec.priority === 'high' ? 'badge-danger' :
                      rec.priority === 'medium' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {rec.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase">
                      {rec.priority} priority
                    </span>
                  </div>
                  
                  <h4 className="text-base font-bold text-slate-200 mb-2">{rec.title}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">{rec.message}</p>
                  
                  {rec.potentialSaving && (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-emerald-400">-{rec.potentialSaving} kg</span>
                        <span className="text-slate-500">CO₂e saved</span>
                      </div>
                      {rec.savingsPercent && (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-emerald-400">{rec.savingsPercent}%</span>
                          <span className="text-slate-500">reduction</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => window.print()} className="btn-primary">
          <span>🖨️</span>
          Print Report
        </button>
        
        <button onClick={() => {
          const reportText = `Carbon Footprint Report (EPA-Verified)
Origin: ${origin} → Destination: ${destination}
Distance: ${distance} km | Transport: ${mode} | Nights: ${nights}

Total Emissions: ${emissions.total} kg CO₂e
Daily Average: ${emissions.perDay} kg CO₂e/day
Eco Score: ${ecoScore}/100

EPA-Verified Equivalents:
- Miles driven: ${emissions.equivalents.milesDriven} miles
- Gasoline: ${emissions.equivalents.gasolineGallons} gallons
- Electricity: ${emissions.equivalents.electricitykWh} kWh
- Trees needed: ${emissions.equivalents.treesNeeded} trees (1 year)
- Home energy: ${emissions.equivalents.homeEnergyYears} years

Impact Level: ${emissions.category}
Carbon Offset Cost: $${emissions.offsetCost}
`;
          navigator.clipboard.writeText(reportText);
          alert('Report summary copied to clipboard!');
        }} className="btn-secondary">
          <span>📋</span>
          Copy Summary
        </button>
        
        <button onClick={() => navigate("/")} className="btn-secondary">
          <span>➕</span>
          New Calculation
        </button>
      </div>
    </div>
  );
};

export default ReportPage;