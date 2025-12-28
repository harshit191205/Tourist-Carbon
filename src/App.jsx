import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TripCalculator from './components/TripCalculator';
import EnhancedReportPage from './components/ReportPage';
import EnhancedEmissionBreakdown from './components/EmissionBreakdown';
import carbonCalculator from './utils/carbonCalculator';
import './App.css';

const { calculateTotalEmissions } = carbonCalculator;

function App() {
  const [emissions, setEmissions] = useState(null);
  const [tripData, setTripData] = useState(null);

  const handleCalculate = (transportData, accommodationData, activityData, tripDetails) => {
    console.log('🧮 Calculating emissions...');
    console.log('Transport:', transportData);
    console.log('Accommodation:', accommodationData);
    console.log('Activities:', activityData);
    console.log('Trip Details:', tripDetails);

    try {
      const result = calculateTotalEmissions(
        transportData,
        accommodationData,
        activityData,
        tripDetails
      );

      console.log('✅ Calculation complete:', result);

      setEmissions(result);
      setTripData({
        transportData,
        accommodationData,
        activityData,
        tripDetails
      });
    } catch (error) {
      console.error('❌ Calculation error:', error);
      alert('Error calculating emissions. Please check your inputs and try again.');
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">🌍</div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">
                    Tourist Carbon Footprint
                  </h1>
                  <p className="text-xs text-slate-400">
                    Track, Analyze & Reduce Your Travel Impact
                  </p>
                </div>
              </div>
              
              <nav className="hidden md:flex gap-4">
                <a 
                  href="/" 
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                >
                  🏠 Home
                </a>
                {emissions && (
                  <a 
                    href="/report" 
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                  >
                    📊 View Report
                  </a>
                )}
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route
              path="/"
              element={
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold gradient-text mb-4">
                      Calculate Your Travel Carbon Footprint
                    </h2>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                      Make informed, sustainable travel choices. Get personalized recommendations
                      to reduce your environmental impact while exploring the world.
                    </p>
                  </div>

                  <TripCalculator onCalculate={handleCalculate} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                    {[
                      {
                        icon: '🎯',
                        title: 'Accurate Calculations',
                        desc: 'Using DEFRA 2024, HCMI, and EPA emission factors'
                      },
                      {
                        icon: '💡',
                        title: 'Personalized Tips',
                        desc: 'Get recommendations tailored to your travel style'
                      },
                      {
                        icon: '📊',
                        title: 'Detailed Reports',
                        desc: 'Visual breakdowns and comparisons with benchmarks'
                      }
                    ].map((feature, i) => (
                      <div
                        key={i}
                        className="card p-6 text-center hover:scale-105 transition-transform"
                      >
                        <div className="text-5xl mb-4">{feature.icon}</div>
                        <h3 className="text-lg font-bold text-slate-100 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-slate-400">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              }
            />

            <Route
              path="/report"
              element={
                emissions && tripData ? (
                  <div className="max-w-6xl mx-auto space-y-8">
                    <EnhancedReportPage emissions={emissions} tripData={tripData} />
                    
                    <EnhancedEmissionBreakdown 
                      emissions={emissions} 
                      tripData={tripData}
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                      <button
                        onClick={() => window.location.href = '/'}
                        className="btn-secondary px-8 py-4 text-lg"
                      >
                        ← Calculate Another Trip
                      </button>
                      
                      <button
                        onClick={() => {
                          const reportData = {
                            date: new Date().toISOString(),
                            route: `${tripData.tripDetails.origin} → ${tripData.tripDetails.destination}`,
                            emissions: emissions,
                            tripData: tripData
                          };
                          
                          const blob = new Blob([JSON.stringify(reportData, null, 2)], {
                            type: 'application/json'
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `carbon-report-${Date.now()}.json`;
                          a.click();
                        }}
                        className="btn-primary px-8 py-4 text-lg"
                      >
                        📥 Download Report
                      </button>
                    </div>
                  </div>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-slate-700 mt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">
                  🌍 Tourist Carbon Footprint
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Empowering travelers to make sustainable choices through accurate
                  carbon footprint tracking and personalized recommendations.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">Data Sources</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• DEFRA 2024 Emission Factors</li>
                  <li>• Hotel Carbon Measurement Initiative (HCMI)</li>
                  <li>• EPA Greenhouse Gas Equivalencies</li>
                  <li>• UNWTO Sustainable Tourism Guidelines</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">About</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Built for the 1M1B Green Internship Program. Educational project
                  promoting sustainable travel and climate awareness.
                </p>
                <p className="text-xs text-slate-500 mt-4">
                  © 2025 Tourist Carbon Project
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
