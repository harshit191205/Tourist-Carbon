import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateTravelDistance } from '../utils/distanceCalculator';

const TripCalculator = ({ onCalculate, ecoMode }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    purpose: 'leisure',
    transportMode: 'flight',
    distance: '',
    calculatingDistance: false,
    routeInfo: '',
    accommodationType: 'hotel',
    nights: '',
    sightseeing: 0,
    adventure: 0,
    localtravel: 0,
    events: 0
  });

  const [distanceError, setDistanceError] = useState('');
  const [distanceInfo, setDistanceInfo] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['sightseeing', 'adventure', 'localtravel', 'events'].includes(name) 
        ? parseInt(value) || 0 
        : value
    }));
    
    if (name === 'origin' || name === 'destination' || name === 'transportMode') {
      setFormData(prev => ({ ...prev, distance: '', routeInfo: '' }));
      setDistanceError('');
      setDistanceInfo('');
    }
  };

  const handleCalculateDistance = async () => {
    if (!formData.origin || !formData.destination) {
      setDistanceError('Please enter both origin and destination');
      return;
    }
    
    setFormData(prev => ({ ...prev, calculatingDistance: true }));
    setDistanceError('');
    setDistanceInfo('');
    
    try {
      const result = await calculateTravelDistance(
        formData.origin, 
        formData.destination,
        formData.transportMode
      );
      
      setFormData(prev => ({
        ...prev,
        distance: result.distance,
        routeInfo: result.routeType,
        calculatingDistance: false
      }));
      
      setDistanceInfo(`${result.routeType}: ${result.distance} km`);
    } catch (error) {
      setDistanceError('Could not calculate distance. Please check location names or enter distance manually.');
      setFormData(prev => ({ ...prev, calculatingDistance: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.distance) {
      setDistanceError('Please calculate or enter the distance');
      return;
    }
    
    const transportData = {
      mode: formData.transportMode,
      distance: parseFloat(formData.distance)
    };
    
    const accommodationData = {
      type: formData.accommodationType,
      nights: parseInt(formData.nights)
    };
    
    const activityData = {
      sightseeing: formData.sightseeing,
      adventure: formData.adventure,
      localtravel: formData.localtravel,
      events: formData.events
    };
    
    const tripDetails = {
      origin: formData.origin,
      destination: formData.destination,
      purpose: formData.purpose
    };
    
    onCalculate(transportData, accommodationData, activityData, tripDetails);
    navigate('/report');
  };

  const transportModes = [
    { value: 'flight', icon: '✈️', label: 'Flight' },
    { value: 'train', icon: '🚆', label: 'Train' },
    { value: 'bus', icon: '🚌', label: 'Bus' },
    { value: 'car', icon: '🚗', label: 'Car' },
    { value: 'motorcycle', icon: '🏍️', label: 'Motorcycle' },
    { value: 'walk', icon: '🚶', label: 'Walk' }
  ];

  const purposes = [
    { value: 'leisure', icon: '🏖️', label: 'Leisure/Vacation' },
    { value: 'business', icon: '💼', label: 'Business' },
    { value: 'education', icon: '🎓', label: 'Education' },
    { value: 'family', icon: '👨‍👩‍👧‍👦', label: 'Family Visit' }
  ];

  const inputClasses = "w-full px-4 py-3 glass-card text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-eco-primary/50 transition-all duration-400 appearance-none";

  return (
    <div className="glass-card p-8 hover-lift">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-text-primary mb-2 text-glow-white">
          Plan Your Trip
        </h2>
        <p className="text-text-secondary">
          Calculate your carbon footprint with precision
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* STEP 1: Transport Mode Pills */}
        <div className="space-y-4 animate-slideUp delay-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full glass-card flex items-center justify-center font-bold ${
              ecoMode ? 'text-eco-primary glow-green' : 'text-accent-red'
            }`}>
              1
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Select Transport Mode</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {transportModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setFormData({...formData, transportMode: mode.value, distance: '', routeInfo: ''})}
                className={`glass-card p-5 transition-all duration-400 button-press hover-lift ${
                  formData.transportMode === mode.value
                    ? ecoMode 
                      ? 'border-2 border-eco-primary glow-green' 
                      : 'border-2 border-accent-red glow-red'
                    : 'border border-dark-border'
                }`}
              >
                <div className="text-4xl mb-2 floating">{mode.icon}</div>
                <div className={`text-sm font-semibold ${
                  formData.transportMode === mode.value 
                    ? ecoMode ? 'text-eco-primary' : 'text-accent-red'
                    : 'text-text-muted'
                }`}>
                  {mode.label}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* STEP 2: Route */}
        <div className="space-y-4 animate-slideUp delay-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-accent-blue font-bold glow-blue">
              2
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Enter Route Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="hover-lift">
              <label className="block text-sm font-medium text-text-secondary mb-2">Origin</label>
              <input 
                type="text" 
                name="origin" 
                value={formData.origin} 
                onChange={handleChange}
                placeholder="e.g., New Delhi, India"
                className={inputClasses}
                required
              />
            </div>
            
            <div className="hover-lift">
              <label className="block text-sm font-medium text-text-secondary mb-2">Destination</label>
              <input 
                type="text" 
                name="destination" 
                value={formData.destination} 
                onChange={handleChange}
                placeholder="e.g., Paris, France"
                className={inputClasses}
                required
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleCalculateDistance}
            disabled={formData.calculatingDistance || !formData.origin || !formData.destination}
            className={`w-full py-4 glass-card font-semibold text-lg transition-all duration-400 button-press hover-lift ${
              formData.calculatingDistance || !formData.origin || !formData.destination
                ? 'opacity-50 cursor-not-allowed'
                : ecoMode ? 'text-eco-primary glow-green' : 'text-accent-blue glow-blue'
            }`}
          >
            {formData.calculatingDistance ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span> Calculating route...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">🗺️</span> Calculate Distance
              </span>
            )}
          </button>
          
          <div className="hover-lift">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Distance (km) {formData.distance && <span className="text-eco-primary">✓ Calculated</span>}
            </label>
            <input 
              type="number" 
              name="distance" 
              value={formData.distance} 
              onChange={handleChange}
              placeholder="Auto-calculated or enter manually"
              className={inputClasses}
              required
              min="1"
            />
            {distanceInfo && (
              <div className={`mt-3 glass-card p-4 animate-scaleIn ${
                ecoMode ? 'border border-eco-primary glow-green' : 'border border-accent-blue'
              }`}>
                <p className={`text-sm font-medium ${ecoMode ? 'text-eco-primary' : 'text-accent-blue'}`}>
                  ✓ {distanceInfo}
                </p>
              </div>
            )}
            {distanceError && (
              <div className="mt-3 glass-card p-4 border border-accent-red glow-red animate-scaleIn">
                <p className="text-accent-red text-sm">⚠️ {distanceError}</p>
              </div>
            )}
          </div>
          
          {/* Purpose Pills - Floating Glass Style */}
          <div className="hover-lift">
            <label className="block text-sm font-medium text-text-secondary mb-3">Purpose of Trip</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {purposes.map((purpose) => (
                <button
                  key={purpose.value}
                  type="button"
                  onClick={() => setFormData({...formData, purpose: purpose.value})}
                  className={`glass-card p-4 transition-all duration-400 button-press hover-lift ${
                    formData.purpose === purpose.value
                      ? ecoMode 
                        ? 'border-2 border-eco-primary glow-green' 
                        : 'border-2 border-accent-blue glow-blue'
                      : 'border border-dark-border'
                  }`}
                >
                  <div className="text-3xl mb-2 floating-delayed">{purpose.icon}</div>
                  <div className={`text-xs font-semibold ${
                    formData.purpose === purpose.value 
                      ? ecoMode ? 'text-eco-primary' : 'text-accent-blue'
                      : 'text-text-muted'
                  }`}>
                    {purpose.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* STEP 3: Accommodation Pills */}
        <div className="space-y-4 animate-slideUp delay-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-accent-yellow font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Accommodation</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['hotel', 'hostel', 'homestay', 'ecoresort'].map((type) => {
              const icons = { hotel: '🏨', hostel: '🏠', homestay: '🏡', ecoresort: '🌿' };
              const labels = { hotel: 'Hotel', hostel: 'Hostel', homestay: 'Homestay', ecoresort: 'Eco-Resort' };
              const isEco = type === 'ecoresort';
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, accommodationType: type})}
                  className={`glass-card p-5 transition-all duration-400 button-press hover-lift ${
                    formData.accommodationType === type
                      ? isEco && ecoMode
                        ? 'border-2 border-eco-primary glow-green'
                        : 'border-2 border-accent-blue'
                      : 'border border-dark-border'
                  }`}
                >
                  <div className="text-4xl mb-2 floating-delayed">{icons[type]}</div>
                  <div className={`text-sm font-semibold ${
                    formData.accommodationType === type 
                      ? isEco && ecoMode ? 'text-eco-primary' : 'text-accent-blue'
                      : 'text-text-muted'
                  }`}>
                    {labels[type]}
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="hover-lift">
            <label className="block text-sm font-medium text-text-secondary mb-2">Duration (nights)</label>
            <input 
              type="number" 
              name="nights" 
              value={formData.nights} 
              onChange={handleChange}
              placeholder="e.g., 3"
              className={inputClasses}
              required
              min="1"
            />
          </div>
        </div>
        
        {/* STEP 4: Activities */}
        <div className="space-y-4 animate-slideUp delay-400">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-accent-blue font-bold glow-blue">
              4
            </div>
            <h3 className="text-xl font-semibold text-text-primary">Activities (Optional)</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['sightseeing', 'adventure', 'localtravel', 'events'].map((activity) => {
              const icons = { sightseeing: '🗺️', adventure: '🏔️', localtravel: '🚕', events: '🎭' };
              const labels = { sightseeing: 'Sightseeing', adventure: 'Adventure', localtravel: 'Local Travel', events: 'Events' };
              return (
                <div key={activity} className="hover-lift">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {icons[activity]} {labels[activity]}
                  </label>
                  <input 
                    type="number" 
                    name={activity} 
                    value={formData[activity]} 
                    onChange={handleChange}
                    min="0"
                    className={inputClasses}
                    placeholder="0"
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Submit Button */}
        <button 
          type="submit" 
          className={`w-full py-5 glass-card text-xl font-bold transition-all duration-400 button-press hover-lift animate-slideUp delay-500 ${
            ecoMode ? 'text-eco-primary glow-green' : 'text-accent-blue glow-blue'
          }`}
        >
          <span className="flex items-center justify-center">
            <span className="mr-3 text-2xl floating">🌍</span>
            <span className="text-glow-green">Calculate Carbon Footprint</span>
          </span>
        </button>
      </form>
    </div>
  );
};

export default TripCalculator;
