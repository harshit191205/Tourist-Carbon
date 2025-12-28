import axios from 'axios';

/**
 * HAVERSINE FORMULA - Accurate Great Circle Distance
 * Accuracy: ±0.5% for spherical Earth model
 * Source: https://www.movable-type.co.uk/scripts/latlong.html
 */

const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const EARTH_RADIUS_KM = 6371; // Mean radius in kilometers

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Haversine formula for great-circle distance
 * Returns distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  // Convert to radians
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);
  
  // Haversine formula
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = EARTH_RADIUS_KM * c;
  
  return distance;
};

/**
 * Geocode location using Nominatim (OpenStreetMap)
 * Returns {lat, lon, displayName}
 */
export const geocodeLocation = async (location) => {
  try {
    const response = await axios.get(`${NOMINATIM_API}/search`, {
      params: {
        q: location,
        format: 'json',
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'CarbonFootprintCalculator/2.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        displayName: result.display_name,
        country: result.address?.country || 'Unknown',
        city: result.address?.city || result.address?.town || result.address?.village || 'Unknown'
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Could not geocode location. Please check the spelling.');
  }
};

/**
 * Calculate distance with mode-specific adjustments
 * Different transport modes don't travel in straight lines
 */
const applyModeAdjustment = (greatCircleDistance, transportMode) => {
  let adjustment = 1.0;
  
  switch (transportMode) {
    case 'flight':
      // ICAO GCD corrections (already accurate for flights)
      if (greatCircleDistance < 550) {
        adjustment = 1.025; // +2.5% for short flights
      } else if (greatCircleDistance < 5500) {
        adjustment = 1.095; // +9.5% for medium flights
      } else {
        adjustment = 1.050; // +5% for long-haul
      }
      break;
      
    case 'train':
      // Rail follows terrain, not straight lines
      // Approximate 15% longer due to geography
      adjustment = 1.15;
      break;
      
    case 'bus':
    case 'car':
    case 'motorcycle':
      // Road distance ~25-30% longer than great circle
      // Accounts for: road network, detours, highway routing
      adjustment = 1.27;
      break;
      
    case 'walk':
      // Walking follows roads/paths
      adjustment = 1.30;
      break;
      
    default:
      adjustment = 1.0;
  }
  
  return greatCircleDistance * adjustment;
};

/**
 * Main function: Calculate travel distance
 * Returns accurate distance for the specified transport mode
 */
export const calculateTravelDistance = async (origin, destination, transportMode = 'flight') => {
  try {
    // Geocode both locations
    console.log(`Geocoding: ${origin} → ${destination}`);
    
    const originCoords = await geocodeLocation(origin);
    const destCoords = await geocodeLocation(destination);
    
    if (!originCoords || !destCoords) {
      throw new Error('Could not find one or both locations');
    }
    
    console.log(`Origin: ${originCoords.lat}, ${originCoords.lon}`);
    console.log(`Destination: ${destCoords.lat}, ${destCoords.lon}`);
    
    // Calculate great circle distance (Haversine)
    const greatCircleKm = haversineDistance(
      originCoords.lat,
      originCoords.lon,
      destCoords.lat,
      destCoords.lon
    );
    
    console.log(`Great circle distance: ${greatCircleKm.toFixed(2)} km`);
    
    // Apply mode-specific adjustment
    const actualDistance = applyModeAdjustment(greatCircleKm, transportMode);
    
    console.log(`${transportMode} distance: ${actualDistance.toFixed(2)} km`);
    
    // Determine route type description
    let routeType;
    switch (transportMode) {
      case 'flight':
        if (actualDistance < 550) {
          routeType = 'Short-haul flight (GCD +2.5%)';
        } else if (actualDistance < 5500) {
          routeType = 'Medium-haul flight (GCD +9.5%)';
        } else {
          routeType = 'Long-haul flight (GCD +5%)';
        }
        break;
      case 'train':
        routeType = 'Rail route (GCD +15%)';
        break;
      case 'bus':
        routeType = 'Road route - bus (GCD +27%)';
        break;
      case 'car':
        routeType = 'Road route - car (GCD +27%)';
        break;
      case 'motorcycle':
        routeType = 'Road route - motorcycle (GCD +27%)';
        break;
      case 'walk':
        routeType = 'Walking route (GCD +30%)';
        break;
      default:
        routeType = 'Direct distance';
    }
    
    return {
      distance: Math.round(actualDistance),
      greatCircleDistance: Math.round(greatCircleKm),
      origin: originCoords.displayName,
      destination: destCoords.displayName,
      originCity: originCoords.city,
      destCity: destCoords.city,
      originCountry: originCoords.country,
      destCountry: destCoords.country,
      routeType: routeType,
      transportMode: transportMode,
      coordinates: {
        origin: { lat: originCoords.lat, lon: originCoords.lon },
        destination: { lat: destCoords.lat, lon: destCoords.lon }
      }
    };
    
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw error;
  }
};

/**
 * Utility: Calculate distance from coordinates (for testing)
 */
export const calculateDistanceFromCoords = (lat1, lon1, lat2, lon2, transportMode = 'flight') => {
  const greatCircleKm = haversineDistance(lat1, lon1, lat2, lon2);
  const actualDistance = applyModeAdjustment(greatCircleKm, transportMode);
  
  return {
    distance: Math.round(actualDistance),
    greatCircleDistance: Math.round(greatCircleKm),
    routeType: `${transportMode} distance`
  };
};

/**
 * Test function: Verify Haversine accuracy
 * Example: London to Paris should be ~344 km
 */
export const testHaversine = () => {
  // London: 51.5074° N, 0.1278° W
  // Paris: 48.8566° N, 2.3522° E
  const distance = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
  console.log(`London to Paris: ${distance.toFixed(2)} km (Expected: ~344 km)`);
  
  // New York to Los Angeles
  // NY: 40.7128° N, 74.0060° W
  // LA: 34.0522° N, 118.2437° W
  const usDistance = haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
  console.log(`NYC to LA: ${usDistance.toFixed(2)} km (Expected: ~3936 km)`);
  
  return {
    londonParis: distance.toFixed(2),
    nyLa: usDistance.toFixed(2)
  };
};

export default {
  geocodeLocation,
  calculateTravelDistance,
  calculateDistanceFromCoords,
  haversineDistance,
  testHaversine
};