import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection names
const TRIPS_COLLECTION = 'trips';
const USERS_COLLECTION = 'users';

// Helper function to remove undefined values from objects
const cleanUndefined = (obj) => {
  if (obj === null || obj === undefined) return null;
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      const value = cleanUndefined(obj[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return obj;
};

// Save a new trip
export const saveTrip = async (userId, tripData, emissions) => {
  try {
    console.log('🔍 Attempting to save trip...');
    console.log('User ID:', userId);
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!db) {
      throw new Error('Firebase database is not initialized');
    }
    
    // Clean undefined values from the data
    const cleanedTripData = cleanUndefined(tripData);
    const cleanedEmissions = cleanUndefined(emissions);
    
    const tripDoc = {
      userId,
      tripData: cleanedTripData,
      emissions: cleanedEmissions,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    console.log('📦 Cleaned trip document:', tripDoc);
    
    const docRef = await addDoc(collection(db, TRIPS_COLLECTION), tripDoc);
    console.log('✅ Trip saved with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Error saving trip:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return { success: false, error: error.message };
  }
};

// Get all trips for a user
export const getUserTrips = async (userId) => {
  try {
    console.log('🔍 Fetching trips for user:', userId);
    
    if (!userId) {
      console.error('❌ No userId provided');
      return { success: false, error: 'User ID is required', trips: [] };
    }
    
    if (!db) {
      console.error('❌ Database not initialized');
      return { success: false, error: 'Database not initialized', trips: [] };
    }
    
    // Simple query without orderBy to avoid index issues
    const tripsRef = collection(db, TRIPS_COLLECTION);
    const q = query(tripsRef, where('userId', '==', userId));
    
    console.log('📡 Executing query...');
    const querySnapshot = await getDocs(q);
    
    console.log('📊 Query returned', querySnapshot.size, 'documents');
    
    const trips = [];
    querySnapshot.forEach((doc) => {
      const tripData = doc.data();
      console.log('📄 Trip document:', doc.id, tripData);
      trips.push({
        id: doc.id,
        ...tripData
      });
    });
    
    // Sort by createdAt manually (newest first)
    trips.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
    
    console.log('✅ Successfully fetched', trips.length, 'trips');
    console.log('Trips array:', trips);
    
    return { success: true, trips };
  } catch (error) {
    console.error('❌ Error getting trips:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return { success: false, error: error.message, trips: [] };
  }
};

// Get a specific trip by ID
export const getTripById = async (tripId) => {
  try {
    console.log('🔍 Fetching trip by ID:', tripId);
    const docRef = doc(db, TRIPS_COLLECTION, tripId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Trip found:', docSnap.data());
      return { 
        success: true, 
        trip: { id: docSnap.id, ...docSnap.data() } 
      };
    } else {
      console.log('❌ Trip not found');
      return { success: false, error: 'Trip not found' };
    }
  } catch (error) {
    console.error('❌ Error getting trip:', error);
    return { success: false, error: error.message };
  }
};

// Update a trip
export const updateTrip = async (tripId, updates) => {
  try {
    console.log('🔄 Updating trip:', tripId);
    const cleanedUpdates = cleanUndefined(updates);
    const docRef = doc(db, TRIPS_COLLECTION, tripId);
    await updateDoc(docRef, {
      ...cleanedUpdates,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Trip updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating trip:', error);
    return { success: false, error: error.message };
  }
};

// Delete a trip
export const deleteTrip = async (tripId) => {
  try {
    console.log('🗑️ Deleting trip:', tripId);
    await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
    console.log('✅ Trip deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting trip:', error);
    return { success: false, error: error.message };
  }
};

// Get recent trips (for dashboard)
export const getRecentTrips = async (userId, limitCount = 5) => {
  try {
    console.log('🔍 Fetching recent trips for user:', userId);
    
    if (!userId) {
      return { success: false, error: 'User ID is required', trips: [] };
    }
    
    const tripsRef = collection(db, TRIPS_COLLECTION);
    const q = query(
      tripsRef,
      where('userId', '==', userId),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const trips = [];
    
    querySnapshot.forEach((doc) => {
      trips.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort manually
    trips.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
    
    console.log('✅ Fetched', trips.length, 'recent trips');
    return { success: true, trips };
  } catch (error) {
    console.error('❌ Error getting recent trips:', error);
    return { success: false, error: error.message, trips: [] };
  }
};

// Calculate total carbon footprint for user
export const getUserTotalEmissions = async (userId) => {
  try {
    console.log('📊 Calculating total emissions for user:', userId);
    const result = await getUserTrips(userId);
    
    if (result.success) {
      const totalEmissions = result.trips.reduce((sum, trip) => {
        return sum + (trip.emissions?.total || 0);
      }, 0);
      
      console.log('✅ Total emissions calculated:', totalEmissions);
      return { success: true, totalEmissions, tripCount: result.trips.length };
    }
    
    return { success: false, error: 'Could not calculate emissions' };
  } catch (error) {
    console.error('❌ Error calculating total emissions:', error);
    return { success: false, error: error.message };
  }
};

// Save or update user profile
export const saveUserProfile = async (userId, profileData) => {
  try {
    console.log('💾 Saving user profile:', userId);
    const cleanedProfile = cleanUndefined(profileData);
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...cleanedProfile,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ User profile saved');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving user profile:', error);
    return { success: false, error: error.message };
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    console.log('🔍 Fetching user profile:', userId);
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ User profile found');
      return { success: true, profile: docSnap.data() };
    } else {
      console.log('❌ User profile not found');
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};
