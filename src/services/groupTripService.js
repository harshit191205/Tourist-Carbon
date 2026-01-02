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
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const GROUP_TRIPS_COLLECTION = 'groupTrips';

// Helper to clean undefined values
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

// Generate unique invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Create a new group trip
export const createGroupTrip = async (organizerId, groupData) => {
  try {
    console.log('🎯 Creating group trip...');
    
    const inviteCode = generateInviteCode();
    
    const groupTrip = cleanUndefined({
      // Basic Info
      groupName: groupData.groupName,
      groupSize: groupData.groupSize || 1,
      groupType: groupData.groupType || 'friends',
      tripOrganizer: organizerId,
      
      // Members
      members: [{
        memberId: organizerId,
        name: groupData.organizerName || 'Organizer',
        email: groupData.organizerEmail || '',
        role: 'organizer',
        joinedAt: Timestamp.now(),
        sustainabilityPriority: 'high'
      }],
      
      // Invitation
      inviteCode: inviteCode,
      isPublic: groupData.isPublic || false,
      allowMemberInvites: groupData.allowMemberInvites !== false,
      
      // Trip Details
      tripDetails: groupData.tripDetails || {},
      
      // Transport
      groupTransport: groupData.groupTransport || {
        mode: 'multiple',
        bookingType: 'individual',
        carpools: [],
        totalTransportCost: 0,
        costPerPerson: 0
      },
      
      // Accommodation
      groupAccommodation: groupData.groupAccommodation || {
        bookingType: 'individual',
        accommodation: [],
        totalCost: 0,
        costPerPerson: 0
      },
      
      // Activities
      groupActivities: groupData.groupActivities || {
        activities: [],
        optionalActivities: []
      },
      
      // Budget
      groupBudget: {
        totalBudgetPerPerson: groupData.budgetPerPerson || 0,
        totalGroupBudget: (groupData.budgetPerPerson || 0) * (groupData.groupSize || 1),
        budgetBreakdown: {
          transport: { budgeted: 0, actual: 0 },
          accommodation: { budgeted: 0, actual: 0 },
          food: { budgeted: 0, actual: 0 },
          activities: { budgeted: 0, actual: 0 },
          miscellaneous: { budgeted: 0, actual: 0 }
        },
        payments: [],
        sharedExpenses: []
      },
      
      // Sustainability
      sustainabilityGoals: {
        targetEmissionsPerPerson: 300,
        currentEmissionsPerPerson: 0,
        greenChoices: {
          publicTransport: false,
          ecoAccommodation: false,
          localFood: false,
          noPlastic: false,
          offsetCarbon: false
        },
        carbonOffsetPlan: {
          enabled: false,
          totalOffset: 0,
          costPerKg: 0.5
        }
      },
      
      // Emissions
      totalGroupEmissions: 0,
      emissionsPerPerson: 0,
      
      // Gamification
      groupRewards: {
        groupLevel: 1,
        groupLevelName: 'Green Beginners',
        totalGroupCredits: 0,
        groupAchievements: [],
        leaderboard: []
      },
      
      // Communication
      announcements: [],
      polls: [],
      tasks: [],
      
      // Metadata
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'planning' // planning, active, completed, cancelled
    });
    
    const docRef = await addDoc(collection(db, GROUP_TRIPS_COLLECTION), groupTrip);
    console.log('✅ Group trip created with ID:', docRef.id);
    
    return { success: true, id: docRef.id, inviteCode };
  } catch (error) {
    console.error('❌ Error creating group trip:', error);
    return { success: false, error: error.message };
  }
};

// Get group trip by ID
export const getGroupTrip = async (groupId) => {
  try {
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, group: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Group trip not found' };
    }
  } catch (error) {
    console.error('❌ Error getting group trip:', error);
    return { success: false, error: error.message };
  }
};

// Get group trip by invite code
export const getGroupTripByInviteCode = async (inviteCode) => {
  try {
    const q = query(
      collection(db, GROUP_TRIPS_COLLECTION),
      where('inviteCode', '==', inviteCode.toUpperCase())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { success: true, group: { id: doc.id, ...doc.data() } };
    } else {
      return { success: false, error: 'Invalid invite code' };
    }
  } catch (error) {
    console.error('❌ Error getting group by invite code:', error);
    return { success: false, error: error.message };
  }
};

// Get all group trips for a user
export const getUserGroupTrips = async (userId) => {
  try {
    const q = query(
      collection(db, GROUP_TRIPS_COLLECTION),
      where('members', 'array-contains', { memberId: userId })
    );
    
    const querySnapshot = await getDocs(q);
    const groups = [];
    
    querySnapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by created date
    groups.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
    
    console.log('✅ Fetched', groups.length, 'group trips');
    return { success: true, groups };
  } catch (error) {
    console.error('❌ Error getting user group trips:', error);
    return { success: false, error: error.message, groups: [] };
  }
};

// Join group trip with invite code
export const joinGroupTrip = async (inviteCode, userId, memberData) => {
  try {
    const groupResult = await getGroupTripByInviteCode(inviteCode);
    
    if (!groupResult.success) {
      return groupResult;
    }
    
    const group = groupResult.group;
    
    // Check if already a member
    const isMember = group.members.some(m => m.memberId === userId);
    if (isMember) {
      return { success: false, error: 'Already a member of this group' };
    }
    
    const newMember = cleanUndefined({
      memberId: userId,
      name: memberData.name || 'Member',
      email: memberData.email || '',
      role: 'member',
      joinedAt: Timestamp.now(),
      transportPreference: memberData.transportPreference || null,
      dietType: memberData.dietType || null,
      budgetRange: memberData.budgetRange || 'medium',
      sustainabilityPriority: memberData.sustainabilityPriority || 'medium'
    });
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, group.id);
    await updateDoc(docRef, {
      members: arrayUnion(newMember),
      groupSize: group.groupSize + 1,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Member joined group trip');
    return { success: true, groupId: group.id };
  } catch (error) {
    console.error('❌ Error joining group trip:', error);
    return { success: false, error: error.message };
  }
};

// Add carpool
export const addCarpool = async (groupId, carpoolData) => {
  try {
    const groupResult = await getGroupTrip(groupId);
    if (!groupResult.success) return groupResult;
    
    const group = groupResult.group;
    const carpools = group.groupTransport?.carpools || [];
    
    const newCarpool = cleanUndefined({
      id: Date.now().toString(),
      driverName: carpoolData.driverName,
      driverId: carpoolData.driverId,
      carModel: carpoolData.carModel || '',
      capacity: carpoolData.capacity || 4,
      passengers: carpoolData.passengers || [],
      pickupPoints: carpoolData.pickupPoints || [],
      fuelSharing: carpoolData.fuelSharing !== false,
      estimatedCost: carpoolData.estimatedCost || 0,
      createdAt: Timestamp.now()
    });
    
    carpools.push(newCarpool);
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      'groupTransport.carpools': carpools,
      updatedAt: Timestamp.now()
    });
    
    return { success: true, carpool: newCarpool };
  } catch (error) {
    console.error('❌ Error adding carpool:', error);
    return { success: false, error: error.message };
  }
};

// Add shared expense
export const addSharedExpense = async (groupId, expenseData) => {
  try {
    const groupResult = await getGroupTrip(groupId);
    if (!groupResult.success) return groupResult;
    
    const group = groupResult.group;
    const sharedExpenses = group.groupBudget?.sharedExpenses || [];
    
    const newExpense = cleanUndefined({
      id: Date.now().toString(),
      description: expenseData.description,
      amount: expenseData.amount,
      paidBy: expenseData.paidBy,
      paidByName: expenseData.paidByName,
      splitAmong: expenseData.splitAmong || group.groupSize,
      amountPerPerson: expenseData.amount / (expenseData.splitAmong || group.groupSize),
      category: expenseData.category || 'miscellaneous',
      date: expenseData.date || Timestamp.now(),
      createdAt: Timestamp.now()
    });
    
    sharedExpenses.push(newExpense);
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      'groupBudget.sharedExpenses': sharedExpenses,
      updatedAt: Timestamp.now()
    });
    
    return { success: true, expense: newExpense };
  } catch (error) {
    console.error('❌ Error adding shared expense:', error);
    return { success: false, error: error.message };
  }
};

// Add group activity
export const addGroupActivity = async (groupId, activityData) => {
  try {
    const groupResult = await getGroupTrip(groupId);
    if (!groupResult.success) return groupResult;
    
    const group = groupResult.group;
    const activities = group.groupActivities?.activities || [];
    
    const newActivity = cleanUndefined({
      id: Date.now().toString(),
      name: activityData.name,
      date: activityData.date || null,
      time: activityData.time || null,
      duration: activityData.duration || 0,
      location: activityData.location || '',
      totalParticipants: activityData.participants?.length || 0,
      participants: activityData.participants || [],
      nonParticipants: [],
      costPerPerson: activityData.costPerPerson || 0,
      totalCost: (activityData.costPerPerson || 0) * (activityData.participants?.length || 0),
      groupDiscount: activityData.groupDiscount || 0,
      emissionsPerPerson: activityData.emissionsPerPerson || 0,
      isOptional: activityData.isOptional || false,
      createdAt: Timestamp.now()
    });
    
    activities.push(newActivity);
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      'groupActivities.activities': activities,
      updatedAt: Timestamp.now()
    });
    
    return { success: true, activity: newActivity };
  } catch (error) {
    console.error('❌ Error adding group activity:', error);
    return { success: false, error: error.message };
  }
};

// Create poll
export const createPoll = async (groupId, pollData) => {
  try {
    const groupResult = await getGroupTrip(groupId);
    if (!groupResult.success) return groupResult;
    
    const group = groupResult.group;
    const polls = group.polls || [];
    
    const newPoll = cleanUndefined({
      id: Date.now().toString(),
      question: pollData.question,
      options: pollData.options.map(opt => ({
        text: opt,
        votes: 0,
        voters: []
      })),
      createdBy: pollData.createdBy,
      createdByName: pollData.createdByName,
      deadline: pollData.deadline || null,
      status: 'active',
      createdAt: Timestamp.now()
    });
    
    polls.push(newPoll);
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      polls: polls,
      updatedAt: Timestamp.now()
    });
    
    return { success: true, poll: newPoll };
  } catch (error) {
    console.error('❌ Error creating poll:', error);
    return { success: false, error: error.message };
  }
};

// Vote on poll
export const voteOnPoll = async (groupId, pollId, optionIndex, userId, userName) => {
  try {
    const groupResult = await getGroupTrip(groupId);
    if (!groupResult.success) return groupResult;
    
    const group = groupResult.group;
    const polls = group.polls || [];
    const pollIndex = polls.findIndex(p => p.id === pollId);
    
    if (pollIndex === -1) {
      return { success: false, error: 'Poll not found' };
    }
    
    // Check if already voted
    const hasVoted = polls[pollIndex].options.some(opt => 
      opt.voters.some(v => v.userId === userId)
    );
    
    if (hasVoted) {
      return { success: false, error: 'Already voted on this poll' };
    }
    
    // Add vote
    polls[pollIndex].options[optionIndex].votes += 1;
    polls[pollIndex].options[optionIndex].voters.push({
      userId,
      userName,
      votedAt: Timestamp.now()
    });
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      polls: polls,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error voting on poll:', error);
    return { success: false, error: error.message };
  }
};

// Add announcement
export const addAnnouncement = async (groupId, announcementData) => {
  try {
    const groupResult = await getGroupTrip(groupId);
    if (!groupResult.success) return groupResult;
    
    const group = groupResult.group;
    const announcements = group.announcements || [];
    
    const newAnnouncement = cleanUndefined({
      id: Date.now().toString(),
      title: announcementData.title,
      message: announcementData.message,
      postedBy: announcementData.postedBy,
      postedByName: announcementData.postedByName,
      priority: announcementData.priority || 'normal',
      timestamp: Timestamp.now()
    });
    
    announcements.unshift(newAnnouncement); // Add to beginning
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      announcements: announcements,
      updatedAt: Timestamp.now()
    });
    
    return { success: true, announcement: newAnnouncement };
  } catch (error) {
    console.error('❌ Error adding announcement:', error);
    return { success: false, error: error.message };
  }
};

// Add task
export const addTask = async (groupId, taskData) => {
  try {
    const groupResult = await getGroupTrip(groupId);
    if (!groupResult.success) return groupResult;
    
    const group = groupResult.group;
    const tasks = group.tasks || [];
    
    const newTask = cleanUndefined({
      id: Date.now().toString(),
      task: taskData.task,
      assignedTo: taskData.assignedTo,
      assignedToName: taskData.assignedToName,
      deadline: taskData.deadline || null,
      status: 'pending',
      priority: taskData.priority || 'medium',
      createdBy: taskData.createdBy,
      createdAt: Timestamp.now()
    });
    
    tasks.push(newTask);
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      tasks: tasks,
      updatedAt: Timestamp.now()
    });
    
    return { success: true, task: newTask };
  } catch (error) {
    console.error('❌ Error adding task:', error);
    return { success: false, error: error.message };
  }
};

// Update task status
export const updateTaskStatus = async (groupId, taskId, status) => {
  try {
    const groupResult = await getGroupTrip(groupId);
    if (!groupResult.success) return groupResult;
    
    const group = groupResult.group;
    const tasks = group.tasks || [];
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return { success: false, error: 'Task not found' };
    }
    
    tasks[taskIndex].status = status;
    tasks[taskIndex].completedAt = status === 'completed' ? Timestamp.now() : null;
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      tasks: tasks,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating task status:', error);
    return { success: false, error: error.message };
  }
};

// Update group emissions
export const updateGroupEmissions = async (groupId, memberEmissions) => {
  try {
    const totalEmissions = memberEmissions.reduce((sum, me) => sum + me.emissions, 0);
    const avgEmissions = totalEmissions / memberEmissions.length;
    
    // Update leaderboard
    const leaderboard = memberEmissions
      .map(me => ({
        memberId: me.memberId,
        memberName: me.memberName,
        emissions: me.emissions,
        creditsEarned: me.creditsEarned || 0
      }))
      .sort((a, b) => b.creditsEarned - a.creditsEarned);
    
    const docRef = doc(db, GROUP_TRIPS_COLLECTION, groupId);
    await updateDoc(docRef, {
      totalGroupEmissions: totalEmissions,
      emissionsPerPerson: avgEmissions,
      'sustainabilityGoals.currentEmissionsPerPerson': avgEmissions,
      'groupRewards.leaderboard': leaderboard,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating group emissions:', error);
    return { success: false, error: error.message };
  }
};

// Delete group trip
export const deleteGroupTrip = async (groupId) => {
  try {
    await deleteDoc(doc(db, GROUP_TRIPS_COLLECTION, groupId));
    console.log('✅ Group trip deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting group trip:', error);
    return { success: false, error: error.message };
  }
};

export default {
  createGroupTrip,
  getGroupTrip,
  getGroupTripByInviteCode,
  getUserGroupTrips,
  joinGroupTrip,
  addCarpool,
  addSharedExpense,
  addGroupActivity,
  createPoll,
  voteOnPoll,
  addAnnouncement,
  addTask,
  updateTaskStatus,
  updateGroupEmissions,
  deleteGroupTrip
};
