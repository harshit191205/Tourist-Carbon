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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
        {/* Enhanced Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="text-2xl">🌍</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                    Carbon Footprint Dashboard
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">
                    Sustainable Travel Analytics Platform
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-300">Live Data</span>
                </div>
                <button className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-all duration-300">
                  Methodology
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Enhanced Footer */}
        <footer className="border-t border-slate-800/50 bg-slate-950/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-400">Carbon Footprint Dashboard</span>
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-500 font-medium">v2.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span>© 2025 Sustainable Travel Initiative</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-slate-500">Estimates based on IPCC guidelines</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;