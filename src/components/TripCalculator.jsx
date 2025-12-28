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
    travelFrequency: "occasional", // New: occasional, regular, frequent
    
    // Step 2: Transport Details
    transportMode: "flight",
    distance: "",
    calculatingDistance: false,
    routeInfo: "",
    cabinClass: "economy", // New: economy, premium_economy, business, first
    passengers: 1, // New: for car sharing
    
    // Step 3: Accommodation
    accommodationType: "hotel",
    nights: "",
    roomSharing: "alone", // New: alone, sharing
    
    // Step 4: Activities & Lifestyle
    sightseeing: 0,
    adventure: 0,
    localtravel: 0,
    events: 0,
    mealsPerDay: 3, // New
    dietType: "mixed", // New: vegan, vegetarian, pescatarian, mixed, meat-heavy
    
    // Step 5: Personal Preferences
    sustainabilityImportance: "medium", // New: low, medium, high
    budgetFlexibility: "medium", // New: low, medium, high
    comfortLevel: "standard", // New: basic, standard, luxury
  });

  const [distanceError, setDistanceError] = useState("");
  const [distanceInfo, setDistanceInfo] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numeric = ["sightseeing", "adventure", "localtravel", "events", "nights", "passengers", "mealsPerDay"];
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

  const handleCalculateDistance = async () => {
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
      cabinClass: formData.cabinClass,
      passengers: formData.passengers,
    };

    const accommodationData = {
      type: formData.accommodationType,
      nights: parseInt(formData.nights, 10),
      roomSharing: formData.roomSharing,
    };

    const activityData = {
      sightseeing: formData.sightseeing,
      adventure: formData.adventure,
      localtravel: formData.localtravel,
      events: formData.events,
      mealsPerDay: formData.mealsPerDay,
      dietType: formData.dietType,
    };

    const tripDetails = {
      origin: formData.origin,
      destination: formData.destination,
      purpose: formData.purpose,
      travelFrequency: formData.travelFrequency,
      sustainabilityImportance: formData.sustainabilityImportance,
      budgetFlexibility: formData.budgetFlexibility,
      comfortLevel: formData.comfortLevel,
    };

    onCalculate(transportData, accommodationData, activityData, tripDetails);
    navigate("/report");
  };

  const nextStep = () => {
    if (step === 1 && (!formData.origin || !formData.destination)) {
      alert("Please enter origin and destination");
      return;
    }
    if (step === 2 && !formData.distance) {
      setDistanceError("Please calculate or enter distance");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

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
                  className="input-base"
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
                  className="input-base"
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
                    className={`mode-pill ${
                      formData.purpose === purpose.value ? "active" : ""
                    }`}
                  >
                    <div className="mode-icon text-3xl">{purpose.icon}</div>
                    <div className="text-xs font-bold">{purpose.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                ✈️ How often do you travel?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "occasional", label: "Occasional", desc: "1-2 trips/year" },
                  { value: "regular", label: "Regular", desc: "3-6 trips/year" },
                  { value: "frequent", label: "Frequent", desc: "7+ trips/year" },
                ].map((freq) => (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, travelFrequency: freq.value })
                    }
                    className={`card p-4 text-center cursor-pointer transition-all ${
                      formData.travelFrequency === freq.value
                        ? "border-2 border-emerald-500 bg-emerald-500/10"
                        : "border-2 border-transparent hover:border-slate-600"
                    }`}
                  >
                    <div className="font-semibold text-slate-200">{freq.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{freq.desc}</div>
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
                    className={`mode-pill ${
                      formData.transportMode === mode.value ? "active" : ""
                    }`}
                  >
                    <div className="mode-icon">{mode.icon}</div>
                    <div className="text-xs font-bold">{mode.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {formData.transportMode === "flight" && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  💺 Cabin Class
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: "economy", label: "Economy", impact: "Lower" },
                    { value: "premium_economy", label: "Premium", impact: "Medium" },
                    { value: "business", label: "Business", impact: "High" },
                    { value: "first", label: "First", impact: "Very High" },
                  ].map((cabin) => (
                    <button
                      key={cabin.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, cabinClass: cabin.value })
                      }
                      className={`card p-4 text-center cursor-pointer ${
                        formData.cabinClass === cabin.value
                          ? "border-2 border-emerald-500 bg-emerald-500/10"
                          : "border-2 border-transparent hover:border-slate-600"
                      }`}
                    >
                      <div className="font-semibold text-slate-200">{cabin.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{cabin.impact}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.transportMode === "car" && (
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
                  className="input-base"
                />
                <p className="text-xs text-slate-400 mt-2">
                  💡 More passengers = lower emissions per person
                </p>
              </div>
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
                  <span>🗺️</span>
                  Calculate Distance
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
                className="input-base"
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
                  { value: "hotel", icon: "🏨", label: "Hotel", impact: "Medium" },
                  { value: "hostel", icon: "🏠", label: "Hostel", impact: "Low" },
                  { value: "homestay", icon: "🏡", label: "Homestay", impact: "Low" },
                  { value: "ecoresort", icon: "🌿", label: "Eco-Resort", impact: "Minimal" },
                ].map((acc) => (
                  <button
                    key={acc.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, accommodationType: acc.value })
                    }
                    className={`mode-pill ${
                      formData.accommodationType === acc.value ? "active" : ""
                    }`}
                  >
                    <div className="mode-icon">{acc.icon}</div>
                    <div className="text-xs font-bold">{acc.label}</div>
                    <div
                      className={`text-[10px] mt-1 ${
                        acc.impact === "Minimal"
                          ? "text-emerald-400"
                          : acc.impact === "Low"
                          ? "text-blue-400"
                          : "text-amber-400"
                      }`}
                    >
                      {acc.impact}
                    </div>
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
                  className="input-base"
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
                  className="input-base"
                >
                  <option value="alone">Solo Room</option>
                  <option value="sharing">Sharing Room</option>
                </select>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: "sightseeing", icon: "🗺️", label: "Sightseeing" },
                { key: "adventure", icon: "🧗", label: "Adventure" },
                { key: "localtravel", icon: "🚕", label: "Local Travel" },
                { key: "events", icon: "🎭", label: "Events" },
              ].map((activity) => (
                <div key={activity.key}>
                  <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <span>{activity.icon}</span>
                    {activity.label}
                  </label>
                  <input
                    type="number"
                    name={activity.key}
                    value={formData[activity.key]}
                    onChange={handleChange}
                    min="0"
                    className="input-base"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                🍽️ Typical Diet
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { value: "vegan", label: "Vegan", icon: "🥗", impact: "Lowest" },
                  { value: "vegetarian", label: "Vegetarian", icon: "🥕", impact: "Low" },
                  { value: "pescatarian", label: "Pescatarian", icon: "🐟", impact: "Medium" },
                  { value: "mixed", label: "Mixed", icon: "🍱", impact: "Medium" },
                  { value: "meat-heavy", label: "Meat-Heavy", icon: "🥩", impact: "High" },
                ].map((diet) => (
                  <button
                    key={diet.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, dietType: diet.value })}
                    className={`card p-3 text-center cursor-pointer ${
                      formData.dietType === diet.value
                        ? "border-2 border-emerald-500 bg-emerald-500/10"
                        : "border-2 border-transparent hover:border-slate-600"
                    }`}
                  >
                    <div className="text-2xl mb-1">{diet.icon}</div>
                    <div className="text-xs font-semibold text-slate-200">
                      {diet.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{diet.impact}</div>
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
                className="input-base"
              />
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
                Final touches
              </h2>
              <p className="text-slate-400">Your travel preferences</p>
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
                    className={`card p-4 text-center cursor-pointer ${
                      formData.sustainabilityImportance === sus.value
                        ? "border-2 border-emerald-500 bg-emerald-500/10"
                        : "border-2 border-transparent hover:border-slate-600"
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
                    className={`card p-4 text-center cursor-pointer ${
                      formData.budgetFlexibility === budget.value
                        ? "border-2 border-emerald-500 bg-emerald-500/10"
                        : "border-2 border-transparent hover:border-slate-600"
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
              <button type="submit" className="btn-primary flex-1 py-4 text-lg">
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