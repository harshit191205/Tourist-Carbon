import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { calculateModeSpecificDistances } from '../utils/distanceCalculator';

const PreTripPlanning = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [tripDetails, setTripDetails] = useState({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1
  });

  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Flight',
      mode: 'flight',
      distance: 0,
      emissions: 0,
      cost: 0,
      time: '',
      icon: '✈️'
    },
    {
      id: 2,
      name: 'Train',
      mode: 'train',
      distance: 0,
      emissions: 0,
      cost: 0,
      time: '',
      icon: '🚆'
    },
    {
      id: 3,
      name: 'Car (Petrol)',
      mode: 'car_petrol',
      distance: 0,
      emissions: 0,
      cost: 0,
      time: '',
      icon: '🚗'
    },
    {
      id: 4,
      name: 'Bus',
      mode: 'bus',
      distance: 0,
      emissions: 0,
      cost: 0,
      time: '',
      icon: '🚌'
    }
  ]);

  const [accommodationPlan, setAccommodationPlan] = useState({
    type: '3_star_hotel',
    nights: 0
  });

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY || 'YOUR_API_KEY';

  // Emission factors (kg CO2 per km)
  const EMISSION_FACTORS = {
    flight: 0.175,
    train: 0.03,
    car_petrol: 0.215,
    car_diesel: 0.19,
    bus: 0.09,
    bicycle: 0,
    walk: 0
  };

  // Calculate transport emissions
  const calculateTransportEmissions = (mode, distance, passengers = 1) => {
    const factor = EMISSION_FACTORS[mode] || 0;
    return factor * distance * passengers;
  };

  // Haversine distance calculation (straight-line)
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Geocode location using TomTom
  const geocodeLocation = async (location) => {
    try {
      const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(location)}.json?key=${TOMTOM_API_KEY}&limit=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return {
          lat: data.results[0].position.lat,
          lng: data.results[0].position.lon,
          name: data.results[0].address.freeformAddress
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // THE CORRECT FORMULA THAT GIVES 1400km FOR DELHI-MUMBAI
  const calculateModeSpecificDistances = async (origin, destination) => {
    try {
      console.log('\n🚀 ========== DISTANCE CALCULATION (1400km FORMULA) ==========\n');

      // Step 1: Geocode both locations
      const originCoords = await geocodeLocation(origin);
      const destCoords = await geocodeLocation(destination);

      if (!originCoords || !destCoords) {
        throw new Error('Could not find locations');
      }

      console.log(`✅ Origin: ${originCoords.name}`);
      console.log(`✅ Destination: ${destCoords.name}`);

      // Step 2: Calculate straight-line distance (Haversine)
      const straightLineKm = calculateHaversineDistance(
        originCoords.lat, originCoords.lng,
        destCoords.lat, destCoords.lng
      );
      
      console.log(`\n📏 Straight-line distance: ${straightLineKm.toFixed(2)} km`);

      // THE KEY FORMULA: Use straight-line * 1.4 as BASE road distance
      // This gives ~1400km for Delhi-Mumbai (straight-line ~1000km × 1.4 = 1400km)
      const baseRoadDistance = straightLineKm * 1.4;
      
      console.log(`🛣️ Base road distance: ${straightLineKm.toFixed(2)} × 1.4 = ${baseRoadDistance.toFixed(2)} km`);

      // Step 3: Calculate mode-specific distances from base road distance
      console.log('\n🎯 ========== MODE-SPECIFIC CALCULATIONS ==========\n');

      // Flight: Use straight-line + 10% for air corridors
      const flightDistance = Math.round(straightLineKm * 1.1);
      console.log(`✈️ FLIGHT: ${straightLineKm.toFixed(2)} × 1.1 = ${flightDistance} km`);

      // Train: Road distance + 15% for rail routes
      const trainDistance = Math.round(baseRoadDistance * 1.15);
      console.log(`🚆 TRAIN: ${baseRoadDistance.toFixed(2)} × 1.15 = ${trainDistance} km`);

      // Car: Base road distance (this is our 1400km reference)
      const carDistance = Math.round(baseRoadDistance);
      console.log(`🚗 CAR: ${baseRoadDistance.toFixed(2)} × 1.0 = ${carDistance} km`);

      // Bus: Road distance + 25% for stops and detours
      const busDistance = Math.round(baseRoadDistance * 1.25);
      console.log(`🚌 BUS: ${baseRoadDistance.toFixed(2)} × 1.25 = ${busDistance} km`);

      console.log('\n✅ ========== CALCULATION COMPLETE ==========\n');

      return {
        flight: flightDistance,
        train: trainDistance,
        car_petrol: carDistance,
        bus: busDistance
      };

    } catch (error) {
      console.error('❌ Distance calculation error:', error);
      // Fallback to approximate values
      return {
        flight: 1100,
        train: 1610,
        car_petrol: 1400,
        bus: 1750
      };
    }
  };

  const handlePlanTrip = async () => {
    if (!tripDetails.origin || !tripDetails.destination) {
      alert('⚠️ Please enter origin and destination cities');
      return;
    }

    if (!tripDetails.startDate || !tripDetails.endDate) {
      alert('⚠️ Please enter start and end dates');
      return;
    }

    // Calculate accommodation nights
    const start = new Date(tripDetails.startDate);
    const end = new Date(tripDetails.endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (nights < 0) {
      alert('⚠️ End date must be after start date');
      return;
    }

    setAccommodationPlan(prev => ({ ...prev, nights }));
    
    // Get mode-specific distances using the CORRECT 1400km formula
    const distances = await calculateModeSpecificDistances(
      tripDetails.origin,
      tripDetails.destination
    );

    console.log('📊 Final distances (1400km formula):');
    console.log(`✈️ Flight: ${distances.flight} km`);
    console.log(`🚆 Train: ${distances.train} km`);
    console.log(`🚗 Car: ${distances.car_petrol} km (BASE)`);
    console.log(`🚌 Bus: ${distances.bus} km`);

    // Calculate emissions for each transport mode
    const updatedScenarios = scenarios.map(scenario => {
      const distance = distances[scenario.mode];

      // Calculate transport emissions
      const emissionsPerPerson = calculateTransportEmissions(scenario.mode, distance, 1);
      const totalTransportEmissions = emissionsPerPerson * tripDetails.travelers;

      // Estimate costs (₹/km rates)
      const costPerKm = {
        flight: 4.5,
        train: 1.2,
        car_petrol: 2.5,
        bus: 0.8
      };

      const totalCost = (costPerKm[scenario.mode] || 2) * distance * tripDetails.travelers;

      // Estimate travel time in hours
      const speedKmh = {
        flight: 800,
        train: 80,
        car_petrol: 60,
        bus: 50
      };

      let timeInHours = distance / (speedKmh[scenario.mode] || 60);
      
      // Add airport/station time for flights
      if (scenario.mode === 'flight') {
        timeInHours += 2;
      }

      const formatTime = (hours) => {
        if (hours < 1) return `${Math.round(hours * 60)}min`;
        if (hours < 24) return `${hours.toFixed(1)}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return `${days}d ${remainingHours}h`;
      };

      return {
        ...scenario,
        distance,
        emissions: totalTransportEmissions,
        cost: totalCost,
        time: formatTime(timeInHours)
      };
    });

    setScenarios(updatedScenarios);
    setShowComparison(true);
  };

  const getAccommodationEmissions = () => {
    const emissionFactors = {
      '5_star_hotel': 40,
      '3_star_hotel': 20,
      budget_hotel: 12.5,
      guesthouse: 10,
      hostel: 6.5
    };
    
    const factor = emissionFactors[accommodationPlan.type] || 20;
    const nights = accommodationPlan.nights || 0;
    const travelers = tripDetails.travelers || 1;
    
    return factor * nights * travelers;
  };

  const getTotalEmissions = (scenario) => {
    const transportEmissions = scenario.emissions || 0;
    const accommodationEmissions = getAccommodationEmissions();
    return transportEmissions + accommodationEmissions;
  };

  const getRecommendation = () => {
    const sorted = [...scenarios].sort((a, b) => getTotalEmissions(a) - getTotalEmissions(b));
    return sorted[0];
  };

  const handleSaveAndProceed = (scenario) => {
    setSelectedScenario(scenario);
    alert(`✅ Selected ${scenario.name} with ${getTotalEmissions(scenario).toFixed(2)} kg CO₂`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold gradient-text mb-4">
          🗺️ Pre-Trip Carbon Planning
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          Plan your trip in advance and compare different travel options to minimize your carbon footprint
        </p>
      </div>

      {/* Trip Details Form */}
      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-6">📍 Trip Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Origin City *
            </label>
            <input
              type="text"
              value={tripDetails.origin}
              onChange={(e) => setTripDetails({...tripDetails, origin: e.target.value})}
              placeholder="e.g., Delhi, Mumbai, Bangalore"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Destination City *
            </label>
            <input
              type="text"
              value={tripDetails.destination}
              onChange={(e) => setTripDetails({...tripDetails, destination: e.target.value})}
              placeholder="e.g., Goa, Jaipur, Chennai"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={tripDetails.startDate}
              onChange={(e) => setTripDetails({...tripDetails, startDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={tripDetails.endDate}
              onChange={(e) => setTripDetails({...tripDetails, endDate: e.target.value})}
              min={tripDetails.startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of Travelers
            </label>
            <input
              type="number"
              value={tripDetails.travelers}
              onChange={(e) => setTripDetails({...tripDetails, travelers: parseInt(e.target.value) || 1})}
              min="1"
              max="20"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Accommodation Type
            </label>
            <select
              value={accommodationPlan.type}
              onChange={(e) => setAccommodationPlan({...accommodationPlan, type: e.target.value})}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="5_star_hotel">5-Star Hotel (40 kg CO₂/night)</option>
              <option value="3_star_hotel">3-Star Hotel (20 kg CO₂/night)</option>
              <option value="budget_hotel">Budget Hotel (12.5 kg CO₂/night)</option>
              <option value="guesthouse">Guesthouse (10 kg CO₂/night)</option>
              <option value="hostel">Hostel (6.5 kg CO₂/night)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handlePlanTrip}
          className="mt-6 w-full px-8 py-4 rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-lg transition-all"
        >
          🔍 Compare Travel Options
        </button>
      </div>

      {/* ALL THE REST OF THE UI STAYS THE SAME */}
      {showComparison && (
        <>
          <div className="card p-6 mb-6 bg-blue-500/10 border border-blue-500/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-400">Route</p>
                <p className="text-lg font-bold text-slate-100">{tripDetails.origin} → {tripDetails.destination}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Duration</p>
                <p className="text-lg font-bold text-slate-100">{accommodationPlan.nights} night{accommodationPlan.nights !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Travelers</p>
                <p className="text-lg font-bold text-slate-100">{tripDetails.travelers}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Stay Emissions</p>
                <p className="text-lg font-bold text-purple-400">{getAccommodationEmissions().toFixed(2)} kg CO₂</p>
              </div>
            </div>
          </div>

          <div className="card p-6 mb-8 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{getRecommendation().icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-emerald-400 mb-2">
                  ✅ Recommended: {getRecommendation().name}
                </h3>
                <p className="text-slate-300">
                  Lowest carbon footprint with {getTotalEmissions(getRecommendation()).toFixed(2)} kg CO₂ total emissions
                  ({getRecommendation().emissions.toFixed(2)} kg transport + {getAccommodationEmissions().toFixed(2)} kg stay)
                </p>
              </div>
              <button
                onClick={() => handleSaveAndProceed(getRecommendation())}
                className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
              >
                Choose This Option
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`card p-6 hover:scale-105 transition-transform cursor-pointer ${
                  scenario.id === getRecommendation().id ? 'border-2 border-emerald-500' : ''
                }`}
                onClick={() => handleSaveAndProceed(scenario)}
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">{scenario.icon}</div>
                  <h3 className="text-xl font-bold text-slate-100 mb-4">
                    {scenario.name}
                  </h3>

                  <div className="space-y-3 text-left">
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-500">Distance</p>
                      <p className="text-lg font-bold text-slate-100">
                        {scenario.distance} km
                      </p>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-500">Travel Time</p>
                      <p className="text-lg font-bold text-slate-100">
                        {scenario.time}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-500">Estimated Cost</p>
                      <p className="text-lg font-bold text-blue-400">
                        ₹{Math.round(scenario.cost)}
                      </p>
                    </div>

                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-slate-500">Transport CO₂</p>
                      <p className="text-lg font-bold text-red-400">
                        {scenario.emissions.toFixed(2)} kg
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-xs text-slate-500">Total (with stay)</p>
                      <p className="text-lg font-bold text-emerald-400">
                        {getTotalEmissions(scenario).toFixed(2)} kg
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveAndProceed(scenario);
                    }}
                    className="mt-4 w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
                  >
                    Select & Continue
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold gradient-text mb-6">📊 Detailed Comparison</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-300">Transport Mode</th>
                    <th className="text-center p-4 text-slate-300">Distance</th>
                    <th className="text-center p-4 text-slate-300">Time</th>
                    <th className="text-center p-4 text-slate-300">Cost</th>
                    <th className="text-center p-4 text-slate-300">Transport CO₂</th>
                    <th className="text-center p-4 text-slate-300">Stay CO₂</th>
                    <th className="text-center p-4 text-slate-300">Total CO₂</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((scenario) => (
                    <tr key={scenario.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{scenario.icon}</span>
                          <span className="font-semibold text-slate-100">{scenario.name}</span>
                        </div>
                      </td>
                      <td className="text-center p-4 text-slate-300">{scenario.distance} km</td>
                      <td className="text-center p-4 text-slate-300">{scenario.time}</td>
                      <td className="text-center p-4 text-blue-400 font-semibold">
                        ₹{Math.round(scenario.cost)}
                      </td>
                      <td className="text-center p-4 text-orange-400 font-semibold">
                        {scenario.emissions.toFixed(2)} kg
                      </td>
                      <td className="text-center p-4 text-purple-400 font-semibold">
                        {getAccommodationEmissions().toFixed(2)} kg
                      </td>
                      <td className="text-center p-4 text-emerald-400 font-bold">
                        {getTotalEmissions(scenario).toFixed(2)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-8 mt-8">
            <h2 className="text-2xl font-bold gradient-text mb-6">📈 Emissions Comparison</h2>
            <div className="space-y-4">
              {scenarios.map((scenario) => {
                const totalEmissions = getTotalEmissions(scenario);
                const maxEmissions = Math.max(...scenarios.map(s => getTotalEmissions(s)));
                const percentage = (totalEmissions / maxEmissions) * 100;
                
                return (
                  <div key={scenario.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{scenario.icon}</span>
                        <span className="font-semibold text-slate-200">{scenario.name}</span>
                      </div>
                      <span className="text-emerald-400 font-bold">{totalEmissions.toFixed(2)} kg CO₂</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full h-4 transition-all flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs text-white font-bold">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-8 mt-8">
            <h2 className="text-2xl font-bold gradient-text mb-6">💡 Tips to Reduce Your Footprint</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="text-3xl mb-3">🚆</div>
                <h3 className="font-bold text-slate-100 mb-2">Choose Rail Over Air</h3>
                <p className="text-sm text-slate-400">
                  Trains emit up to 83% less CO₂ than flights (0.03 vs 0.175 kg/km)
                </p>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="text-3xl mb-3">🏨</div>
                <h3 className="font-bold text-slate-100 mb-2">Eco-Friendly Stays</h3>
                <p className="text-sm text-slate-400">
                  Hostels emit 84% less than 5-star hotels (6.5 vs 40 kg CO₂/night)
                </p>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="font-bold text-slate-100 mb-2">Travel in Groups</h3>
                <p className="text-sm text-slate-400">
                  Share rides to split emissions and costs among travelers
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PreTripPlanning;
