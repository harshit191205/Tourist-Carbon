import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const GroupTripsList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [groupTrips, setGroupTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchGroupTrips = useCallback(async () => {
    if (!currentUser) {
      console.log('❌ No user logged in');
      setLoading(false);
      return;
    }

    console.log('🔍 Starting fetch for user:', currentUser.uid);
    console.log('📧 User email:', currentUser.email);
    setLoading(true);

    try {
      // Get ALL group trips to debug and find user's trips
      const groupsRef = collection(db, 'groupTrips');
      const allTripsQuery = query(groupsRef);
      const allSnapshot = await getDocs(allTripsQuery);
      
      console.log(`📊 Total group trips in database: ${allSnapshot.size}`);
      
      const trips = [];
      let userTripsCount = 0;
      
      // Log and filter trips
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // ✅ CHECK BOTH UID AND EMAIL
        const isMemberByUid = data.members?.includes(currentUser.uid);
        const isMemberByEmail = data.memberEmails?.includes(currentUser.email?.toLowerCase());
        const isCreator = data.createdBy === currentUser.uid;
        
        // Extra debugging for the specific new trip
        if (doc.id === 'gHffAVIpoly0YLMF3FRH') {
          console.log('🔥🔥🔥 FOUND THE NEW TRIP! 🔥🔥🔥');
          console.log('Members array:', data.members);
          console.log('MemberEmails array:', data.memberEmails);
          console.log('Current user UID:', currentUser.uid);
          console.log('Current user email:', currentUser.email);
          console.log('Current user email (lowercase):', currentUser.email?.toLowerCase());
          console.log('isMemberByUid:', isMemberByUid);
          console.log('isMemberByEmail:', isMemberByEmail);
        }
        
        console.log('Trip:', doc.id, {
          name: data.tripName,
          members: data.members,
          memberEmails: data.memberEmails,
          currentUserUid: currentUser.uid,
          currentUserEmail: currentUser.email,
          isMemberByUid,
          isMemberByEmail,
          isCreator
        });
        
        // ✅ Include trip if user is member by UID OR email, OR creator
        if (isMemberByUid || isMemberByEmail || isCreator) {
          userTripsCount++;
          trips.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            startDate: data.startDate?.toDate(),
            endDate: data.endDate?.toDate()
          });
        }
      });

      console.log(`✅ Found ${userTripsCount} trips for current user`);

      // Sort by creation date
      trips.sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB - dateA;
      });

      // Apply filter
      let filteredTrips = trips;
      if (filter === 'active') {
        filteredTrips = trips.filter(trip => getTripStatus(trip) === 'active');
      } else if (filter === 'completed') {
        filteredTrips = trips.filter(trip => getTripStatus(trip) === 'completed');
      }

      console.log('📦 Final filtered trips:', filteredTrips);

      setGroupTrips(filteredTrips);
    } catch (error) {
      console.error('❌ Error fetching group trips:', error);
      alert('Error loading trips: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, filter]);

  useEffect(() => {
    if (currentUser) {
      fetchGroupTrips();
    }
  }, [currentUser, fetchGroupTrips]);

  const getMemberCount = (trip) => {
    return trip.members?.length || 0;
  };

  const getTripStatus = (trip) => {
    if (!trip.startDate) return 'planning';
    
    const now = new Date();
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'active';
  };

  const getStatusBadge = (status) => {
    const badges = {
      planning: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '📋 Planning' },
      upcoming: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '🗓️ Upcoming' },
      active: { bg: 'bg-green-500/20', text: 'text-green-400', label: '✈️ Active' },
      completed: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: '✅ Completed' }
    };
    return badges[status] || badges.planning;
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    try {
      return new Date(date).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getDuration = (trip) => {
    if (!trip.startDate || !trip.endDate) return null;
    
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : null;
    } catch (error) {
      return null;
    }
  };

  const getTransportIcon = (mode) => {
    const icons = {
      flight: '✈️',
      train: '🚆',
      car_petrol: '🚗',
      car_diesel: '🚗',
      bus: '🚌',
      bicycle: '🚴',
      walk: '🚶'
    };
    return icons[mode] || '🚗';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getTotalBudget = (trip) => {
    return trip.budget || 0;
  };

  const getActivitiesCount = (trip) => {
    return trip.activities?.length || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌍</div>
          <p className="text-slate-400 text-lg">Loading your group trips...</p>
          <p className="text-slate-500 text-sm mt-2">Checking database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold gradient-text mb-4">
          👥 Group Trips
        </h1>
        <p className="text-xl text-slate-300">
          Plan and track trips with your friends and family
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <button
          onClick={() => navigate('/groups/create')}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold transition-all"
        >
          ➕ Create New Group Trip
        </button>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Group Trips List */}
      {groupTrips.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-slate-300 mb-4">
            No Group Trips Found
          </h2>
          <p className="text-slate-400 mb-6">
            Create your first group trip to start planning adventures with friends!
          </p>
          <button
            onClick={() => navigate('/groups/create')}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
          >
            ➕ Create Group Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupTrips.map((trip) => {
            const status = getTripStatus(trip);
            const statusBadge = getStatusBadge(status);
            const isCreator = trip.createdBy === currentUser.uid;
            const isAdmin = trip.admins?.includes(currentUser.uid) || isCreator;
            const duration = getDuration(trip);
            const budget = getTotalBudget(trip);
            const activitiesCount = getActivitiesCount(trip);

            return (
              <div
                key={trip.id}
                onClick={() => navigate(`/group/${trip.id}`)}
                className="card p-6 hover:scale-105 transition-all cursor-pointer group relative"
              >
                {/* Admin/Creator Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                    {statusBadge.label}
                  </span>
                  <div className="flex gap-2">
                    {isCreator && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        👑 Lead
                      </span>
                    )}
                    {isAdmin && !isCreator && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        ⭐ Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Trip Name */}
                <h3 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors">
                  {trip.tripName || 'Untitled Trip'}
                </h3>

                {/* Destination */}
                <div className="flex items-center gap-2 text-slate-300 mb-4">
                  <span className="text-xl">📍</span>
                  <span className="font-semibold">
                    {trip.destination || 'Destination not set'}
                  </span>
                </div>

                {/* Dates */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Start:</span>
                    <span className="text-slate-300 font-semibold">
                      {formatDate(trip.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">End:</span>
                    <span className="text-slate-300 font-semibold">
                      {formatDate(trip.endDate)}
                    </span>
                  </div>
                  {duration && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-blue-400 font-semibold">
                        {duration} day{duration !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Transport Mode */}
                {trip.transportMode && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-slate-800 rounded-lg">
                    <span className="text-xl">{getTransportIcon(trip.transportMode)}</span>
                    <span className="text-sm text-slate-300 font-medium">
                      {trip.transportMode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                )}

                {/* Budget & Activities */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {budget > 0 && (
                    <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-xs text-slate-400">Budget</p>
                      <p className="text-sm font-bold text-green-400">{formatCurrency(budget)}</p>
                    </div>
                  )}
                  {activitiesCount > 0 && (
                    <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <p className="text-xs text-slate-400">Activities</p>
                      <p className="text-sm font-bold text-orange-400">{activitiesCount} planned</p>
                    </div>
                  )}
                </div>

                {/* Members */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    <span className="text-slate-300 font-semibold">
                      {getMemberCount(trip)} member{getMemberCount(trip) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <span className="text-xs text-purple-400 font-semibold">
                        Can Edit
                      </span>
                    )}
                    <div className="text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </div>
                </div>

                {/* Total Emissions */}
                {trip.totalEmissions > 0 && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Total CO₂:</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {trip.totalEmissions.toFixed(2)} kg
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {groupTrips.length > 0 && (
        <div className="card p-8 mt-12">
          <h3 className="text-2xl font-bold gradient-text mb-6 text-center">
            📊 Your Group Trip Stats
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-3xl font-bold text-emerald-400 mb-1">
                {groupTrips.length}
              </p>
              <p className="text-sm text-slate-400">Total Trips</p>
            </div>

            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <div className="text-3xl mb-2">👑</div>
              <p className="text-3xl font-bold text-amber-400 mb-1">
                {groupTrips.filter(t => t.createdBy === currentUser.uid).length}
              </p>
              <p className="text-sm text-slate-400">As Lead</p>
            </div>

            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <div className="text-3xl mb-2">✈️</div>
              <p className="text-3xl font-bold text-blue-400 mb-1">
                {groupTrips.filter(t => getTripStatus(t) === 'active' || getTripStatus(t) === 'upcoming').length}
              </p>
              <p className="text-sm text-slate-400">Active/Upcoming</p>
            </div>

            <div className="text-center p-4 bg-slate-800 rounded-lg">
              <div className="text-3xl mb-2">💰</div>
              <p className="text-3xl font-bold text-green-400 mb-1">
                {formatCurrency(groupTrips.reduce((sum, t) => sum + (t.budget || 0), 0))}
              </p>
              <p className="text-sm text-slate-400">Total Budget</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="card p-8 mt-8">
        <h3 className="text-xl font-bold gradient-text mb-4">💡 Group Trip Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-2xl mb-2">👥</div>
            <h4 className="font-bold text-slate-200 mb-1">Invite Members</h4>
            <p className="text-sm text-slate-400">
              Add friends and assign admin roles for collaborative planning
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-2xl mb-2">🚗</div>
            <h4 className="font-bold text-slate-200 mb-1">Plan Transport</h4>
            <p className="text-sm text-slate-400">
              Choose transport modes and track emissions together
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-2xl mb-2">💰</div>
            <h4 className="font-bold text-slate-200 mb-1">Manage Budget</h4>
            <p className="text-sm text-slate-400">
              Set budgets, track expenses, and split costs fairly
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-bold text-slate-200 mb-1">Add Activities</h4>
            <p className="text-sm text-slate-400">
              Plan activities and see their environmental impact
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-2xl mb-2">👑</div>
            <h4 className="font-bold text-slate-200 mb-1">Admin Controls</h4>
            <p className="text-sm text-slate-400">
              Trip leads and admins can edit all trip details
            </p>
          </div>
          <div className="p-4 bg-slate-800 rounded-lg">
            <div className="text-2xl mb-2">🌱</div>
            <h4 className="font-bold text-slate-200 mb-1">Track Impact</h4>
            <p className="text-sm text-slate-400">
              Monitor group carbon footprint and earn credits
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupTripsList;
