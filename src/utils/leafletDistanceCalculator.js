import L from 'leaflet';
import 'leaflet-routing-machine';

/**
 * Geocode location name to coordinates using Nominatim (OpenStreetMap)
 * @param {string} locationName - City or place name
 * @returns {Promise<Object>} - Returns {lat, lng, displayName}
 */
export const geocodeLocation = async (locationName) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
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
 * @param {number} lat1 - Latitude of origin
 * @param {number} lon1 - Longitude of origin
 * @param {number} lat2 - Latitude of destination
 * @param {number} lon2 - Longitude of destination
 * @returns {number} - Distance in kilometers
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
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @returns {Promise<Object>} - Returns distance and duration
 */
export const calculateRoadDistance = async (originLat, originLng, destLat, destLng) => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`
    );
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceInKm = Math.round(route.distance / 1000);
      const durationInHours = (route.duration / 3600).toFixed(1);
      
      return {
        success: true,
        distance: distanceInKm,
        duration: `${durationInHours} hours`,
        durationInMinutes: Math.round(route.duration / 60)
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
 * Main function to calculate distance between two locations
 * @param {string} origin - Origin location name
 * @param {string} destination - Destination location name
 * @returns {Promise<Object>} - Complete distance information
 */
export const calculateDistance = async (origin, destination) => {
  try {
    // Step 1: Geocode both locations
    const originGeo = await geocodeLocation(origin);
    if (!originGeo.success) {
      throw new Error(`Could not find origin: ${origin}`);
    }
    
    const destGeo = await geocodeLocation(destination);
    if (!destGeo.success) {
      throw new Error(`Could not find destination: ${destination}`);
    }
    
    // Step 2: Calculate straight-line distance
    const straightLineDistance = calculateHaversineDistance(
      originGeo.lat,
      originGeo.lng,
      destGeo.lat,
      destGeo.lng
    );
    
    // Step 3: Calculate road distance
    const roadDistance = await calculateRoadDistance(
      originGeo.lat,
      originGeo.lng,
      destGeo.lat,
      destGeo.lng
    );
    
    return {
      success: true,
      distance: roadDistance.success ? roadDistance.distance : straightLineDistance,
      straightLineDistance: straightLineDistance,
      roadDistance: roadDistance.success ? roadDistance.distance : null,
      duration: roadDistance.success ? roadDistance.duration : 'N/A',
      durationInMinutes: roadDistance.success ? roadDistance.durationInMinutes : null,
      origin: {
        name: origin,
        displayName: originGeo.displayName,
        lat: originGeo.lat,
        lng: originGeo.lng
      },
      destination: {
        name: destination,
        displayName: destGeo.displayName,
        lat: destGeo.lat,
        lng: destGeo.lng
      }
    };
  } catch (error) {
    console.error('Distance calculation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get location suggestions (autocomplete)
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of location suggestions
 */
export const getLocationSuggestions = async (query) => {
  if (query.length < 3) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
    );
    
    const data = await response.json();
    
    return data.map(item => ({
      id: item.place_id,
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }));
  } catch (error) {
    console.error('Location suggestions error:', error);
    return [];
  }
};
