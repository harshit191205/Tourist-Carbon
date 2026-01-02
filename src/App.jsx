import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import TripCalculator from './components/TripCalculator';
import SimplifiedReportPage from './components/SimplifiedReportPage';
import TripHistory from './components/TripHistory';
import CarbonCredits from './components/CarbonCredits';
import Login from './components/Login';
import PreTripPlanning from './components/PreTripPlanning';

// Group Trips Components
import CreateGroupTrip from './components/GroupTrips/CreateGroupTrip';
import GroupTripsList from './components/GroupTrips/GroupTripsList';
import GroupTripDashboard from './components/GroupTrips/GroupTripDashboard';

import carbonCalculator from './utils/carbonCalculator';
import { saveTrip } from './services/firebaseService';
import './App.css';

const { calculateTotalEmissions } = carbonCalculator;

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppContent() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [emissions, setEmissions] = useState(null);
  const [tripData, setTripData] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      alert('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout');
    }
  };

  const handleCalculate = async (transportData, accommodationData, activityData, tripDetails) => {
    console.log('🧮 Calculating emissions...');
    console.log('Transport Data:', transportData);
    console.log('Accommodation Data:', accommodationData);
    console.log('Activity Data:', activityData);
    console.log('Trip Details:', tripDetails);

    try {
      const result = calculateTotalEmissions(
        transportData,
        accommodationData,
        activityData,
        tripDetails
      );

      console.log('✅ Calculation complete:', result);

      // Validate result before setting
      if (!result || typeof result.totalEmissions !== 'number' || isNaN(result.totalEmissions)) {
        console.error('❌ Invalid emissions result:', result);
        alert('❌ Error: Unable to calculate emissions. Please check your inputs.');
        return;
      }

      // Validate individual emission components
      const validatedResult = {
        totalEmissions: Number(result.totalEmissions) || 0,
        transportEmissions: Number(result.transportEmissions) || 0,
        accommodationEmissions: Number(result.accommodationEmissions) || 0,
        activityEmissions: Number(result.activityEmissions) || 0
      };

      setEmissions(validatedResult);
      setTripData({
        transportData,
        accommodationData,
        activityData,
        tripDetails
      });

      console.log('✅ Emissions state set:', validatedResult);
      console.log('✅ Trip data state set');

      // Save to Firebase
      if (currentUser) {
        console.log('💾 Saving trip to Firebase...');
        console.log('👤 Current User ID:', currentUser.uid);
        
        const saveResult = await saveTrip(
          currentUser.uid,
          { transportData, accommodationData, activityData, tripDetails },
          validatedResult
        );
        
        console.log('💾 Save Result:', saveResult);
        
        if (saveResult.success) {
          console.log('✅ Trip saved to Firebase with ID:', saveResult.id);
          alert('✅ Trip saved successfully!');
          
          // Navigate to report page after successful save
          navigate('/report');
        } else {
          console.error('❌ Failed to save trip:', saveResult.error);
          alert(`⚠️ Trip calculated but failed to save: ${saveResult.error}`);
          
          // Still navigate to report even if save failed
          navigate('/report');
        }
      } else {
        // Navigate to report even if not logged in
        navigate('/report');
      }
    } catch (error) {
      console.error('❌ Calculation error:', error);
      alert('❌ Error calculating emissions. Please check your inputs and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header - Only show when user is logged in */}
      {currentUser && (
        <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
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
              
              <nav className="flex gap-3 items-center flex-wrap">
                <span className="text-slate-400 text-sm hidden md:block">
                  👤 {currentUser.email}
                </span>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-sm font-semibold"
                >
                  🏠 Dashboard
                </button>
                <button
                  onClick={() => navigate('/pre-trip-planning')}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all text-sm font-semibold"
                >
                  🗺️ Plan Trip
                </button>
                <button
                  onClick={() => navigate('/history')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-sm font-semibold"
                >
                  📊 Trip History
                </button>
                <button
                  onClick={() => navigate('/groups')}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all text-sm font-semibold"
                >
                  👥 Group Trips
                </button>
                <button
                  onClick={() => navigate('/credits')}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all text-sm font-semibold"
                >
                  💎 Carbon Credits
                </button>
                {emissions && (
                  <button
                    onClick={() => navigate('/report')}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-all text-sm font-semibold"
                  >
                    📄 View Report
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all text-sm font-semibold"
                >
                  🚪 Logout
                </button>
              </nav>
            </div>
          </div>
        </header>
      )}

      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Login Route - Public */}
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard Route - Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold gradient-text mb-4">
                      Calculate Your Travel Carbon Footprint
                    </h2>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                      Make informed, sustainable travel choices. Get accurate calculations
                      based on standard emission factors and transparent formulas.
                    </p>
                    
                    {/* Welcome Message */}
                    <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg max-w-2xl mx-auto">
                      <p className="text-emerald-300 text-sm">
                        🎉 Welcome back! Your trips will be automatically saved and you'll earn carbon credits!
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <button
                      onClick={() => navigate('/pre-trip-planning')}
                      className="card p-6 hover:scale-105 transition-all text-center group"
                    >
                      <div className="text-5xl mb-3">🗺️</div>
                      <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-purple-400 transition-colors">
                        Plan Your Trip
                      </h3>
                      <p className="text-sm text-slate-400">
                        Compare transport options before you travel
                      </p>
                    </button>

                    <button
                      onClick={() => navigate('/history')}
                      className="card p-6 hover:scale-105 transition-all text-center group"
                    >
                      <div className="text-5xl mb-3">📊</div>
                      <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors">
                        Trip History
                      </h3>
                      <p className="text-sm text-slate-400">
                        View all your past trips and emissions
                      </p>
                    </button>

                    <button
                      onClick={() => navigate('/groups')}
                      className="card p-6 hover:scale-105 transition-all text-center group"
                    >
                      <div className="text-5xl mb-3">👥</div>
                      <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-blue-400 transition-colors">
                        Group Trips
                      </h3>
                      <p className="text-sm text-slate-400">
                        Plan trips with friends and family
                      </p>
                    </button>
                  </div>

                  <TripCalculator onCalculate={handleCalculate} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                    {[
                      {
                        icon: '🎯',
                        title: 'Standard Emission Factors',
                        desc: 'Using internationally recognized carbon accounting values'
                      },
                      {
                        icon: '📐',
                        title: 'Transparent Calculations',
                        desc: 'See the exact formulas and factors used in calculations'
                      },
                      {
                        icon: '💡',
                        title: 'Actionable Insights',
                        desc: 'Get practical recommendations to reduce your footprint'
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

                  {/* Emission Factors Reference */}
                  <div className="card p-8 mt-16">
                    <h3 className="text-2xl font-bold gradient-text mb-6 text-center">
                      📊 Standard Emission Factors Used
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-bold text-slate-200 mb-3">🚗 Transport (kg CO₂e/km)</h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                          <li>• Flight: 0.175</li>
                          <li>• Car (Petrol): 0.215</li>
                          <li>• Car (Diesel): 0.19</li>
                          <li>• Bus: 0.09</li>
                          <li>• Train: 0.03</li>
                          <li>• Bicycle/Walk: 0.00</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-200 mb-3">🏨 Accommodation (kg CO₂e/night)</h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                          <li>• 5-Star Hotel: 40</li>
                          <li>• 3-Star Hotel: 20</li>
                          <li>• Budget Hotel: 12.5</li>
                          <li>• Guesthouse: 10</li>
                          <li>• Eco-Lodge: 7.5</li>
                          <li>• Hostel: 6.5</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-200 mb-3">🍽️ Food & Activities</h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                          <li>• Non-veg meal: 4 kg CO₂e</li>
                          <li>• Veg meal: 1.5 kg CO₂e</li>
                          <li>• Sightseeing: 2 kg CO₂e/day</li>
                          <li>• Adventure: 10 kg CO₂e</li>
                          <li>• Shopping: 1 kg CO₂e/item</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Pre-Trip Planning Route - Protected */}
          <Route
            path="/pre-trip-planning"
            element={
              <ProtectedRoute>
                <PreTripPlanning />
              </ProtectedRoute>
            }
          />

          {/* Trip History Route - Protected */}
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <TripHistory />
              </ProtectedRoute>
            }
          />

          {/* Group Trips Routes - Protected */}
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <GroupTripsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/create"
            element={
              <ProtectedRoute>
                <CreateGroupTrip />
              </ProtectedRoute>
            }
          />
          {/* FIXED: Changed :groupId to :tripId */}
          <Route
            path="/group/:tripId"
            element={
              <ProtectedRoute>
                <GroupTripDashboard />
              </ProtectedRoute>
            }
          />

          {/* Carbon Credits Route - Protected */}
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <CarbonCredits />
              </ProtectedRoute>
            }
          />

          {/* Report Route - Protected */}
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                {emissions && tripData ? (
                  <div className="max-w-6xl mx-auto">
                    <SimplifiedReportPage emissions={emissions} tripData={tripData} />
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-slate-300 mb-4">No Trip Data Available</h2>
                    <p className="text-slate-400 mb-6">Please calculate a trip first to view the report</p>
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
                    >
                      Calculate a Trip
                    </button>
                  </div>
                )}
              </ProtectedRoute>
            }
          />

          {/* Catch All - Redirect to login if not authenticated, else dashboard */}
          <Route 
            path="*" 
            element={
              currentUser ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </main>

      {/* Footer - Only show when logged in */}
      {currentUser && (
        <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-slate-700 mt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">
                  🌍 Tourist Carbon Footprint
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Empowering travelers to make sustainable choices through accurate
                  carbon footprint tracking using standard emission factors.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">Features</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Pre-Trip Planning</li>
                  <li>• Trip Calculator</li>
                  <li>• Group Trips Planning</li>
                  <li>• Carbon Credits System</li>
                  <li>• Trip History</li>
                  <li>• Achievements & Levels</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">Methodology</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Standard emission factors</li>
                  <li>• Transparent calculations</li>
                  <li>• Activity × Emission Factor</li>
                  <li>• Internationally recognized values</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">About</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Built for the 1M1B Green Internship Program. Educational project
                  promoting sustainable travel and climate awareness.
                </p>
                <p className="text-xs text-slate-500 mt-4">
                  © 2026 Tourist Carbon Project - Powered by Firebase
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
