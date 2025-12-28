import axios from 'axios';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const WGS84_A = 6378137.0;
const WGS84_B = 6356752.314245;
const WGS84_F = 1 / 298.257223563;

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = 'tourist_carbon_distance_';

const getCachedDistance = (origin, destination, mode) => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${origin}_${destination}_${mode}`.toLowerCase().replace(/\s+/g, '_');
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      const now = Date.now();
      
      if (now - data.timestamp < CACHE_EXPIRY) {
        console.log('✅ Using cached distance');
        return data.result;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error);
  }
  return null;
};

const setCachedDistance = (origin, destination, mode, result) => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${origin}_${destination}_${mode}`.toLowerCase().replace(/\s+/g, '_');
    const cacheData = {
      result: result,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('💾 Distance cached for future use');
  } catch (error) {
    console.warn('Cache write error:', error);
  }
};

const vincentyDistance = (lat1, lon1, lat2, lon2) => {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const λ1 = toRadians(lon1);
  const λ2 = toRadians(lon2);
  
  const L = λ2 - λ1;
  const U1 = Math.atan((1 - WGS84_F) * Math.tan(φ1));
  const U2 = Math.atan((1 - WGS84_F) * Math.tan(φ2));
  
  const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
  
  let λ = L, λPrev, iterLimit = 100;
  let sinλ, cosλ, sinσ, cosσ, σ, sinα, cos2αM, cos2σM, C;
  
  do {
    sinλ = Math.sin(λ);
    cosλ = Math.cos(λ);
    const sinSqσ = (cosU2 * sinλ) ** 2 + 
                   (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) ** 2;
    sinσ = Math.sqrt(sinSqσ);
    
    if (sinσ === 0) return 0;
    
    cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
    σ = Math.atan2(sinσ, cosσ);
    sinα = cosU1 * cosU2 * sinλ / sinσ;
    cos2αM = 1 - sinα ** 2;
    cos2σM = cosσ - 2 * sinU1 * sinU2 / cos2αM;
    
    if (isNaN(cos2σM)) cos2σM = 0;
    
    C = WGS84_F / 16 * cos2αM * (4 + WGS84_F * (4 - 3 * cos2αM));
    λPrev = λ;
    λ = L + (1 - C) * WGS84_F * sinα *
        (σ + C * sinσ * (cos2σM + C * cosσ * (-1 + 2 * cos2σM ** 2)));
        
  } while (Math.abs(λ - λPrev) > 1e-12 && --iterLimit > 0);
  
  if (iterLimit === 0) {
    console.warn('Vincenty did not converge, using Haversine');
    return haversineDistance(lat1, lon1, lat2, lon2);
  }
  
  const uSq = cos2αM * (WGS84_A ** 2 - WGS84_B ** 2) / (WGS84_B ** 2);
  const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const Δσ = B * sinσ * (cos2σM + B / 4 * 
             (cosσ * (-1 + 2 * cos2σM ** 2) -
              B / 6 * cos2σM * (-3 + 4 * sinσ ** 2) * (-3 + 4 * cos2σM ** 2)));
  
  const distance = WGS84_B * A * (σ - Δσ);
  
  return distance / 1000;
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);
  
  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

const getModeAdjustment = (gcdKm, mode, originLat, destLat) => {
  let factor = 1.0;
  let description = '';
  
  const latDiff = Math.abs(destLat - originLat);
  const isTranscontinental = gcdKm > 5000;
  const isMountainous = latDiff > 20 && gcdKm < 2000;
  
  switch (mode) {
    case 'flight': {
      if (gcdKm < 500) {
        factor = 1.09;
        description = 'Short-haul flight (+9% for airport procedures & routing)';
      } else if (gcdKm < 1500) {
        factor = 1.06;
        description = 'Regional flight (+6% for ATC routing)';
      } else if (gcdKm < 3700) {
        factor = 1.04;
        description = 'Medium-haul flight (+4% for routing)';
      } else if (gcdKm < 8000) {
        factor = 1.03;
        description = 'Long-haul flight (+3% for routing)';
      } else {
        factor = 1.02;
        description = 'Ultra long-haul flight (+2% for routing)';
      }
      break;
    }
    
    case 'train': {
      if (gcdKm < 150) {
        factor = 1.18;
        description = 'Local/regional rail (+18% for stops & track routing)';
      } else if (gcdKm < 500) {
        factor = 1.12;
        description = 'Regional train (+12% for track routing)';
      } else if (gcdKm < 1500) {
        factor = 1.10;
        description = 'Intercity rail (+10% for track routing)';
      } else {
        factor = 1.08;
        description = 'Long-distance rail (+8% for efficient routing)';
      }
      
      if (isMountainous) {
        factor += 0.07;
        description += ' (mountainous terrain)';
      }
      break;
    }
    
    case 'bus':
    case 'car':
    case 'motorcycle': {
      if (gcdKm < 50) {
        factor = 1.40;
        description = 'Urban roads (+40% for city routing & traffic)';
      } else if (gcdKm < 150) {
        factor = 1.28;
        description = 'Regional roads (+28% for routing)';
      } else if (gcdKm < 500) {
        factor = 1.20;
        description = 'Highway route (+20% for routing)';
      } else if (gcdKm < 1500) {
        factor = 1.16;
        description = 'Long-distance highway (+16%)';
      } else {
        factor = 1.15;
        description = 'Transcontinental highway (+15%)';
      }
      
      if (isMountainous) {
        factor += 0.10;
        description += ' (mountain roads)';
      }
      
      if (isTranscontinental) {
        factor += 0.05;
        description += ' (transcontinental)';
      }
      break;
    }
    
    case 'bicycle':
    case 'walk': {
      if (gcdKm < 5) {
        factor = 1.50;
        description = 'Walking/cycling paths (+50% urban routing)';
      } else if (gcdKm < 20) {
        factor = 1.35;
        description = 'Cycling routes (+35% for safe paths)';
      } else {
        factor = 1.28;
        description = 'Long-distance cycling (+28%)';
      }
      break;
    }
    
    default:
      factor = 1.0;
      description = 'Direct geodesic distance (default)';
  }
  
  return { factor, description };
};

export const geocodeLocation = async (location, retries = 3) => {
  location = location.trim();
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`🔍 Geocoding attempt ${attempt + 1}: "${location}"`);
      
      const response = await axios.get(`${NOMINATIM_API}/search`, {
        params: {
          q: location,
          format: 'json',
          limit: 5,
          addressdetails: 1,
          'accept-language': 'en'
        },
        headers: {
          'User-Agent': 'TouristCarbonCalculator/3.0 (Educational Project)'
        },
        timeout: 15000
      });
      
      if (response.data && response.data.length > 0) {
        const result = response.data.find(r => 
          r.type === 'city' || 
          r.type === 'town' ||
          r.type === 'administrative' || 
          r.class === 'place' ||
          r.class === 'boundary'
        ) || response.data[0];
        
        console.log(`✅ Found: ${result.display_name}`);
        
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          displayName: result.display_name,
          country: result.address?.country || 'Unknown',
          city: result.address?.city || 
                result.address?.town || 
                result.address?.village || 
                result.name || 'Unknown',
          state: result.address?.state || '',
          type: result.type,
          importance: result.importance
        };
      }
    } catch (error) {
      console.warn(`⚠️ Geocoding attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw new Error(`Could not geocode "${location}". Please try format: "City, Country" (e.g., "New Delhi, India")`);
};

export const calculateTravelDistance = async (origin, destination, transportMode = 'flight') => {
  try {
    console.log(`\n🗺️  Calculating Distance`);
    console.log(`   Route: ${origin} → ${destination}`);
    console.log(`   Mode: ${transportMode}`);
    
    const cached = getCachedDistance(origin, destination, transportMode);
    if (cached) {
      return cached;
    }
    
    console.log(`\n🌍 Geocoding locations...`);
    const [originCoords, destCoords] = await Promise.all([
      geocodeLocation(origin),
      geocodeLocation(destination)
    ]);
    
    console.log(`\n📍 Origin: ${originCoords.city}, ${originCoords.country}`);
    console.log(`   Coordinates: ${originCoords.lat.toFixed(4)}, ${originCoords.lon.toFixed(4)}`);
    console.log(`📍 Destination: ${destCoords.city}, ${destCoords.country}`);
    console.log(`   Coordinates: ${destCoords.lat.toFixed(4)}, ${destCoords.lon.toFixed(4)}`);
    
    const gcdKm = vincentyDistance(
      originCoords.lat,
      originCoords.lon,
      destCoords.lat,
      destCoords.lon
    );
    
    console.log(`\n🌐 Geodesic distance (Vincenty): ${gcdKm.toFixed(2)} km`);
    
    const adjustment = getModeAdjustment(
      gcdKm, 
      transportMode,
      originCoords.lat,
      destCoords.lat
    );
    
    const actualDistance = gcdKm * adjustment.factor;
    
    console.log(`\n✅ ${transportMode.toUpperCase()} distance: ${actualDistance.toFixed(1)} km`);
    console.log(`   ${adjustment.description}`);
    console.log(`   Accuracy: Vincenty formula (±0.5mm) + empirical routing factors`);
    
    const result = {
      distance: Math.round(actualDistance),
      geodesicDistance: Math.round(gcdKm),
      adjustmentFactor: adjustment.factor,
      adjustmentPercent: ((adjustment.factor - 1) * 100).toFixed(1),
      origin: originCoords.displayName,
      destination: destCoords.displayName,
      originCity: originCoords.city,
      destCity: destCoords.city,
      originCountry: originCoords.country,
      destCountry: destCoords.country,
      routeType: adjustment.description,
      transportMode: transportMode,
      coordinates: {
        origin: { lat: originCoords.lat, lon: originCoords.lon },
        destination: { lat: destCoords.lat, lon: destCoords.lon }
      },
      calculationMethod: 'Vincenty (WGS84 ellipsoid)',
      accuracy: '±0.5mm geodesic + mode-specific routing adjustment',
      calculatedAt: new Date().toISOString()
    };
    
    setCachedDistance(origin, destination, transportMode, result);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Distance calculation error:', error);
    throw new Error(`Distance calculation failed: ${error.message}`);
  }
};

export const validateDistance = (origin, dest, calculatedKm) => {
  const knownRoutes = {
    'delhi-mumbai': { min: 1140, max: 1420, optimal: 1400 },
    'delhi-bangalore': { min: 1740, max: 2100, optimal: 2100 },
    'delhi-kolkata': { min: 1300, max: 1550, optimal: 1470 },
    'mumbai-bangalore': { min: 840, max: 1020, optimal: 980 },
    'delhi-chennai': { min: 1760, max: 2180, optimal: 2180 },
    'mumbai-kolkata': { min: 1650, max: 1950, optimal: 1950 },
    'london-paris': { min: 340, max: 460, optimal: 344 },
    'newyork-losangeles': { min: 3900, max: 4500, optimal: 3944 },
    'tokyo-osaka': { min: 400, max: 520, optimal: 515 },
    'sydney-melbourne': { min: 700, max: 880, optimal: 880 }
  };
  
  const routeKey = `${origin.toLowerCase().split(',')[0]}-${dest.toLowerCase().split(',')[0]}`;
  
  if (knownRoutes[routeKey]) {
    const route = knownRoutes[routeKey];
    if (calculatedKm >= route.min && calculatedKm <= route.max) {
      const accuracy = Math.abs(calculatedKm - route.optimal) / route.optimal * 100;
      console.log(`✅ Distance validated: ${accuracy.toFixed(1)}% deviation from known route`);
      return { valid: true, accuracy: accuracy.toFixed(1) };
    } else {
      console.warn(`⚠️  Distance ${calculatedKm}km outside expected range [${route.min}-${route.max}]`);
      return { valid: false, expected: route.optimal };
    }
  }
  
  return { valid: null, message: 'Unknown route - cannot validate' };
};

export const clearOldCache = () => {
  try {
    const now = Date.now();
    let cleared = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (now - data.timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch (e) {
          localStorage.removeItem(key);
          cleared++;
        }
      }
    }
    
    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} old cache entries`);
    }
  } catch (error) {
    console.warn('Cache cleanup error:', error);
  }
};

export const getCacheStats = () => {
  try {
    let total = 0;
    let valid = 0;
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        total++;
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (now - data.timestamp < CACHE_EXPIRY) {
            valid++;
          }
        } catch (e) {
          // Invalid entry
        }
      }
    }
    
    return {
      totalEntries: total,
      validEntries: valid,
      expiredEntries: total - valid
    };
  } catch (error) {
    return { totalEntries: 0, validEntries: 0, expiredEntries: 0 };
  }
};

clearOldCache();

export default {
  geocodeLocation,
  calculateTravelDistance,
  vincentyDistance,
  haversineDistance,
  validateDistance,
  clearOldCache,
  getCacheStats
};
