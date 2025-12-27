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
    const numeric = ["sightseeing", "adventure", "localtravel", "events"];
    setFormData((prev) => ({
      ...prev,
      [name]: numeric.includes(name) ? parseInt(value || 0, 10) || 0 : value,
    }));

    if (name === "origin" || name === "destination" || name === "transportMode") {
      setFormData((prev) => ({ ...prev, distance: "", routeInfo: "" }));
      setDistanceError("");
      setDistanceInfo("");
    }
  };

  const handleCalculateDistance = async () => {
    if (!formData.origin || !formData.destination) {
      setDistanceError("Please enter both origin and destination.");
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
        "Could not calculate distance. Please check locations or enter distance manually."
      );
      setFormData((prev) => ({ ...prev, calculatingDistance: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.distance) {
      setDistanceError("Please calculate or enter the distance.");
      return;
    }

    const transportData = {
      mode: formData.transportMode,
      distance: parseFloat(formData.distance),
    };

    const accommodationData = {
      type: formData.accommodationType,
      nights: parseInt(formData.nights || 0, 10),
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
    { value: "flight", label: "Flight ✈️" },
    { value: "train", label: "Train 🚆" },
    { value: "bus", label: "Bus 🚌" },
    { value: "car", label: "Car 🚗" },
    { value: "motorcycle", label: "Motorcycle 🏍️" },
    { value: "walk", label: "Walk 🚶" },
  ];

  const purposes = [
    { value: "leisure", label: "Leisure / Vacation 🏖️" },
    { value: "business", label: "Business 💼" },
    { value: "education", label: "Education 🎓" },
    { value: "family", label: "Family Visit 👨‍👩‍👧‍👦" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.7fr,1fr] gap-4">
      {/* LEFT: main form */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Plan a new trip</h2>
            <p className="text-xs text-slate-400">
              Choose mode, set route, then stay and activities.
            </p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            Step 1 · Input
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transport */}
          <section>
            <h3 className="section-label">Transport</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {transportModes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      transportMode: m.value,
                      distance: "",
                      routeInfo: "",
                    }))
                  }
                  className={`px-3 py-2 rounded-lg border text-sm text-left ${
                    formData.transportMode === m.value
                      ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          {/* Origin / destination */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="section-label">Origin</h3>
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
              <h3 className="section-label">Destination</h3>
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
          </section>

          {/* Distance */}
          <section>
            <h3 className="section-label">Distance</h3>
            <button
              type="button"
              onClick={handleCalculateDistance}
              disabled={
                formData.calculatingDistance ||
                !formData.origin ||
                !formData.destination
              }
              className="btn-primary w-full justify-center mb-2"
            >
              {formData.calculatingDistance
                ? "Calculating route..."
                : "Calculate distance"}
            </button>

            <label className="block text-xs font-medium text-slate-400 mb-1">
              Distance (km)
              {formData.distance && (
                <span className="ml-1 text-emerald-400 font-normal">✓</span>
              )}
            </label>
            <input
              type="number"
              name="distance"
              value={formData.distance}
              onChange={handleChange}
              min="1"
              placeholder="Auto-calculated or enter manually"
              className="input-base"
              required
            />
            {distanceInfo && (
              <p className="mt-1 text-xs text-emerald-300">{distanceInfo}</p>
            )}
            {distanceError && (
              <p className="mt-1 text-xs text-red-400">{distanceError}</p>
            )}
          </section>

          {/* Purpose + accommodation */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="section-label">Purpose</h3>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="input-base"
              >
                {purposes.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <h3 className="section-label">Accommodation</h3>
              <div className="space-y-2">
                <select
                  name="accommodationType"
                  value={formData.accommodationType}
                  onChange={handleChange}
                  className="input-base"
                >
                  <option value="hotel">Hotel 🏨</option>
                  <option value="hostel">Hostel 🏠</option>
                  <option value="homestay">Homestay 🏡</option>
                  <option value="ecoresort">Eco-resort 🌿</option>
                </select>
                <input
                  type="number"
                  name="nights"
                  value={formData.nights}
                  onChange={handleChange}
                  min="0"
                  placeholder="Nights of stay"
                  className="input-base"
                  required
                />
              </div>
            </div>
          </section>

          {/* Activities */}
          <section>
            <h3 className="section-label">Activities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: "sightseeing", label: "Sightseeing 🗺️" },
                { key: "adventure", label: "Adventure 🧗" },
                { key: "localtravel", label: "Local travel 🚕" },
                { key: "events", label: "Events 🎭" },
              ].map((a) => (
                <div key={a.key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {a.label}
                  </label>
                  <input
                    type="number"
                    name={a.key}
                    value={formData[a.key]}
                    onChange={handleChange}
                    min="0"
                    className="input-base"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Submit */}
          <section className="pt-1">
            <button type="submit" className="btn-primary w-full justify-center">
              Generate footprint report
            </button>
          </section>
        </form>
      </div>

      {/* RIGHT: summary panel */}
      <div className="card p-5 flex flex-col gap-4">
        <div>
          <h3 className="section-label">Current setup</h3>
          <p className="text-sm text-slate-200">
            {formData.origin && formData.destination
              ? `${formData.origin} → ${formData.destination}`
              : "Set origin & destination"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Mode:{" "}
            <span className="font-medium">
              {formData.transportMode.toUpperCase()}
            </span>{" "}
            · Distance:{" "}
            <span className="font-medium">
              {formData.distance ? `${formData.distance} km` : "not calculated"}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
            <p className="text-slate-400">Nights</p>
            <p className="text-base font-semibold">
              {formData.nights || 0}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
            <p className="text-slate-400">Activities</p>
            <p className="text-base font-semibold">
              {formData.sightseeing +
                formData.adventure +
                formData.localtravel +
                formData.events}
            </p>
          </div>
        </div>

        <div className="mt-auto text-[11px] text-slate-500 border-t border-slate-800 pt-3">
          Tip: trains and shorter distances usually reduce emissions the most.
        </div>
      </div>
    </div>
  );
};

export default TripCalculator;
