/**
 * FREE DISTANCE CALCULATOR - NO API KEY REQUIRED
 * Uses Nominatim (OpenStreetMap) for geocoding
 * Uses OSRM (Open Source Routing Machine) for routing
 * COMPLETELY FREE - NO REGISTRATION NEEDED
 */

/**
 * Geocode location using Nominatim - FREE
 */
export const geocodeLocation = async (locationName) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
      {
        headers: {
          'User-Agent': 'TouristCarbonFootprint/1.0'
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        success: true,
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    } else {
      return {
        success: false,
        error: 'Location not found'
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Calculate straight-line distance using Haversine formula
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (deg) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Calculate route using FREE OSRM API - NO API KEY NEEDED
 */
const calculateOSRMRoute = async (originLat, originLng, destLat, destLng, profile = 'driving') => {
  try {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      return {
        distance: Math.round(route.distance / 1000), // km
        duration: Math.round(route.duration / 60), // minutes
        success: true
      };
    } else {
      return { success: false, error: 'No routes found' };
    }
  } catch (error) {
    console.error(`OSRM error for ${profile}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * UNIFIED DISTANCE CALCULATION - FREE, NO API KEY
 */
export const calculateModeSpecificDistances = async (origin, destination) => {
  try {
    console.log('\n🚀 ========== FREE DISTANCE CALCULATION (NO API KEY) ==========');
    console.log(`Route: ${origin} → ${destination}\n`);

    // Geocode locations
    const originGeo = await geocodeLocation(origin);
    if (!originGeo.success) {
      throw new Error(`Could not find origin: ${origin}`);
    }

    const destGeo = await geocodeLocation(destination);
    if (!destGeo.success) {
      throw new Error(`Could not find destination: ${destination}`);
    }

    console.log(`✅ Origin: ${originGeo.displayName}`);
    console.log(`✅ Destination: ${destGeo.displayName}`);

    // Straight-line distance
    const straightLineKm = calculateHaversineDistance(
      originGeo.lat, originGeo.lng,
      destGeo.lat, destGeo.lng
    );
    
    console.log(`\n📏 Straight-line: ${straightLineKm.toFixed(2)} km`);

    // Flight distance
    const flightDistance = Math.round(straightLineKm * 1.1);
    console.log(`✈️ Flight: ${flightDistance} km (straight-line + 10%)`);

    // Car/Driving distance using OSRM
    const drivingRoute = await calculateOSRMRoute(
      originGeo.lat, originGeo.lng,
      destGeo.lat, destGeo.lng,
      'driving'
    );
    const carDistance = drivingRoute.success ? drivingRoute.distance : Math.round(straightLineKm * 1.4);
    console.log(`🚗 Car: ${carDistance} km ${drivingRoute.success ? '(OSRM)' : '(fallback)'}`);

    // Other modes
    const motorcycleDistance = carDistance;
    const busDistance = Math.round(carDistance * 1.25);
    const trainDistance = Math.round(carDistance * 1.15);
    
    // Bicycle route
    const cyclingRoute = await calculateOSRMRoute(
      originGeo.lat, originGeo.lng,
      destGeo.lat, destGeo.lng,
      'cycling'
    );
    const bicycleDistance = cyclingRoute.success ? cyclingRoute.distance : carDistance;
    
    // Walking route
    const walkRoute = await calculateOSRMRoute(
      originGeo.lat, originGeo.lng,
      destGeo.lat, destGeo.lng,
      'foot'
    );
    const walkDistance = walkRoute.success ? walkRoute.distance : carDistance;

    console.log(`🏍️ Motorcycle: ${motorcycleDistance} km`);
    console.log(`🚌 Bus: ${busDistance} km`);
    console.log(`🚆 Train: ${trainDistance} km`);
    console.log(`🚴 Bicycle: ${bicycleDistance} km`);
    console.log(`🚶 Walking: ${walkDistance} km`);
    console.log('\n✅ ========== COMPLETE ==========\n');

    return {
      flight: flightDistance,
      train: trainDistance,
      car: carDistance,
      car_petrol: carDistance,
      car_diesel: carDistance,
      car_hybrid: carDistance,
      car_electric: carDistance,
      motorcycle: motorcycleDistance,
      bus: busDistance,
      bicycle: bicycleDistance,
      walking: walkDistance,
      walk: walkDistance
    };

  } catch (error) {
    console.error('❌ Distance calculation error:', error);
    throw error;
  }
};

/**
 * Calculate duration
 */
const calculateDuration = (distance, transportMode) => {
  const speedMap = {
    flight: 800, train: 80, car: 60, car_petrol: 60, car_diesel: 60,
    car_hybrid: 60, car_electric: 60, motorcycle: 70, bus: 50,
    bicycle: 20, walking: 5, walk: 5
  };

  const speed = speedMap[transportMode] || 60;
  let timeInHours = distance / speed;

  if (transportMode === 'flight') timeInHours += 2;

  if (timeInHours < 1) {
    return `${Math.round(timeInHours * 60)} mins`;
  } else if (timeInHours < 24) {
    return `${timeInHours.toFixed(1)} hours`;
  } else {
    const days = Math.floor(timeInHours / 24);
    const hours = Math.round(timeInHours % 24);
    return `${days}d ${hours}h`;
  }
};

/**
 * Get route type
 */
const getRouteType = (transportMode) => {
  const routeTypes = {
    flight: 'Flight path', train: 'Rail route', car: 'Car route',
    car_petrol: 'Car route (Petrol)', car_diesel: 'Car route (Diesel)',
    car_hybrid: 'Car route (Hybrid)', car_electric: 'Car route (Electric)',
    motorcycle: 'Motorcycle route', bus: 'Bus route',
    bicycle: 'Cycling route', walking: 'Walking route', walk: 'Walking route'
  };
  return routeTypes[transportMode] || 'Road route';
};

/**
 * Backward compatibility wrapper
 */
export const calculateTravelDistance = async (origin, destination, transportMode) => {
  try {
    const distances = await calculateModeSpecificDistances(origin, destination);
    const distance = distances[transportMode] || distances.car;
    const duration = calculateDuration(distance, transportMode);
    const routeType = getRouteType(transportMode);

    return { distance, routeType, duration };
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};
