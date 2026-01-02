import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const CreateGroupTrip = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    tripName: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    transportMode: 'car_petrol',
    budget: ''
  });

  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({ name: '', type: 'sightseeing', estimatedCost: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Field changed: ${name} = ${value}`);
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddActivity = () => {
    if (!newActivity.name.trim()) {
      alert('❌ Please enter activity name');
      return;
    }

    const activity = {
      id: Date.now().toString(),
      name: newActivity.name.trim(),
      type: newActivity.type,
      estimatedCost: Number(newActivity.estimatedCost) || 0,
      addedBy: currentUser.uid,
      addedByEmail: currentUser.email,
      addedAt: Timestamp.now()
    };

    console.log('➕ Adding activity:', activity);
    setActivities(prevActivities => [...prevActivities, activity]);
    setNewActivity({ name: '', type: 'sightseeing', estimatedCost: '' });
    
    console.log('✅ Activities updated. New count:', activities.length + 1);
  };

  const handleRemoveActivity = (id) => {
    console.log('🗑️ Removing activity:', id);
    setActivities(prevActivities => prevActivities.filter(a => a.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.tripName.trim() || !formData.origin.trim() || !formData.destination.trim()) {
      alert('❌ Please fill in Trip Name, Origin, and Destination');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert('❌ Please select start and end dates');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('❌ End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Creating group trip...');
      console.log('👤 Creator User ID:', currentUser.uid);
      console.log('📧 Creator Email:', currentUser.email);
      console.log('💰 Budget:', formData.budget);
      console.log('🎯 Activities:', activities);

      // Convert budget to number properly
      const budgetValue = formData.budget ? Number(formData.budget) : 0;
      console.log('💰 Budget as number:', budgetValue);

      const groupTripData = {
        tripName: formData.tripName.trim(),
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        description: formData.description.trim() || '',
        transportMode: formData.transportMode,
        budget: budgetValue,
        activities: activities,
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        members: [currentUser.uid],
        memberEmails: [currentUser.email],
        admins: [currentUser.uid],
        status: 'planning',
        totalEmissions: 0,
        expenses: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('💾 Data to save:', groupTripData);

      const docRef = await addDoc(collection(db, 'groupTrips'), groupTripData);

      console.log('✅ Group trip created with ID:', docRef.id);

      alert(`✅ Group trip "${formData.tripName}" created successfully!\n\n📍 ${formData.origin} → ${formData.destination}\n💰 Budget: ₹${budgetValue}\n🎯 Activities: ${activities.length}`);
      navigate(`/group/${docRef.id}`);
    } catch (error) {
      console.error('❌ Error creating group trip:', error);
      alert('Failed to create group trip: ' + error.message);
    } finally {
      setLoading(false);
    }
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

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold gradient-text mb-4">
          ➕ Create Group Trip
        </h1>
        <p className="text-xl text-slate-300">
          Start planning an adventure with your friends and family
        </p>
      </div>

      {/* Debug Info */}
      <div className="card p-4 mb-6 bg-blue-500/10 border border-blue-500/30">
        <div className="text-sm text-slate-300">
          <strong>📊 Current Form Data:</strong>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• Origin: <strong className="text-blue-400">{formData.origin || 'Not set'}</strong></li>
            <li>• Destination: <strong className="text-purple-400">{formData.destination || 'Not set'}</strong></li>
            <li>• Budget: <strong className="text-green-400">{formatCurrency(formData.budget)}</strong></li>
            <li>• Activities: <strong className="text-orange-400">{activities.length}</strong></li>
            <li>• Transport: <strong className="text-cyan-400">{formData.transportMode}</strong></li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-8">
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="border-b border-slate-700 pb-6">
            <h3 className="text-xl font-bold text-slate-200 mb-4">📋 Basic Information</h3>
            
            {/* Trip Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Trip Name *
              </label>
              <input
                type="text"
                name="tripName"
                value={formData.tripName}
                onChange={handleChange}
                placeholder="e.g., Goa Beach Vacation 2026"
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Origin - NEW FIELD */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Origin (Starting Point) *
              </label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder="e.g., Mumbai, India"
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Destination */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Destination *
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g., Goa, India"
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Transport & Budget Section */}
          <div className="border-b border-slate-700 pb-6">
            <h3 className="text-xl font-bold text-slate-200 mb-4">🚗 Transport & Budget</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transport Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mode of Transport
                </label>
                <select
                  name="transportMode"
                  value={formData.transportMode}
                  onChange={handleChange}
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

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Total Budget (₹) *
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g., 50000"
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                {formData.budget && (
                  <p className="text-sm text-emerald-400 mt-1">
                    💰 {formatCurrency(formData.budget)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Activities Section */}
          <div className="border-b border-slate-700 pb-6">
            <h3 className="text-xl font-bold text-slate-200 mb-4">
              🎯 Planned Activities 
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({activities.length} added)
              </span>
            </h3>
            
            {/* Add Activity Form */}
            <div className="p-4 bg-slate-800 rounded-lg mb-4">
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
                  className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                  className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
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
                  className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              
              <button
                type="button"
                onClick={handleAddActivity}
                className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
              >
                ➕ Add Activity
              </button>
            </div>

            {/* Activities List */}
            {activities.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-400">
                    Total estimated cost: <strong className="text-emerald-400">
                      {formatCurrency(activities.reduce((sum, a) => sum + a.estimatedCost, 0))}
                    </strong>
                  </p>
                </div>
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                      <div>
                        <p className="font-semibold text-slate-200">{activity.name}</p>
                        <p className="text-xs text-slate-400">
                          {activity.type.replace('_', ' ')} • {formatCurrency(activity.estimatedCost)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(activity.id)}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-800 rounded-lg border border-dashed border-slate-600">
                <p className="text-slate-400 text-sm">No activities added yet</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details about the trip, itinerary, or any notes..."
              rows="4"
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-slate-300">
              <strong>💡 After Creating:</strong>
            </p>
            <ul className="text-sm text-slate-400 mt-2 space-y-1 ml-4">
              <li>• You'll be the trip lead with full admin access</li>
              <li>• Invite friends and assign admin roles</li>
              <li>• Track expenses and split costs</li>
              <li>• Monitor carbon footprint together</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/groups')}
              className="flex-1 px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Creating...' : `✅ Create Trip (${activities.length} activities)`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupTrip;
