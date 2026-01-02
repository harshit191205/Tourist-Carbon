/**
 * Geocode location name to coordinates using Nominatim (OpenStreetMap)
 */
export const geocodeLocation = async (locationName) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
      {
        headers: {
          'User-Agent': 'TouristCarbonFootprint/1.0' // Required by Nominatim
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
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Return as float for more accurate calculations
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * UNIFIED DISTANCE CALCULATION - Used by both Calculator and Pre-Trip Planning
 * This ensures consistent distances across all pages (1400km for Delhi-Mumbai car)
 */
export const calculateModeSpecificDistances = async (origin, destination) => {
  try {
    console.log('\n🚀 ========== UNIFIED DISTANCE CALCULATION ==========\n');

    // Step 1: Geocode both locations
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

    // Step 2: Calculate straight-line distance (Haversine)
    const straightLineKm = calculateHaversineDistance(
      originGeo.lat, originGeo.lng,
      destGeo.lat, destGeo.lng
    );
    
    console.log(`\n📏 Straight-line distance: ${straightLineKm.toFixed(2)} km`);

    // Step 3: Calculate BASE road distance (straight-line × 1.4)
    // This gives ~1400km for Delhi-Mumbai
    const baseRoadDistance = straightLineKm * 1.4;
    
    console.log(`🛣️ Base road distance: ${straightLineKm.toFixed(2)} × 1.4 = ${baseRoadDistance.toFixed(2)} km`);

    // Step 4: Calculate mode-specific distances
    console.log('\n🎯 ========== MODE-SPECIFIC CALCULATIONS ==========\n');

    // Flight: straight-line + 10% for air corridors
    const flightDistance = Math.round(straightLineKm * 1.1);
    console.log(`✈️ FLIGHT: ${straightLineKm.toFixed(2)} × 1.1 = ${flightDistance} km`);

    // Train: road distance + 15% for rail routes
    const trainDistance = Math.round(baseRoadDistance * 1.15);
    console.log(`🚆 TRAIN: ${baseRoadDistance.toFixed(2)} × 1.15 = ${trainDistance} km`);

    // Car: base road distance (1400km for Delhi-Mumbai)
    const carDistance = Math.round(baseRoadDistance);
    console.log(`🚗 CAR: ${baseRoadDistance.toFixed(2)} × 1.0 = ${carDistance} km`);

    // Motorcycle: same as car
    const motorcycleDistance = Math.round(baseRoadDistance);
    console.log(`🏍️ MOTORCYCLE: ${baseRoadDistance.toFixed(2)} × 1.0 = ${motorcycleDistance} km`);

    // Bus: road distance + 25% for stops and detours
    const busDistance = Math.round(baseRoadDistance * 1.25);
    console.log(`🚌 BUS: ${baseRoadDistance.toFixed(2)} × 1.25 = ${busDistance} km`);

    // Bicycle: same as car route
    const bicycleDistance = Math.round(baseRoadDistance);
    console.log(`🚴 BICYCLE: ${baseRoadDistance.toFixed(2)} × 1.0 = ${bicycleDistance} km`);

    // Walking: same as car route
    const walkDistance = Math.round(baseRoadDistance);
    console.log(`🚶 WALKING: ${baseRoadDistance.toFixed(2)} × 1.0 = ${walkDistance} km`);

    console.log('\n✅ ========== CALCULATION COMPLETE ==========\n');

    return {
      flight: flightDistance,
      train: trainDistance,
      car: carDistance,
      car_petrol: carDistance,
      car_diesel: carDistance,
      car_cng: carDistance,
      car_ev: carDistance,
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
 * Calculate duration based on distance and transport mode
 */
const calculateDuration = (distance, transportMode) => {
  const speedMap = {
    flight: 800,      // 800 km/h
    train: 80,        // 80 km/h
    car: 60,          // 60 km/h
    car_petrol: 60,
    car_diesel: 60,
    car_cng: 60,
    car_ev: 60,
    motorcycle: 70,   // 70 km/h
    bus: 50,          // 50 km/h
    bicycle: 20,      // 20 km/h
    walking: 5,       // 5 km/h
    walk: 5
  };

  const speed = speedMap[transportMode] || 60;
  let timeInHours = distance / speed;

  // Add airport/station time for flights
  if (transportMode === 'flight') {
    timeInHours += 2;
  }

  // Format duration
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
 * Get route type label
 */
const getRouteType = (transportMode) => {
  const routeTypeMap = {
    flight: 'Flight path (great circle)',
    train: 'Estimated rail route',
    car: 'Car route',
    car_petrol: 'Car route (petrol)',
    car_diesel: 'Car route (diesel)',
    car_cng: 'Car route (CNG)',
    car_ev: 'Car route (electric)',
    motorcycle: 'Motorcycle route',
    bus: 'Bus route',
    bicycle: 'Cycling route',
    walking: 'Walking route',
    walk: 'Walking route'
  };

  return routeTypeMap[transportMode] || 'Road route';
};

/**
 * Main function to calculate travel distance based on transport mode
 * This maintains backward compatibility with your existing TripCalculator
 */
export const calculateTravelDistance = async (origin, destination, transportMode) => {
  try {
    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    console.log(`\n📍 Calculating distance: ${origin} → ${destination} (${transportMode})\n`);

    // Use the unified distance calculator
    const distances = await calculateModeSpecificDistances(origin, destination);

    // Get mode-specific distance
    const distance = distances[transportMode] || distances.car;

    // Calculate duration
    const duration = calculateDuration(distance, transportMode);

    // Get route type
    const routeType = getRouteType(transportMode);

    console.log(`✅ Result: ${distance} km, ${duration}\n`);

    // Return result in the format expected by your TripCalculator
    return {
      distance: distance,
      routeType: routeType,
      duration: duration
    };

  } catch (error) {
    console.error('Distance calculation error:', error);
    throw error;
  }
};

/**
 * LEGACY FUNCTIONS - Kept for backward compatibility but not recommended
 */

export const calculateRoadDistance = async (originLat, originLng, destLat, destLng, transportMode) => {
  console.warn('⚠️ calculateRoadDistance is deprecated. Use calculateModeSpecificDistances instead.');
  
  const straightLine = calculateHaversineDistance(originLat, originLng, destLat, destLng);
  const baseRoadDistance = straightLine * 1.4;
  const distance = Math.round(baseRoadDistance);
  
  return {
    success: true,
    distance: distance,
    duration: calculateDuration(distance, transportMode),
    routeType: getRouteType(transportMode)
  };
};

export const calculateFlightDistance = (lat1, lon1, lat2, lon2) => {
  console.warn('⚠️ calculateFlightDistance is deprecated. Use calculateModeSpecificDistances instead.');
  
  const straightLine = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  const flightDistance = Math.round(straightLine * 1.1);
  
  return {
    success: true,
    distance: flightDistance,
    duration: calculateDuration(flightDistance, 'flight'),
    routeType: 'Flight path (great circle)'
  };
};

export const calculateTrainDistance = async (originLat, originLng, destLat, destLng) => {
  console.warn('⚠️ calculateTrainDistance is deprecated. Use calculateModeSpecificDistances instead.');
  
  const straightLine = calculateHaversineDistance(originLat, originLng, destLat, destLng);
  const baseRoadDistance = straightLine * 1.4;
  const trainDistance = Math.round(baseRoadDistance * 1.15);
  
  return {
    success: true,
    distance: trainDistance,
    duration: calculateDuration(trainDistance, 'train'),
    routeType: 'Estimated rail route'
  };
};
