import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import TripCalculator from "./components/TripCalculator";
import ReportPage from "./components/ReportPage";
import { calculateTotalEmissions } from "./utils/carbonCalculator";

function App() {
  const [emissions, setEmissions] = useState(null);
  const [tripData, setTripData] = useState(null);

  const handleCalculate = (transportData, accommodationData, activityData, tripDetails) => {
    const result = calculateTotalEmissions(
      transportData,
      accommodationData,
      activityData
    );
    setEmissions(result);
    setTripData({ transportData, accommodationData, activityData, tripDetails });
  };

  return (
    <Router>
      <div className="min-h-screen bg-dark-bg flex flex-col">
        {/* Top header */}
        <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 text-xl font-semibold">
                🌍
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight">
                  Tourist Carbon Dashboard
                </h1>
                <p className="text-xs text-slate-400">
                  Plan trips, compare modes, reduce emissions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                Live estimate
              </div>
              <button className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-emerald-400 hover:text-emerald-300">
                Methodology
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
            <Routes>
              <Route
                path="/"
                element={<TripCalculator onCalculate={handleCalculate} />}
              />
              <Route
                path="/report"
                element={
                  emissions && tripData ? (
                    <ReportPage emissions={emissions} tripData={tripData} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/90">
          <div className="max-w-6xl mx-auto px-4 py-3 text-xs text-text-secondary flex justify-between">
            <span>Tourist Carbon Footprint · demo</span>
            <span>Estimates only – not official data</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
