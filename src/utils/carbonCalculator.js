// Standard emission factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  // Transport (per km)
  transport: {
    flight: 0.175,
    train: 0.03,
    car_petrol: 0.215,
    car_diesel: 0.19,
    car_cng: 0.13,
    car_ev: 0.05,
    car_hybrid: 0.10,  // Added hybrid
    car_electric: 0.05, // Added electric (same as car_ev)
    car: 0.215,  // Generic car fallback
    bus: 0.09,
    motorcycle: 0.12,
    bicycle: 0,
    walk: 0
  },
  
  // Accommodation (per night)
  accommodation: {
    '5_star_hotel': 40,
    '3_star_hotel': 20,
    'budget_hotel': 12.5,
    'guesthouse': 10,
    'eco_lodge': 7.5,
    'hostel': 6.5,
    'camping': 2.5,
    'hotel': 20,  // Generic hotel fallback
    'ecoresort': 7.5,  // Match your form value
    'Homestay': 10     // Match your form value (capital H)
  },
  
  // Activities
  activities: {
    sightseeing: 2,
    adventure_sports: 10,
    water_sports: 8,
    wildlife_safari: 15,
    cultural_tour: 3,
    shopping: 1,
    spa_wellness: 5,
    hiking: 1,
    skiing: 12,
    dining: 2,
    nightlife: 3,
    cultural: 3,
    adventure: 10,
    relaxation: 1,
    'water-sports': 8  // Match your form value
  },
  
  // Food (per meal)
  food: {
    non_veg: 4,
    veg: 1.5,
    vegan: 1.0
  }
};


// Calculate transport emissions
const calculateTransportEmissions = (transportData) => {
  console.log('🚗 Calculating transport emissions:', transportData);
  
  if (!transportData || !transportData.mode) {
    console.log('⚠️ No transport data provided');
    return 0;
  }

  const { mode, distance, vehicleType, passengers } = transportData;
  
  // Validate inputs
  const validDistance = Number(distance) || 0;
  const validPassengers = Number(passengers) || 1;
  
  if (validDistance <= 0) {
    console.log('⚠️ Invalid distance:', distance);
    return 0;
  }

  // Determine the correct emission factor key
  let factorKey = mode.toLowerCase();
  
  // Handle car/motorcycle with vehicle type
  if ((mode === 'car' || mode === 'motorcycle') && vehicleType) {
    factorKey = `${mode}_${vehicleType}`;
  }
  
  // Get emission factor with fallbacks
  let emissionFactor = EMISSION_FACTORS.transport[factorKey];
  
  // Fallback chain for cars
  if (!emissionFactor && mode === 'car') {
    emissionFactor = EMISSION_FACTORS.transport.car_petrol; // Default to petrol
    console.log('ℹ️ Using car_petrol factor as fallback for car');
  }
  
  // Final fallback
  if (!emissionFactor) {
    emissionFactor = EMISSION_FACTORS.transport[mode] || 0;
  }
  
  // Calculate total emissions
  const totalEmissions = emissionFactor * validDistance;
  
  // Divide by passengers for per-person emissions
  const emissionsPerPerson = totalEmissions / validPassengers;
  
  console.log(`📊 Transport: ${factorKey}, ${validDistance}km, ${validPassengers} passengers`);
  console.log(`📊 Factor: ${emissionFactor}, Total: ${totalEmissions.toFixed(2)} kg CO₂, Per person: ${emissionsPerPerson.toFixed(2)} kg CO₂`);
  
  return emissionsPerPerson;
};


// Calculate accommodation emissions
const calculateAccommodationEmissions = (accommodationData) => {
  console.log('🏨 Calculating accommodation emissions:', accommodationData);
  
  if (!accommodationData || !accommodationData.type) {
    console.log('⚠️ No accommodation data provided');
    return 0;
  }

  const { type, nights, roomSharing, starRating } = accommodationData;
  
  // Validate inputs
  const validNights = Number(nights) || 0;
  
  if (validNights <= 0) {
    console.log('⚠️ Invalid nights:', nights);
    return 0;
  }

  // Get emission factor with fallbacks
  let emissionFactor = EMISSION_FACTORS.accommodation[type];
  
  // Fallback for hotel types with star ratings
  if (!emissionFactor && type === 'hotel' && starRating) {
    const starFactors = {
      1: 12.5,
      2: 12.5,
      3: 20,
      4: 30,
      5: 40
    };
    emissionFactor = starFactors[starRating] || 20;
    console.log(`ℹ️ Using ${starRating}-star hotel factor: ${emissionFactor}`);
  }
  
  // Final fallback
  if (!emissionFactor) {
    emissionFactor = 20; // Default to 3-star hotel
    console.log('ℹ️ Using default hotel factor: 20');
  }
  
  // Apply sharing discount (50% off if sharing)
  const sharingMultiplier = roomSharing === 'sharing' ? 0.5 : 1;
  
  const emissions = emissionFactor * validNights * sharingMultiplier;
  
  console.log(`📊 Accommodation: ${type}, ${validNights} nights, ${roomSharing}`);
  console.log(`📊 Factor: ${emissionFactor}, Multiplier: ${sharingMultiplier}, Emissions: ${emissions.toFixed(2)} kg CO₂`);
  
  return emissions;
};


// Calculate activity emissions
const calculateActivityEmissions = (activityData) => {
  console.log('🎯 Calculating activity emissions:', activityData);
  
  if (!activityData) {
    console.log('⚠️ No activity data provided');
    return 0;
  }

  let totalEmissions = 0;

  // Calculate emissions from activities list
  if (activityData.activities && Array.isArray(activityData.activities)) {
    activityData.activities.forEach(activity => {
      // Handle both object format {type, count} and string format
      let activityType, activityCount;
      
      if (typeof activity === 'object') {
        activityType = activity.type;
        activityCount = Number(activity.count) || 1;
      } else {
        activityType = activity;
        activityCount = 1;
      }
      
      const emissionFactor = EMISSION_FACTORS.activities[activityType] || 2; // Default 2kg
      const emissions = emissionFactor * activityCount;
      totalEmissions += emissions;
      
      console.log(`📊 Activity: ${activityType}, Count: ${activityCount}, Factor: ${emissionFactor}, Emissions: ${emissions.toFixed(2)} kg CO₂`);
    });
  }

  // Add food/meal emissions if provided
  if (activityData.mealsPerDay) {
    const mealsPerDay = Number(activityData.mealsPerDay) || 0;
    const nights = activityData.nights || 1; // Assume 1 if not provided
    
    // Assume 60% veg, 40% non-veg mix
    const avgMealEmission = (EMISSION_FACTORS.food.veg * 0.6) + (EMISSION_FACTORS.food.non_veg * 0.4);
    const totalMeals = mealsPerDay * nights;
    const mealEmissions = avgMealEmission * totalMeals;
    
    totalEmissions += mealEmissions;
    console.log(`📊 Meals: ${totalMeals} meals (${mealsPerDay}/day × ${nights} nights), Emissions: ${mealEmissions.toFixed(2)} kg CO₂`);
  }

  // Add shopping emissions if provided
  if (activityData.shoppingIntensity) {
    const shoppingFactors = {
      'low': 5,
      'moderate': 15,
      'high': 30
    };
    const shoppingEmissions = shoppingFactors[activityData.shoppingIntensity] || 0;
    totalEmissions += shoppingEmissions;
    console.log(`📊 Shopping (${activityData.shoppingIntensity}): ${shoppingEmissions.toFixed(2)} kg CO₂`);
  }

  console.log(`✅ Total activity emissions: ${totalEmissions.toFixed(2)} kg CO₂`);
  
  return totalEmissions;
};


// Calculate total emissions
const calculateTotalEmissions = (transportData, accommodationData, activityData, tripDetails) => {
  console.log('🧮 Starting total emissions calculation...');
  console.log('Transport Data:', transportData);
  console.log('Accommodation Data:', accommodationData);
  console.log('Activity Data:', activityData);
  console.log('Trip Details:', tripDetails);

  try {
    // Pass nights to activity data if not already there
    const enrichedActivityData = {
      ...activityData,
      nights: accommodationData?.nights || activityData?.nights || 1
    };

    // Calculate individual components
    const transportEmissions = calculateTransportEmissions(transportData);
    const accommodationEmissions = calculateAccommodationEmissions(accommodationData);
    const activityEmissions = calculateActivityEmissions(enrichedActivityData);

    // Ensure all values are valid numbers
    const validTransport = Number(transportEmissions) || 0;
    const validAccommodation = Number(accommodationEmissions) || 0;
    const validActivity = Number(activityEmissions) || 0;

    // Calculate total
    const totalEmissions = validTransport + validAccommodation + validActivity;

    const result = {
      transportEmissions: validTransport,
      accommodationEmissions: validAccommodation,
      activityEmissions: validActivity,
      totalEmissions: totalEmissions
    };

    console.log('✅ Final emissions calculation:', result);

    // Validate result
    if (isNaN(result.totalEmissions) || result.totalEmissions < 0) {
      console.error('❌ Invalid total emissions:', result.totalEmissions);
      throw new Error('Invalid emissions calculation result');
    }

    return result;
  } catch (error) {
    console.error('❌ Error in calculateTotalEmissions:', error);
    throw error;
  }
};


// Get recommendations based on emissions
const getRecommendations = (emissions) => {
  const recommendations = [];
  
  if (emissions.transportEmissions > 100) {
    recommendations.push({
      category: 'Transport',
      icon: '🚆',
      suggestion: 'Consider taking a train instead of flying for distances under 1000km',
      potentialSavings: emissions.transportEmissions * 0.83
    });
  }
  
  if (emissions.accommodationEmissions > 100) {
    recommendations.push({
      category: 'Accommodation',
      icon: '🏨',
      suggestion: 'Choose eco-lodges or hostels instead of luxury hotels',
      potentialSavings: emissions.accommodationEmissions * 0.70
    });
  }
  
  if (emissions.activityEmissions > 50) {
    recommendations.push({
      category: 'Activities',
      icon: '🎯',
      suggestion: 'Opt for low-carbon activities like walking tours and cultural experiences',
      potentialSavings: emissions.activityEmissions * 0.40
    });
  }
  
  return recommendations;
};


// Calculate carbon credits earned
const calculateCarbonCredits = (emissions) => {
  // 1 carbon credit = 10 kg CO2e reduced
  // Base credits for tracking
  const trackingCredits = 10;
  
  // Bonus credits for low emissions
  let bonusCredits = 0;
  if (emissions.totalEmissions < 50) {
    bonusCredits = 50;
  } else if (emissions.totalEmissions < 100) {
    bonusCredits = 30;
  } else if (emissions.totalEmissions < 200) {
    bonusCredits = 20;
  }
  
  return trackingCredits + bonusCredits;
};


// Calculate offset cost (in rupees)
const calculateOffsetCost = (emissions) => {
  // Average offset cost: ₹800 per tonne CO2 = ₹0.8 per kg
  const costPerKg = 0.8;
  return emissions.totalEmissions * costPerKg;
};


// Get emission level
const getEmissionLevel = (totalEmissions) => {
  if (totalEmissions < 50) return { level: 'Excellent', color: 'green', emoji: '🌟' };
  if (totalEmissions < 150) return { level: 'Good', color: 'emerald', emoji: '✅' };
  if (totalEmissions < 300) return { level: 'Moderate', color: 'yellow', emoji: '⚠️' };
  if (totalEmissions < 500) return { level: 'High', color: 'orange', emoji: '🔥' };
  return { level: 'Very High', color: 'red', emoji: '⛔' };
};


// Export all functions
const carbonCalculator = {
  calculateTransportEmissions,
  calculateAccommodationEmissions,
  calculateActivityEmissions,
  calculateTotalEmissions,
  getRecommendations,
  calculateCarbonCredits,
  calculateOffsetCost,
  getEmissionLevel,
  EMISSION_FACTORS
};

export default carbonCalculator;
