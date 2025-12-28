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
  
  return Math.round(distance);
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate road distance using OSRM (Open Source Routing Machine)
 */
export const calculateRoadDistance = async (originLat, originLng, destLat, destLng, transportMode) => {
  try {
    // Map transport modes to OSRM profiles
    const profileMap = {
      car: 'driving',
      motorcycle: 'driving',
      bus: 'driving',
      train: 'driving', // Use driving as approximation
      bicycle: 'cycling',
      walking: 'foot'
    };

    const profile = profileMap[transportMode] || 'driving';
    
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${originLng},${originLat};${destLng},${destLat}?overview=false`
    );
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      let distanceInKm = Math.round(route.distance / 1000);
      const durationInMinutes = Math.round(route.duration / 60);
      const durationInHours = (route.duration / 3600).toFixed(1);
      
      // Add adjustment for train routes (typically 10-15% longer than road)
      if (transportMode === 'train') {
        distanceInKm = Math.round(distanceInKm * 1.12);
      }
      
      return {
        success: true,
        distance: distanceInKm,
        duration: durationInMinutes < 60 
          ? `${durationInMinutes} mins` 
          : `${durationInHours} hours`,
        durationInMinutes: durationInMinutes
      };
    } else {
      return {
        success: false,
        error: 'Route not found'
      };
    }
  } catch (error) {
    console.error('Road distance calculation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Calculate flight distance (great circle distance + 5%)
 */
export const calculateFlightDistance = (lat1, lon1, lat2, lon2) => {
  // For flights, use straight-line distance (great circle)
  // Add ~5% for typical flight path deviations
  const straightLine = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  const flightDistance = Math.round(straightLine * 1.05);
  
  // Estimate flight duration based on distance
  // Average cruise speed: 800 km/h, plus taxi/takeoff/landing time
  let durationHours;
  if (flightDistance < 500) {
    // Short haul: add 30 min for ground operations
    durationHours = (flightDistance / 700 + 0.5).toFixed(1);
  } else if (flightDistance < 3000) {
    // Medium haul: add 45 min
    durationHours = (flightDistance / 800 + 0.75).toFixed(1);
  } else {
    // Long haul: add 1 hour
    durationHours = (flightDistance / 850 + 1).toFixed(1);
  }
  
  return {
    success: true,
    distance: flightDistance,
    duration: `${durationHours} hours`,
    routeType: 'Flight path (great circle)'
  };
};

/**
 * Calculate train distance (approximation using road routes + 12%)
 */
export const calculateTrainDistance = async (originLat, originLng, destLat, destLng) => {
  // Try to get road distance first
  const roadResult = await calculateRoadDistance(originLat, originLng, destLat, destLng, 'train');
  
  if (roadResult.success) {
    // Train routes are typically 10-15% longer than direct road routes
    const trainDistance = Math.round(roadResult.distance * 1.12);
    
    // Average train speed: 80 km/h for regular trains
    const durationHours = (trainDistance / 80).toFixed(1);
    
    return {
      success: true,
      distance: trainDistance,
      duration: `${durationHours} hours`,
      routeType: 'Estimated rail route'
    };
  }
  
  // Fallback to straight-line distance + 20% if road route fails
  const straightLine = calculateHaversineDistance(originLat, originLng, destLat, destLng);
  const trainDistance = Math.round(straightLine * 1.2);
  const durationHours = (trainDistance / 80).toFixed(1);
  
  return {
    success: true,
    distance: trainDistance,
    duration: `${durationHours} hours`,
    routeType: 'Estimated rail route (straight-line approximation)'
  };
};

/**
 * Main function to calculate travel distance based on transport mode
 * This matches your existing function signature exactly
 */
export const calculateTravelDistance = async (origin, destination, transportMode) => {
  try {
    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }
    
    // Step 1: Geocode both locations
    console.log('Geocoding origin:', origin);
    const originGeo = await geocodeLocation(origin);
    
    if (!originGeo.success) {
      throw new Error(`Could not find origin: ${origin}`);
    }
    
    console.log('Geocoding destination:', destination);
    const destGeo = await geocodeLocation(destination);
    
    if (!destGeo.success) {
      throw new Error(`Could not find destination: ${destination}`);
    }
    
    console.log('Origin coordinates:', originGeo.lat, originGeo.lng);
    console.log('Destination coordinates:', destGeo.lat, destGeo.lng);
    
    let result;
    
    // Step 2: Calculate distance based on transport mode
    switch (transportMode) {
      case 'flight':
        result = calculateFlightDistance(
          originGeo.lat, originGeo.lng,
          destGeo.lat, destGeo.lng
        );
        break;
        
      case 'train':
        result = await calculateTrainDistance(
          originGeo.lat, originGeo.lng,
          destGeo.lat, destGeo.lng
        );
        break;
        
      case 'car':
      case 'motorcycle':
      case 'bus':
        result = await calculateRoadDistance(
          originGeo.lat, originGeo.lng,
          destGeo.lat, destGeo.lng,
          transportMode
        );
        if (result.success) {
          const modeLabel = transportMode.charAt(0).toUpperCase() + transportMode.slice(1);
          result.routeType = `${modeLabel} route`;
        }
        break;
        
      case 'bicycle':
        result = await calculateRoadDistance(
          originGeo.lat, originGeo.lng,
          destGeo.lat, destGeo.lng,
          'bicycle'
        );
        if (result.success) {
          result.routeType = 'Cycling route';
        }
        break;
        
      default:
        // Fallback to straight-line distance
        const straightLine = calculateHaversineDistance(
          originGeo.lat, originGeo.lng,
          destGeo.lat, destGeo.lng
        );
        result = {
          success: true,
          distance: straightLine,
          duration: 'N/A',
          routeType: 'Straight-line distance'
        };
    }
    
    // Handle failure with fallback
    if (!result.success) {
      console.warn('Route calculation failed, using straight-line distance');
      const straightLine = calculateHaversineDistance(
        originGeo.lat, originGeo.lng,
        destGeo.lat, destGeo.lng
      );
      result = {
        success: true,
        distance: straightLine,
        duration: 'N/A',
        routeType: 'Straight-line distance (route not available)'
      };
    }
    
    // Return result in the format expected by your TripCalculator
    return {
      distance: result.distance,
      routeType: result.routeType,
      duration: result.duration || 'N/A'
    };
    
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw error;
  }
};
