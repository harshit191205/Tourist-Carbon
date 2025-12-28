/**
 * ULTRA-ACCURATE CARBON CALCULATOR
 * 
 * ENHANCEMENTS:
 * 1. Individual experience factors (diet, travel frequency, room sharing)
 * 2. More accurate emission calculations per activity type
 * 3. Dynamic factors based on user preferences
 * 4. Detailed methodology transparency
 * 5. Context-aware recommendations
 */

import {
  defraTransportFactors,
  accommodationFactors,
  activityFactors,
  epaEquivalencies,
  globalBenchmarks,
  getFlightEmissionFactor,
  calculateEPAEquivalents
} from '../data/emissionFactors';

/**
 * ENHANCED TRANSPORT EMISSIONS
 * Now considers: cabin class, passengers, individual preferences
 */
export const calculateTransportEmissions = (transportData) => {
  const { mode, distance, cabinClass = 'economy', passengers = 1 } = transportData;
  const dist = parseFloat(distance);
  
  if (!dist || dist <= 0) return { emissions: "0.00", factor: 0, methodology: "No distance" };
  
  let factor = 0;
  let methodology = '';
  let details = {};
  
  switch (mode) {
    case 'flight': {
      const flightData = getFlightEmissionFactor(dist, cabinClass, false);
      factor = flightData.factor;
      const totalEmissions = factor * dist;
      
      methodology = `DEFRA 2024: ${flightData.category} flight, ${cabinClass} class (${(factor * 1000).toFixed(2)}g CO₂e/km)`;
      
      details = {
        baseEmissionFactor: flightData.baseEmission,
        distanceCategory: flightData.distanceCategory,
        cabinMultiplier: cabinClass === 'economy' ? 1.0 : 
                         cabinClass === 'premium_economy' ? 1.5 :
                         cabinClass === 'business' ? 3.0 : 4.0,
        rfNote: 'Excludes radiative forcing (+89% for full climate impact)',
        perPassenger: totalEmissions.toFixed(2)
      };
      
      return {
        emissions: totalEmissions.toFixed(2),
        factor: factor,
        methodology: methodology,
        details: details
      };
    }
    
    case 'train': {
      // Smart train selection based on distance
      if (dist > 800) {
        factor = defraTransportFactors.rail.highSpeedRail; // 0.014
        methodology = 'High-speed rail (electric, long-distance)';
      } else if (dist > 200) {
        factor = defraTransportFactors.rail.intercityTrain; // 0.041
        methodology = 'Intercity train (standard rail)';
      } else {
        factor = defraTransportFactors.rail.regionalTrain; // 0.045
        methodology = 'Regional train (commuter)';
      }
      
      const totalEmissions = factor * dist;
      
      details = {
        emissionFactor: factor,
        efficiency: 'Very high (electric, shared transport)',
        co2Comparison: `${((defraTransportFactors.flight.shortHaulEconomy / factor) * 100 - 100).toFixed(0)}% less than flying`
      };
      
      return {
        emissions: totalEmissions.toFixed(2),
        factor: factor,
        methodology: methodology,
        details: details
      };
    }
    
    case 'bus': {
      if (dist > 200) {
        factor = defraTransportFactors.bus.intercityCoach; // 0.027
        methodology = 'Long-distance coach (most efficient road transport)';
      } else {
        factor = defraTransportFactors.bus.cityBus; // 0.103
        methodology = 'City/local bus (urban routes)';
      }
      
      const totalEmissions = factor * dist;
      
      details = {
        emissionFactor: factor,
        efficiency: dist > 200 ? 'High' : 'Medium',
        note: 'Shared public transport - already per passenger'
      };
      
      return {
        emissions: totalEmissions.toFixed(2),
        factor: factor,
        methodology: methodology,
        details: details
      };
    }
    
    case 'car': {
      // CRITICAL: Proper occupancy handling
      const vehicleFactor = defraTransportFactors.car.petrolMedium; // 0.191 kg/vehicle-km
      const actualPassengers = Math.max(1, parseInt(passengers, 10));
      const perPassengerFactor = vehicleFactor / actualPassengers;
      
      const totalVehicleEmissions = vehicleFactor * dist;
      const perPassengerEmissions = totalVehicleEmissions / actualPassengers;
      
      methodology = `Medium petrol car: ${actualPassengers} passenger(s) (${(perPassengerFactor * 1000).toFixed(1)}g CO₂e/km per person)`;
      
      details = {
        vehicleEmissions: totalVehicleEmissions.toFixed(2),
        perPassenger: perPassengerEmissions.toFixed(2),
        passengers: actualPassengers,
        emissionReduction: actualPassengers > 1 ? `${(100 - (100 / actualPassengers)).toFixed(0)}% less per person vs solo` : 'Solo driving',
        carpoolSavings: actualPassengers === 1 ? (totalVehicleEmissions * 0.67).toFixed(0) : null
      };
      
      return {
        emissions: perPassengerEmissions.toFixed(2),
        factor: perPassengerFactor,
        methodology: methodology,
        details: details
      };
    }
    
    case 'motorcycle': {
      factor = defraTransportFactors.motorcycle.medium; // 0.103
      const totalEmissions = factor * dist;
      
      methodology = 'Medium motorcycle (125-500cc)';
      details = {
        emissionFactor: factor,
        note: 'Lower than cars but higher than public transport'
      };
      
      return {
        emissions: totalEmissions.toFixed(2),
        factor: factor,
        methodology: methodology,
        details: details
      };
    }
    
    case 'bicycle':
    case 'walk': {
      return {
        emissions: "0.00",
        factor: 0,
        methodology: 'Zero emissions (human-powered)',
        details: { impact: 'Excellent choice! No carbon emissions.' }
      };
    }
    
    default: {
      const totalEmissions = dist * 0.1;
      return {
        emissions: totalEmissions.toFixed(2),
        factor: 0.1,
        methodology: 'Estimated (mode not recognized)',
        details: {}
      };
    }
  }
};

/**
 * ENHANCED ACCOMMODATION EMISSIONS
 * Now considers: room sharing, hotel type nuances
 */
export const calculateAccommodationEmissions = (accommodationData) => {
  const { type, nights, roomSharing = 'alone' } = accommodationData;
  const n = parseInt(nights, 10);
  
  if (!n || n <= 0) return { emissions: "0.00", factor: 0, methodology: "No nights" };
  
  let factor = 0;
  let methodology = '';
  
  switch (type) {
    case 'hotel':
      factor = accommodationFactors.hotel3Star; // 24.3 kg/night
      methodology = 'Standard 3-star hotel (HCMI 2024 global median)';
      break;
    case 'hostel':
      factor = accommodationFactors.hostel; // 12.4 kg/night
      methodology = 'Hostel with shared facilities (50% less than hotels)';
      break;
    case 'homestay':
      factor = accommodationFactors.homestay; // 10.2 kg/night
      methodology = 'Homestay/B&B (residential efficiency)';
      break;
    case 'ecoresort':
      factor = accommodationFactors.ecoHotel; // 6.8 kg/night
      methodology = 'Eco-certified hotel (LEED/Green Key, 72% less than standard)';
      break;
    case 'airbnb':
      factor = accommodationFactors.airbnb; // 15.8 kg/night
      methodology = 'Airbnb apartment (residential building)';
      break;
    default:
      factor = accommodationFactors.hotel3Star;
      methodology = 'Standard hotel (default)';
  }
  
  let totalEmissions = factor * n;
  
  // Apply room sharing adjustment
  if (roomSharing === 'sharing') {
    totalEmissions *= 0.55; // 45% reduction per person when sharing
    methodology += ' (shared room: -45% per person)';
  }
  
  const details = {
    perNight: (totalEmissions / n).toFixed(2),
    baseFactorPerNight: factor,
    sharingBenefit: roomSharing === 'sharing' ? '45% reduction' : 'Could share to save 45%',
    comparisonToEco: type !== 'ecoresort' ? 
      `Switch to eco-hotel: -${(((factor - accommodationFactors.ecoHotel) / factor) * 100).toFixed(0)}%` : 
      'Already eco-friendly! ⭐'
  };
  
  return {
    emissions: totalEmissions.toFixed(2),
    factor: factor,
    methodology: methodology,
    details: details
  };
};

/**
 * ENHANCED ACTIVITY EMISSIONS
 * Now considers: diet type, activity intensity, meals
 */
export const calculateActivityEmissions = (activityData) => {
  const { sightseeing = 0, adventure = 0, localtravel = 0, events = 0, 
          mealsPerDay = 3, dietType = 'mixed' } = activityData;
  
  let total = 0;
  const breakdown = [];
  
  // Standard activities
  const activities = { sightseeing, adventure, localtravel, events };
  
  Object.keys(activities).forEach(key => {
    const count = parseInt(activities[key], 10) || 0;
    if (count === 0) return;
    
    let factor = 0;
    let description = '';
    
    switch (key) {
      case 'sightseeing':
        factor = activityFactors.sightseeing; // 4.2 kg
        description = 'City tours & sightseeing';
        break;
      case 'adventure':
        factor = activityFactors.hiking; // 2.1 kg (realistic)
        description = 'Adventure activities (hiking, etc.)';
        break;
      case 'localtravel':
        factor = activityFactors.taxiRide; // 2.1 kg per trip
        description = 'Local transport (taxis, short trips)';
        break;
      case 'events':
        factor = activityFactors.concertMedium; // 9.2 kg
        description = 'Events & entertainment';
        break;
    }
    
    const emissions = factor * count;
    total += emissions;
    
    breakdown.push({
      activity: key,
      description: description,
      count: count,
      factor: factor,
      emissions: emissions.toFixed(2)
    });
  });
  
  // MEALS - Diet-specific calculation
  const nights = Math.max(1, parseInt(activityData.nights || 1, 10));
  const totalMeals = mealsPerDay * nights;
  
  let mealFactor = 0;
  let dietDescription = '';
  
  switch (dietType) {
    case 'vegan':
      mealFactor = activityFactors.mealVegan; // 0.9 kg
      dietDescription = 'Vegan diet (lowest impact)';
      break;
    case 'vegetarian':
      mealFactor = activityFactors.mealVegetarian; // 1.5 kg
      dietDescription = 'Vegetarian diet (low impact)';
      break;
    case 'pescatarian':
      mealFactor = activityFactors.mealPescatarian || 2.2; // 2.2 kg
      dietDescription = 'Pescatarian diet (medium impact)';
      break;
    case 'mixed':
      mealFactor = activityFactors.mealAverage; // 2.5 kg
      dietDescription = 'Mixed diet (average)';
      break;
    case 'meat-heavy':
      mealFactor = activityFactors.mealBeef; // 5.8 kg
      dietDescription = 'Meat-heavy diet (high impact)';
      break;
    default:
      mealFactor = activityFactors.mealAverage;
      dietDescription = 'Average diet';
  }
  
  const mealEmissions = mealFactor * totalMeals;
  total += mealEmissions;
  
  breakdown.push({
    activity: 'meals',
    description: dietDescription,
    count: totalMeals,
    factor: mealFactor,
    emissions: mealEmissions.toFixed(2)
  });
  
  return {
    total: total.toFixed(2),
    breakdown: breakdown,
    mealImpact: {
      total: mealEmissions.toFixed(2),
      perMeal: mealFactor,
      potentialSavings: dietType !== 'vegan' ? 
        ((mealFactor - activityFactors.mealVegan) * totalMeals).toFixed(0) : 0
    }
  };
};

/**
 * MAIN CALCULATION - ULTRA-ACCURATE
 */
export const calculateTotalEmissions = (transportData, accommodationData, activityData, tripDetails) => {
  // Enhanced calculations
  const transportResult = calculateTransportEmissions(transportData);
  const accommodationResult = calculateAccommodationEmissions(accommodationData);
  const activityResult = calculateActivityEmissions({
    ...activityData,
    nights: accommodationData.nights
  });
  
  // Parse values
  const transport = parseFloat(transportResult.emissions);
  const accommodation = parseFloat(accommodationResult.emissions);
  const activities = parseFloat(activityResult.total);
  const total = transport + accommodation + activities;
  
  // Time metrics
  const nights = parseInt(accommodationData.nights, 10) || 1;
  const days = Math.max(nights, 1);
  const perDay = total / days;
  
  // EPA equivalents
  const equivalents = calculateEPAEquivalents(total);
  
  // Impact assessment with personalization
  const impact = assessImpactLevel(perDay, tripDetails.travelFrequency);
  
  // Global comparison
  const globalAvg = globalBenchmarks.avgTouristPerDay;
  const comparisonPercentage = ((perDay - globalAvg) / globalAvg) * 100;
  
  // Component percentages
  const transportPct = total > 0 ? (transport / total) * 100 : 0;
  const accommodationPct = total > 0 ? (accommodation / total) * 100 : 0;
  const activitiesPct = total > 0 ? (activities / total) * 100 : 0;
  
  // Efficiency metrics
  const distance = parseFloat(transportData.distance) || 0;
  const perKm = distance > 0 ? (transport / distance).toFixed(5) : '0.00000';
  const perNight = nights > 0 ? (accommodation / nights).toFixed(2) : '0.00';
  
  // Carbon offset cost
  const offsetCostUSD = (total / 1000) * 18.50;
  
  // Sustainability flags
  const isSustainable = perDay <= globalBenchmarks.sustainableDaily;
  const isLowCarbon = perDay <= globalBenchmarks.lowCarbonDaily;
  
  // Annual projection based on travel frequency
  const annualProjection = calculateAnnualProjection(total, tripDetails.travelFrequency);
  
  return {
    // Component emissions
    transport: transport.toFixed(2),
    accommodation: accommodation.toFixed(2),
    activities: activities.toFixed(2),
    total: total.toFixed(2),
    
    // Detailed methodology
    transportMethodology: transportResult.methodology,
    accommodationMethodology: accommodationResult.methodology,
    transportDetails: transportResult.details,
    accommodationDetails: accommodationResult.details,
    activityDetails: activityResult,
    
    // Time metrics
    perDay: perDay.toFixed(2),
    days: days,
    
    // Offset metrics
    treesNeeded: equivalents.treesNeeded,
    offsetCost: offsetCostUSD.toFixed(2),
    
    // Impact assessment
    category: impact.level,
    categoryColor: impact.color,
    categoryIcon: impact.icon,
    categoryMessage: impact.message,
    categoryBadge: impact.badge,
    percentile: impact.percentile,
    
    // Comparisons
    comparisonPercentage: parseFloat(comparisonPercentage.toFixed(1)),
    globalAverage: globalAvg,
    sustainableTarget: globalBenchmarks.sustainableDaily,
    isSustainable: isSustainable,
    isLowCarbon: isLowCarbon,
    
    // Percentages
    transportPercentage: parseFloat(transportPct.toFixed(1)),
    accommodationPercentage: parseFloat(accommodationPct.toFixed(1)),
    activitiesPercentage: parseFloat(activitiesPct.toFixed(1)),
    
    // Efficiency
    perKm: perKm,
    perNight: perNight,
    
    // EPA equivalents
    equivalents: equivalents,
    
    // Activity breakdown
    activityBreakdown: activityResult.breakdown,
    mealImpact: activityResult.mealImpact,
    
    // Annual context
    annualProjection: annualProjection,
    
    // Trip details
    transportMode: transportData.mode,
    accommodationType: accommodationData.type,
    totalActivities: (activityData.sightseeing || 0) + (activityData.adventure || 0) + 
                     (activityData.localtravel || 0) + (activityData.events || 0),
    
    // Metadata
    calculationDate: new Date().toISOString(),
    dataSource: 'DEFRA 2024 + HCMI 2024 + EPA 2024',
    accuracyNote: 'High-precision calculation with individual factors',
    tripDetails: tripDetails
  };
};

/**
 * Impact level assessment with travel frequency context
 */
const assessImpactLevel = (perDay, travelFrequency = 'occasional') => {
  let level, color, icon, message, badge, percentile;
  
  if (perDay <= 5) {
    level = 'Net-Zero';
    color = 'emerald';
    icon = '⭐';
    message = 'Exceptional! Near carbon-neutral travel.';
    badge = 'Net-Zero Traveler';
    percentile = 'Top 1%';
  } else if (perDay <= 15) {
    level = 'Excellent';
    color = 'green';
    icon = '🌟';
    message = 'Outstanding! Well below sustainable target.';
    badge = 'Low-Carbon Champion';
    percentile = 'Top 5%';
  } else if (perDay <= 28.5) {
    level = 'Good';
    color = 'lime';
    icon = '🟢';
    message = 'Great! Meets UNWTO sustainable standards.';
    badge = 'Sustainable Traveler';
    percentile = 'Better than 60%';
  } else if (perDay <= 45.2) {
    level = 'Average';
    color = 'amber';
    icon = '🟡';
    message = 'Close to global tourist average.';
    badge = 'Aware Traveler';
    percentile = 'Average';
  } else if (perDay <= 70) {
    level = 'High';
    color = 'orange';
    icon = '🟠';
    message = 'Above average. Major improvements possible.';
    badge = 'High Impact';
    percentile = 'Higher than 70%';
  } else {
    level = 'Very High';
    color = 'red';
    icon = '🔴';
    message = 'Critical impact. Urgent action needed.';
    badge = 'Critical Impact';
    percentile = 'Top 10% highest';
  }
  
  // Add context for frequent travelers
  if (travelFrequency === 'frequent' && perDay > 30) {
    message += ' As a frequent traveler, consider trip consolidation.';
  }
  
  return { level, color, icon, message, badge, percentile };
};

/**
 * Calculate annual projection based on travel frequency
 */
const calculateAnnualProjection = (tripEmissions, frequency) => {
  const tripsPerYear = {
    occasional: 2,
    regular: 5,
    frequent: 10
  };
  
  const trips = tripsPerYear[frequency] || 2;
  const annualTotal = tripEmissions * trips;
  const percentOfGlobal = (annualTotal / globalBenchmarks.annualGlobal) * 100;
  
  return {
    trips: trips,
    annualTotal: annualTotal.toFixed(0),
    percentOfGlobalAverage: percentOfGlobal.toFixed(1),
    recommendation: annualTotal > globalBenchmarks.annualGlobal ? 
      'Consider reducing trip frequency or choosing lower-carbon options' :
      'Your annual travel footprint is reasonable'
  };
};

/**
 * Calculate alternative scenario with personalization
 */
export const calculateAlternativeScenario = (transportData, accommodationData, tripDetails) => {
  const distance = parseFloat(transportData.distance) || 0;
  const nights = parseInt(accommodationData.nights, 10) || 0;
  
  const currentTransport = parseFloat(calculateTransportEmissions(transportData).emissions);
  const currentAccommodation = parseFloat(calculateAccommodationEmissions(accommodationData).emissions);
  
  // Best alternatives
  const bestTransportData = { ...transportData, mode: 'train', passengers: 1 };
  const bestAccommodationData = { ...accommodationData, type: 'ecoresort', roomSharing: 'sharing' };
  
  const bestTransport = parseFloat(calculateTransportEmissions(bestTransportData).emissions);
  const bestAccommodation = parseFloat(calculateAccommodationEmissions(bestAccommodationData).emissions);
  
  const transportSavings = Math.max(0, currentTransport - bestTransport);
  const accommodationSavings = Math.max(0, currentAccommodation - bestAccommodation);
  const totalSavings = transportSavings + accommodationSavings;
  
  const currentTotal = currentTransport + currentAccommodation;
  const percentage = currentTotal > 0 ? (totalSavings / currentTotal) * 100 : 0;
  
  const feasible = distance < 3000; // Train feasible up to ~3000km
  
  return {
    savings: totalSavings.toFixed(2),
    percentage: percentage.toFixed(1),
    transportSavings: transportSavings.toFixed(2),
    accommodationSavings: accommodationSavings.toFixed(2),
    treesSaved: Math.ceil(totalSavings / 21),
    feasible: feasible,
    explanation: feasible ? 
      `Train + eco-resort: -${percentage.toFixed(0)}% emissions` :
      'For long distances, focus on carbon offsets and trip frequency'
  };
};

/**
 * Eco score calculation
 */
export const calculateEcoScore = (totalEmissions, days) => {
  const perDay = totalEmissions / days;
  let score = 0;
  
  if (perDay <= 5) score = 95 + (5 * (5 - perDay) / 5);
  else if (perDay <= 15) score = 80 + (15 * (15 - perDay) / 10);
  else if (perDay <= 28.5) score = 60 + (20 * (28.5 - perDay) / 13.5);
  else if (perDay <= 45.2) score = 40 + (20 * (45.2 - perDay) / 16.7);
  else if (perDay <= 90) score = 20 + (20 * (90 - perDay) / 44.8);
  else score = Math.max(0, 20 * (150 - perDay) / 60);
  
  return Math.round(Math.max(0, Math.min(100, score)));
};

export default {
  calculateTransportEmissions,
  calculateAccommodationEmissions,
  calculateActivityEmissions,
  calculateTotalEmissions,
  calculateAlternativeScenario,
  calculateEcoScore
};