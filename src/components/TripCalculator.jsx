import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateTravelDistance } from "../utils/distanceCalculator";

const TripCalculator = ({ onCalculate }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    purpose: "leisure",
    transportMode: "flight",
    distance: "",
    calculatingDistance: false,
    routeInfo: "",
    accommodationType: "hotel",
    nights: "",
    sightseeing: 0,
    adventure: 0,
    localtravel: 0,
    events: 0,
  });

  const [distanceError, setDistanceError] = useState("");
  const [distanceInfo, setDistanceInfo] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numeric = ["sightseeing", "adventure", "localtravel", "events", "nights"];
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
      setDistanceError(
        "Could not calculate distance. Please enter distance manually."
      );
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
    };

    const accommodationData = {
      type: formData.accommodationType,
      nights: parseInt(formData.nights, 10),
    };

    const activityData = {
      sightseeing: formData.sightseeing,
      adventure: formData.adventure,
      localtravel: formData.localtravel,
      events: formData.events,
    };

    const tripDetails = {
      origin: formData.origin,
      destination: formData.destination,
      purpose: formData.purpose,
    };

    onCalculate(transportData, accommodationData, activityData, tripDetails);
    navigate("/report");
  };

  const transportModes = [
    { value: "flight", icon: "✈️", label: "Flight", color: "red" },
    { value: "train", icon: "🚆", label: "Train", color: "emerald" },
    { value: "bus", icon: "🚌", label: "Bus", color: "blue" },
    { value: "car", icon: "🚗", label: "Car", color: "slate" },
    { value: "motorcycle", icon: "🏍️", label: "Motorcycle", color: "orange" },
    { value: "walk", icon: "🚶", label: "Walk", color: "green" },
  ];

  const purposes = [
    { value: "leisure", icon: "🏖️", label: "Leisure" },
    { value: "business", icon: "💼", label: "Business" },
    { value: "education", icon: "🎓", label: "Education" },
    { value: "family", icon: "👨‍👩‍👧‍👦", label: "Family" },
  ];

  const accommodationTypes = [
    { value: "hotel", icon: "🏨", label: "Hotel", impact: "High" },
    { value: "hostel", icon: "🏠", label: "Hostel", impact: "Medium" },
    { value: "homestay", icon: "🏡", label: "Homestay", impact: "Low" },
    { value: "ecoresort", icon: "🌿", label: "Eco-resort", impact: "Minimal" },
  ];

  const activities = [
    { key: "sightseeing", icon: "🗺️", label: "Sightseeing" },
    { key: "adventure", icon: "🧗", label: "Adventure" },
    { key: "localtravel", icon: "🚕", label: "Local Travel" },
    { key: "events", icon: "🎭", label: "Events" },
  ];

  const currentTotal = 
    formData.sightseeing + formData.adventure + formData.localtravel + formData.events;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.5fr,1fr] gap-6 animate-fade-in">
      {/* Main Form */}
      <div className="card p-8 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-1">Plan Your Trip</h2>
            <p className="text-sm text-slate-400">
              Calculate your journey's environmental impact
            </p>
          </div>
          <span className="badge badge-info">Step 1 of 2</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Transport Mode Selection */}
          <section>
            <h3 className="section-label">🚀 Transport Mode</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {transportModes.map((mode) => (
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
                  <div className={`text-xs font-bold ${
                    formData.transportMode === mode.value
                      ? "text-emerald-400"
                      : "text-slate-400"
                  }`}>
                    {mode.label}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Route Details */}
          <section className="space-y-4">
            <h3 className="section-label">📍 Route Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Origin City
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
                  Destination City
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
                Distance (km)
                {formData.distance && (
                  <span className="ml-2 text-emerald-400 text-xs">✓ Calculated</span>
                )}
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
                  <p className="text-sm font-medium text-emerald-300">
                    ✓ {distanceInfo}
                  </p>
                </div>
              )}
              {distanceError && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-medium text-red-300">
                    ⚠️ {distanceError}
                  </p>
                </div>
              )}
            </div>

            {/* Purpose Pills */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Trip Purpose
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {purposes.map((purpose) => (
                  <button
                    key={purpose.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, purpose: purpose.value })}
                    className={`mode-pill ${
                      formData.purpose === purpose.value ? "active" : ""
                    }`}
                  >
                    <div className="mode-icon text-3xl">{purpose.icon}</div>
                    <div className={`text-xs font-bold ${
                      formData.purpose === purpose.value
                        ? "text-emerald-400"
                        : "text-slate-400"
                    }`}>
                      {purpose.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Accommodation */}
          <section className="space-y-4">
            <h3 className="section-label">🏨 Accommodation</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {accommodationTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, accommodationType: type.value })
                  }
                  className={`mode-pill ${
                    formData.accommodationType === type.value ? "active" : ""
                  }`}
                >
                  <div className="mode-icon">{type.icon}</div>
                  <div className={`text-xs font-bold ${
                    formData.accommodationType === type.value
                      ? "text-emerald-400"
                      : "text-slate-400"
                  }`}>
                    {type.label}
                  </div>
                  <div className={`text-[10px] font-medium mt-1 ${
                    type.impact === "Minimal" ? "text-emerald-400" :
                    type.impact === "Low" ? "text-blue-400" :
                    type.impact === "Medium" ? "text-amber-400" : "text-red-400"
                  }`}>
                    {type.impact} Impact
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Number of Nights
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
          </section>

          {/* Activities */}
          <section className="space-y-4">
            <h3 className="section-label">🎯 Activities (Optional)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activities.map((activity) => (
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
          </section>

          {/* Submit Button */}
          <button type="submit" className="btn-primary w-full text-base py-4">
            <span className="text-xl">🌍</span>
            Generate Carbon Footprint Report
          </button>
        </form>
      </div>

      {/* Summary Panel */}
      <div className="space-y-6">
        <div className="card p-6 sticky top-24">
          <h3 className="section-label">📊 Trip Summary</h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 mb-2">Route</p>
              <p className="text-sm font-bold text-slate-200">
                {formData.origin && formData.destination
                  ? `${formData.origin} → ${formData.destination}`
                  : "Not set"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card">
                <div className="stat-value">{formData.transportMode.toUpperCase()}</div>
                <div className="stat-label">Transport</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {formData.distance ? `${formData.distance} km` : "—"}
                </div>
                <div className="stat-label">Distance</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card">
                <div className="stat-value">{formData.nights || 0}</div>
                <div className="stat-label">Nights</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{currentTotal}</div>
                <div className="stat-label">Activities</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-xs font-semibold text-emerald-400 mb-1">💡 Tip</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Choose trains and eco-resorts to minimize your carbon footprint
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCalculator;