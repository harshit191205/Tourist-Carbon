export const emissionFactors = {
  transport: {
    flight: { factor: 0.255, unit: 'kg CO₂/km', label: 'Flight' },
    train: { factor: 0.041, unit: 'kg CO₂/km', label: 'Train' },
    bus: { factor: 0.089, unit: 'kg CO₂/km', label: 'Bus' },
    car: { factor: 0.192, unit: 'kg CO₂/km', label: 'Car' },
    motorcycle: { factor: 0.103, unit: 'kg CO₂/km', label: 'Motorcycle' }, // CHANGED from bike
    walk: { factor: 0, unit: 'kg CO₂/km', label: 'Walk' }
  },
  accommodation: {
    hotel: { factor: 30, unit: 'kg CO₂/night', label: 'Hotel' },
    hostel: { factor: 15, unit: 'kg CO₂/night', label: 'Hostel' },
    homestay: { factor: 12, unit: 'kg CO₂/night', label: 'Homestay' },
    ecoresort: { factor: 7, unit: 'kg CO₂/night', label: 'Eco-resort' }
  },
  activities: {
    sightseeing: { factor: 5, unit: 'kg CO₂/activity', label: 'Sightseeing' },
    adventure: { factor: 15, unit: 'kg CO₂/activity', label: 'Adventure Sports' },
    localtravel: { factor: 3, unit: 'kg CO₂/activity', label: 'Local Travel' },
    events: { factor: 8, unit: 'kg CO₂/activity', label: 'Events' }
  }
};

export const lowCarbonAlternatives = {
  transport: {
    flight: { alternative: 'train', reduction: 84, message: 'Switch from Flight to Train' },
    car: { alternative: 'bus', reduction: 54, message: 'Switch from Car to Bus' },
    motorcycle: { alternative: 'bus', reduction: 46, message: 'Switch from Motorcycle to Bus' }, // CHANGED
    bus: { alternative: 'train', reduction: 54, message: 'Switch from Bus to Train' }
  },
  accommodation: {
    hotel: { alternative: 'ecoresort', reduction: 77, message: 'Switch from Hotel to Eco-resort' },
    hostel: { alternative: 'ecoresort', reduction: 53, message: 'Switch from Hostel to Eco-resort' }
  }
};

export const sustainabilityTips = [
  "Choose train over plane when possible - saves up to 84% emissions",
  "Stay in eco-resorts or homestays instead of large hotels",
  "Use public transport or walk at your destination",
  "Support local restaurants and reduce food waste",
  "Participate in eco-tourism activities and nature conservation",
  "Carry reusable water bottles and bags",
  "Offset your carbon footprint by planting trees or carbon credits"
];

export const globalAverages = {
  perTouristPerDay: 45, // kg CO₂
  perTripAverage: 315, // kg CO₂ for 7-day trip
  treesPerTon: 48 // trees needed to offset 1 ton CO₂ annually
};
