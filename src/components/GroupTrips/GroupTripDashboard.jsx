import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';

const GroupTripDashboard = () => {
  const { tripId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [newActivity, setNewActivity] = useState({ name: '', type: 'sightseeing', estimatedCost: '' });
  const [saving, setSaving] = useState(false);
  const [memberDetails, setMemberDetails] = useState({});
  
  // Member invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  
  // Transport cost
  const [transportCost, setTransportCost] = useState('');
  const [bookingType, setBookingType] = useState('');
  const [savingTransport, setSavingTransport] = useState(false);

  // Expense tracking
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: currentUser?.uid || '',
    category: 'food',
    splitAmong: []
  });
  const [addingExpense, setAddingExpense] = useState(false);

  useEffect(() => {
    fetchTripData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const fetchTripData = async () => {
    if (!tripId) {
      console.error('❌ No tripId provided');
      navigate('/groups');
      return;
    }

    try {
      console.log('🔍 Fetching trip:', tripId);
      const tripRef = doc(db, 'groupTrips', tripId);
      const tripSnap = await getDoc(tripRef);

      if (tripSnap.exists()) {
        const data = tripSnap.data();
        console.log('✅ Raw trip data:', data);
        
        const processedData = {
          id: tripSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || null),
          startDate: data.startDate?.toDate ? data.startDate.toDate() : (data.startDate || null),
          endDate: data.endDate?.toDate ? data.endDate.toDate() : (data.endDate || null),
          activities: data.activities || [],
          members: data.members || [],
          memberEmails: data.memberEmails || [],
          admins: data.admins || [],
          budget: data.budget || 0,
          transportMode: data.transportMode || 'car_petrol',
          transportCost: data.transportCost || 0,
          bookingType: data.bookingType || '',
          description: data.description || '',
          totalEmissions: data.totalEmissions || 0,
          groupCredits: data.groupCredits || 0,
          tripName: data.tripName || 'Untitled Trip',
          destination: data.destination || 'No destination',
          origin: data.origin || '',
          expenses: data.expenses || []
        };
        
        setTrip(processedData);
        
        setEditData({
          tripName: data.tripName || '',
          destination: data.destination || '',
          origin: data.origin || '',
          startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString().split('T')[0] : '',
          endDate: data.endDate?.toDate ? data.endDate.toDate().toISOString().split('T')[0] : '',
          description: data.description || '',
          transportMode: data.transportMode || 'car_petrol',
          budget: data.budget || 0
        });

        setTransportCost(data.transportCost || '');
        setBookingType(data.bookingType || '');

        // Initialize split among all members by default
        setNewExpense(prev => ({
          ...prev,
          paidBy: currentUser?.uid || '',
          splitAmong: data.members || []
        }));

        // Fetch member details
        if (data.memberEmails && data.memberEmails.length > 0 && data.members && data.members.length > 0) {
          const details = {};
          data.memberEmails.forEach((email, index) => {
            if (data.members[index]) {
              details[data.members[index]] = {
                email: email || 'Unknown',
                isAdmin: (data.admins || []).includes(data.members[index]),
                isCreator: data.createdBy === data.members[index]
              };
            }
          });
          setMemberDetails(details);
        }
      } else {
        console.error('❌ Trip not found');
        alert('Trip not found!');
        navigate('/groups');
      }
    } catch (error) {
      console.error('❌ Error fetching trip:', error);
      alert('Error loading trip: ' + error.message);
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    if (!trip || !currentUser) return false;
    return trip.createdBy === currentUser.uid || (trip.admins || []).includes(currentUser.uid);
  };

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveChanges = async () => {
    if (!isAdmin()) {
      alert('❌ Only admins can edit trip details');
      return;
    }

    setSaving(true);
    try {
      const tripRef = doc(db, 'groupTrips', tripId);
      await updateDoc(tripRef, {
        tripName: editData.tripName,
        origin: editData.origin,
        destination: editData.destination,
        startDate: new Date(editData.startDate),
        endDate: new Date(editData.endDate),
        description: editData.description,
        transportMode: editData.transportMode,
        budget: Number(editData.budget),
        updatedAt: new Date()
      });

      alert('✅ Trip updated successfully!');
      setIsEditing(false);
      fetchTripData();
    } catch (error) {
      console.error('❌ Error updating trip:', error);
      alert('Failed to update trip: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!isAdmin()) {
      alert('❌ Only admins can invite members');
      return;
    }

    if (!inviteEmail.trim()) {
      alert('❌ Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      alert('❌ Please enter a valid email address');
      return;
    }

    if (trip.memberEmails.includes(inviteEmail.toLowerCase())) {
      alert('❌ This user is already a member of the trip');
      return;
    }

    setInviting(true);
    try {
      const tripRef = doc(db, 'groupTrips', tripId);
      const placeholderUid = `email_${inviteEmail.toLowerCase()}`;
      
      await updateDoc(tripRef, {
        members: arrayUnion(placeholderUid),
        memberEmails: arrayUnion(inviteEmail.toLowerCase()),
        updatedAt: new Date()
      });

      alert(`✅ Invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
      fetchTripData();
    } catch (error) {
      console.error('❌ Error inviting member:', error);
      alert('Failed to invite member: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleSaveTransport = async () => {
    if (!isAdmin()) {
      alert('❌ Only admins can update transport details');
      return;
    }

    setSavingTransport(true);
    try {
      const tripRef = doc(db, 'groupTrips', tripId);
      await updateDoc(tripRef, {
        transportCost: Number(transportCost) || 0,
        bookingType: bookingType,
        updatedAt: new Date()
      });

      alert('✅ Transport details updated successfully!');
      fetchTripData();
    } catch (error) {
      console.error('❌ Error updating transport:', error);
      alert('Failed to update transport: ' + error.message);
    } finally {
      setSavingTransport(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description.trim()) {
      alert('❌ Please enter expense description');
      return;
    }

    if (!newExpense.amount || Number(newExpense.amount) <= 0) {
      alert('❌ Please enter a valid amount');
      return;
    }

    if (newExpense.splitAmong.length === 0) {
      alert('❌ Please select at least one member to split with');
      return;
    }

    setAddingExpense(true);
    try {
      const expense = {
        id: Date.now().toString(),
        description: newExpense.description.trim(),
        amount: Number(newExpense.amount),
        paidBy: newExpense.paidBy,
        paidByEmail: memberDetails[newExpense.paidBy]?.email || currentUser.email,
        category: newExpense.category,
        splitAmong: newExpense.splitAmong,
        splitAmount: Number(newExpense.amount) / newExpense.splitAmong.length,
        date: new Date(),
        addedAt: new Date()
      };

      const tripRef = doc(db, 'groupTrips', tripId);
      const currentExpenses = trip.expenses || [];
      
      await updateDoc(tripRef, {
        expenses: [...currentExpenses, expense],
        updatedAt: new Date()
      });

      alert('✅ Expense added!');
      setNewExpense({
        description: '',
        amount: '',
        paidBy: currentUser.uid,
        category: 'food',
        splitAmong: trip.members
      });
      fetchTripData();
    } catch (error) {
      console.error('❌ Error adding expense:', error);
      alert('Failed to add expense: ' + error.message);
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const tripRef = doc(db, 'groupTrips', tripId);
      const updatedExpenses = (trip.expenses || []).filter(e => e.id !== expenseId);
      
      await updateDoc(tripRef, {
        expenses: updatedExpenses,
        updatedAt: new Date()
      });

      alert('✅ Expense deleted!');
      fetchTripData();
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
      alert('Failed to delete expense: ' + error.message);
    }
  };

  const calculateBalances = () => {
    const balances = {};
    
    trip.members.forEach(memberId => {
      balances[memberId] = 0;
    });

    (trip.expenses || []).forEach(expense => {
      const splitAmount = expense.amount / expense.splitAmong.length;
      
      balances[expense.paidBy] += expense.amount;
      
      expense.splitAmong.forEach(memberId => {
        balances[memberId] -= splitAmount;
      });
    });

    return balances;
  };

  const getSettlements = () => {
    const balances = calculateBalances();
    const settlements = [];
    
    const creditors = [];
    const debtors = [];
    
    Object.entries(balances).forEach(([memberId, balance]) => {
      if (balance > 0.01) {
        creditors.push({ memberId, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ memberId, amount: Math.abs(balance) });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const settleAmount = Math.min(creditor.amount, debtor.amount);
      
      settlements.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: settleAmount
      });

      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;

      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }

    return settlements;
  };

  const handleAddActivity = async () => {
    if (!isAdmin()) {
      alert('❌ Only admins can add activities');
      return;
    }

    if (!newActivity.name.trim()) {
      alert('❌ Please enter activity name');
      return;
    }

    try {
      const activity = {
        id: Date.now().toString(),
        name: newActivity.name.trim(),
        type: newActivity.type,
        estimatedCost: Number(newActivity.estimatedCost) || 0,
        addedBy: currentUser.uid,
        addedByEmail: currentUser.email,
        addedAt: new Date()
      };

      const tripRef = doc(db, 'groupTrips', tripId);
      const currentActivities = trip.activities || [];
      
      await updateDoc(tripRef, {
        activities: [...currentActivities, activity],
        updatedAt: new Date()
      });

      alert('✅ Activity added!');
      setNewActivity({ name: '', type: 'sightseeing', estimatedCost: '' });
      fetchTripData();
    } catch (error) {
      console.error('❌ Error adding activity:', error);
      alert('Failed to add activity: ' + error.message);
    }
  };

  const handleRemoveActivity = async (activityId) => {
    if (!isAdmin()) {
      alert('❌ Only admins can remove activities');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this activity?')) {
      return;
    }

    try {
      const tripRef = doc(db, 'groupTrips', tripId);
      const updatedActivities = (trip.activities || []).filter(a => a.id !== activityId);
      
      await updateDoc(tripRef, {
        activities: updatedActivities,
        updatedAt: new Date()
      });

      alert('✅ Activity removed!');
      fetchTripData();
    } catch (error) {
      console.error('❌ Error removing activity:', error);
      alert('Failed to remove activity: ' + error.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getTransportIcon = (mode) => {
    const icons = {
      flight: '✈️',
      train: '🚆',
      car_petrol: '🚗',
      car_diesel: '🚗',
      car_cng: '🚗',
      car_ev: '⚡',
      bus: '🚌',
      bicycle: '🚴',
      walk: '🚶'
    };
    return icons[mode] || '🚗';
  };

  const getTransportLabel = (mode) => {
    const labels = {
      flight: 'Flight',
      train: 'Train',
      car_petrol: 'Car (Petrol)',
      car_diesel: 'Car (Diesel)',
      car_cng: 'Car (CNG)',
      car_ev: 'Car (Electric)',
      bus: 'Bus',
      bicycle: 'Bicycle',
      walk: 'Walk'
    };
    return labels[mode] || 'Not Set';
  };

  const getActivityIcon = (type) => {
    const icons = {
      sightseeing: '🏛️',
      adventure_sports: '🏔️',
      water_sports: '🏄',
      wildlife_safari: '🦁',
      cultural_tour: '🎭',
      shopping: '🛍️',
      spa_wellness: '💆'
    };
    return icons[type] || '🎯';
  };

  const getActivityLabel = (type) => {
    if (!type) return 'Activity';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food: '🍽️',
      transport: '🚗',
      accommodation: '🏨',
      activities: '🎯',
      shopping: '🛍️',
      other: '💰'
    };
    return icons[category] || '💰';
  };

  const getUserInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  const getMemberEmail = (memberId) => {
    return memberDetails[memberId]?.email || 'Unknown';
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Trip Details */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📍</span>
          <h2 className="text-2xl font-bold gradient-text">Trip Details</h2>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Trip Name</label>
              <input
                type="text"
                name="tripName"
                value={editData.tripName}
                onChange={handleEditChange}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Origin</label>
              <input
                type="text"
                name="origin"
                value={editData.origin}
                onChange={handleEditChange}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Destination</label>
              <input
                type="text"
                name="destination"
                value={editData.destination}
                onChange={handleEditChange}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={editData.startDate}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={editData.endDate}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Transport Mode</label>
                <select
                  name="transportMode"
                  value={editData.transportMode}
                  onChange={handleEditChange}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="flight">✈️ Flight</option>
                  <option value="train">🚆 Train</option>
                  <option value="car_petrol">🚗 Car (Petrol)</option>
                  <option value="car_diesel">🚗 Car (Diesel)</option>
                  <option value="car_cng">🚗 Car (CNG)</option>
                  <option value="car_ev">⚡ Car (Electric)</option>
                  <option value="bus">🚌 Bus</option>
                  <option value="bicycle">🚴 Bicycle</option>
                  <option value="walk">🚶 Walk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Budget (₹)</label>
                <input
                  type="number"
                  name="budget"
                  value={editData.budget}
                  onChange={handleEditChange}
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                name="description"
                value={editData.description}
                onChange={handleEditChange}
                rows="4"
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50"
              >
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Origin</p>
              <p className="text-lg font-bold text-slate-100">{trip?.origin || 'Not set'}</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Destination</p>
              <p className="text-lg font-bold text-slate-100">{trip?.destination || 'Not set'}</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Start Date</p>
              <p className="text-lg font-bold text-slate-100">{formatDate(trip?.startDate)}</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">End Date</p>
              <p className="text-lg font-bold text-slate-100">{formatDate(trip?.endDate)}</p>
            </div>

            {trip?.description && (
              <div className="md:col-span-2 p-4 bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Description</p>
                <p className="text-slate-200">{trip.description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⏱️</span>
            <p className="text-sm text-slate-400">Duration</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {trip?.startDate && trip?.endDate 
              ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))
              : 0} days
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">👥</span>
            <p className="text-sm text-slate-400">Members</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{trip?.members?.length || 0}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎯</span>
            <p className="text-sm text-slate-400">Activities</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{trip?.activities?.length || 0}</p>
        </div>
      </div>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      {/* Invite Member (Admin Only) */}
      {isAdmin() && (
        <div className="card p-6">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span>➕</span> Invite Member
          </h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInviteMember();
                }
              }}
              placeholder="Enter email address"
              className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={handleInviteMember}
              disabled={inviting}
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-50"
            >
              {inviting ? '⏳ Inviting...' : '📧 Send Invite'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            💡 Invited members will be able to view and contribute to the trip
          </p>
        </div>
      )}

      {/* Members List */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <h2 className="text-2xl font-bold gradient-text">Group Members</h2>
          </div>
          <span className="text-slate-400">{trip?.members?.length || 0} member{(trip?.members?.length || 0) !== 1 ? 's' : ''}</span>
        </div>

        <div className="space-y-3">
          {trip?.members && trip.members.length > 0 ? (
            trip.members.map((memberId, index) => {
              const memberInfo = memberDetails[memberId] || {};
              const email = memberInfo.email || trip?.memberEmails?.[index] || 'Unknown';
              const isCreator = memberInfo.isCreator || trip?.createdBy === memberId;
              const isAdminUser = memberInfo.isAdmin || (trip?.admins || []).includes(memberId);
              
              // Calculate member's balance
              const balances = calculateBalances();
              const balance = balances[memberId] || 0;

              return (
                <div key={memberId} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {getUserInitials(email)}
                    </div>
                    
                    <div>
                      <p className="font-bold text-slate-100">{email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {isCreator && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            👑 Trip Lead
                          </span>
                        )}
                        {isAdminUser && !isCreator && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            ⭐ Admin
                          </span>
                        )}
                        {!isAdminUser && !isCreator && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-400">
                            Member
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Balance:</p>
                    <p className={`text-lg font-bold ${balance > 0 ? 'text-emerald-400' : balance < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {balance > 0 ? '+' : ''}{formatCurrency(balance)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No members found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTransportTab = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🚗</span>
          <h2 className="text-2xl font-bold gradient-text">Group Transport</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-6 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400 mb-3">Mode:</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getTransportIcon(trip?.transportMode)}</span>
              <p className="text-xl font-bold text-slate-100">{getTransportLabel(trip?.transportMode)}</p>
            </div>
          </div>

          <div className="p-6 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400 mb-3">Booking Type:</p>
            <p className="text-xl font-bold text-slate-100">{trip?.bookingType || 'Not Set'}</p>
          </div>

          <div className="p-6 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400 mb-3">Total Cost:</p>
            <p className="text-xl font-bold text-emerald-400">{formatCurrency(trip?.transportCost)}</p>
          </div>
        </div>

        {isAdmin() && (
          <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="font-bold text-slate-200 mb-4">💰 Update Transport Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Booking Type</label>
                <select
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Select booking type</option>
                  <option value="individual">Individual Bookings</option>
                  <option value="group">Group Booking</option>
                  <option value="shared">Shared Transport</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Cost (₹)</label>
                <input
                  type="number"
                  value={transportCost}
                  onChange={(e) => setTransportCost(e.target.value)}
                  placeholder="e.g., 15000"
                  min="0"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveTransport}
              disabled={savingTransport}
              className="w-full px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50"
            >
              {savingTransport ? '⏳ Saving...' : '💾 Save Transport Details'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivitiesTab = () => (
    <div className="space-y-6">
      {isAdmin() && (
        <div className="card p-6">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span>➕</span> Add New Activity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              value={newActivity.name}
              onChange={(e) => setNewActivity({...newActivity, name: e.target.value})}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddActivity();
                }
              }}
              placeholder="Activity name"
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />

            <select
              value={newActivity.type}
              onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="sightseeing">🏛️ Sightseeing</option>
              <option value="adventure_sports">🏔️ Adventure Sports</option>
              <option value="water_sports">🏄 Water Sports</option>
              <option value="wildlife_safari">🦁 Wildlife Safari</option>
              <option value="cultural_tour">🎭 Cultural Tour</option>
              <option value="shopping">🛍️ Shopping</option>
              <option value="spa_wellness">💆 Spa & Wellness</option>
            </select>

            <input
              type="number"
              value={newActivity.estimatedCost}
              onChange={(e) => setNewActivity({...newActivity, estimatedCost: e.target.value})}
              placeholder="Est. cost (₹)"
              min="0"
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleAddActivity}
            className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
          >
            ➕ Add Activity
          </button>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h2 className="text-2xl font-bold gradient-text">Group Activities</h2>
          </div>
          <span className="text-slate-400">{trip?.activities?.length || 0} activities</span>
        </div>

        {trip?.activities && trip.activities.length > 0 ? (
          <div className="space-y-3">
            {trip.activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{getActivityIcon(activity.type)}</span>
                  <div>
                    <p className="font-bold text-slate-100 text-lg">{activity.name}</p>
                    <p className="text-sm text-slate-400">{getActivityLabel(activity.type)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-emerald-400">
                    {formatCurrency(activity.estimatedCost)}
                  </p>
                  {isAdmin() && (
                    <button
                      onClick={() => handleRemoveActivity(activity.id)}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-slate-200">Total Estimated Cost:</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(trip.activities.reduce((sum, a) => sum + (a.estimatedCost || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-slate-400 text-lg">No activities planned yet</p>
            {isAdmin() && (
              <p className="text-slate-500 text-sm mt-2">Add activities using the form above</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderBudgetTab = () => {
    // Calculate category-wise expenses
    const categoryExpenses = (trip?.expenses || []).reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const totalSpent = (trip?.expenses || []).reduce((sum, e) => sum + e.amount, 0);
    const remaining = (trip?.budget || 0) - totalSpent;

    return (
      <div className="space-y-6">
        {/* Budget Overview */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">💰</span>
            <h2 className="text-2xl font-bold gradient-text">Budget Overview</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center py-8 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-500/30">
              <div className="text-5xl mb-3">💰</div>
              <p className="text-4xl font-bold gradient-text mb-2">
                {formatCurrency(trip?.budget)}
              </p>
              <p className="text-slate-400 text-sm">Total Budget</p>
            </div>

            <div className="text-center py-8 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="text-5xl mb-3">💸</div>
              <p className="text-4xl font-bold text-red-400 mb-2">
                {formatCurrency(totalSpent)}
              </p>
              <p className="text-slate-400 text-sm">Total Spent</p>
              <p className="text-xs text-slate-500 mt-1">
                {trip?.budget > 0 ? `${((totalSpent / trip.budget) * 100).toFixed(1)}% of budget` : ''}
              </p>
            </div>

            <div className="text-center py-8 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="text-5xl mb-3">{remaining >= 0 ? '✅' : '⚠️'}</div>
              <p className={`text-4xl font-bold mb-2 ${remaining >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                {formatCurrency(Math.abs(remaining))}
              </p>
              <p className="text-slate-400 text-sm">{remaining >= 0 ? 'Remaining' : 'Over Budget'}</p>
            </div>
          </div>
        </div>

        {/* Category-wise Breakdown */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📊</span>
            <h2 className="text-2xl font-bold gradient-text">Expense Breakdown by Category</h2>
          </div>

          {Object.keys(categoryExpenses).length > 0 ? (
            <div className="space-y-4">
              {/* Food */}
              {categoryExpenses.food > 0 && (
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🍽️</span>
                      <div>
                        <p className="font-bold text-slate-200">Food & Dining</p>
                        <p className="text-xs text-slate-400">
                          {(trip?.expenses || []).filter(e => e.category === 'food').length} expense{(trip?.expenses || []).filter(e => e.category === 'food').length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">{formatCurrency(categoryExpenses.food)}</p>
                      <p className="text-xs text-slate-400">
                        {trip?.budget > 0 ? `${((categoryExpenses.food / trip.budget) * 100).toFixed(1)}% of budget` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((categoryExpenses.food / totalSpent) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Transport */}
              {categoryExpenses.transport > 0 && (
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🚗</span>
                      <div>
                        <p className="font-bold text-slate-200">Transport</p>
                        <p className="text-xs text-slate-400">
                          {(trip?.expenses || []).filter(e => e.category === 'transport').length} expense{(trip?.expenses || []).filter(e => e.category === 'transport').length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-400">{formatCurrency(categoryExpenses.transport)}</p>
                      <p className="text-xs text-slate-400">
                        {trip?.budget > 0 ? `${((categoryExpenses.transport / trip.budget) * 100).toFixed(1)}% of budget` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((categoryExpenses.transport / totalSpent) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Accommodation */}
              {categoryExpenses.accommodation > 0 && (
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🏨</span>
                      <div>
                        <p className="font-bold text-slate-200">Accommodation</p>
                        <p className="text-xs text-slate-400">
                          {(trip?.expenses || []).filter(e => e.category === 'accommodation').length} expense{(trip?.expenses || []).filter(e => e.category === 'accommodation').length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-400">{formatCurrency(categoryExpenses.accommodation)}</p>
                      <p className="text-xs text-slate-400">
                        {trip?.budget > 0 ? `${((categoryExpenses.accommodation / trip.budget) * 100).toFixed(1)}% of budget` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((categoryExpenses.accommodation / totalSpent) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Activities */}
              {categoryExpenses.activities > 0 && (
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🎯</span>
                      <div>
                        <p className="font-bold text-slate-200">Activities</p>
                        <p className="text-xs text-slate-400">
                          {(trip?.expenses || []).filter(e => e.category === 'activities').length} expense{(trip?.expenses || []).filter(e => e.category === 'activities').length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-400">{formatCurrency(categoryExpenses.activities)}</p>
                      <p className="text-xs text-slate-400">
                        {trip?.budget > 0 ? `${((categoryExpenses.activities / trip.budget) * 100).toFixed(1)}% of budget` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((categoryExpenses.activities / totalSpent) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Shopping */}
              {categoryExpenses.shopping > 0 && (
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🛍️</span>
                      <div>
                        <p className="font-bold text-slate-200">Shopping</p>
                        <p className="text-xs text-slate-400">
                          {(trip?.expenses || []).filter(e => e.category === 'shopping').length} expense{(trip?.expenses || []).filter(e => e.category === 'shopping').length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-pink-400">{formatCurrency(categoryExpenses.shopping)}</p>
                      <p className="text-xs text-slate-400">
                        {trip?.budget > 0 ? `${((categoryExpenses.shopping / trip.budget) * 100).toFixed(1)}% of budget` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-pink-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((categoryExpenses.shopping / totalSpent) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Other */}
              {categoryExpenses.other > 0 && (
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">💰</span>
                      <div>
                        <p className="font-bold text-slate-200">Other</p>
                        <p className="text-xs text-slate-400">
                          {(trip?.expenses || []).filter(e => e.category === 'other').length} expense{(trip?.expenses || []).filter(e => e.category === 'other').length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">{formatCurrency(categoryExpenses.other)}</p>
                      <p className="text-xs text-slate-400">
                        {trip?.budget > 0 ? `${((categoryExpenses.other / trip.budget) * 100).toFixed(1)}% of budget` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((categoryExpenses.other / totalSpent) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Total Summary */}
              <div className="mt-6 p-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-200 mb-1">Total Expenses</p>
                    <p className="text-sm text-slate-400">{trip?.expenses?.length || 0} transactions across {Object.keys(categoryExpenses).length} categories</p>
                  </div>
                  <p className="text-4xl font-bold gradient-text">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800 rounded-lg border border-dashed border-slate-600">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-slate-400 text-lg">No expenses recorded yet</p>
              <p className="text-slate-500 text-sm mt-2">Add expenses to see the breakdown</p>
            </div>
          )}
        </div>

        {/* Add Expense */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span>➕</span> Add Expense
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  placeholder="e.g., Lunch at restaurant"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Paid By</label>
                <select
                  value={newExpense.paidBy}
                  onChange={(e) => setNewExpense({...newExpense, paidBy: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  {trip?.members?.map(memberId => (
                    <option key={memberId} value={memberId}>
                      {getMemberEmail(memberId)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="food">🍽️ Food</option>
                  <option value="transport">🚗 Transport</option>
                  <option value="accommodation">🏨 Accommodation</option>
                  <option value="activities">🎯 Activities</option>
                  <option value="shopping">🛍️ Shopping</option>
                  <option value="other">💰 Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Split Among</label>
              <div className="p-4 bg-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={newExpense.splitAmong.length === trip?.members?.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewExpense({...newExpense, splitAmong: trip.members});
                      } else {
                        setNewExpense({...newExpense, splitAmong: []});
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <label htmlFor="selectAll" className="text-sm font-semibold text-slate-300">
                    Select All
                  </label>
                </div>
                
                {trip?.members?.map(memberId => (
                  <div key={memberId} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`member-${memberId}`}
                      checked={newExpense.splitAmong.includes(memberId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewExpense({...newExpense, splitAmong: [...newExpense.splitAmong, memberId]});
                        } else {
                          setNewExpense({...newExpense, splitAmong: newExpense.splitAmong.filter(id => id !== memberId)});
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`member-${memberId}`} className="text-sm text-slate-300">
                      {getMemberEmail(memberId)}
                    </label>
                    {newExpense.amount && newExpense.splitAmong.includes(memberId) && (
                      <span className="text-xs text-emerald-400 ml-auto">
                        {formatCurrency(Number(newExpense.amount) / newExpense.splitAmong.length)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddExpense}
              disabled={addingExpense}
              className="w-full px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50"
            >
              {addingExpense ? '⏳ Adding...' : '💰 Add Expense'}
            </button>
          </div>
        </div>

        {/* Expenses List */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <h2 className="text-2xl font-bold gradient-text">All Expenses</h2>
            </div>
            <span className="text-slate-400">{trip?.expenses?.length || 0} expenses</span>
          </div>

          {trip?.expenses && trip.expenses.length > 0 ? (
            <div className="space-y-3">
              {trip.expenses.slice().reverse().map((expense) => (
                <div key={expense.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
                      <div>
                        <p className="font-bold text-slate-100 text-lg">{expense.description}</p>
                        <p className="text-sm text-slate-400">
                          Paid by <strong>{expense.paidByEmail}</strong> • {formatDate(expense.date)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Split among {expense.splitAmong.length} member{expense.splitAmong.length !== 1 ? 's' : ''} 
                          ({formatCurrency(expense.splitAmount)} each)
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">{formatCurrency(expense.amount)}</p>
                      {(expense.paidBy === currentUser.uid || isAdmin()) && (
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="mt-2 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💸</div>
              <p className="text-slate-400 text-lg">No expenses recorded yet</p>
              <p className="text-slate-500 text-sm mt-2">Add expenses using the form above</p>
            </div>
          )}
        </div>

        {/* Settlement */}
        {trip?.expenses && trip.expenses.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">💸</span>
              <h2 className="text-2xl font-bold gradient-text">Settlement</h2>
            </div>

            {getSettlements().length > 0 ? (
              <div className="space-y-3">
                {getSettlements().map((settlement, index) => (
                  <div key={index} className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-slate-200">
                      <strong className="text-red-400">{getMemberEmail(settlement.from)}</strong>
                      {' owes '}
                      <strong className="text-emerald-400">{getMemberEmail(settlement.to)}</strong>
                      {': '}
                      <strong className="text-2xl text-blue-400">{formatCurrency(settlement.amount)}</strong>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-emerald-400 text-lg font-bold">All settled up!</p>
                <p className="text-slate-400 text-sm mt-2">No one owes anyone</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCarbonEmissionsTab = () => {
    // Calculate transport emissions
    const calculateTransportEmissions = () => {
      if (!trip?.origin || !trip?.destination) return 0;
      
      // Emission factors (kg CO2 per km)
      const emissionFactors = {
        flight: 0.175,
        train: 0.03,
        car_petrol: 0.215,
        car_diesel: 0.19,
        car_cng: 0.171,
        car_ev: 0.05,
        bus: 0.09,
        bicycle: 0,
        walk: 0
      };
      
      // Approximate distance calculation (you can replace with actual distance)
      // For demo, using a placeholder distance of 500km
      const estimatedDistance = 500; // Replace with actual calculation
      
      const factor = emissionFactors[trip.transportMode] || 0.215;
      const totalEmissions = estimatedDistance * factor;
      
      return totalEmissions;
    };

    // Calculate activity emissions
    const calculateActivityEmissions = () => {
      const activityFactors = {
        sightseeing: 2,
        adventure_sports: 10,
        water_sports: 8,
        wildlife_safari: 15,
        cultural_tour: 3,
        shopping: 1,
        spa_wellness: 5
      };
      
      let total = 0;
      (trip?.activities || []).forEach(activity => {
        const factor = activityFactors[activity.type] || 2;
        total += factor;
      });
      
      return total;
    };

    // Calculate expense-based emissions
    const calculateExpenseEmissions = () => {
      const categoryFactors = {
        food: 3, // kg CO2 per meal/expense
        transport: 0.2, // kg CO2 per rupee spent
        accommodation: 15, // kg CO2 per night
        activities: 5, // kg CO2 per activity
        shopping: 2, // kg CO2 per purchase
        other: 1
      };
      
      let total = 0;
      (trip?.expenses || []).forEach(expense => {
        const factor = categoryFactors[expense.category] || 1;
        
        // Different calculation based on category
        if (expense.category === 'food') {
          total += factor; // Each food expense = one meal
        } else if (expense.category === 'accommodation') {
          total += factor; // Per accommodation expense
        } else if (expense.category === 'activities') {
          total += factor; // Per activity expense
        } else {
          // For other categories, estimate based on amount
          total += (expense.amount / 1000) * factor;
        }
      });
      
      return total;
    };

    // Calculate individual member emissions
    const calculateMemberEmissions = () => {
      const memberEmissions = {};
      
      // Initialize all members
      trip?.members?.forEach(memberId => {
        memberEmissions[memberId] = {
          transport: 0,
          activities: 0,
          expenses: 0,
          total: 0
        };
      });
      
      // Transport emissions (split equally among all members)
      const transportEmissions = calculateTransportEmissions();
      const transportPerMember = transportEmissions / (trip?.members?.length || 1);
      trip?.members?.forEach(memberId => {
        memberEmissions[memberId].transport = transportPerMember;
      });
      
      // Activity emissions (split equally among all members)
      const activityEmissions = calculateActivityEmissions();
      const activityPerMember = activityEmissions / (trip?.members?.length || 1);
      trip?.members?.forEach(memberId => {
        memberEmissions[memberId].activities = activityPerMember;
      });
      
      // Expense-based emissions (based on who was in the split)
      (trip?.expenses || []).forEach(expense => {
        const categoryFactors = {
          food: 3,
          transport: 0.2,
          accommodation: 15,
          activities: 5,
          shopping: 2,
          other: 1
        };
        
        const factor = categoryFactors[expense.category] || 1;
        let emissionAmount = 0;
        
        if (expense.category === 'food' || expense.category === 'accommodation' || expense.category === 'activities') {
          emissionAmount = factor;
        } else {
          emissionAmount = (expense.amount / 1000) * factor;
        }
        
        const emissionPerPerson = emissionAmount / (expense.splitAmong?.length || 1);
        
        expense.splitAmong?.forEach(memberId => {
          if (memberEmissions[memberId]) {
            memberEmissions[memberId].expenses += emissionPerPerson;
          }
        });
      });
      
      // Calculate totals
      Object.keys(memberEmissions).forEach(memberId => {
        memberEmissions[memberId].total = 
          memberEmissions[memberId].transport +
          memberEmissions[memberId].activities +
          memberEmissions[memberId].expenses;
      });
      
      return memberEmissions;
    };

    const transportEmissions = calculateTransportEmissions();
    const activityEmissions = calculateActivityEmissions();
    const expenseEmissions = calculateExpenseEmissions();
    const totalGroupEmissions = transportEmissions + activityEmissions + expenseEmissions;
    const memberEmissions = calculateMemberEmissions();

    return (
      <div className="space-y-6">
        {/* Group Total Emissions */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🌍</span>
            <h2 className="text-2xl font-bold gradient-text">Group Carbon Footprint</h2>
          </div>

          <div className="text-center py-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/30 mb-6">
            <div className="text-6xl mb-4">🌫️</div>
            <p className="text-5xl font-bold gradient-text mb-2">
              {totalGroupEmissions.toFixed(2)} kg
            </p>
            <p className="text-slate-400 text-sm">Total CO₂ Emissions</p>
            <p className="text-xs text-slate-500 mt-2">
              {(totalGroupEmissions / (trip?.members?.length || 1)).toFixed(2)} kg per person
            </p>
          </div>

          {/* Emissions Breakdown by Source */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center py-6 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="text-4xl mb-3">🚗</div>
              <p className="text-3xl font-bold text-blue-400 mb-1">
                {transportEmissions.toFixed(2)} kg
              </p>
              <p className="text-slate-400 text-sm">Transport</p>
              <p className="text-xs text-slate-500 mt-1">
                {totalGroupEmissions > 0 ? `${((transportEmissions / totalGroupEmissions) * 100).toFixed(1)}%` : '0%'} of total
              </p>
            </div>

            <div className="text-center py-6 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-3xl font-bold text-purple-400 mb-1">
                {activityEmissions.toFixed(2)} kg
              </p>
              <p className="text-slate-400 text-sm">Activities</p>
              <p className="text-xs text-slate-500 mt-1">
                {totalGroupEmissions > 0 ? `${((activityEmissions / totalGroupEmissions) * 100).toFixed(1)}%` : '0%'} of total
              </p>
            </div>

            <div className="text-center py-6 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <div className="text-4xl mb-3">💸</div>
              <p className="text-3xl font-bold text-orange-400 mb-1">
                {expenseEmissions.toFixed(2)} kg
              </p>
              <p className="text-slate-400 text-sm">Lifestyle</p>
              <p className="text-xs text-slate-500 mt-1">
                {totalGroupEmissions > 0 ? `${((expenseEmissions / totalGroupEmissions) * 100).toFixed(1)}%` : '0%'} of total
              </p>
            </div>
          </div>
        </div>

        {/* Emissions by Category */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📊</span>
            <h2 className="text-2xl font-bold gradient-text">Emissions Breakdown</h2>
          </div>

          <div className="space-y-4">
            {/* Transport */}
            {transportEmissions > 0 && (
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getTransportIcon(trip?.transportMode)}</span>
                    <div>
                      <p className="font-bold text-slate-200">Transport ({getTransportLabel(trip?.transportMode)})</p>
                      <p className="text-xs text-slate-400">Estimated: 500 km journey</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-400">{transportEmissions.toFixed(2)} kg CO₂</p>
                    <p className="text-xs text-slate-400">
                      {(transportEmissions / (trip?.members?.length || 1)).toFixed(2)} kg per person
                    </p>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all"
                    style={{ width: `${totalGroupEmissions > 0 ? Math.min((transportEmissions / totalGroupEmissions) * 100, 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Activities */}
            {activityEmissions > 0 && (
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎯</span>
                    <div>
                      <p className="font-bold text-slate-200">Activities & Entertainment</p>
                      <p className="text-xs text-slate-400">{trip?.activities?.length || 0} planned activities</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-400">{activityEmissions.toFixed(2)} kg CO₂</p>
                    <p className="text-xs text-slate-400">
                      {(activityEmissions / (trip?.members?.length || 1)).toFixed(2)} kg per person
                    </p>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all"
                    style={{ width: `${totalGroupEmissions > 0 ? Math.min((activityEmissions / totalGroupEmissions) * 100, 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Lifestyle (Expenses) */}
            {expenseEmissions > 0 && (
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🍽️</span>
                    <div>
                      <p className="font-bold text-slate-200">Food, Accommodation & Lifestyle</p>
                      <p className="text-xs text-slate-400">{trip?.expenses?.length || 0} recorded expenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-400">{expenseEmissions.toFixed(2)} kg CO₂</p>
                    <p className="text-xs text-slate-400">Based on spending patterns</p>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full transition-all"
                    style={{ width: `${totalGroupEmissions > 0 ? Math.min((expenseEmissions / totalGroupEmissions) * 100, 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Individual Member Emissions */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">👥</span>
            <h2 className="text-2xl font-bold gradient-text">Emissions by Member</h2>
          </div>

          {trip?.members && trip.members.length > 0 ? (
            <div className="space-y-3">
              {trip.members
                .map(memberId => ({
                  memberId,
                  ...memberEmissions[memberId]
                }))
                .sort((a, b) => b.total - a.total)
                .map((member, index) => {
                  const email = getMemberEmail(member.memberId);
                  const isCurrentUser = member.memberId === currentUser.uid;
                  
                  return (
                    <div 
                      key={member.memberId} 
                      className={`p-5 rounded-lg border ${
                        isCurrentUser 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${
                            index === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                            index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                            'bg-gradient-to-r from-emerald-500 to-blue-500'
                          } flex items-center justify-center text-white font-bold text-sm`}>
                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : getUserInitials(email)}
                          </div>
                          
                          <div>
                            <p className="font-bold text-slate-100">
                              {email}
                              {isCurrentUser && <span className="text-emerald-400 ml-2">(You)</span>}
                            </p>
                            <p className="text-xs text-slate-400">
                              Rank #{index + 1} • {((member.total / totalGroupEmissions) * 100).toFixed(1)}% of group total
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-400">
                            {member.total.toFixed(2)} kg
                          </p>
                          <p className="text-xs text-slate-400">Total CO₂</p>
                        </div>
                      </div>

                      {/* Member's breakdown */}
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="text-center p-2 bg-slate-900/50 rounded">
                          <p className="text-xs text-slate-400 mb-1">Transport</p>
                          <p className="text-sm font-bold text-blue-400">{member.transport.toFixed(1)} kg</p>
                        </div>
                        <div className="text-center p-2 bg-slate-900/50 rounded">
                          <p className="text-xs text-slate-400 mb-1">Activities</p>
                          <p className="text-sm font-bold text-purple-400">{member.activities.toFixed(1)} kg</p>
                        </div>
                        <div className="text-center p-2 bg-slate-900/50 rounded">
                          <p className="text-xs text-slate-400 mb-1">Lifestyle</p>
                          <p className="text-sm font-bold text-orange-400">{member.expenses.toFixed(1)} kg</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                              : 'bg-gradient-to-r from-blue-500 to-blue-400'
                          }`}
                          style={{ width: `${totalGroupEmissions > 0 ? Math.min((member.total / totalGroupEmissions) * 100, 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-slate-400 text-lg">No members found</p>
            </div>
          )}
        </div>

        {/* Comparison & Insights */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">💡</span>
            <h2 className="text-2xl font-bold gradient-text">Insights & Comparisons</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Equivalent to:</p>
              <p className="text-2xl font-bold text-blue-400 mb-1">
                {(totalGroupEmissions / 2.3).toFixed(0)} trees needed
              </p>
              <p className="text-xs text-slate-500">to offset your emissions (1 tree = ~2.3 kg CO₂/year)</p>
            </div>

            <div className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Offset Cost:</p>
              <p className="text-2xl font-bold text-purple-400 mb-1">
                ₹{(totalGroupEmissions * 50).toFixed(0)}
              </p>
              <p className="text-xs text-slate-500">estimated carbon offset purchase (~₹50/kg CO₂)</p>
            </div>

            <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Average per day:</p>
              <p className="text-2xl font-bold text-green-400 mb-1">
                {trip?.startDate && trip?.endDate 
                  ? (totalGroupEmissions / Math.max(1, Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)))).toFixed(2)
                  : '0'} kg CO₂
              </p>
              <p className="text-xs text-slate-500">group emissions per day of trip</p>
            </div>

            <div className="p-5 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Group Carbon Credits:</p>
              <p className="text-2xl font-bold text-orange-400 mb-1">
                {Math.floor(totalGroupEmissions / 10)} credits
              </p>
              <p className="text-xs text-slate-500">earned for tracking (1 credit per 10 kg CO₂)</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="card p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🌱</span>
            <h2 className="text-xl font-bold text-slate-200">Sustainability Tips</h2>
          </div>
          
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span><strong>Choose eco-friendly transport:</strong> Consider trains or electric vehicles to reduce transport emissions by up to 80%</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span><strong>Stay at eco-lodges:</strong> Green accommodations can cut emissions by 40% compared to standard hotels</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span><strong>Eat local & plant-based:</strong> Local vegetarian meals have 60% lower carbon footprint than imported meat</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span><strong>Offset your emissions:</strong> Support verified carbon offset projects to neutralize your trip's impact</span>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const renderLeaderboardTab = () => (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🏆</span>
        <h2 className="text-2xl font-bold gradient-text">Leaderboard</h2>
      </div>
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-slate-400 text-lg">Leaderboard coming soon...</p>
        <p className="text-slate-500 text-sm mt-2">Track member contributions and achievements</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌍</div>
          <p className="text-slate-400 text-lg">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-slate-400 text-lg">Trip not found</p>
          <button
            onClick={() => navigate('/groups')}
            className="mt-4 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            ← Back to Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/groups')}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all flex items-center gap-2"
        >
          ← Back
        </button>

        {isAdmin() && !isEditing && activeTab === 'overview' && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-2"
          >
            ✏️ Edit Trip
          </button>
        )}
      </div>

      {/* Trip Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {trip?.createdBy === currentUser?.uid && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              👑 Trip Lead
            </span>
          )}
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-2">{trip?.tripName || 'Untitled Trip'}</h1>
        <p className="text-xl text-slate-300 flex items-center gap-2">
          <span>📍</span> {trip?.origin || 'Origin'} → {trip?.destination || 'Destination'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{trip?.members?.length || 0}</p>
          <p className="text-sm text-slate-400">Members</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(trip?.budget)}</p>
          <p className="text-sm text-slate-400">Total Budget</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💸</span>
          </div>
          <p className="text-3xl font-bold text-red-400">
            {formatCurrency((trip?.expenses || []).reduce((sum, e) => sum + e.amount, 0))}
          </p>
          <p className="text-sm text-slate-400">Total Spent</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📝</span>
          </div>
          <p className="text-3xl font-bold text-blue-400">{trip?.expenses?.length || 0}</p>
          <p className="text-sm text-slate-400">Expenses</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 p-2 bg-slate-800/50 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          📊 Overview
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'members'
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          👥 Members
        </button>

        {/* <button
          onClick={() => setActiveTab('transport')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'transport'
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          🚗 Transport
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'activities'
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          🎯 Activities
        </button> */}

        <button
          onClick={() => setActiveTab('budget')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'budget'
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          💰 Budget & Expenses
        </button>

        <button
          onClick={() => setActiveTab('emissions')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'emissions'
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          🌍 Carbon Emissions
        </button>

        {/* <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          🏆 Leaderboard
        </button> */}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'members' && renderMembersTab()}
      {activeTab === 'transport' && renderTransportTab()}
      {activeTab === 'activities' && renderActivitiesTab()}
      {activeTab === 'budget' && renderBudgetTab()}
      {activeTab === 'emissions' && renderCarbonEmissionsTab()}
      {activeTab === 'leaderboard' && renderLeaderboardTab()}
    </div>
  );
};

export default GroupTripDashboard;
