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
  const [loading, setLoading] = useState(false);

  // Emission factors (kg CO2 per km)
  const EMISSION_FACTORS = {
    flight: 0.175,
    train: 0.03,
    car_petrol: 0.215,
    car_diesel: 0.19,
    car_hybrid: 0.15,
    car_electric: 0.05,
    bus: 0.09,
    motorcycle: 0.12,
    bicycle: 0,
    walk: 0
  };

  // Calculate transport emissions
  const calculateTransportEmissions = (mode, distance, passengers = 1) => {
    const factor = EMISSION_FACTORS[mode] || 0;
    return factor * distance * passengers;
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
    setLoading(true);
    
    try {
      // Use TomTom-based unified calculator
      const distances = await calculateModeSpecificDistances(
        tripDetails.origin,
        tripDetails.destination
      );

      console.log('📊 TomTom API distances:');
      console.log(`✈️ Flight: ${distances.flight} km`);
      console.log(`🚆 Train: ${distances.train} km`);
      console.log(`🚗 Car: ${distances.car} km`);
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
          car_diesel: 2.3,
          car_hybrid: 2.0,
          car_electric: 1.5,
          bus: 0.8,
          motorcycle: 1.5
        };

        const totalCost = (costPerKm[scenario.mode] || 2) * distance * tripDetails.travelers;

        // Estimate travel time in hours
        const speedKmh = {
          flight: 800,
          train: 80,
          car_petrol: 60,
          car_diesel: 60,
          car_hybrid: 60,
          car_electric: 60,
          bus: 50,
          motorcycle: 70
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
      
    } catch (error) {
      console.error('❌ Distance calculation error:', error);
      alert('⚠️ Could not calculate distances. Please check your TomTom API key and location names.');
    } finally {
      setLoading(false);
    }
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
    if (scenarios.length === 0) return null;
    const sorted = [...scenarios].sort((a, b) => getTotalEmissions(a) - getTotalEmissions(b));
    return sorted[0];
  };

  const handleSaveAndProceed = (scenario) => {
    setSelectedScenario(scenario);
    alert(`✅ Selected ${scenario.name} with ${getTotalEmissions(scenario).toFixed(2)} kg CO₂`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold gradient-text mb-4">
           Pre-Trip Carbon Planning
        </h1>
        {/* <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          Plan your trip using TomTom API for accurate route distances
        </p> */}
      </div>

      <div className="card p-8 mt-8 mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-6">📍 Trip Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Origin City *</label>
            <input
              type="text"
              value={tripDetails.origin}
              onChange={(e) => setTripDetails({...tripDetails, origin: e.target.value})}
              placeholder="e.g., Delhi, Mumbai, Bangalore"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Destination City *</label>
            <input
              type="text"
              value={tripDetails.destination}
              onChange={(e) => setTripDetails({...tripDetails, destination: e.target.value})}
              placeholder="e.g., Goa, Jaipur, Chennai"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date *</label>
            <input
              type="date"
              value={tripDetails.startDate}
              onChange={(e) => setTripDetails({...tripDetails, startDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">End Date *</label>
            <input
              type="date"
              value={tripDetails.endDate}
              onChange={(e) => setTripDetails({...tripDetails, endDate: e.target.value})}
              min={tripDetails.startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Number of Travelers</label>
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Accommodation Type</label>
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
          disabled={loading}
          className="mt-6 w-full px-8 py-4 rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>⏳ Calculating </>
          ) : (
            <>🔍 Compare Travel Options</>
          )}
        </button>
      </div>

      {showComparison && (
        <div className="space-y-6">
          {/* Recommendation Banner */}
          {getRecommendation() && (
            <div className="card p-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{getRecommendation().icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-emerald-400">✅ Recommended: {getRecommendation().name}</h3>
                    <p className="text-slate-300">
                      Lowest carbon footprint with {getTotalEmissions(getRecommendation()).toFixed(2)} kg CO₂ total emissions
                      ({getRecommendation().emissions.toFixed(2)} kg transport + {getAccommodationEmissions().toFixed(2)} kg stay)
                    </p>
                  </div>
                </div>
                {/* <button
                  onClick={() => handleSaveAndProceed(getRecommendation())}
                  className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
                >
                  Choose This Option
                </button> */}
              </div>
            </div>
          )}

          {/* Transport Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="card p-6 hover:scale-105 transition-transform">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{scenario.icon}</div>
                  <h3 className="text-xl font-bold text-slate-100">{scenario.name}</h3>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800 p-3 rounded-lg">
                    <div className="text-xs text-slate-400">Distance</div>
                    <div className="text-lg font-bold text-slate-100">{scenario.distance} km</div>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-lg">
                    <div className="text-xs text-slate-400">Travel Time</div>
                    <div className="text-lg font-bold text-slate-100">{scenario.time}</div>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-lg">
                    <div className="text-xs text-slate-400">Estimated Cost</div>
                    <div className="text-lg font-bold text-blue-400">₹{scenario.cost.toFixed(0)}</div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                    <div className="text-xs text-slate-400">Transport CO₂</div>
                    <div className="text-lg font-bold text-red-400">{scenario.emissions.toFixed(2)} kg</div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg">
                    <div className="text-xs text-slate-400">Total (with stay)</div>
                    <div className="text-lg font-bold text-emerald-400">{getTotalEmissions(scenario).toFixed(2)} kg</div>
                  </div>
                </div>

                {/* <button
                  onClick={() => handleSaveAndProceed(scenario)}
                  className="mt-4 w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
                >
                  Select & Continue
                </button> */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreTripPlanning;
