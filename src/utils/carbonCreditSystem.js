// Carbon Credit System Configuration
const CARBON_CREDIT_CONFIG = {
  // Carbon credits earned per kg CO2 saved
  CREDITS_PER_KG_SAVED: 10,
  
  // Baseline emissions (average trip emissions in kg CO2)
  BASELINE_EMISSIONS: 500,
  
  // Level thresholds (credits needed)
  LEVELS: [
    { level: 1, name: 'Carbon Newbie', minCredits: 0, badge: '🌱', color: 'slate' },
    { level: 2, name: 'Eco Traveler', minCredits: 500, badge: '🌿', color: 'green' },
    { level: 3, name: 'Green Explorer', minCredits: 1500, badge: '🍃', color: 'emerald' },
    { level: 4, name: 'Climate Champion', minCredits: 3000, badge: '🌳', color: 'teal' },
    { level: 5, name: 'Sustainability Hero', minCredits: 5000, badge: '🌍', color: 'blue' },
    { level: 6, name: 'Planet Guardian', minCredits: 10000, badge: '⭐', color: 'purple' },
    { level: 7, name: 'Eco Legend', minCredits: 20000, badge: '👑', color: 'yellow' }
  ],
  
  // Achievement badges
  ACHIEVEMENTS: [
    {
      id: 'first_trip',
      name: 'First Step',
      description: 'Calculate your first trip',
      badge: '🎯',
      criteria: (stats) => stats.totalTrips >= 1
    },
    {
      id: 'eco_warrior',
      name: 'Eco Warrior',
      description: 'Complete 10 trips',
      badge: '⚔️',
      criteria: (stats) => stats.totalTrips >= 10
    },
    {
      id: 'train_lover',
      name: 'Train Enthusiast',
      description: 'Take 5 train trips',
      badge: '🚆',
      criteria: (stats) => stats.trainTrips >= 5
    },
    {
      id: 'low_carbon',
      name: 'Low Carbon Expert',
      description: 'Average emissions below 200kg',
      badge: '💚',
      criteria: (stats) => stats.averageEmissions < 200
    },
    {
      id: 'tree_planter',
      name: 'Tree Planter',
      description: 'Earn 1000 carbon credits',
      badge: '🌲',
      criteria: (stats) => stats.totalCredits >= 1000
    },
    {
      id: 'globe_trotter',
      name: 'Globe Trotter',
      description: 'Complete 25 trips',
      badge: '🌏',
      criteria: (stats) => stats.totalTrips >= 25
    },
    {
      id: 'bike_hero',
      name: 'Bicycle Hero',
      description: 'Take 3 bicycle trips',
      badge: '🚴',
      criteria: (stats) => stats.bicycleTrips >= 3
    },
    {
      id: 'eco_accommodation',
      name: 'Eco Stay Lover',
      description: 'Stay in eco-lodges 5 times',
      badge: '🏡',
      criteria: (stats) => stats.ecoAccommodations >= 5
    }
  ]
};

// Calculate carbon credits for a trip
export const calculateTripCredits = (tripEmissions) => {
  const baseline = CARBON_CREDIT_CONFIG.BASELINE_EMISSIONS;
  const savings = Math.max(0, baseline - tripEmissions);
  const credits = Math.floor(savings * CARBON_CREDIT_CONFIG.CREDITS_PER_KG_SAVED);
  
  return {
    credits,
    savings,
    percentage: ((savings / baseline) * 100).toFixed(1)
  };
};

// Calculate user level based on total credits
export const calculateUserLevel = (totalCredits) => {
  const levels = CARBON_CREDIT_CONFIG.LEVELS;
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalCredits >= levels[i].minCredits) {
      const currentLevel = levels[i];
      const nextLevel = levels[i + 1];
      
      return {
        ...currentLevel,
        progress: nextLevel ? 
          ((totalCredits - currentLevel.minCredits) / (nextLevel.minCredits - currentLevel.minCredits) * 100).toFixed(1) : 100,
        nextLevel: nextLevel || null,
        creditsToNext: nextLevel ? nextLevel.minCredits - totalCredits : 0
      };
    }
  }
  
  return {
    ...levels[0],
    progress: 0,
    nextLevel: levels[1],
    creditsToNext: levels[1].minCredits
  };
};

// Calculate statistics from all trips
export const calculateUserStats = (trips) => {
  const stats = {
    totalTrips: trips.length,
    totalEmissions: 0,
    averageEmissions: 0,
    totalCredits: 0,
    totalSavings: 0,
    trainTrips: 0,
    bicycleTrips: 0,
    ecoAccommodations: 0,
    flightTrips: 0,
    carTrips: 0,
    busTrips: 0
  };
  
  trips.forEach(trip => {
    const emissions = parseFloat(trip.emissions?.total) || 0;
    stats.totalEmissions += emissions;
    
    // Calculate credits for this trip
    const tripCredits = calculateTripCredits(emissions);
    stats.totalCredits += tripCredits.credits;
    stats.totalSavings += tripCredits.savings;
    
    // Count transport types
    const transport = trip.tripData?.transportData?.mode;
    if (transport === 'train') stats.trainTrips++;
    if (transport === 'bicycle') stats.bicycleTrips++;
    if (transport === 'flight') stats.flightTrips++;
    if (transport === 'car') stats.carTrips++;
    if (transport === 'bus') stats.busTrips++;
    
    // Count eco accommodations
    const accommodation = trip.tripData?.accommodationData?.type;
    if (accommodation === 'ecoresort') stats.ecoAccommodations++;
  });
  
  stats.averageEmissions = stats.totalTrips > 0 ? stats.totalEmissions / stats.totalTrips : 0;
  
  return stats;
};

// Get unlocked achievements
export const getUnlockedAchievements = (stats) => {
  return CARBON_CREDIT_CONFIG.ACHIEVEMENTS.filter(achievement => 
    achievement.criteria(stats)
  );
};

// Get locked achievements
export const getLockedAchievements = (stats) => {
  return CARBON_CREDIT_CONFIG.ACHIEVEMENTS.filter(achievement => 
    !achievement.criteria(stats)
  );
};

// Calculate trees equivalent (1 tree absorbs ~20kg CO2 per year)
export const calculateTreesEquivalent = (totalSavings) => {
  return (totalSavings / 20).toFixed(1);
};

// Calculate car miles equivalent (average car emits 0.4kg CO2 per mile)
export const calculateCarMilesEquivalent = (totalSavings) => {
  return (totalSavings / 0.4).toFixed(0);
};

export default CARBON_CREDIT_CONFIG;
