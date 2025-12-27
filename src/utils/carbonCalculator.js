import { emissionFactors, globalAverages, getImpactLevel, calculateEquivalents } from '../data/emissionFactors';

/**
 * Calculate transport emissions with distance-dependent factors
 */
export const calculateTransportEmissions = (mode, distance) => {
  const dist = parseFloat(distance);
  if (!dist || dist <= 0) return "0.00";
  
  let factor = 0;
  
  switch(mode) {
    case 'flight':
      if (dist < 1500) {
        factor = emissionFactors.transport.flight.factorShortHaul || 0.285;
      } else {
        factor = emissionFactors.transport.flight.factorLongHaul || 0.195;
      }
      factor *= emissionFactors.transport.flight.radiativeForcing || 1.9;
      break;
      
    case 'train':
      factor = emissionFactors.transport.train.factorElectric || 0.028;
      break;
      
    case 'bus':
      factor = dist > 200 
        ? (emissionFactors.transport.bus.factorIntercity || 0.068)
        : (emissionFactors.transport.bus.factor || 0.089);
      break;
      
    case 'car':
      const occupancy = emissionFactors.transport.car.occupancyRate || 1.5;
      factor = (emissionFactors.transport.car.factor || 0.192) / occupancy;
      break;
      
    case 'motorcycle':
      factor = emissionFactors.transport.motorcycle.factorMedium || 0.113;
      break;
      
    case 'walk':
      factor = 0;
      break;
      
    default:
      factor = emissionFactors.transport[mode]?.factor || 0;
  }
  
  const emissions = factor * dist;
  return emissions.toFixed(2);
};

/**
 * Calculate accommodation emissions
 */
export const calculateAccommodationEmissions = (type, nights) => {
  const n = parseInt(nights, 10);
  if (!n || n <= 0) return "0.00";
  
  const factor = emissionFactors.accommodation[type]?.factor || 20.0;
  const emissions = factor * n;
  return emissions.toFixed(2);
};

/**
 * Calculate activity emissions
 */
export const calculateActivityEmissions = (activities) => {
  let total = 0;
  
  Object.keys(activities).forEach(key => {
    const count = parseInt(activities[key], 10) || 0;
    if (count === 0) return;
    
    const factor = emissionFactors.activities[key]?.factor || 0;
    total += factor * count;
  });
  
  return total.toFixed(2);
};

/**
 * COMPREHENSIVE EMISSIONS CALCULATION
 * Returns complete breakdown with EPA-verified equivalents
 */
export const calculateTotalEmissions = (transportData, accommodationData, activityData) => {
  // Calculate components
  const transport = parseFloat(calculateTransportEmissions(
    transportData.mode,
    transportData.distance
  ));
  
  const accommodation = parseFloat(calculateAccommodationEmissions(
    accommodationData.type,
    accommodationData.nights
  ));
  
  const activities = parseFloat(calculateActivityEmissions(activityData));
  
  // Calculate totals
  const total = transport + accommodation + activities;
  const nights = parseInt(accommodationData.nights, 10);
  const days = Math.max(nights, 1);
  const perDay = total / days;
  
  // Get EPA-verified equivalents
  const equivalents = calculateEquivalents(total);
  
  // Get impact assessment
  const impact = getImpactLevel(total, days);
  
  // Global comparison
  const globalAvgPerDay = globalAverages.perTouristPerDay;
  const comparisonPercentage = ((perDay - globalAvgPerDay) / globalAvgPerDay) * 100;
  
  // Percentage breakdowns
  const transportPercentage = total > 0 ? (transport / total) * 100 : 0;
  const accommodationPercentage = total > 0 ? (accommodation / total) * 100 : 0;
  const activitiesPercentage = total > 0 ? (activities / total) * 100 : 0;
  
  // Efficiency metrics
  const distance = parseFloat(transportData.distance) || 0;
  const perKm = distance > 0 ? transport / distance : 0;
  const perNight = nights > 0 ? accommodation / nights : 0;
  
  // Carbon offset cost
  const offsetCost = (total / 1000) * 18.50;
  
  // Sustainability flags
  const isSustainable = perDay <= globalAverages.sustainableDaily;
  const isLowCarbon = perDay <= globalAverages.lowCarbonDaily;
  
  return {
    // Component emissions
    transport: transport.toFixed(2),
    accommodation: accommodation.toFixed(2),
    activities: activities.toFixed(2),
    total: total.toFixed(2),
    
    // Time metrics
    perDay: perDay.toFixed(2),
    days: days,
    
    // Offset metrics (using EPA-corrected values)
    treesNeeded: equivalents.treesNeeded, // Based on 39 kg/tree/year (EPA)
    offsetCost: offsetCost.toFixed(2),
    
    // Impact assessment
    category: impact.level,
    categoryColor: impact.color,
    categoryIcon: impact.icon,
    categoryMessage: impact.message,
    categoryBadge: impact.badge,
    percentile: impact.percentile,
    
    // Comparisons
    comparisonPercentage: parseFloat(comparisonPercentage.toFixed(1)),
    globalAverage: globalAvgPerDay,
    isSustainable: isSustainable,
    isLowCarbon: isLowCarbon,
    
    // Percentage breakdowns
    transportPercentage: parseFloat(transportPercentage.toFixed(1)),
    accommodationPercentage: parseFloat(accommodationPercentage.toFixed(1)),
    activitiesPercentage: parseFloat(activitiesPercentage.toFixed(1)),
    
    // Efficiency metrics
    perKm: perKm.toFixed(3),
    perNight: perNight.toFixed(2),
    
    // EPA-verified equivalents
    equivalents: {
      // EPA VERIFIED VALUES
      gasolineGallons: equivalents.gasolineGallons, // gallons of gasoline
      milesDriven: equivalents.milesDriven, // miles by average car
      vehicleYears: equivalents.vehicleYears, // passenger vehicles per year
      electricitykWh: equivalents.electricitykWh, // kWh of electricity
      homeEnergyYears: equivalents.homeEnergyYears, // homes' energy use (years)
      treesNeeded: equivalents.treesNeeded, // trees for 1 year (EPA: 39 kg/tree)
      treeSeedlings10Years: equivalents.treeSeedlings10Years, // tree seedlings for 10 years
      acresForestYear: equivalents.acresForestYear, // acres of forest for 1 year
      propaneGallons: equivalents.propaneGallons, // gallons of propane
      smartphoneYears: equivalents.smartphoneYears, // years of smartphone use
      coalPounds: equivalents.coalPounds, // pounds of coal burned
      percentAnnual: equivalents.percentAnnual, // % of annual carbon footprint
      touristDays: equivalents.touristDays // equivalent tourist-days
    },
    
    // Additional context
    transportMode: transportData.mode,
    accommodationType: accommodationData.type,
    totalActivities: Object.values(activityData).reduce((sum, val) => sum + val, 0)
  };
};

/**
 * Calculate alternative scenario with eco-friendly options
 */
export const calculateAlternativeScenario = (transportData, accommodationData) => {
  const distance = parseFloat(transportData.distance) || 0;
  const nights = parseInt(accommodationData.nights, 10) || 0;
  
  // Current emissions
  const currentTransport = parseFloat(calculateTransportEmissions(
    transportData.mode,
    distance
  ));
  
  const currentAccommodation = parseFloat(calculateAccommodationEmissions(
    accommodationData.type,
    nights
  ));
  
  // Best alternative: Train + Eco-resort
  const bestTransport = parseFloat(calculateTransportEmissions('train', distance));
  const bestAccommodation = parseFloat(calculateAccommodationEmissions('ecoresort', nights));
  
  // Calculate savings
  const transportSavings = Math.max(0, currentTransport - bestTransport);
  const accommodationSavings = Math.max(0, currentAccommodation - bestAccommodation);
  const totalSavings = transportSavings + accommodationSavings;
  
  // Percentages
  const currentTotal = currentTransport + currentAccommodation;
  const percentage = currentTotal > 0 ? (totalSavings / currentTotal) * 100 : 0;
  const newTotal = currentTotal - totalSavings;
  
  // EPA-verified trees saved (using 39 kg/tree/year)
  const treesSaved = Math.ceil(totalSavings / 39);
  
  // Offset cost savings
  const offsetSavings = (totalSavings / 1000) * 18.50;
  
  // Recommendations
  let transportRecommendation = '';
  let accommodationRecommendation = '';
  
  if (transportData.mode === 'flight' && distance < 1500) {
    transportRecommendation = `For distances under 1500km, trains are often faster city-to-city and emit 84% less CO₂`;
  } else if (transportData.mode === 'flight') {
    transportRecommendation = `Consider train for legs under 800km. For long flights, choose direct routes`;
  } else if (transportData.mode === 'car') {
    transportRecommendation = `Switch to train or bus to reduce transport emissions by 75-80%`;
  }
  
  if (accommodationData.type === 'hotel') {
    accommodationRecommendation = `Certified eco-resorts use 75% renewable energy and reduce emissions by 78%`;
  } else if (accommodationData.type === 'hostel' || accommodationData.type === 'homestay') {
    accommodationRecommendation = `Eco-resorts offer professional sustainability with verified standards`;
  }
  
  return {
    savings: totalSavings.toFixed(2),
    percentage: percentage.toFixed(1),
    transportSavings: transportSavings.toFixed(2),
    accommodationSavings: accommodationSavings.toFixed(2),
    newTotal: newTotal.toFixed(2),
    newTransport: bestTransport.toFixed(2),
    newAccommodation: bestAccommodation.toFixed(2),
    treesSaved: treesSaved,
    offsetCostSaved: offsetSavings.toFixed(2),
    transportRecommendation: transportRecommendation,
    accommodationRecommendation: accommodationRecommendation,
    bestTransportMode: 'train',
    bestAccommodationType: 'ecoresort',
    feasible: distance < 3000,
    explanation: distance < 3000 
      ? 'These alternatives are practical and available for your route'
      : 'For very long distances, consider carbon offsetting as trains may not be available'
  };
};

/**
 * Calculate eco score (0-100) based on daily emissions
 */
export const calculateEcoScore = (totalEmissions, days) => {
  const perDay = totalEmissions / days;
  let score = 0;
  
  if (perDay === 0) {
    score = 100;
  } else if (perDay <= 15) {
    score = 85 + (15 * (15 - perDay) / 15);
  } else if (perDay <= 28.5) {
    score = 70 + (15 * (28.5 - perDay) / 13.5);
  } else if (perDay <= 45.2) {
    score = 50 + (20 * (45.2 - perDay) / 16.7);
  } else if (perDay <= 90) {
    score = 50 * (90 - perDay) / 44.8;
  } else {
    score = 0;
  }
  
  return Math.round(Math.max(0, Math.min(100, score)));
};

/**
 * Get detailed, actionable recommendations
 */
export const getRecommendations = (emissions, tripData) => {
  const recommendations = [];
  const transport = parseFloat(emissions.transport);
  const accommodation = parseFloat(emissions.accommodation);
  const perDay = parseFloat(emissions.perDay);
  
  if (tripData.transportData.mode === 'flight') {
    const distance = parseFloat(tripData.transportData.distance);
    
    if (distance < 1500) {
      recommendations.push({
        category: 'Transport',
        priority: 'high',
        icon: '🚆',
        title: 'Take the train instead',
        message: `For distances under 1500km, trains are often faster city-to-city and emit 84% less CO₂`,
        potentialSaving: (transport * 0.84).toFixed(2),
        savingsPercent: 84,
        actionable: true,
        difficulty: 'easy'
      });
    } else {
      recommendations.push({
        category: 'Transport',
        priority: 'medium',
        icon: '✈️',
        title: 'Choose direct flights',
        message: `Takeoff and landing account for 25% of flight emissions. Direct flights reduce emissions by 20-30%`,
        potentialSaving: (transport * 0.25).toFixed(2),
        savingsPercent: 25,
        actionable: true,
        difficulty: 'easy'
      });
    }
  }
  
  if (tripData.transportData.mode === 'car') {
    recommendations.push({
      category: 'Transport',
      priority: 'high',
      icon: '🚌',
      title: 'Switch to public transport',
      message: `Trains or buses can reduce transport emissions by 75-79%`,
      potentialSaving: (transport * 0.77).toFixed(2),
      savingsPercent: 77,
      actionable: true,
      difficulty: 'easy'
    });
  }
  
  if (tripData.accommodationData.type === 'hotel' && accommodation > 60) {
    recommendations.push({
      category: 'Accommodation',
      priority: 'high',
      icon: '🌿',
      title: 'Stay at certified eco-accommodation',
      message: `Eco-resorts with LEED/Green Key certification use 75% renewable energy and reduce emissions by 78%`,
      potentialSaving: (accommodation * 0.78).toFixed(2),
      savingsPercent: 78,
      actionable: true,
      difficulty: 'medium'
    });
  }
  
  const activities = parseFloat(emissions.activities);
  if (activities > 20) {
    recommendations.push({
      category: 'Activities',
      priority: 'medium',
      icon: '🚇',
      title: 'Use public transport locally',
      message: `Metro/trams emit 90% less than taxis. Saves 15-25 kg CO₂ per trip`,
      potentialSaving: (activities * 0.40).toFixed(2),
      savingsPercent: 40,
      actionable: true,
      difficulty: 'easy'
    });
  }
  
  if (perDay > 45.2) {
    recommendations.push({
      category: 'General',
      priority: 'high',
      icon: '🌍',
      title: 'Carbon offset your trip',
      message: `Your emissions are above average. Consider offsetting through Gold Standard projects (cost: $${emissions.offsetCost})`,
      potentialSaving: null,
      savingsPercent: null,
      actionable: true,
      difficulty: 'easy'
    });
  }
  
  const days = emissions.days;
  if (days < 5 && transport > 100) {
    recommendations.push({
      category: 'Planning',
      priority: 'medium',
      icon: '📅',
      title: 'Stay longer, travel less often',
      message: `Transport is ${emissions.transportPercentage}% of your impact. Longer stays reduce emissions per day`,
      potentialSaving: null,
      savingsPercent: null,
      actionable: true,
      difficulty: 'medium'
    });
  }
  
  recommendations.push({
    category: 'Lifestyle',
    priority: 'low',
    icon: '🥗',
    title: 'Choose local, plant-based meals',
    message: `Local, seasonal food reduces transport emissions by 60%. Plant-based meals save 3-5 kg CO₂/day`,
    potentialSaving: (days * 4).toFixed(2),
    savingsPercent: null,
    actionable: true,
    difficulty: 'easy'
  });
  
  return recommendations;
};

export default {
  calculateTransportEmissions,
  calculateAccommodationEmissions,
  calculateActivityEmissions,
  calculateTotalEmissions,
  calculateAlternativeScenario,
  calculateEcoScore,
  getRecommendations
};