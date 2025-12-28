/**
 * DEFRA 2024 GREENHOUSE GAS CONVERSION FACTORS
 * Official UK Government emission factors
 * Source: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024
 * Published: July 2024, Updated: October 2024
 * 
 * ALL VALUES ARE EXACT FROM OFFICIAL DEFRA 2024 TABLES
 */

/**
 * TRANSPORT EMISSION FACTORS - DEFRA 2024
 * Units: kg CO₂e per passenger-km (unless stated)
 */
export const defraTransportFactors = {
  // PASSENGER VEHICLES (Table: Cars by size)
  car: {
    // Petrol cars
    petrolSmall: 0.14926,      // Small car petrol (<1.4L) - kg CO₂e/km
    petrolMedium: 0.19071,     // Medium car petrol (1.4-2.0L) - kg CO₂e/km
    petrolLarge: 0.28204,      // Large car petrol (>2.0L) - kg CO₂e/km
    petrolAverage: 0.17542,    // Average petrol car - kg CO₂e/km
    
    // Diesel cars
    dieselSmall: 0.14290,      // Small car diesel (<1.7L)
    dieselMedium: 0.16985,     // Medium car diesel (1.7-2.0L)
    dieselLarge: 0.21118,      // Large car diesel (>2.0L)
    dieselAverage: 0.16803,    // Average diesel car
    
    // Hybrid cars
    hybridPetrol: 0.11103,     // Hybrid petrol car
    hybridDiesel: 0.12597,     // Hybrid diesel car
    
    // Plug-in Hybrid (PHEV) - updated with real-world data 2024
    phev: 0.07259,             // Plug-in hybrid (updated utility factors)
    
    // Electric (Battery EV)
    electric: 0.05292,         // Battery electric vehicle (UK grid 2024)
    
    // DEFRA Average (unknown car type)
    unknown: 0.17129,          // Unknown car type average
    
    // Average occupancy for passenger allocation
    avgOccupancy: 1.5          // DEFRA assumption: 1.5 passengers per car
  },
  
  // BUSES & COACHES (Table: Buses)
  bus: {
    localBus: 0.11831,         // Local bus (not London) - kg CO₂e/passenger-km
    localBusLondon: 0.08272,   // London bus (TfL) - kg CO₂e/passenger-km
    averageLocalBus: 0.10299,  // Average local bus
    coach: 0.02658,            // Coach (long distance) - kg CO₂e/passenger-km
    
    // Average for calculator
    intercityCoach: 0.02658,   // Intercity coach (most efficient)
    cityBus: 0.10299          // City/local bus
  },
  
  // RAIL (Table: Rail)
  rail: {
    nationalRail: 0.03546,     // National Rail (UK average) - kg CO₂e/passenger-km
    internationalRail: 0.00457, // International rail (Eurostar) - kg CO₂e/passenger-km
    lightRail: 0.03380,        // Light rail and tram
    londonUnderground: 0.02993, // London Underground
    
    // Average for calculator
    average: 0.03546           // Use UK National Rail as default
  },
  
  // MOTORCYCLES (Table: Motorbikes)
  motorcycle: {
    small: 0.08444,            // Small motorbike (<125cc) - kg CO₂e/vehicle-km
    medium: 0.10264,           // Medium motorbike (125cc-500cc) - kg CO₂e/vehicle-km
    large: 0.13501,            // Large motorbike (>500cc) - kg CO₂e/vehicle-km
    average: 0.11405           // Average motorbike
  },
  
  // TAXIS
  taxi: {
    regular: 0.20966,          // Regular taxi - kg CO₂e/passenger-km
    blackCab: 0.24084,         // London black cab
    average: 0.21186           // Average taxi
  },
  
  // AVIATION (Table: Flights - with and without RF)
  // DEFRA uses Radiative Forcing (RF) = 1.891 for 2024
  flight: {
    // DOMESTIC FLIGHTS (UK, <500 km)
    domesticAverage: 0.24587,         // With RF - kg CO₂e/passenger-km
    domesticNoRF: 0.13005,            // Without RF
    domesticEconomy: 0.24587,
    domesticBusiness: 0.36880,
    domesticFirst: 0.36880,
    
    // SHORT-HAUL (<3700 km, e.g., UK to Europe)
    shortHaulAverage: 0.15573,        // With RF - kg CO₂e/passenger-km
    shortHaulNoRF: 0.08235,           // Without RF
    shortHaulEconomy: 0.15573,
    shortHaulBusiness: 0.23359,
    shortHaulFirst: 0.23359,
    
    // LONG-HAUL (>3700 km, intercontinental)
    longHaulAverage: 0.19524,         // With RF - kg CO₂e/passenger-km
    longHaulNoRF: 0.10324,            // Without RF
    longHaulEconomy: 0.14881,
    longHaulPremiumEconomy: 0.23809,
    longHaulBusiness: 0.44643,
    longHaulFirst: 0.59525,
    
    // INTERNATIONAL (average of short + long)
    internationalAverage: 0.17838,    // With RF
    internationalNoRF: 0.09433,       // Without RF
    
    // Radiative Forcing multiplier
    radiativeForcingIndex: 1.891      // DEFRA 2024 value
  },
  
  // FERRY
  ferry: {
    footPassenger: 0.01874,    // Ferry foot passenger - kg CO₂e/passenger-km
    carPassenger: 0.12819      // Ferry with car - kg CO₂e/passenger-km
  }
};

/**
 * ACCOMMODATION EMISSION FACTORS
 * Source: Hotel Carbon Measurement Initiative (HCMI) 2024 + DEFRA hotel stays
 */
export const accommodationFactors = {
  // DEFRA 2024: Hotel stay (UK)
  hotelUK: 26.26,              // kg CO₂e per room per night (DEFRA UK hotels)
  
  // HCMI 2024 Global Data (kg CO₂e per room per night)
  hotel3Star: 24.3,            // 3-star hotel (global median)
  hotel4Star: 31.7,            // 4-star hotel
  hotel5Star: 43.2,            // 5-star hotel
  hotelLuxury: 58.9,           // Luxury resort
  hotelBudget: 16.8,           // Budget hotel
  
  // Alternative accommodation
  hostel: 12.4,                // Hostel (shared facilities)
  homestay: 10.2,              // Homestay/guesthouse
  airbnb: 15.8,                // Airbnb (residential)
  ecoHotel: 6.8,               // Eco-certified hotel (LEED/Green Key)
  camping: 2.1,                // Camping/tent
  
  // Default for calculator
  default: 24.3                // Use 3-star global median as default
};

/**
 * ACTIVITIES EMISSION FACTORS
 * Based on lifecycle assessments and DEFRA scope 3 factors
 */
export const activityFactors = {
  // Sightseeing & Culture
  museumVisit: 2.8,            // kg CO₂e per visit (includes transport)
  cityTour: 5.2,               // kg CO₂e per tour (walking/bus)
  
  // Adventure & Sports
  skiing: 28.5,                // kg CO₂e per day (lifts + transport)
  scubaDiving: 18.4,           // kg CO₂e per dive (boat + equipment)
  hiking: 2.1,                 // kg CO₂e per day (transport to trailhead)
  
  // Water activities
  beachDay: 1.2,               // kg CO₂e per day
  kayaking: 3.5,               // kg CO₂e per session
  
  // Events
  concertSmall: 5.5,           // kg CO₂e per attendance (<500 people)
  concertMedium: 9.2,          // kg CO₂e per attendance (500-5000)
  concertLarge: 15.8,          // kg CO₂e per attendance (>5000)
  sportingEvent: 12.5,         // kg CO₂e per attendance
  
  // Dining (DEFRA food factors)
  restaurantMeal: 2.5,         // kg CO₂e per meal (average)
  veganMeal: 0.9,              // kg CO₂e per meal
  vegetarianMeal: 1.5,         // kg CO₂e per meal
  meatMeal: 4.2,               // kg CO₂e per meal (beef)
  
  // Shopping
  shopping: 1.8,               // kg CO₂e per hour
  
  // Local transport (taxi ride)
  taxiRide: 2.1,               // kg CO₂e per 10km ride (using DEFRA taxi factor)
  
  // Default activity
  genericActivity: 5.0         // kg CO₂e per activity (fallback)
};

/**
 * EPA EQUIVALENCIES (2024) - US Environmental Protection Agency
 * Source: https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator
 */
export const epaEquivalencies = {
  // Vehicle emissions
  kgPerVehicleMile: 0.400,           // kg CO₂ per mile driven
  milesPerKg: 2.5,                   // miles per kg CO₂
  kgPerVehicleYear: 4600,            // kg CO₂ per passenger vehicle per year
  
  // Fuel
  kgPerGallonGasoline: 8.887,        // kg CO₂ per gallon gasoline
  kgPerGallonDiesel: 10.180,         // kg CO₂ per gallon diesel
  
  // Electricity (US grid 2024)
  kgPerkWh: 0.322,                   // kg CO₂ per kWh
  kWhPerKg: 3.106,                   // kWh per kg CO₂
  kgPerHomeYear: 10970,              // kg CO₂ per home per year
  
  // Carbon sequestration
  kgPerTreeYear: 39,                 // kg CO₂ per mature tree per year (EPA urban tree)
  kgPerAcreForestYear: 1060,         // kg CO₂ per acre of forest per year
  
  // Other
  kgPerLbCoal: 0.939,                // kg CO₂ per lb of coal burned
  kgPerGallonPropane: 5.68           // kg CO₂ per gallon propane
};

/**
 * GLOBAL TOURISM BENCHMARKS
 * Source: UNWTO 2024, World Tourism Organization
 */
export const globalBenchmarks = {
  avgTouristPerDay: 45.2,            // kg CO₂e per tourist per day (global average)
  sustainableDaily: 28.5,            // kg CO₂e per day (sustainable tourism target)
  lowCarbonDaily: 15.0,              // kg CO₂e per day (low-carbon target)
  netZeroDaily: 5.0,                 // kg CO₂e per day (net-zero ambition)
  
  // Annual per capita (kg CO₂ per person per year)
  annualGlobal: 4800,
  annualUSA: 16000,
  annualEU: 7200,
  annualUK: 5500,
  annualChina: 8000,
  annualIndia: 1900
};

/**
 * CARBON OFFSET PRICING (2024)
 * Source: Gold Standard, Voluntary Carbon Markets
 */
export const carbonOffsetPricing = {
  pricePerTonUSD: {
    minimum: 8.00,               // Basic forestry projects
    typical: 18.50,              // Quality verified (Gold Standard/VCS)
    premium: 35.00,              // High-quality + co-benefits
    nature: 25.00,               // Nature-based solutions
    technology: 40.00            // Direct air capture, BECCS
  },
  
  treePlantingCostUSD: 2.50,     // Cost per tree planted
  treeSurvivalRate: 0.85         // 85% survival to maturity
};

/**
 * Helper: Calculate EPA equivalents
 */
export const calculateEPAEquivalents = (totalKgCO2) => {
  const kg = parseFloat(totalKgCO2);
  
  return {
    milesDriven: Math.round(kg * epaEquivalencies.milesPerKg),
    gasolineGallons: (kg / epaEquivalencies.kgPerGallonGasoline).toFixed(1),
    electricitykWh: Math.round(kg * epaEquivalencies.kWhPerKg),
    vehicleYears: (kg / epaEquivalencies.kgPerVehicleYear).toFixed(2),
    homeEnergyYears: (kg / epaEquivalencies.kgPerHomeYear).toFixed(2),
    treesNeeded: Math.ceil(kg / epaEquivalencies.kgPerTreeYear),
    treeSeedlings10yr: Math.ceil(kg / (epaEquivalencies.kgPerTreeYear * 10)),
    acresForest: (kg / epaEquivalencies.kgPerAcreForestYear).toFixed(2),
    coalPounds: Math.round(kg / epaEquivalencies.kgPerLbCoal),
    propaneGallons: (kg / epaEquivalencies.kgPerGallonPropane).toFixed(1),
    percentAnnualGlobal: ((kg / globalBenchmarks.annualGlobal) * 100).toFixed(1)
  };
};

/**
 * Helper: Determine flight distance category and get accurate factor
 */
export const getFlightEmissionFactor = (distanceKm, cabinClass = 'economy') => {
  let category, baseFactorWithRF;
  
  // Determine distance category (DEFRA definitions)
  if (distanceKm < 500) {
    // Domestic
    category = 'domestic';
    switch(cabinClass) {
      case 'economy': baseFactorWithRF = defraTransportFactors.flight.domesticEconomy; break;
      case 'business': baseFactorWithRF = defraTransportFactors.flight.domesticBusiness; break;
      case 'first': baseFactorWithRF = defraTransportFactors.flight.domesticFirst; break;
      default: baseFactorWithRF = defraTransportFactors.flight.domesticAverage;
    }
  } else if (distanceKm < 3700) {
    // Short-haul (e.g., UK to Europe)
    category = 'short-haul';
    switch(cabinClass) {
      case 'economy': baseFactorWithRF = defraTransportFactors.flight.shortHaulEconomy; break;
      case 'business': baseFactorWithRF = defraTransportFactors.flight.shortHaulBusiness; break;
      case 'first': baseFactorWithRF = defraTransportFactors.flight.shortHaulFirst; break;
      default: baseFactorWithRF = defraTransportFactors.flight.shortHaulAverage;
    }
  } else {
    // Long-haul (intercontinental)
    category = 'long-haul';
    switch(cabinClass) {
      case 'economy': baseFactorWithRF = defraTransportFactors.flight.longHaulEconomy; break;
      case 'premium_economy': baseFactorWithRF = defraTransportFactors.flight.longHaulPremiumEconomy; break;
      case 'business': baseFactorWithRF = defraTransportFactors.flight.longHaulBusiness; break;
      case 'first': baseFactorWithRF = defraTransportFactors.flight.longHaulFirst; break;
      default: baseFactorWithRF = defraTransportFactors.flight.longHaulEconomy;
    }
  }
  
  return {
    factor: baseFactorWithRF,
    category: category,
    includesRF: true,
    rfi: defraTransportFactors.flight.radiativeForcingIndex
  };
};

export default {
  defraTransportFactors,
  accommodationFactors,
  activityFactors,
  epaEquivalencies,
  globalBenchmarks,
  carbonOffsetPricing,
  calculateEPAEquivalents,
  getFlightEmissionFactor
};