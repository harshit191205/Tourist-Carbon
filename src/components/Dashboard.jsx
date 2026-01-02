import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserTrips } from '../services/tripService';
import { getUserGroupTrips } from '../services/groupTripService';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalEmissions: 0,
    totalDistance: 0,
    greenCredits: 0
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [groupTrips, setGroupTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) return;

      try {
        // Load individual trips
        const tripsResult = await getUserTrips(currentUser.uid);
        if (tripsResult.success) {
          const trips = tripsResult.trips;
          setRecentTrips(trips.slice(0, 3));

          // Calculate stats
          const totalEmissions = trips.reduce((sum, trip) => sum + (trip.totalEmissions || 0), 0);
          const totalDistance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0);

          setStats({
            totalTrips: trips.length,
            totalEmissions: totalEmissions.toFixed(2),
            totalDistance: totalDistance.toFixed(0),
            greenCredits: Math.floor(totalEmissions * 10)
          });
        }

        // Load group trips
        const groupsResult = await getUserGroupTrips(currentUser.uid);
        if (groupsResult.success) {
          setGroupTrips(groupsResult.groups.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌍</div>
          <p className="text-slate-300 text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold gradient-text mb-2">
          Welcome back, {currentUser?.displayName || currentUser?.email}! 👋
        </h1>
        <p className="text-xl text-slate-300">
          Track your carbon footprint and travel sustainably
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <div className="text-4xl mb-3">🚗</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {stats.totalTrips}
          </div>
          <div className="text-sm text-slate-400">Total Trips</div>
        </div>

        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <div className="text-4xl mb-3">💨</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {stats.totalEmissions}
          </div>
          <div className="text-sm text-slate-400">kg CO₂</div>
        </div>

        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <div className="text-4xl mb-3">📏</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {stats.totalDistance}
          </div>
          <div className="text-sm text-slate-400">km Traveled</div>
        </div>

        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <div className="text-4xl mb-3">💎</div>
          <div className="text-3xl font-bold gradient-text mb-2">
            {stats.greenCredits}
          </div>
          <div className="text-sm text-slate-400">Green Credits</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate('/add-trip')}
          className="card p-8 hover:scale-105 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl">➕</div>
            <div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors">
                Log New Trip
              </h3>
              <p className="text-slate-400">
                Track your latest journey and calculate emissions
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/groups')}
          className="card p-8 hover:scale-105 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl">👥</div>
            <div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors">
                Group Trips
              </h3>
              <p className="text-slate-400">
                Plan and track trips with friends and family
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Individual Trips */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold gradient-text">Recent Trips</h2>
          <button
            onClick={() => navigate('/history')}
            className="text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            View All →
          </button>
        </div>

        {recentTrips.length > 0 ? (
          <div className="space-y-4">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-100 mb-1">
                      {trip.origin} → {trip.destination}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {trip.mode} • {trip.distance?.toFixed(0)} km • {new Date(trip.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {trip.totalEmissions?.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400">kg CO₂</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-slate-400 mb-4">No trips logged yet</p>
            <button
              onClick={() => navigate('/add-trip')}
              className="btn-primary"
            >
              Log Your First Trip
            </button>
          </div>
        )}
      </div>

      {/* Recent Group Trips */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold gradient-text">👥 Your Group Trips</h2>
          <button
            onClick={() => navigate('/groups')}
            className="text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            View All →
          </button>
        </div>

        {groupTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groupTrips.map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/group/${group.id}`)}
                className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer"
              >
                <h3 className="font-bold text-slate-100 mb-2">{group.groupName}</h3>
                <p className="text-sm text-slate-400 mb-3">
                  {group.members?.length || 0} members
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Emissions:</span>
                  <span className="text-emerald-400 font-semibold">
                    {group.totalGroupEmissions?.toFixed(0) || 0} kg
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-slate-400 mb-4">No group trips yet</p>
            <button
              onClick={() => navigate('/groups/create')}
              className="btn-primary"
            >
              Create Your First Group Trip
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
