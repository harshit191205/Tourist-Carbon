/**
 * SIMPLIFIED EMISSION FACTORS
 * Based on standard carbon accounting practices
 * Values in kg CO₂e per unit
 */

// TRANSPORT EMISSION FACTORS (kg CO₂e per passenger-km)
export const transportFactors = {
  walk: 0.000,
  bicycle: 0.000,
  bus: 0.09,           // Average of 0.08-0.10
  train: 0.03,         // Average of 0.02-0.04 (electric)
  'car-petrol': 0.215, // Average of 0.18-0.25
  'car-diesel': 0.19,  // Average of 0.16-0.22
  flight: 0.175        // Average of 0.15-0.20 (domestic)
};

// ACCOMMODATION EMISSION FACTORS (kg CO₂e per night)
export const accommodationFactors = {
  hostel: 6.5,        // Average of 5-8
  'budget-hotel': 12.5, // Average of 10-15
  '3star-hotel': 20,  // Average of 15-25
  '5star-hotel': 40,  // Average of 30-50
  'eco-lodge': 7.5,   // Average of 5-10
  guesthouse: 10      // Average of 8-12
};

// FOOD EMISSION FACTORS (kg CO₂e per meal)
export const foodFactors = {
  vegetarian: 1.5,    // Average of 1-2
  'non-vegetarian': 4 // Average of 3-5
};

// ACTIVITY EMISSION FACTORS (kg CO₂e per day or per item)
export const activityFactors = {
  sightseeing: 2,      // Average of 1-3 per day
  adventure: 10,       // Average of 5-15
  shopping: 1          // Average of 0.5-2 per item
};

/**
 * Calculate transport emissions
 * Formula: Distance (km) × Emission Factor (kg CO₂e/km)
 */
export const calculateTransportEmission = (mode, distance) => {
  const factor = transportFactors[mode] || 0;
  return distance * factor;
};

/**
 * Calculate accommodation emissions
 * Formula: Nights × Emission Factor (kg CO₂e/night)
 */
export const calculateAccommodationEmission = (type, nights) => {
  const factor = accommodationFactors[type] || 0;
  return nights * factor;
};

/**
 * Calculate food emissions
 * Formula: Meals × Emission Factor (kg CO₂e/meal)
 */
export const calculateFoodEmission = (mealType, numberOfMeals) => {
  const factor = foodFactors[mealType] || 0;
  return numberOfMeals * factor;
};

/**
 * Calculate activity emissions
 * Formula: Days/Items × Emission Factor
 */
export const calculateActivityEmission = (activityType, quantity) => {
  const factor = activityFactors[activityType] || 0;
  return quantity * factor;
};

export default {
  transportFactors,
  accommodationFactors,
  foodFactors,
  activityFactors,
  calculateTransportEmission,
  calculateAccommodationEmission,
  calculateFoodEmission,
  calculateActivityEmission
};
