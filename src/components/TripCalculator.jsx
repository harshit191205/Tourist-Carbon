import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateTravelDistance } from "../utils/distanceCalculator";

const TripCalculator = ({ onCalculate }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Trip Info
    origin: "",
    destination: "",
    purpose: "leisure",
    
    // Step 2: Transport Details
    transportMode: "flight",
    distance: "",
    calculatingDistance: false,
    routeInfo: "",
    passengers: 1,
    vehicleType: "petrol",
    
    // Step 3: Accommodation
    accommodationType: "hotel",
    nights: "",
    roomSharing: "alone",
    starRating: 3,
    
    // Step 4: Activities & Lifestyle
    activities: [],
    mealsPerDay: 3,
    shoppingIntensity: "moderate",
    
    // Step 5: Personal Preferences
    sustainabilityImportance: "medium",
    budgetFlexibility: "medium",
  });

  const [distanceError, setDistanceError] = useState("");
  const [distanceInfo, setDistanceInfo] = useState("");

  const activityOptions = [
    { id: 'sightseeing', label: '🏛️ Sightseeing' },
    { id: 'hiking', label: '🥾 Hiking' },
    { id: 'water-sports', label: '🏄 Water Sports' },
    { id: 'skiing', label: '⛷️ Skiing' },
    { id: 'shopping', label: '🛍️ Shopping' },
    { id: 'dining', label: '🍽️ Dining' },
    { id: 'nightlife', label: '🎉 Nightlife' },
    { id: 'cultural', label: '🎭 Cultural' },
    { id: 'adventure', label: '🪂 Adventure' },
    { id: 'relaxation', label: '🧘 Relaxation' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numeric = ["nights", "passengers", "mealsPerDay", "starRating"];
    setFormData((prev) => ({
      ...prev,
      [name]: numeric.includes(name) ? parseInt(value, 10) || 0 : value,
    }));

    if (name === "origin" || name === "destination" || name === "transportMode") {
      setFormData((prev) => ({ ...prev, distance: "", routeInfo: "" }));
      setDistanceError("");
      setDistanceInfo("");
    }
  };

  const toggleActivity = (activityId) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.includes(activityId)
        ? prev.activities.filter(id => id !== activityId)
        : [...prev.activities, activityId]
    }));
  };

  const handleCalculateDistance = async (e) => {
    e.preventDefault();
    
    if (!formData.origin || !formData.destination) {
      setDistanceError("Please enter both origin and destination");
      return;
    }

    setFormData((prev) => ({ ...prev, calculatingDistance: true }));
    setDistanceError("");
    setDistanceInfo("");

    try {
      const result = await calculateTravelDistance(
        formData.origin,
        formData.destination,
        formData.transportMode
      );

      setFormData((prev) => ({
        ...prev,
        distance: result.distance,
        routeInfo: result.routeType,
        calculatingDistance: false,
      }));

      setDistanceInfo(`${result.routeType}: ${result.distance} km`);
    } catch (err) {
      console.error(err);
      setDistanceError("Could not calculate distance. Please enter manually.");
      setFormData((prev) => ({ ...prev, calculatingDistance: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.distance || formData.distance <= 0) {
      setDistanceError("Please calculate or enter a valid distance");
      return;
    }

    if (!formData.nights || formData.nights <= 0) {
      alert("Please enter the number of nights");
      return;
    }

    const transportData = {
      mode: formData.transportMode,
      distance: parseFloat(formData.distance),
      passengers: formData.passengers,
      vehicleType: formData.vehicleType,
    };

    const accommodationData = {
      type: formData.accommodationType,
      nights: parseInt(formData.nights, 10),
      roomSharing: formData.roomSharing,
      starRating: formData.starRating,
    };

    const activityData = {
      activities: formData.activities,
      mealsPerDay: formData.mealsPerDay,
      shoppingIntensity: formData.shoppingIntensity,
    };

    const tripDetails = {
      origin: formData.origin,
      destination: formData.destination,
      purpose: formData.purpose,
      sustainabilityImportance: formData.sustainabilityImportance,
      budgetFlexibility: formData.budgetFlexibility,
    };

    onCalculate(transportData, accommodationData, activityData, tripDetails);
    navigate("/report");
  };

  const nextStep = (e) => {
    e.preventDefault();
    
    if (step === 1 && (!formData.origin || !formData.destination)) {
      alert("Please enter origin and destination");
      return;
    }
    if (step === 2 && !formData.distance) {
      setDistanceError("Please calculate or enter distance");
      return;
    }
    if (step === 3 && !formData.nights) {
      alert("Please enter the number of nights");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = (e) => {
    e.preventDefault();
    setStep(step - 1);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8 space-x-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              s === step
                ? "bg-emerald-500 text-white scale-110"
                : s < step
                ? "bg-emerald-500/30 text-emerald-300"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {s}
          </div>
          {s < 5 && (
            <div
              className={`w-8 h-1 mx-1 ${
                s < step ? "bg-emerald-500" : "bg-slate-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="card p-8 animate-fade-in max-w-4xl mx-auto">
      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Trip Basics */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold gradient-text mb-2">
                Tell us about your trip
              </h2>
              <p className="text-slate-400">Where are you traveling?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  📍 From (Origin)
                </label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder="e.g., New Delhi, India"
                  className="input-field w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  🎯 To (Destination)
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="e.g., Paris, France"
                  className="input-field w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                🎒 Trip Purpose
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "leisure", icon: "🏖️", label: "Leisure" },
                  { value: "business", icon: "💼", label: "Business" },
                  { value: "education", icon: "🎓", label: "Education" },
                  { value: "family", icon: "👨‍👩‍👧", label: "Family" },
                ].map((purpose) => (
                  <button
                    key={purpose.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, purpose: purpose.value })}
                    className={`py-4 px-4 rounded-lg font-semibold transition-all ${
                      formData.purpose === purpose.value
                        ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg scale-105"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    <div className="text-3xl mb-1">{purpose.icon}</div>
                    <div className="text-xs">{purpose.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={nextStep}
              className="btn-primary w-full text-lg py-4"
            >
              Continue to Transport →
            </button>
          </div>
        )}

        {/* STEP 2: Transport Details */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold gradient-text mb-2">
                How will you travel?
              </h2>
              <p className="text-slate-400">Choose your mode of transport</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                🚀 Transport Mode
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { value: "flight", icon: "✈️", label: "Flight" },
                  { value: "train", icon: "🚆", label: "Train" },
                  { value: "bus", icon: "🚌", label: "Bus" },
                  { value: "car", icon: "🚗", label: "Car" },
                  { value: "motorcycle", icon: "🏍️", label: "Motorcycle" },
                  { value: "bicycle", icon: "🚴", label: "Bicycle" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        transportMode: mode.value,
                        distance: "",
                        routeInfo: "",
                      })
                    }
                    className={`py-4 px-4 rounded-lg font-semibold transition-all ${
                      formData.transportMode === mode.value
                        ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg scale-105"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    <div className="text-2xl mb-1">{mode.icon}</div>
                    <div className="text-xs">{mode.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {(formData.transportMode === "car" || formData.transportMode === "motorcycle") && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    ⛽ Vehicle Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['petrol', 'diesel', 'hybrid', 'electric'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, vehicleType: type })}
                        className={`py-3 px-4 rounded-lg font-semibold capitalize transition-all ${
                          formData.vehicleType === type
                            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    👥 Number of Passengers (including you)
                  </label>
                  <input
                    type="number"
                    name="passengers"
                    value={formData.passengers}
                    onChange={handleChange}
                    min="1"
                    max="8"
                    className="input-field w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    💡 More passengers = lower emissions per person
                  </p>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleCalculateDistance}
              disabled={
                formData.calculatingDistance ||
                !formData.origin ||
                !formData.destination
              }
              className="btn-primary w-full"
            >
              {formData.calculatingDistance ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Calculating route...
                </>
              ) : (
                <>
                  <span>🗺️</span> Calculate Distance
                </>
              )}
            </button>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                📏 Distance (km)
              </label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                min="1"
                step="0.1"
                placeholder="Auto-calculated or enter manually"
                className="input-field w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                required
              />
              {distanceInfo && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-sm font-medium text-emerald-300">✓ {distanceInfo}</p>
                </div>
              )}
              {distanceError && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-medium text-red-300">⚠️ {distanceError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary flex-1 py-4"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex-1 py-4"
              >
                Continue to Accommodation →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Accommodation */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold gradient-text mb-2">
                Where will you stay?
              </h2>
              <p className="text-slate-400">Tell us about your accommodation</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                🏨 Accommodation Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "hotel", icon: "🏨", label: "Hotel" },
                  { value: "hostel", icon: "🏠", label: "Hostel" },
                  { value: "Homestay", icon: "🏡", label: "Homestay" },
                  { value: "ecoresort", icon: "🌿", label: "Eco-Resort" },
                ].map((acc) => (
                  <button
                    key={acc.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, accommodationType: acc.value })
                    }
                    className={`py-4 px-4 rounded-lg font-semibold transition-all ${
                      formData.accommodationType === acc.value
                        ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg scale-105"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    <div className="text-3xl mb-1">{acc.icon}</div>
                    <div className="text-xs">{acc.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  🌙 Number of Nights
                </label>
                <input
                  type="number"
                  name="nights"
                  value={formData.nights}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g., 3"
                  className="input-field w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  👥 Room Arrangement
                </label>
                <select
                  name="roomSharing"
                  value={formData.roomSharing}
                  onChange={handleChange}
                  className="input-field w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="alone">Solo Room</option>
                  <option value="sharing">Sharing Room</option>
                </select>
              </div>
            </div>

            {formData.accommodationType === 'hotel' && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  ⭐ Hotel Star Rating
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setFormData({ ...formData, starRating: stars })}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        formData.starRating === stars
                          ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {'⭐'.repeat(stars)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary flex-1 py-4"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex-1 py-4"
              >
                Continue to Activities →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Activities & Lifestyle */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold gradient-text mb-2">
                What will you do?
              </h2>
              <p className="text-slate-400">Activities and daily habits</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                🎯 Planned Activities (select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {activityOptions.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => toggleActivity(activity.id)}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      formData.activities.includes(activity.id)
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg scale-105'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {activity.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                🍽️ Meals per day
              </label>
              <input
                type="number"
                name="mealsPerDay"
                value={formData.mealsPerDay}
                onChange={handleChange}
                min="1"
                max="5"
                className="input-field w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                🛍️ Shopping Intensity
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['minimal', 'moderate', 'heavy'].map((intensity) => (
                  <button
                    key={intensity}
                    type="button"
                    onClick={() => setFormData({ ...formData, shoppingIntensity: intensity })}
                    className={`py-3 px-4 rounded-lg font-semibold capitalize transition-all ${
                      formData.shoppingIntensity === intensity
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
            </div> */}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary flex-1 py-4"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex-1 py-4"
              >
                Continue to Preferences →
              </button>
            </div>
          </div>
        )}

      {/* STEP 5: Personal Preferences */}
      {step === 5 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold gradient-text mb-2">
              Your travel preferences
            </h2>
            <p className="text-slate-400">Help us personalize your report</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              🌱 Sustainability Importance
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "low", label: "Low Priority", desc: "Convenience first" },
                { value: "medium", label: "Important", desc: "Balance both" },
                { value: "high", label: "Very Important", desc: "Eco-conscious" },
              ].map((sus) => (
                <button
                  key={sus.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, sustainabilityImportance: sus.value })
                  }
                  className={`p-4 rounded-lg text-center cursor-pointer transition-all border-2 ${
                    formData.sustainabilityImportance === sus.value
                      ? "border-emerald-500 bg-emerald-500/20 scale-105"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600 hover:bg-slate-700"
                  }`}
                >
                  <div className="font-semibold text-slate-200">{sus.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{sus.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              💰 Budget Flexibility
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "low", label: "Limited", desc: "Budget travel" },
                { value: "medium", label: "Moderate", desc: "Standard options" },
                { value: "high", label: "Flexible", desc: "Premium options" },
              ].map((budget) => (
                <button
                  key={budget.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, budgetFlexibility: budget.value })
                  }
                  className={`p-4 rounded-lg text-center cursor-pointer transition-all border-2 ${
                    formData.budgetFlexibility === budget.value
                      ? "border-emerald-500 bg-emerald-500/20 scale-105"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600 hover:bg-slate-700"
                  }`}
                >
                  <div className="font-semibold text-slate-200">{budget.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{budget.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={prevStep}
              className="btn-secondary flex-1 py-4"
            >
              ← Back
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1 py-4 text-lg"
            >
              <span className="text-xl">🌍</span>
              Generate My Carbon Report
            </button>
          </div>
        </div>
      )}

      </form>
    </div>
  );
};

export default TripCalculator;
