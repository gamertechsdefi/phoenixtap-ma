import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { db } from "@/api/firebase/triggers";
import { useState, useEffect, useRef, useCallback } from 'react';

const TAP_CONFIG = {
  MAX_TAPS: 2500,
  INACTIVITY_DELAY: 5000,
  REGEN_INTERVAL: 1000,
};

const createTapManager = () => {
  const state = {
    currentTaps: TAP_CONFIG.MAX_TAPS,
    totalTaps: 0,
    isRegenerating: false
  };

  let updateTimeout = null;
  let regenInterval = null;
  const subscribers = new Set();

  const notifySubscribers = () => {
    subscribers.forEach(callback => callback({ ...state }));
  };

  const startRegeneration = () => {
    if (regenInterval || state.isRegenerating) return;
    
    state.isRegenerating = true;
    regenInterval = setInterval(() => {
      if (state.currentTaps < TAP_CONFIG.MAX_TAPS) {
        state.currentTaps+=10;
        notifySubscribers();
      } else {
        clearInterval(regenInterval);
        regenInterval = null;
        state.isRegenerating = false;
      }
    }, TAP_CONFIG.REGEN_INTERVAL);
  };

  const fetchTaps = async (userId) => {
    try {
      const userRef = doc(db, 'users', String(userId));
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        state.totalTaps = data?.stats?.totalTaps || 0;
        state.currentTaps = data?.stats?.currentTaps || TAP_CONFIG.MAX_TAPS;
      }

      if (state.currentTaps === 0) {
        startRegeneration();
      }
      notifySubscribers();
    } catch (error) {
      console.error('Error fetching taps:', error);
    }
  };

  const updateTaps = async (userId) => {
    try {
      const userRef = doc(db, 'users', String(userId));
      await updateDoc(userRef, {
        'stats.currentTaps': state.currentTaps,
        'stats.totalTaps': state.totalTaps,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating taps:', error);
    }
  };

  return {
    subscribe(callback) {
      subscribers.add(callback);
      callback({ ...state });
      return () => subscribers.delete(callback);
    },

    async init(userId) {
      if (!userId) return;
      await fetchTaps(userId);
    },

    handleTap(userId) {
      if (state.currentTaps <= 0) return false;

      state.currentTaps--;
      state.totalTaps++;
      
      if (state.currentTaps === 0) {
        startRegeneration();
      }
      
      notifySubscribers();

      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      updateTimeout = setTimeout(() => {
        updateTaps(userId);
      }, TAP_CONFIG.INACTIVITY_DELAY);

      return true;
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
    currentTaps: TAP_CONFIG.MAX_TAPS,
    totalTaps: 0
  });

  useEffect(() => {
    if (!userId) return;

    tapManager.init(userId);
    const unsubscribe = tapManager.subscribe(setTapState);

    return () => {
      unsubscribe();
      tapManager.cleanup();
    };
  }, [userId]);

  const handleTap = useCallback(() => {
    return tapManager.handleTap(userId);
  }, [userId]);

  return {
    currentTaps: tapState.currentTaps,
    totalTaps: tapState.totalTaps,
    handleTap
  };
};

export const useXPManager = (userId) => {
  const [totalXP, setCurrentXP] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  const fetchUserXP = async () => {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', String(userId));
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const xp = data?.stats?.totalXP || 0;
        setCurrentXP(xp);
      }
    } catch (error) {
      console.error('Error fetching user XP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateXP = async (xpToAdd) => {
    if (!userId || xpToAdd <= 0) return;

    try {
      const userRef = doc(db, 'users', String(userId));

      await updateDoc(userRef, {
        'stats.totalXP': increment(xpToAdd),
        lastUpdated: serverTimestamp()
      });

      setCurrentXP(prev => prev + xpToAdd);
      return true;
    } catch (error) {
      console.error('Error updating XP:', error);
      return false;
    }
  };

  useEffect(() => {
    if (!userId || initialized.current) return;

    initialized.current = true;
    fetchUserXP();
  }, [userId]);

  return {
    totalXP,
    isLoading,
    updateXP
  };
};

export const taskService = {
  async fetchTasks(category) {
    try {
      const q = query(
        collection(db, 'users', 'tasks'),
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

  async completeTask(taskId, completed = true) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed,
        completedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      return false;
    }
  }
};

// Generate referral code with PHX prefix
const generateReferralCode = (userId) => {
  const prefix = 'PHX';
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${randomPart}`;
};

// Export referralSystem and its functions
export const referralSystem = {
  async processReferral(newUserId) {
      try {
          const newUserRef = doc(db, 'users', String(newUserId));
          const newUserDoc = await getDoc(newUserRef);

          if (!newUserDoc.exists()) return false;

          const userData = newUserDoc.data();
          
          if (!userData.pendingReferralCode || userData.referredBy) {
              return false;
          }

          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('referralCode', '==', userData.pendingReferralCode));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) return false;

          const referrerDoc = querySnapshot.docs[0];
          const referrerData = referrerDoc.data();
          const referrerId = referrerDoc.id;

          if (referrerId === String(newUserId)) return false;

          const batch = writeBatch(db);

          // Update referrer
          const referrerRef = doc(db, 'users', referrerId);
          batch.update(referrerRef, {
              referralsCount: increment(1),
              totalReferralRewards: increment(100),
              'stats.currentXP': increment(100),
              'stats.totalXP': increment(100),
              lastUpdated: serverTimestamp()
          });

          // Add to friends collection
          const friendRef = doc(db, 'users', referrerId, 'friends', String(newUserId));
          batch.set(friendRef, {
              userId: String(newUserId),
              username: userData.username || '',
              firstName: userData.firstName || '',
              referredAt: serverTimestamp()
          });

          // Update referred user
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

  async initializeReferralCode(userId) {
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

  async getReferralStats(userId) {
      try {
          const userRef = doc(db, 'users', String(userId));
          const userDoc = await getDoc(userRef);

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

  async getFriendsList(userId) {
      try {
          const friendsRef = collection(db, 'users', String(userId), 'friends');
          const friendsSnapshot = await getDocs(friendsRef);
          
          const friends = [];
          friendsSnapshot.forEach(doc => {
              friends.push({
                  id: doc.id,
                  ...doc.data()
              });
          });

          return friends;
      } catch (error) {
          console.error('Error getting friends list:', error);
          return [];
      }
  }
};
