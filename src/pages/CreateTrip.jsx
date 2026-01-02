import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const CreateTrip = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState({
    tripName: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    groupSize: 1,
    description: ''
  });
  const [transportOptions, setTransportOptions] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [calculatingRoutes, setCalculatingRoutes] = useState(false);
  const [accommodation, setAccommodation] = useState({
    type: 'hotel',
    nightsStay: 1,
    pricePerNight: 0
  });
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({
    name: '',
    type: 'sightseeing',
    estimatedCost: 0
  });

  const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY || 'YOUR_API_KEY';

  const handleInputChange = (e) => {
    setTripData({ ...tripData, [e.target.name]: e.target.value });
  };

  const handleAccommodationChange = (e) => {
    setAccommodation({ ...accommodation, [e.target.name]: e.target.value });
  };

  const handleActivityChange = (e) => {
    setNewActivity({ ...newActivity, [e.target.name]: e.target.value });
  };

  const addActivity = () => {
    if (newActivity.name.trim()) {
      setActivities([...activities, { ...newActivity, id: Date.now() }]);
      setNewActivity({ name: '', type: 'sightseeing', estimatedCost: 0 });
    }
  };

  const removeActivity = (id) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  // Haversine distance calculation
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

  const calculateTransportOptions = async () => {
    if (!tripData.origin || !tripData.destination || !tripData.tripName) {
      alert('Please fill in all required fields');
      return;
    }

    setCalculatingRoutes(true);

    try {
      console.log('\n🚀 ========== ROUTE CALCULATION START ==========');
      
      // Geocode origin
      const originUrl = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(tripData.origin)}.json?key=${TOMTOM_API_KEY}&limit=1`;
      console.log('🔍 Fetching origin coordinates...');
      const originRes = await fetch(originUrl);
      const originData = await originRes.json();
      
      if (!originData.results || originData.results.length === 0) {
        throw new Error(`Could not find location: ${tripData.origin}`);
      }
      
      const originCoords = {
        lat: originData.results[0].position.lat,
        lng: originData.results[0].position.lon
      };
      console.log('✅ Origin:', originData.results[0].address.freeformAddress);
      console.log('   Coordinates:', originCoords);

      // Geocode destination
      const destUrl = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(tripData.destination)}.json?key=${TOMTOM_API_KEY}&limit=1`;
      console.log('🔍 Fetching destination coordinates...');
      const destRes = await fetch(destUrl);
      const destData = await destRes.json();
      
      if (!destData.results || destData.results.length === 0) {
        throw new Error(`Could not find location: ${tripData.destination}`);
      }
      
      const destCoords = {
        lat: destData.results[0].position.lat,
        lng: destData.results[0].position.lon
      };
      console.log('✅ Destination:', destData.results[0].address.freeformAddress);
      console.log('   Coordinates:', destCoords);

      // Calculate straight-line distance
      const straightLine = calculateHaversineDistance(
        originCoords.lat, originCoords.lng,
        destCoords.lat, destCoords.lng
      );
      console.log(`\n📏 Straight-line distance: ${straightLine.toFixed(2)} km`);

      // Get car route from TomTom
      const carUrl = `https://api.tomtom.com/routing/1/calculateRoute/${originCoords.lat},${originCoords.lng}:${destCoords.lat},${destCoords.lng}/json?key=${TOMTOM_API_KEY}&travelMode=car&traffic=false`;
      console.log('🚗 Fetching car route from TomTom...');
      const carRes = await fetch(carUrl);
      const carData = await carRes.json();
      
      let carDistance = straightLine * 1.4; // Default fallback
      
      if (carData.routes && carData.routes.length > 0) {
        carDistance = carData.routes[0].summary.lengthInMeters / 1000;
        console.log(`✅ TomTom car route: ${carDistance.toFixed(2)} km`);
      } else {
        console.log(`⚠️ TomTom API failed, using fallback: ${carDistance.toFixed(2)} km`);
      }

      // NOW CALCULATE EACH MODE WITH DIFFERENT DISTANCES
      console.log('\n🎯 ========== CALCULATING EACH TRANSPORT MODE ==========');

      const modes = [
        {
          mode: 'flight',
          icon: '✈️',
          name: 'Flight',
          emissionFactor: 0.175,
          costPerKm: 4.5,
          speed: 800,
          distanceMultiplier: 1.1, // Flight takes most direct route
          baseDistance: straightLine
        },
        {
          mode: 'train',
          icon: '🚆',
          name: 'Train',
          emissionFactor: 0.03,
          costPerKm: 1.2,
          speed: 80,
          distanceMultiplier: 1.15, // Train routes are ~15% longer than car
          baseDistance: carDistance
        },
        {
          mode: 'car_petrol',
          icon: '🚗',
          name: 'Car (Petrol)',
          emissionFactor: 0.215,
          costPerKm: 2.5,
          speed: 60,
          distanceMultiplier: 1.0, // Base car route
          baseDistance: carDistance
        },
        {
          mode: 'bus',
          icon: '🚌',
          name: 'Bus',
          emissionFactor: 0.09,
          costPerKm: 0.8,
          speed: 50,
          distanceMultiplier: 1.25, // Bus takes longer routes with stops
          baseDistance: carDistance
        }
      ];

      const options = modes.map((transport) => {
        // CRITICAL: Calculate unique distance for each mode
        const distance = parseFloat((transport.baseDistance * transport.distanceMultiplier).toFixed(2));
        const durationInSeconds = (distance / transport.speed) * 3600;
        
        const transportEmissions = distance * transport.emissionFactor;
        const accommodationEmissions = accommodation.nightsStay * 22;
        const totalEmissions = transportEmissions + accommodationEmissions;
        const estimatedCost = Math.round(distance * transport.costPerKm);

        const hours = Math.floor(durationInSeconds / 3600);
        const minutes = Math.floor((durationInSeconds % 3600) / 60);
        const travelTime = hours >= 24 
          ? `${Math.floor(hours/24)}d ${hours%24}h`
          : `${hours}.${Math.round(minutes/6)}h`;

        console.log(`\n${transport.icon} ${transport.name}:`);
        console.log(`   Base: ${transport.baseDistance.toFixed(2)} km × ${transport.distanceMultiplier} = ${distance} km`);
        console.log(`   Time: ${travelTime}`);
        console.log(`   Cost: ₹${estimatedCost}`);
        console.log(`   CO₂: ${totalEmissions.toFixed(2)} kg`);

        return {
          mode: transport.mode,
          icon: transport.icon,
          name: transport.name,
          distance: distance,
          travelTime: travelTime,
          estimatedCost: estimatedCost,
          transportEmissions: parseFloat(transportEmissions.toFixed(2)),
          totalEmissions: parseFloat(totalEmissions.toFixed(2)),
          emissionFactor: transport.emissionFactor
        };
      });

      options.sort((a, b) => a.totalEmissions - b.totalEmissions);

      console.log('\n✅ ========== CALCULATION COMPLETE ==========');
      console.log('Final distances:');
      options.forEach(o => console.log(`   ${o.name}: ${o.distance} km`));

      setTransportOptions(options);
      setStep(2);

    } catch (error) {
      console.error('❌ ERROR:', error);
      alert(`Error: ${error.message}\n\nPlease check:\n1. Your TomTom API key is correct\n2. Location names are spelled correctly\n3. You have internet connection`);
    } finally {
      setCalculatingRoutes(false);
    }
  };

  const handleTransportSelect = (transport) => {
    setSelectedTransport(transport);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedTransport) {
      alert('Please select a transport mode');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'trips'), {
        tripName: tripData.tripName,
        origin: tripData.origin,
        destination: tripData.destination,
        startDate: new Date(tripData.startDate),
        endDate: new Date(tripData.endDate),
        groupSize: Number(tripData.groupSize),
        description: tripData.description,
        transportMode: selectedTransport.mode,
        distance: selectedTransport.distance,
        estimatedCost: selectedTransport.estimatedCost,
        travelTime: selectedTransport.travelTime,
        transportEmissions: selectedTransport.transportEmissions,
        accommodationEmissions: accommodation.nightsStay * 22,
        totalEmissions: selectedTransport.totalEmissions,
        accommodation: {
          type: accommodation.type,
          nightsStay: Number(accommodation.nightsStay),
          pricePerNight: Number(accommodation.pricePerNight)
        },
        activities: activities,
        budget: 
          selectedTransport.estimatedCost +
          (accommodation.nightsStay * accommodation.pricePerNight) +
          activities.reduce((sum, a) => sum + Number(a.estimatedCost), 0),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        createdAt: serverTimestamp(),
        status: 'planned'
      });

      alert('✅ Trip created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Failed to create trip: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  const getActivityIcon = (type) => {
    const icons = {
      sightseeing: '🏛️',
      adventure_sports: '🏔️',
      water_sports: '🏄',
      wildlife_safari: '🦁',
      cultural_tour: '🎭',
      shopping: '🛍️',
      spa_wellness: '💆'
    };
    return icons[type] || '🎯';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Plan Your Sustainable Trip</h1>
          <p className="text-slate-300">Create an eco-friendly travel plan with carbon tracking</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-emerald-600' : 'bg-slate-700'}`}>1</div>
              <span className="ml-2 font-semibold hidden md:inline">Trip Details</span>
            </div>
            <div className="w-16 h-1 bg-slate-700"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-700'}`}>2</div>
              <span className="ml-2 font-semibold hidden md:inline">Transport</span>
            </div>
            <div className="w-16 h-1 bg-slate-700"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-700'}`}>3</div>
              <span className="ml-2 font-semibold hidden md:inline">Activities</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">📋 Trip Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Trip Name *</label>
                <input type="text" name="tripName" value={tripData.tripName} onChange={handleInputChange} placeholder="e.g., Summer Vacation to Goa" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Origin *</label>
                  <input type="text" name="origin" value={tripData.origin} onChange={handleInputChange} placeholder="e.g., Delhi, India" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none" required />
                  <p className="text-xs text-slate-400 mt-1">💡 Format: City, Country</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Destination *</label>
                  <input type="text" name="destination" value={tripData.destination} onChange={handleInputChange} placeholder="e.g., Goa, India" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none" required />
                  <p className="text-xs text-slate-400 mt-1">💡 Format: City, Country</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Date *</label>
                  <input type="date" name="startDate" value={tripData.startDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Date *</label>
                  <input type="date" name="endDate" value={tripData.endDate} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Group Size</label>
                <input type="number" name="groupSize" value={tripData.groupSize} onChange={handleInputChange} min="1" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea name="description" value={tripData.description} onChange={handleInputChange} rows="4" placeholder="Tell us about your trip..." className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none resize-none" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">🏨 Accommodation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                    <select name="type" value={accommodation.type} onChange={handleAccommodationChange} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none">
                      <option value="hotel">🏨 Hotel</option>
                      <option value="hostel">🏠 Hostel</option>
                      <option value="resort">🏖️ Resort</option>
                      <option value="homestay">🏡 Homestay</option>
                      <option value="camping">⛺ Camping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nights</label>
                    <input type="number" name="nightsStay" value={accommodation.nightsStay} onChange={handleAccommodationChange} min="1" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Price/Night (₹)</label>
                    <input type="number" name="pricePerNight" value={accommodation.pricePerNight} onChange={handleAccommodationChange} min="0" className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <button onClick={calculateTransportOptions} disabled={calculatingRoutes || !tripData.origin || !tripData.destination || !tripData.tripName} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold rounded-lg hover:from-emerald-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {calculatingRoutes ? '⏳ Calculating Routes...' : '🚀 Calculate Transport Options'}
              </button>

              <p className="text-xs text-center text-slate-400">🗺️ Powered by TomTom API | Open console (F12) for debug info</p>
            </div>
          </div>
        )}

        {step === 2 && transportOptions.length > 0 && (
          <div>
            <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border-2 border-emerald-500 rounded-lg p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="text-6xl">{transportOptions[0].icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-400 text-2xl">✅</span>
                    <h2 className="text-2xl font-bold text-white">Recommended: {transportOptions[0].name}</h2>
                  </div>
                  <p className="text-slate-300">Lowest carbon footprint with {transportOptions[0].totalEmissions.toFixed(2)} kg CO₂ total emissions</p>
                </div>
              </div>
              <button onClick={() => handleTransportSelect(transportOptions[0])} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all whitespace-nowrap">Choose This Option</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {transportOptions.map((transport, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 hover:border-emerald-500 transition-all">
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-3">{transport.icon}</div>
                    <h3 className="text-xl font-bold text-white">{transport.name}</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="bg-slate-700 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">Distance</p>
                      <p className="text-white font-bold text-lg">{transport.distance} km</p>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">Travel Time</p>
                      <p className="text-white font-bold">{transport.travelTime}</p>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">Estimated Cost</p>
                      <p className="text-blue-400 font-bold text-lg">{formatCurrency(transport.estimatedCost)}</p>
                    </div>
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">Transport CO₂</p>
                      <p className="text-red-400 font-bold">{transport.transportEmissions} kg</p>
                    </div>
                    <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">Total (with stay)</p>
                      <p className="text-emerald-400 font-bold text-lg">{transport.totalEmissions} kg</p>
                    </div>
                  </div>
                  <button onClick={() => handleTransportSelect(transport)} className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all">Select & Continue</button>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="mt-6 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all">← Back</button>
          </div>
        )}

        {step === 3 && selectedTransport && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">📊 Trip Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-3">Trip Details</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-400">📍 <strong className="text-white">{tripData.origin}</strong> → <strong className="text-white">{tripData.destination}</strong></p>
                    <p className="text-slate-400">📅 {formatDate(tripData.startDate)} to {formatDate(tripData.endDate)}</p>
                    <p className="text-slate-400">👥 Group Size: <strong className="text-white">{tripData.groupSize}</strong></p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-3">Selected Transport</h3>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-4xl">{selectedTransport.icon}</div>
                    <div>
                      <p className="text-xl font-bold text-white">{selectedTransport.name}</p>
                      <p className="text-emerald-400">{selectedTransport.distance} km • {selectedTransport.travelTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">🎯 Plan Activities</h2>
              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" name="name" value={newActivity.name} onChange={handleActivityChange} placeholder="Activity name" className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none" />
                  <select name="type" value={newActivity.type} onChange={handleActivityChange} className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:border-emerald-500 focus:outline-none">
                    <option value="sightseeing">🏛️ Sightseeing</option>
                    <option value="adventure_sports">🏔️ Adventure Sports</option>
                    <option value="water_sports">🏄 Water Sports</option>
                    <option value="wildlife_safari">🦁 Wildlife Safari</option>
                    <option value="cultural_tour">🎭 Cultural Tour</option>
                    <option value="shopping">🛍️ Shopping</option>
                    <option value="spa_wellness">💆 Spa & Wellness</option>
                  </select>
                  <input type="number" name="estimatedCost" value={newActivity.estimatedCost} onChange={handleActivityChange} placeholder="Est. cost (₹)" min="0" className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <button onClick={addActivity} className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all">➕ Add Activity</button>
              </div>

              {activities.length > 0 && (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getActivityIcon(activity.type)}</span>
                        <div>
                          <p className="font-bold text-white">{activity.name}</p>
                          <p className="text-sm text-slate-400">{activity.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-emerald-400 font-bold">{formatCurrency(activity.estimatedCost)}</p>
                        <button onClick={() => removeActivity(activity.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded transition-all">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">💰 Total Trip Budget</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Transport</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(selectedTransport.estimatedCost)}</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Accommodation</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(accommodation.nightsStay * accommodation.pricePerNight)}</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Activities</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(activities.reduce((sum, a) => sum + Number(a.estimatedCost), 0))}</p>
                </div>
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Total</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(selectedTransport.estimatedCost + (accommodation.nightsStay * accommodation.pricePerNight) + activities.reduce((sum, a) => sum + Number(a.estimatedCost), 0))}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all">← Back</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold rounded-lg hover:from-emerald-500 hover:to-blue-500 transition-all disabled:opacity-50">{loading ? '⏳ Creating...' : '✅ Create Trip'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTrip;
