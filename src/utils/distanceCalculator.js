import axios from 'axios';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const OSRM_API = 'https://router.project-osrm.org';

// Calculate straight-line distance (for flights)
const calculateStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
};

// Geocode location to get coordinates
export const geocodeLocation = async (location) => {
  try {
    const response = await axios.get(`${NOMINATIM_API}/search`, {
      params: {
        q: location,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'TouristCarbonFootprintApp/1.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
        displayName: response.data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Calculate road distance using OSRM (for car, bus, motorcycle)
const calculateRoadDistance = async (originCoords, destCoords, profile = 'car') => {
  try {
    const url = `${OSRM_API}/route/v1/${profile}/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}`;
    
    const response = await axios.get(url, {
      params: {
        overview: 'false',
        alternatives: 'false',
        steps: 'false'
      }
    });
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const distanceInMeters = response.data.routes[0].distance;
      return Math.round(distanceInMeters / 1000); // Convert to km
    }
    return null;
  } catch (error) {
    console.error('Road routing error:', error);
    return null;
  }
};

// Calculate distance based on transport mode
export const calculateTravelDistance = async (origin, destination, transportMode) => {
  try {
    // Geocode both locations
    const originCoords = await geocodeLocation(origin);
    const destCoords = await geocodeLocation(destination);
    
    if (!originCoords || !destCoords) {
      throw new Error('Could not find one or both locations');
    }
    
    let distance;
    let routeType;
    
    switch (transportMode) {
      case 'flight':
        // Flight: Straight-line distance (great circle)
        distance = calculateStraightLineDistance(
          originCoords.lat,
          originCoords.lon,
          destCoords.lat,
          destCoords.lon
        );
        routeType = 'Air route (direct)';
        break;
        
      case 'car':
        // Car: Road distance using car routing
        distance = await calculateRoadDistance(originCoords, destCoords, 'car');
        if (!distance) {
          // Fallback to straight-line + 25% for road curves
          distance = Math.round(
            calculateStraightLineDistance(
              originCoords.lat,
              originCoords.lon,
              destCoords.lat,
              destCoords.lon
            ) * 1.25
          );
        }
        routeType = 'Road route (driving)';
        break;
        
      case 'motorcycle':
        // MOTORCYCLE: Same as car - uses road routing
        distance = await calculateRoadDistance(originCoords, destCoords, 'car');
        if (!distance) {
          distance = Math.round(
            calculateStraightLineDistance(
              originCoords.lat,
              originCoords.lon,
              destCoords.lat,
              destCoords.lon
            ) * 1.25
          );
        }
        routeType = 'Road route (motorcycle)';
        break;
        
      case 'bus':
        // Bus: Similar to car but may take highways
        distance = await calculateRoadDistance(originCoords, destCoords, 'car');
        if (!distance) {
          distance = Math.round(
            calculateStraightLineDistance(
              originCoords.lat,
              originCoords.lon,
              destCoords.lat,
              destCoords.lon
            ) * 1.25
          );
        }
        routeType = 'Road route (bus)';
        break;
        
      case 'train':
        // Train: Approximate rail distance (20% more than straight-line)
        distance = Math.round(
          calculateStraightLineDistance(
            originCoords.lat,
            originCoords.lon,
            destCoords.lat,
            destCoords.lon
          ) * 1.20
        );
        routeType = 'Rail route (estimated)';
        break;
        
      case 'walk':
        // Walk: Road distance using foot routing
        distance = await calculateRoadDistance(originCoords, destCoords, 'foot');
        if (!distance) {
          distance = Math.round(
            calculateStraightLineDistance(
              originCoords.lat,
              originCoords.lon,
              destCoords.lat,
              destCoords.lon
            ) * 1.30
          );
        }
        routeType = 'Walking route';
        break;
        
      default:
        distance = calculateStraightLineDistance(
          originCoords.lat,
          originCoords.lon,
          destCoords.lat,
          destCoords.lon
        );
        routeType = 'Direct distance';
    }
    
    return {
      distance,
      origin: originCoords.displayName,
      destination: destCoords.displayName,
      routeType
    };
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw error;
  }
};
