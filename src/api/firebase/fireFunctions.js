import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  deleteField,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { db } from "./triggers";
import { useState, useEffect, useRef, useCallback } from 'react';

export const TAP_CONFIG = {
  INACTIVITY_DELAY: 1000,
  REGEN_INTERVAL: 1000,
  REGEN_AMOUNT: 10,
  UPDATE_THRESHOLD: 50,
  DEFAULT_MAX_TAPS: 2500
};

export const createTapManager = () => {
  const state = {
    currentTaps: 0,
    maxTaps: TAP_CONFIG.DEFAULT_MAX_TAPS,
    totalTaps: 0,
    isRegenerating: false,
    pendingTotalTaps: 0,
    lastUpdateTaps: 0,
    tapMultiplier: 1,
    lastTapTime: Date.now()
  };

  let updateTimeout = null;
  let regenInterval = null;
  const subscribers = new Set();

  const notifySubscribers = () => {
    subscribers.forEach(callback => callback({ ...state }));
  };

  const updateBackend = async (userId) => {
    if (!userId) return;

    try {
      console.log('Updating backend with state:', {
        currentTaps: state.currentTaps,
        totalTaps: state.totalTaps,
        pendingTotalTaps: state.pendingTotalTaps
      });

      const userRef = doc(db, 'users', String(userId));
      await updateDoc(userRef, {
        'stats.currentTaps': state.currentTaps,
        'stats.totalTaps': state.totalTaps,
        'stats.pendingTotalTaps': state.pendingTotalTaps,
        lastUpdated: serverTimestamp()
      });
      
      state.lastUpdateTaps = state.currentTaps;
      console.log('Backend update successful');
    } catch (error) {
      console.error('Error updating backend:', error);
    }
  };

  const startRegeneration = (userId) => {
    if (regenInterval || state.isRegenerating || state.currentTaps >= state.maxTaps) {
      return;
    }
    
    const timeSinceLastTap = Date.now() - state.lastTapTime;
    if (timeSinceLastTap < TAP_CONFIG.INACTIVITY_DELAY) {
      return;
    }
    
    console.log('Starting regeneration process');
    state.isRegenerating = true;
    state.lastUpdateTaps = state.currentTaps;

    regenInterval = setInterval(async () => {
      if (state.currentTaps < state.maxTaps) {
        const previousTaps = state.currentTaps;
        state.currentTaps += TAP_CONFIG.REGEN_AMOUNT;
        
        if (state.currentTaps > state.maxTaps) {
          state.currentTaps = state.maxTaps;
        }

        console.log(`Regenerated taps: ${previousTaps} -> ${state.currentTaps}`);

        const tapsSinceLastUpdate = state.currentTaps - state.lastUpdateTaps;
        if (tapsSinceLastUpdate >= TAP_CONFIG.UPDATE_THRESHOLD || state.currentTaps === state.maxTaps) {
          await updateBackend(userId);
        }

        notifySubscribers();

        if (state.currentTaps === state.maxTaps) {
          console.log('Reached max taps, stopping regeneration');
          clearInterval(regenInterval);
          regenInterval = null;
          state.isRegenerating = false;
          await updateBackend(userId);
        }
      } else {
        console.log('Stopping regeneration - max taps reached');
        clearInterval(regenInterval);
        regenInterval = null;
        state.isRegenerating = false;
        await updateBackend(userId);
      }
    }, TAP_CONFIG.REGEN_INTERVAL);
  };

  const fetchTaps = async (userId) => {
    if (!userId) return;

    try {
      console.log('Fetching taps for user:', userId);
      const userRef = doc(db, 'users', String(userId));
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Fetched user data:', data);

        state.totalTaps = data?.stats?.totalTaps || 0;
        state.currentTaps = data?.stats?.currentTaps || 0;
        state.lastUpdateTaps = state.currentTaps;
        state.pendingTotalTaps = data?.stats?.pendingTotalTaps || 0;
        state.tapMultiplier = data?.stats?.tapMultiplier || 1;

        if (data.energy && typeof data.energy.max === 'number') {
          console.log('Setting maxTaps to:', data.energy.max);
          state.maxTaps = data.energy.max;
        }

        if (state.currentTaps > state.maxTaps) {
          state.currentTaps = state.maxTaps;
          await updateBackend(userId);
        }

        if (state.currentTaps < state.maxTaps) {
          startRegeneration(userId);
        }

        notifySubscribers();
        console.log('State after fetch:', { ...state });
      } else {
        console.warn('No document found for user:', userId);
      }
    } catch (error) {
      console.error('Error fetching taps:', error);
    }
  };

  const handleTap = async (userId) => {
    if (!userId) return false;

    state.lastTapTime = Date.now();
    
    if (state.currentTaps < state.tapMultiplier) {
      console.log('Not enough taps for multiplier:', {
        currentTaps: state.currentTaps,
        required: state.tapMultiplier
      });
      return false;
    }

    console.log('Tap stats before:', {
      currentTaps: state.currentTaps,
      totalTaps: state.totalTaps,
      multiplier: state.tapMultiplier
    });

    state.currentTaps -= state.tapMultiplier;
    
    const tapIncrease = 1 * state.tapMultiplier;
    state.totalTaps += tapIncrease;
    state.pendingTotalTaps += tapIncrease;

    console.log('Tap stats after:', {
      currentTaps: state.currentTaps,
      totalTaps: state.totalTaps,
      pendingTotalTaps: state.pendingTotalTaps
    });
    
    if (state.currentTaps === 0) {
      startRegeneration(userId);
    }
    
    notifySubscribers();

    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(async () => {
      await updateBackend(userId);
      state.pendingTotalTaps = 0;
      notifySubscribers();
      
      if (state.currentTaps < state.maxTaps) {
        startRegeneration(userId);
      }
    }, TAP_CONFIG.INACTIVITY_DELAY);

    return true;
  };

  const updateMaxTaps = async (userId) => {
    if (!userId) return false;

    try {
      console.log('Updating max taps for user:', userId);
      const userRef = doc(db, 'users', String(userId));
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Fetched energy data:', data.energy);
        
        if (data.energy && typeof data.energy.max === 'number') {
          const newMaxTaps = data.energy.max;
          console.log('New maxTaps value:', newMaxTaps);
          
          state.maxTaps = newMaxTaps;
          if (state.currentTaps > newMaxTaps) {
            state.currentTaps = newMaxTaps;
          }

          notifySubscribers();
          console.log('Updated state:', state);

          await updateDoc(userRef, {
            'stats.currentTaps': state.currentTaps,
            lastUpdated: serverTimestamp()
          });

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating max taps:', error);
      return false;
    }
  };

  const getTapManagerState = () => ({
    currentTaps: state.currentTaps,
    maxTaps: state.maxTaps,
    totalTaps: state.totalTaps,
    pendingTotalTaps: state.pendingTotalTaps,
    isRegenerating: state.isRegenerating,
    tapMultiplier: state.tapMultiplier
  });

  return {
    subscribe(callback) {
      subscribers.add(callback);
      callback(getTapManagerState());
      return () => subscribers.delete(callback);
    },

    async init(userId) {
      console.log('Initializing tap manager for user:', userId);
      if (!userId) {
        console.warn('No userId provided for initialization');
        return;
      }
      await fetchTaps(userId);
    },

    handleTap(userId) {
      return handleTap(userId);
    },

    async refreshMaxTaps(userId) {
      console.log('Refreshing max taps for user:', userId);
      if (!userId) {
        console.warn('No userId provided for refresh');
        return false;
      }
      return await updateMaxTaps(userId);
    },

    getState() {
      return getTapManagerState();
    },

    cleanup() {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      if (regenInterval) {
        clearInterval(regenInterval);
      }
      subscribers.clear();
    }
  };
};

const tapManager = createTapManager();

export const useTapManager = (userId) => {
  const [tapState, setTapState] = useState({
    currentTaps: 0,
    maxTaps: TAP_CONFIG.DEFAULT_MAX_TAPS,
    totalTaps: 0,
    pendingTotalTaps: 0,
    isRegenerating: false,
    tapMultiplier: 1
  });

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = tapManager.subscribe(setTapState);
    tapManager.init(userId);

    return () => {
      unsubscribe();
      tapManager.cleanup();
    };
  }, [userId]);

  const handleTap = useCallback(() => {
    return tapManager.handleTap(userId);
  }, [userId]);

  const refreshMaxTaps = useCallback(async () => {
    const success = await tapManager.refreshMaxTaps(userId);
    if (!success) {
      console.warn('Failed to refresh max taps');
    }
    return success;
  }, [userId]);

  return {
    currentTaps: tapState.currentTaps,
    maxTaps: tapState.maxTaps,
    totalTaps: tapState.totalTaps,
    pendingTotalTaps: tapState.pendingTotalTaps,
    isRegenerating: tapState.isRegenerating,
    tapMultiplier: tapState.tapMultiplier,
    handleTap,
    refreshMaxTaps
  };
};

// Base XP Manager functions for Firebase operations
export const xpManager = {
  async fetchXP(userId) {
    if (!userId) return 0;
    try {
      const userRef = doc(db, 'users', String(userId));
      const docSnap = await getDoc(userRef);
      return docSnap.exists() ? docSnap.data()?.stats?.totalXP || 0 : 0;
    } catch (error) {
      console.error('Error fetching XP:', error);
      return 0;
    }
  },

  async updateXP(userId, xpToAdd) {
    if (!userId || xpToAdd <= 0) return false;
    try {
      const userRef = doc(db, 'users', String(userId));
      await updateDoc(userRef, {
        'stats.totalXP': increment(xpToAdd),
        'stats.currentXP': increment(xpToAdd),
        lastUpdated: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating XP:', error);
      return false;
    }
  }
};

// Custom hook for XP management
export const useXPManager = (userId) => {
  const [totalXP, setTotalXP] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial XP
  useEffect(() => {
    let mounted = true;

    const fetchInitialXP = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const xp = await xpManager.fetchXP(userId);
        if (mounted) {
          setTotalXP(xp);
        }
      } catch (error) {
        console.error('Error fetching initial XP:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialXP();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // Update XP function
  const updateXP = useCallback(async (xpToAdd) => {
    if (!userId || !xpToAdd) return false;

    try {
      setIsLoading(true);
      const success = await xpManager.updateXP(userId, xpToAdd);
      
      if (success) {
        setTotalXP(prev => prev + xpToAdd);
      }
      
      return success;
    } catch (error) {
      console.error('Error in updateXP:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    totalXP,
    isLoading,
    updateXP
  };
};

export const taskService = {
  fetchTasks: async (category) => {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('category', '==', category),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  fetchPartnerTasks: async () => {
    try {
      const q = query(
        collection(db, 'partners'),
        where('active', '==', true),
        orderBy('position', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching partner tasks:', error);
      return [];
    }
  },

  completeTask: async (userId, taskId, category) => {
    try {
      const userRef = doc(db, 'users', userId);
      const taskRef = doc(db, 'tasks', taskId);

      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        throw new Error('Task not found');
      }

      const taskData = taskSnap.data();
      const xpReward = taskData.xpReward || 0;

      await updateDoc(taskRef, {
        completed: true,
        completedAt: serverTimestamp()
      });

      await updateDoc(userRef, {
        [`stats.completedTasks.${category}`]: increment(1),
        'stats.currentXP': increment(xpReward),
        'stats.totalXP': increment(xpReward),
        lastUpdated: serverTimestamp()
      });

      return { success: true, xpEarned: xpReward };
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, error: error.message };
    }
  },

  completePartnerTask: async (userId, partnerId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const partnerRef = doc(db, 'partners', partnerId);

      const partnerSnap = await getDoc(partnerRef);
      if (!partnerSnap.exists()) {
        throw new Error('Partner not found');
      }

      const partnerData = partnerSnap.data();
      const xpReward = partnerData.xpReward || 0;

      await updateDoc(userRef, {
        [`completedPartners.${partnerId}`]: {
          completedAt: serverTimestamp(),
          xpEarned: xpReward
        },
        'stats.currentXP': increment(xpReward),
        'stats.totalXP': increment(xpReward),
        lastUpdated: serverTimestamp()
      });

      return { success: true, xpEarned: xpReward };
    } catch (error) {
      console.error('Error completing partner task:', error);
      return { success: false, error: error.message };
    }
  },

  checkPartnerTaskCompletion: async (userId, partnerId) => {
    try {
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (!userSnap.exists()) return false;

      const userData = userSnap.data();
      return !!userData.completedPartners?.[partnerId];
    } catch (error) {
      console.error('Error checking partner task completion:', error);
      return false;
    }
  }
};

const generateReferralCode = (userId) => {
  const prefix = 'PHX';
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${randomPart}`;
};

export const referralSystem = {
  processReferral: async (newUserId) => {
    try {
      const newUserRef = doc(db, 'users', String(newUserId));
      const newUserDoc = await getDoc(newUserRef);
      
      if (!newUserDoc.exists()) return false;
      
      const userData = newUserDoc.data();
      if (!userData.pendingReferralCode || userData.referredBy) return false;

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', userData.pendingReferralCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return false;

      const referrerDoc = querySnapshot.docs[0];
      const referrerData = referrerDoc.data();
      const referrerId = referrerDoc.id;

      if (referrerId === String(newUserId)) return false;

      const batch = writeBatch(db);

      batch.update(doc(db, 'users', referrerId), {
        referralsCount: increment(1),
        totalReferralRewards: increment(100),
        'stats.currentXP': increment(100),
        'stats.totalXP': increment(100),
        lastUpdated: serverTimestamp()
      });

      batch.set(doc(db, 'users', referrerId, 'friends', String(newUserId)), {
        userId: String(newUserId),
        username: userData.username || '',
        firstName: userData.firstName || '',
        referredAt: serverTimestamp()
      });

      batch.update(newUserRef, {
        referredBy: {
          userId: referrerId,
          username: referrerData.username || '',
          firstName: referrerData.firstName || '',
          referralCode: userData.pendingReferralCode
        },
        'stats.currentXP': increment(50),
        'stats.totalXP': increment(50),
        pendingReferralCode: deleteField(),
        lastUpdated: serverTimestamp()
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  },

  initializeReferralCode: async (userId) => {
    if (!userId) return null;
    try {
      const userRef = doc(db, 'users', String(userId));
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      if (!userData.referralCode) {
        const referralCode = generateReferralCode(userId);
        await updateDoc(userRef, {
          referralCode,
          referralsCount: 0,
          totalReferralRewards: 0
        });
        return referralCode;
      }
      return userData.referralCode;
    } catch (error) {
      console.error('Error initializing referral code:', error);
      return null;
    }
  },

  getReferralStats: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', String(userId)));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      return {
        referralCode: userData.referralCode || '',
        referralsCount: userData.referralsCount || 0,
        totalRewards: userData.totalReferralRewards || 0
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return null;
    }
  },

  getFriendsList: async (userId) => {
    try {
      const friendsSnapshot = await getDocs(collection(db, 'users', String(userId), 'friends'));
      return friendsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting friends list:', error);
      return [];
    }
  }
};


// Export all functions as a single object
export const boostFunctions = {
  // Calculate the cost of a boost based on how many times it's been used
  calculateBoostCost: (boostCount) => {
    if (boostCount === 0) return 1000;
    return 1000 * Math.pow(2, boostCount);
  },

  // Fill current taps to maximum capacity
  applyCurrentTapBoost: async (userId) => {
    try {
      if (!userId) {
        return { success: false, message: 'No user ID provided' };
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return { success: false, message: 'User not found' };
      }

      const userData = userSnap.data();
      const totalTaps = userData.stats?.totalTaps || 0;
      const currentTapBoostCount = userData.stats?.currentTapBoostCount || 0;
      const maxTaps = userData.energy?.max || 2500;
      const currentTaps = userData.stats?.currentTaps || 0;
      
      const boostCost = boostFunctions.calculateBoostCost(currentTapBoostCount);

      if (totalTaps < boostCost) {
        return { 
          success: false, 
          message: `Need ${boostCost.toLocaleString()} total taps to refill. You have ${totalTaps.toLocaleString()} taps.` 
        };
      }

      if (currentTaps >= maxTaps) {
        return {
          success: false,
          message: 'Taps are already at maximum capacity'
        };
      }

      // Calculate the refill amount
      const refillAmount = maxTaps - currentTaps;

      await updateDoc(userRef, {
        'stats.currentTaps': maxTaps,
        'stats.totalTaps': increment(-boostCost),
        'stats.currentTapBoostCount': increment(1),
        lastUpdated: serverTimestamp()
      });

      return { 
        success: true, 
        message: `Successfully refilled ${refillAmount.toLocaleString()} taps`,
        stats: {
          currentTapBoostCount: currentTapBoostCount + 1,
          maxTaps,
          totalTaps: totalTaps - boostCost
        }
      };

    } catch (error) {
      console.error('Error applying current tap boost:', error);
      return { success: false, message: 'Error applying boost' };
    }
  },

  // Increase maximum tap capacity
  applyMaxTapBoost: async (userId) => {
    try {
      if (!userId) {
        return { success: false, message: 'No user ID provided' };
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return { success: false, message: 'User not found' };
      }

      const userData = userSnap.data();
      const totalTaps = userData.stats?.totalTaps || 0;
      const maxTapBoostCount = userData.stats?.maxTapBoostCount || 0;
      const currentMax = userData.energy?.max || 2500;
      
      const boostCost = boostFunctions.calculateBoostCost(maxTapBoostCount);
      const increase = 500;

      if (totalTaps < boostCost) {
        return { 
          success: false, 
          message: `Need ${boostCost.toLocaleString()} total taps to increase capacity. You have ${totalTaps.toLocaleString()} taps.` 
        };
      }

      const MAX_BOOST_LIMIT = 10000;
      if (currentMax + increase > MAX_BOOST_LIMIT) {
        return {
          success: false,
          message: `Maximum tap capacity limit (${MAX_BOOST_LIMIT.toLocaleString()}) would be exceeded`
        };
      }

      const newMaxTaps = currentMax + increase;

      await updateDoc(userRef, {
        'energy.max': newMaxTaps,
        'stats.currentTaps': increment(increase),
        'stats.totalTaps': increment(-boostCost),
        'stats.maxTapBoostCount': increment(1),
        lastUpdated: serverTimestamp()
      });

      return { 
        success: true, 
        message: `Maximum tap capacity increased by ${increase.toLocaleString()}`,
        stats: {
          maxTapBoostCount: maxTapBoostCount + 1,
          maxTaps: newMaxTaps,
          totalTaps: totalTaps - boostCost
        }
      };

    } catch (error) {
      console.error('Error applying max tap boost:', error);
      return { success: false, message: 'Error applying boost' };
    }
  }
};


export const userFunctions = {
  fetchUserDetails: async (userId) => {
    try {
      if (!userId) throw new Error('No user ID provided');

      const userSnap = await getDoc(doc(db, 'users', String(userId)));
      if (!userSnap.exists()) throw new Error('User not found');

      const userData = userSnap.data();
      return {
        success: true,
        data: {
          username: userData.username || 'Anonymous',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          stats: {
            totalTaps: userData.stats?.totalTaps || 0,
            totalXP: userData.stats?.totalXP || 0,
            currentLevel: userData.stats?.currentLevel || 1,
          }
        }
      };
    } catch (error) {
      console.error('Error fetching user details:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user details'
      };
    }
  }
};

// Group all exports
// export default {
//   createTapManager,
//   useTapManager,
//   useXPManager,
//   taskService,
//   referralSystem,
//   boostFunctions,
//   userFunctions,
//   TAP_CONFIG
// };

const functions = {
  createTapManager,
  useTapManager,
  xpManager,
  taskService,
  referralSystem,
  boostFunctions,
  userFunctions,
  TAP_CONFIG
};

export default functions;