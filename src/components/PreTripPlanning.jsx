import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  // Calculate distance between cities
  const calculateDistance = (origin, destination) => {
    const distances = {
      'delhi-mumbai': 1400,
      'delhi-bangalore': 2150,
      'delhi-kolkata': 1500,
      'delhi-chennai': 2180,
      'delhi-hyderabad': 1570,
      'delhi-pune': 1450,
      'delhi-ahmedabad': 950,
      'delhi-goa': 1900,
      'delhi-jaipur': 280,
      'delhi-agra': 230,
      'delhi-lucknow': 550,
      'delhi-chandigarh': 250,
      'delhi-shimla': 340,
      'delhi-manali': 540,
      'mumbai-bangalore': 980,
      'mumbai-goa': 580,
      'mumbai-pune': 150,
      'mumbai-hyderabad': 710,
      'mumbai-chennai': 1340,
      'mumbai-kolkata': 2000,
      'bangalore-chennai': 350,
      'bangalore-hyderabad': 570,
      'bangalore-goa': 560,
      'bangalore-mumbai': 980,
      'chennai-hyderabad': 630,
      'kolkata-bangalore': 1870,
      'kolkata-hyderabad': 1500,
      'hyderabad-goa': 630
    };
    
    const key = `${origin.toLowerCase().trim()}-${destination.toLowerCase().trim()}`;
    const reverseKey = `${destination.toLowerCase().trim()}-${origin.toLowerCase().trim()}`;
    
    return distances[key] || distances[reverseKey] || 500;
  };

  const handlePlanTrip = () => {
    if (!tripDetails.origin || !tripDetails.destination) {
      alert('⚠️ Please enter origin and destination cities');
      return;
    }

    if (!tripDetails.startDate || !tripDetails.endDate) {
      alert('⚠️ Please enter start and end dates');
      return;
    }

    const distance = calculateDistance(tripDetails.origin, tripDetails.destination);
    
    // Calculate accommodation nights
    const start = new Date(tripDetails.startDate);
    const end = new Date(tripDetails.endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (nights < 0) {
      alert('⚠️ End date must be after start date');
      return;
    }

    setAccommodationPlan(prev => ({ ...prev, nights }));
    
    // Calculate emissions for each transport mode
    const updatedScenarios = scenarios.map(scenario => {
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
        flight: 600,
        train: 80,
        car_petrol: 70,
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
    // You can navigate to the trip calculator here if needed
    // navigate('/', { state: { preplanData: scenario } });
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

      {/* Comparison Results */}
      {showComparison && (
        <>
          {/* Trip Info Banner */}
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

          {/* Recommendation Banner */}
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

          {/* Comparison Grid */}
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

          {/* Detailed Comparison */}
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

          {/* Emissions Breakdown Chart */}
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

          {/* Tips */}
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
