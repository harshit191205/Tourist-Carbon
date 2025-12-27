import { emissionFactors, globalAverages } from '../data/emissionFactors';

export const calculateTransportEmissions = (mode, distance, passengers = 1) => {
  const factor = emissionFactors.transport[mode]?.factor || 0;
  return (factor * distance).toFixed(2);
};

export const calculateAccommodationEmissions = (type, nights) => {
  const factor = emissionFactors.accommodation[type]?.factor || 0;
  return (factor * nights).toFixed(2);
};

export const calculateActivityEmissions = (activities) => {
  let total = 0;
  Object.keys(activities).forEach(key => {
    const factor = emissionFactors.activities[key]?.factor || 0;
    total += factor * (activities[key] || 0);
  });
  return total.toFixed(2);
};

export const calculateTotalEmissions = (transportData, accommodationData, activityData) => {
  const transport = parseFloat(calculateTransportEmissions(
    transportData.mode, 
    transportData.distance
  ));
  const accommodation = parseFloat(calculateAccommodationEmissions(
    accommodationData.type, 
    accommodationData.nights
  ));
  const activities = parseFloat(calculateActivityEmissions(activityData));
  
  const total = transport + accommodation + activities;
  const days = parseInt(accommodationData.nights) || 1; // FIX: Ensure it's parsed as integer
  const perDay = (total / days).toFixed(2);
  const treesNeeded = Math.ceil(total / 21);
  
  // Carbon category
  let category = 'Low';
  let categoryColor = 'green';
  if (total > 200) {
    category = 'High';
    categoryColor = 'red';
  } else if (total > 100) {
    category = 'Medium';
    categoryColor = 'yellow';
  }
  
  // Comparison with global average
  const globalAvgPerDay = globalAverages.perTouristPerDay;
  const comparisonPercentage = (((perDay - globalAvgPerDay) / globalAvgPerDay) * 100).toFixed(1);
  
  return {
    transport,
    accommodation,
    activities,
    total: total.toFixed(2),
    perDay,
    treesNeeded,
    category,
    categoryColor,
    comparisonPercentage,
    days // FIX: Return the actual number of days
  };
};

export const calculateAlternativeScenario = (transportData, accommodationData) => {
  const currentTransport = parseFloat(calculateTransportEmissions(
    transportData.mode,
    transportData.distance
  ));
  
  const currentAccommodation = parseFloat(calculateAccommodationEmissions(
    accommodationData.type,
    accommodationData.nights
  ));
  
  // Best alternative scenario
  const bestTransport = parseFloat(calculateTransportEmissions(
    'train',
    transportData.distance
  ));
  
  const bestAccommodation = parseFloat(calculateAccommodationEmissions(
    'ecoresort',
    accommodationData.nights
  ));
  
  const totalSavings = (currentTransport - bestTransport) + (currentAccommodation - bestAccommodation);
  
  return {
    savings: totalSavings.toFixed(2),
    percentage: ((totalSavings / (currentTransport + currentAccommodation)) * 100).toFixed(1)
  };
};
