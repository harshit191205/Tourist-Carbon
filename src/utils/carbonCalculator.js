/**
 * SIMPLIFIED CARBON CALCULATOR
 * Using standard emission factors
 */

import {
  transportFactors,
  accommodationFactors,
  foodFactors,
  activityFactors
} from '../data/emissionFactors';

/**
 * Calculate transport emissions
 * Formula: Distance × Emission Factor
 */
export const calculateTransportEmissions = (transportData) => {
  const { mode, distance } = transportData;
  
  let factor = 0;
  
  // Map mode to emission factor
  switch (mode) {
    case 'flight':
      factor = transportFactors.flight;
      break;
    case 'train':
      factor = transportFactors.train;
      break;
    case 'bus':
      factor = transportFactors.bus;
      break;
    case 'car':
      // Use vehicle type if available
      if (transportData.vehicleType === 'diesel') {
        factor = transportFactors['car-diesel'];
      } else {
        factor = transportFactors['car-petrol'];
      }
      // Divide by number of passengers
      if (transportData.passengers && transportData.passengers > 1) {
        factor = factor / transportData.passengers;
      }
      break;
    case 'motorcycle':
      factor = transportFactors['car-petrol'] * 0.5; // Roughly half of car
      break;
    case 'bicycle':
      factor = transportFactors.bicycle;
      break;
    case 'walk':
      factor = transportFactors.walk;
      break;
    default:
      factor = 0;
  }
  
  const emissions = distance * factor;
  
  return {
    total: emissions.toFixed(2),
    factor: factor.toFixed(3),
    formula: `${distance} km × ${factor.toFixed(3)} kg CO₂e/km = ${emissions.toFixed(2)} kg CO₂e`
  };
};

/**
 * Calculate accommodation emissions
 * Formula: Nights × Emission Factor
 */
export const calculateAccommodationEmissions = (accommodationData) => {
  const { type, nights } = accommodationData;
  
  let factor = 0;
  
  // Map type to emission factor
  switch (type) {
    case 'hotel':
      factor = accommodationData.starRating >= 4 
        ? accommodationFactors['5star-hotel'] 
        : accommodationFactors['3star-hotel'];
      break;
    case 'hostel':
      factor = accommodationFactors.hostel;
      break;
    case 'Homestay':
      factor = accommodationFactors['budget-hotel'];
      break;
    case 'ecoresort':
      factor = accommodationFactors['eco-lodge'];
      break;
    default:
      factor = accommodationFactors.guesthouse;
  }
  
  // Adjust for room sharing
  if (accommodationData.roomSharing === 'shared') {
    factor = factor * 0.5; // 50% reduction when sharing
  }
  
  const emissions = nights * factor;
  
  return {
    total: emissions.toFixed(2),
    factor: factor.toFixed(2),
    formula: `${nights} nights × ${factor.toFixed(2)} kg CO₂e/night = ${emissions.toFixed(2)} kg CO₂e`
  };
};

/**
 * Calculate food & activity emissions
 * Formula: (Meals × Food Factor) + (Activities × Activity Factor)
 */
export const calculateActivityEmissions = (activityData, nights) => {
  const { mealsPerDay, dietType, activities } = activityData;
  
  // Food emissions
  const mealFactor = dietType === 'vegetarian' || dietType === 'vegan' 
    ? foodFactors.vegetarian 
    : foodFactors['non-vegetarian'];
  
  const totalMeals = mealsPerDay * nights;
  const foodEmissions = totalMeals * mealFactor;
  
  // Activity emissions
  let activityEmissions = 0;
  
  // Sightseeing (assume daily)
  if (activities.includes('sightseeing') || activities.includes('cultural')) {
    activityEmissions += nights * activityFactors.sightseeing;
  }
  
  // Adventure activities
  const adventureActivities = activities.filter(a => 
    ['hiking', 'water-sports', 'skiing', 'adventure'].includes(a)
  );
  if (adventureActivities.length > 0) {
    activityEmissions += adventureActivities.length * activityFactors.adventure;
  }
  
  // Shopping
  if (activities.includes('shopping')) {
    const shoppingIntensity = activityData.shoppingIntensity || 'moderate';
    const shoppingItems = shoppingIntensity === 'heavy' ? 10 : shoppingIntensity === 'moderate' ? 5 : 2;
    activityEmissions += shoppingItems * activityFactors.shopping;
  }
  
  const totalEmissions = foodEmissions + activityEmissions;
  
  return {
    total: totalEmissions.toFixed(2),
    food: foodEmissions.toFixed(2),
    activities: activityEmissions.toFixed(2),
    mealFactor: mealFactor.toFixed(2),
    formula: `Food: ${totalMeals} meals × ${mealFactor.toFixed(2)} + Activities: ${activityEmissions.toFixed(2)} = ${totalEmissions.toFixed(2)} kg CO₂e`
  };
};

/**
 * Calculate total emissions
 */
export const calculateTotalEmissions = (
  transportData,
  accommodationData,
  activityData,
  tripDetails
) => {
  const nights = accommodationData.nights;
  const days = nights + 1;
  
  // Calculate each component
  const transport = calculateTransportEmissions(transportData);
  const accommodation = calculateAccommodationEmissions(accommodationData);
  const activities = calculateActivityEmissions(activityData, nights);
  
  // Total
  const total = (
    parseFloat(transport.total) +
    parseFloat(accommodation.total) +
    parseFloat(activities.total)
  ).toFixed(2);
  
  // Percentages
  const transportPercent = ((parseFloat(transport.total) / parseFloat(total)) * 100).toFixed(1);
  const accommodationPercent = ((parseFloat(accommodation.total) / parseFloat(total)) * 100).toFixed(1);
  const activitiesPercent = ((parseFloat(activities.total) / parseFloat(total)) * 100).toFixed(1);
  
  return {
    total: total,
    transport: transport.total,
    accommodation: accommodation.total,
    activities: activities.total,
    food: activities.food,
    
    // Percentages
    transportPercentage: transportPercent,
    accommodationPercentage: accommodationPercent,
    activitiesPercentage: activitiesPercent,
    
    // Per unit calculations
    perDay: (parseFloat(total) / days).toFixed(2),
    perNight: (parseFloat(total) / nights).toFixed(2),
    perKm: (parseFloat(transport.total) / transportData.distance).toFixed(3),
    
    // Days
    days: days,
    nights: nights,
    
    // Formulas for transparency
    transportFormula: transport.formula,
    accommodationFormula: accommodation.formula,
    activitiesFormula: activities.formula,
    
    // Factors used
    transportFactor: transport.factor,
    accommodationFactor: accommodation.factor,
    mealFactor: activities.mealFactor,
    
    // Category
    category: parseFloat(total) < 50 ? 'Low Impact' : 
              parseFloat(total) < 150 ? 'Medium Impact' : 'High Impact',
    
    // Offset cost (₹6 per kg CO₂e)
    offsetCostINR: (parseFloat(total) * 6).toFixed(0),
    
    // Details
    transportDetails: {
      mode: transportData.mode,
      distance: transportData.distance,
      factor: transport.factor
    },
    accommodationDetails: {
      type: accommodationData.type,
      nights: nights,
      factor: accommodation.factor
    },
    activityDetails: {
      meals: activityData.mealsPerDay * nights,
      dietType: activityData.dietType,
      activities: activityData.activities.length
    }
  };
};

/**
 * Calculate eco score (0-100)
 */
export const calculateEcoScore = (totalEmissions, days) => {
  const perDay = totalEmissions / days;
  
  let score = 0;
  
  if (perDay <= 10) score = 100;
  else if (perDay <= 20) score = 90;
  else if (perDay <= 30) score = 75;
  else if (perDay <= 50) score = 60;
  else if (perDay <= 75) score = 40;
  else if (perDay <= 100) score = 25;
  else score = 10;
  
  return score;
};

export default {
  calculateTransportEmissions,
  calculateAccommodationEmissions,
  calculateActivityEmissions,
  calculateTotalEmissions,
  calculateEcoScore
};
