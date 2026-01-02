import React from 'react';
import { useNavigate } from 'react-router-dom';

const SimplifiedReportPage = ({ emissions, tripData }) => {
  const navigate = useNavigate();

  // Early return if no data
  if (!emissions || !tripData) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-slate-400 text-xl">No trip data available</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
        >
          Calculate a Trip
        </button>
      </div>
    );
  }

  // Safely extract ALL emissions with comprehensive defaults
  const totalEmissions = Number(emissions?.totalEmissions) || 0;
  const transportEmissions = Number(emissions?.transportEmissions) || 0;
  const accommodationEmissions = Number(emissions?.accommodationEmissions) || 0;
  const activityEmissions = Number(emissions?.activityEmissions) || 0;

  // Validate we have valid numbers
  if (isNaN(totalEmissions) || totalEmissions === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-slate-400 text-xl mb-4">Unable to calculate emissions</p>
        <p className="text-slate-500 text-sm mb-6">The trip data may be incomplete</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Icon mapping for transport modes
  const TRANSPORT_ICONS = {
    flight: '✈️',
    train: '🚆',
    car_petrol: '🚗',
    car_diesel: '🚗',
    car_cng: '🚗',
    car_ev: '⚡',
    bus: '🚌',
    bicycle: '🚴',
    walk: '🚶'
  };

  // Get transport mode and icon
  const getTransportInfo = () => {
    const mode = tripData?.transportData?.mode || 'car_petrol';
    const icon = TRANSPORT_ICONS[mode] || '🚗';
    
    // Format mode name
    let modeName = String(mode).replace(/_/g, ' ');
    modeName = modeName.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return { mode, icon, modeName };
  };

  const transportInfo = getTransportInfo();

  const getSustainabilityLevel = (total) => {
    const value = Number(total) || 0;
    
    if (value < 50) return { 
      level: 'Excellent', 
      color: 'text-green-400', 
      bg: 'bg-green-500/20', 
      border: 'border-green-500/30',
      emoji: '🌟'
    };
    if (value < 150) return { 
      level: 'Good', 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/20', 
      border: 'border-emerald-500/30',
      emoji: '✅'
    };
    if (value < 300) return { 
      level: 'Moderate', 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/20', 
      border: 'border-yellow-500/30',
      emoji: '⚠️'
    };
    if (value < 500) return { 
      level: 'High Impact', 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/20', 
      border: 'border-orange-500/30',
      emoji: '🔥'
    };
    return { 
      level: 'Very High Impact', 
      color: 'text-red-400', 
      bg: 'bg-red-500/20', 
      border: 'border-red-500/30',
      emoji: '⛔'
    };
  };

  const sustainability = getSustainabilityLevel(totalEmissions);

  const origin = String(tripData?.tripDetails?.origin || 'Origin');
  const destination = String(tripData?.tripDetails?.destination || 'Destination');
  const distance = Number(tripData?.transportData?.distance) || 0;
  const nights = Number(tripData?.accommodationData?.nights) || 0;
  const accommodationType = String(tripData?.accommodationData?.type || 'hotel');

  // Safe calculation helper
  const safeCalc = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold gradient-text mb-4">
          🌍 Your Trip Carbon Report
        </h1>
        <p className="text-xl text-slate-300">
          Complete analysis of your travel carbon footprint
        </p>
      </div>

      {/* Trip Summary Card */}
      <div className="card p-8 mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-6 text-center">
          {origin} → {destination}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">📍</div>
            <p className="text-slate-400 text-sm">Distance</p>
            <p className="text-xl font-bold text-slate-100">{distance} km</p>
          </div>
          
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-slate-400 text-sm">Duration</p>
            <p className="text-xl font-bold text-slate-100">{nights} night{nights !== 1 ? 's' : ''}</p>
          </div>
          
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">{transportInfo.icon}</div>
            <p className="text-slate-400 text-sm">Transport</p>
            <p className="text-lg font-bold text-slate-100">{transportInfo.modeName}</p>
          </div>
          
          <div className="text-center p-4 bg-slate-800 rounded-lg">
            <div className="text-3xl mb-2">🏨</div>
            <p className="text-slate-400 text-sm">Accommodation</p>
            <p className="text-sm font-bold text-slate-100 capitalize">
              {accommodationType.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Total Emissions - Big Display */}
        <div className="text-center py-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-slate-700">
          <p className="text-slate-400 text-lg mb-2">Total Carbon Footprint</p>
          <h2 className="text-7xl font-bold gradient-text mb-3">
            {safeCalc(totalEmissions).toFixed(2)}
          </h2>
          <p className="text-2xl text-slate-300 mb-4">kg CO₂e</p>
          <div className={`inline-block px-6 py-3 rounded-full ${sustainability.bg} border ${sustainability.border}`}>
            <span className={`text-lg font-bold ${sustainability.color}`}>
              {sustainability.emoji} {sustainability.level}
            </span>
          </div>
        </div>
      </div>

      {/* Emissions Breakdown */}
      <div className="card p-8 mb-8">
        <h3 className="text-2xl font-bold gradient-text mb-6">📊 Emissions Breakdown</h3>
        
        <div className="space-y-4">
          {/* Transport */}
          {transportEmissions > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{transportInfo.icon}</span>
                  <span className="text-slate-200 font-semibold">Transport ({transportInfo.modeName})</span>
                </div>
                <span className="text-blue-400 font-bold text-lg">
                  {safeCalc(transportEmissions).toFixed(2)} kg CO₂
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full h-3 transition-all"
                  style={{ width: `${totalEmissions > 0 ? (transportEmissions / totalEmissions) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {totalEmissions > 0 ? safeCalc((transportEmissions / totalEmissions) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          )}

          {/* Accommodation */}
          {accommodationEmissions > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏨</span>
                  <span className="text-slate-200 font-semibold">Accommodation ({nights} night{nights !== 1 ? 's' : ''})</span>
                </div>
                <span className="text-purple-400 font-bold text-lg">
                  {safeCalc(accommodationEmissions).toFixed(2)} kg CO₂
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full h-3 transition-all"
                  style={{ width: `${totalEmissions > 0 ? (accommodationEmissions / totalEmissions) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {totalEmissions > 0 ? safeCalc((accommodationEmissions / totalEmissions) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          )}

          {/* Activities */}
          {activityEmissions > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  <span className="text-slate-200 font-semibold">Activities</span>
                </div>
                <span className="text-orange-400 font-bold text-lg">
                  {safeCalc(activityEmissions).toFixed(2)} kg CO₂
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full h-3 transition-all"
                  style={{ width: `${totalEmissions > 0 ? (activityEmissions / totalEmissions) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {totalEmissions > 0 ? safeCalc((activityEmissions / totalEmissions) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          )}
        </div>

        {/* Pie Chart Representation */}
        <div className="mt-8 p-6 bg-slate-800 rounded-lg">
          <h4 className="text-lg font-bold text-slate-200 mb-4 text-center">Emissions Distribution</h4>
          <div className="flex items-center justify-center gap-6">
            {transportEmissions > 0 && (
              <div className="text-center">
                <div className="text-4xl mb-2">{transportInfo.icon}</div>
                <p className="text-2xl font-bold text-blue-400">
                  {totalEmissions > 0 ? safeCalc((transportEmissions / totalEmissions) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-slate-400">Transport</p>
              </div>
            )}
            {accommodationEmissions > 0 && (
              <div className="text-center">
                <div className="text-4xl mb-2">🏨</div>
                <p className="text-2xl font-bold text-purple-400">
                  {totalEmissions > 0 ? safeCalc((accommodationEmissions / totalEmissions) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-slate-400">Stay</p>
              </div>
            )}
            {activityEmissions > 0 && (
              <div className="text-center">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-2xl font-bold text-orange-400">
                  {totalEmissions > 0 ? safeCalc((activityEmissions / totalEmissions) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-slate-400">Activities</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparisons */}
      <div className="card p-8 mb-8">
        <h3 className="text-2xl font-bold gradient-text mb-6">🔄 Put it in Perspective</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-slate-800 rounded-lg hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">🌳</div>
            <p className="text-3xl font-bold text-emerald-400 mb-2">
              {safeCalc(totalEmissions / 21.77).toFixed(1)}
            </p>
            <p className="text-sm text-slate-400">
              Trees needed for 1 year to absorb this CO₂
            </p>
          </div>

          <div className="text-center p-6 bg-slate-800 rounded-lg hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">🚗</div>
            <p className="text-3xl font-bold text-blue-400 mb-2">
              {safeCalc(totalEmissions / 0.215).toFixed(0)}
            </p>
            <p className="text-sm text-slate-400">
              km driven in a petrol car
            </p>
          </div>

          <div className="text-center p-6 bg-slate-800 rounded-lg hover:scale-105 transition-transform">
            <div className="text-4xl mb-3">💡</div>
            <p className="text-3xl font-bold text-yellow-400 mb-2">
              {safeCalc(totalEmissions / 0.5).toFixed(0)}
            </p>
            <p className="text-sm text-slate-400">
              hours of LED bulb usage (10W)
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-slate-300 text-center">
            💡 <strong>Did you know?</strong> An average tree absorbs about 21.77 kg of CO₂ per year. 
            Your trip would require <strong>{safeCalc(totalEmissions / 21.77).toFixed(1)} trees</strong> working for a full year to offset!
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card p-8 mb-8">
        <h3 className="text-2xl font-bold gradient-text mb-6">💡 How to Reduce Your Footprint</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <h4 className="font-bold text-emerald-400 mb-2">✅ Choose Trains Over Flights</h4>
            <p className="text-sm text-slate-300">
              Trains emit 83% less CO₂ than flights (0.03 vs 0.175 kg/km)
            </p>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="font-bold text-blue-400 mb-2">✅ Eco-Friendly Stays</h4>
            <p className="text-sm text-slate-300">
              Hostels emit 84% less than 5-star hotels (6.5 vs 40 kg/night)
            </p>
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <h4 className="font-bold text-purple-400 mb-2">✅ Travel Light & Local</h4>
            <p className="text-sm text-slate-300">
              Use local transport and support eco-businesses
            </p>
          </div>

          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <h4 className="font-bold text-orange-400 mb-2">✅ Offset Emissions</h4>
            <p className="text-sm text-slate-300">
              Plant {Math.ceil(safeCalc(totalEmissions / 21.77))} trees to offset your trip
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-lg transition-all"
        >
          📊 Calculate Another Trip
        </button>
        
        <button
          onClick={() => navigate('/history')}
          className="px-8 py-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg transition-all"
        >
          📈 View Trip History
        </button>

        <button
          onClick={() => navigate('/credits')}
          className="px-8 py-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-lg transition-all"
        >
          💎 Carbon Credits
        </button>
      </div>
    </div>
  );
};

export default SimplifiedReportPage;
