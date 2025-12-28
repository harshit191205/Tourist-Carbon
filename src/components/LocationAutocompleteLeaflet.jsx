import React, { useState, useEffect, useRef } from 'react';
import { getLocationSuggestions } from '../utils/leafletDistanceCalculator';

const LocationAutocompleteLeaflet = ({ value, onChange, placeholder, name }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = async (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(e);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (newValue.length > 2) {
      setIsLoading(true);
      
      // Debounce API calls
      timeoutRef.current = setTimeout(async () => {
        try {
          const results = await getLocationSuggestions(newValue);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsLoading(false);
        }
      }, 500); // Wait 500ms after user stops typing
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const event = {
      target: {
        name: name,
        value: suggestion.name.split(',')[0] // Get main location name
      }
    };
    setInputValue(suggestion.name.split(',')[0]);
    onChange(event);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="input-field"
        placeholder={placeholder}
        autoComplete="off"
        required
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-3 hover:bg-slate-700 cursor-pointer text-slate-200 text-sm border-b border-slate-700 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-emerald-500">📍</span>
                <span>{suggestion.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocompleteLeaflet;
