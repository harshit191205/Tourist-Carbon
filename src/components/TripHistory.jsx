import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserTrips, deleteTrip } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const TripHistory = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalEmissions: 0,
    averageEmissions: 0
  });

  const calculateStats = useCallback((tripsList) => {
    const total = tripsList.length;
    const totalEmissions = tripsList.reduce((sum, trip) => {
      const emissionValue = parseFloat(trip.emissions?.total) || 0;
      return sum + emissionValue;
    }, 0);
    const average = total > 0 ? totalEmissions / total : 0;

    setStats({
      totalTrips: total,
      totalEmissions: totalEmissions.toFixed(2),
      averageEmissions: average.toFixed(2)
    });
  }, []);

  const loadTrips = useCallback(async () => {
    if (!currentUser) {
      console.log('❌ No current user');
      return;
    }
    
    console.log('🔍 Loading trips for user:', currentUser.uid);
    setLoading(true);
    
    try {
      const result = await getUserTrips(currentUser.uid);
      console.log('📦 getUserTrips result:', result);
      
      if (result.success) {
        console.log('✅ Trips loaded:', result.trips.length);
        console.log('Trip data:', result.trips);
        setTrips(result.trips);
        calculateStats(result.trips);
      } else {
        console.error('❌ Failed to load trips:', result.error);
        alert('Failed to load trips: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error loading trips:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, calculateStats]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      const result = await deleteTrip(tripId);
      if (result.success) {
        alert('✅ Trip deleted successfully!');
        loadTrips(); // Reload trips
      } else {
        alert('❌ Failed to delete trip: ' + result.error);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0' : num.toFixed(2);
  };

  const getTransportIcon = (mode) => {
    const icons = {
      flight: '✈️',
      train: '🚆',
      bus: '🚌',
      car: '🚗',
      motorcycle: '🏍️',
      bicycle: '🚴'
    };
    return icons[mode] || '🚗';
  };

  const getAccommodationIcon = (type) => {
    const icons = {
      hotel: '🏨',
      hostel: '🏠',
      Homestay: '🏡',
      ecoresort: '🌿'
    };
    return icons[type] || '🏨';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌍</div>
          <p className="text-slate-300 text-xl">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold gradient-text mb-4">
          📊 Trip History
        </h1>
        <p className="text-xl text-slate-300">
          Track your carbon footprint journey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 text-center">
          <div className="text-5xl mb-3">🗺️</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {stats.totalTrips}
          </div>
          <div className="text-sm text-slate-400">Total Trips</div>
        </div>

        <div className="card p-6 text-center">
          <div className="text-5xl mb-3">💨</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {stats.totalEmissions}
          </div>
          <div className="text-sm text-slate-400">Total CO₂ (kg)</div>
        </div>

        <div className="card p-6 text-center">
          <div className="text-5xl mb-3">📈</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {stats.averageEmissions}
          </div>
          <div className="text-sm text-slate-400">Average per Trip (kg)</div>
        </div>
      </div>

      {/* Trips List */}
      {trips.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🧳</div>
          <h3 className="text-2xl font-bold text-slate-300 mb-3">
            No trips yet!
          </h3>
          <p className="text-slate-400 mb-6">
            Start tracking your carbon footprint by calculating your first trip.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-8 py-3"
          >
            Calculate Your First Trip
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div key={trip.id} className="card p-6 hover:scale-[1.01] transition-transform">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Trip Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">
                      {getTransportIcon(trip.tripData?.transportData?.mode)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-100">
                        {trip.tripData?.tripDetails?.origin || 'N/A'} → {trip.tripData?.tripDetails?.destination || 'N/A'}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {formatDate(trip.createdAt)} • {trip.tripData?.tripDetails?.purpose || 'leisure'}
                      </p>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Transport:</span>
                      <p className="text-slate-300 font-semibold capitalize">
                        {trip.tripData?.transportData?.mode || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Distance:</span>
                      <p className="text-slate-300 font-semibold">
                        {formatNumber(trip.tripData?.transportData?.distance)} km
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Accommodation:</span>
                      <p className="text-slate-300 font-semibold capitalize">
                        {getAccommodationIcon(trip.tripData?.accommodationData?.type)}{' '}
                        {trip.tripData?.accommodationData?.type || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Nights:</span>
                      <p className="text-slate-300 font-semibold">
                        {trip.tripData?.accommodationData?.nights || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emissions & Actions */}
                <div className="flex md:flex-col items-center md:items-end gap-4">
                  <div className="text-center md:text-right">
                    <div className="text-3xl font-bold gradient-text">
                      {formatNumber(trip.emissions?.total)} kg
                    </div>
                    <div className="text-xs text-slate-400">CO₂ Emissions</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Breakdown Preview */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-emerald-400 font-bold">
                      {formatNumber(trip.emissions?.transport)} kg
                    </div>
                    <div className="text-slate-500 text-xs">Transport</div>
                  </div>
                  <div>
                    <div className="text-blue-400 font-bold">
                      {formatNumber(trip.emissions?.accommodation)} kg
                    </div>
                    <div className="text-slate-500 text-xs">Accommodation</div>
                  </div>
                  <div>
                    <div className="text-purple-400 font-bold">
                      {formatNumber(trip.emissions?.activities)} kg
                    </div>
                    <div className="text-slate-500 text-xs">Activities</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={() => navigate('/')}
          className="btn-primary flex-1 py-4"
        >
          ➕ Calculate New Trip
        </button>
      </div>
    </div>
  );
};

export default TripHistory;
