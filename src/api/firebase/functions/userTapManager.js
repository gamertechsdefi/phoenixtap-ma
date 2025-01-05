import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import { TAP_CONFIG } from '@/api/firebase/constants';
import { useState, useEffect, useRef, useCallback } from 'react';

export const createTapManager = () => {
    const state = {
      current: 0,
      maxTaps: TAP_CONFIG.DEFAULT_MAX_TAPS,
      totalTaps: 0,
      isRegenerating: false,
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
          current: state.current,
          totalTaps: state.totalTaps,
        });
    
        const userRef = doc(db, 'users', String(userId));
        await updateDoc(userRef, {
          'energy.current': state.current,
          'stats.totalTaps': state.totalTaps,
          lastUpdated: serverTimestamp()
        });
        
        state.lastUpdateTaps = state.current;
        console.log('Backend update successful');
      } catch (error) {
        console.error('Error updating backend:', error);
      }
    };
  
    const startRegeneration = (userId) => {
      // Exit if any of these conditions are met
      if (regenInterval || 
          state.isRegenerating || 
          state.current >= state.maxTaps || 
          state.current > 0) {  // Add this check to prevent regeneration if not at 0
        return;
      }
      
      const timeSinceLastTap = Date.now() - state.lastTapTime;
      if (timeSinceLastTap < TAP_CONFIG.INACTIVITY_DELAY) {
        return;
      }
      
      console.log('Starting regeneration process');
      state.isRegenerating = true;
      state.lastUpdateTaps = state.current;
    
      regenInterval = setInterval(async () => {
        if (state.current < state.maxTaps) {
          const previousTaps = state.current;
          state.current += TAP_CONFIG.REGEN_AMOUNT;
          
          if (state.current > state.maxTaps) {
            state.current = state.maxTaps;
          }
    
          console.log(`Regenerated taps: ${previousTaps} -> ${state.current}`);
    
          const tapsSinceLastUpdate = state.current - state.lastUpdateTaps;
          if (tapsSinceLastUpdate >= TAP_CONFIG.UPDATE_THRESHOLD || state.current === state.maxTaps) {
            await updateBackend(userId);
          }
    
          notifySubscribers();
    
          if (state.current === state.maxTaps) {
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
  
    // ... previous code remains the same ...

const fetchTaps = async (userId) => {
  if (!userId) return;

  try {
    console.log('Fetching taps for user:', userId);
    const userRef = doc(db, 'users', String(userId));
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Fetched user data:', data);

      // Update total taps and multiplier from stats
      state.totalTaps = data?.stats?.totalTaps || 0;
      state.tapMultiplier = data?.stats?.tapMultiplier || 1;

      // Get current taps from energy object
      state.current = data?.energy?.current ?? data?.energy?.max ?? TAP_CONFIG.DEFAULT_MAX_TAPS;
      state.lastUpdateTaps = state.current;

      // Set max taps from energy
      if (data.energy?.max) {
        console.log('Setting maxTaps to:', data.energy.max);
        state.maxTaps = data.energy.max;
      }

      // If current is undefined or null, set it to maxTaps
      if (state.current === undefined || state.current === null) {
        state.current = state.maxTaps;
        await updateDoc(userRef, {
          'energy.current': state.current,
          lastUpdated: serverTimestamp()
        });
      }

      // Ensure current doesn't exceed max
      if (state.current > state.maxTaps) {
        state.current = state.maxTaps;
        await updateBackend(userId);
      }

      // Only start regeneration if current is less than max
      if (state.current < state.maxTaps) {
        startRegeneration(userId);
      }

      notifySubscribers();
      console.log('State after fetch:', { 
        current: state.current, 
        maxTaps: state.maxTaps,
        totalTaps: state.totalTaps 
      });
    } else {
      console.warn('No document found for user:', userId);
      
      // Initialize new user with max taps
      state.current = TAP_CONFIG.DEFAULT_MAX_TAPS;
      await updateDoc(userRef, {
        'energy.current': state.current,
        'energy.max': state.maxTaps,
        lastUpdated: serverTimestamp()
      });
      notifySubscribers();
    }
  } catch (error) {
    console.error('Error fetching taps:', error);
  }
};
  
const handleTap = async (userId) => {
  if (!userId) return false;

  state.lastTapTime = Date.now();
  
  // Clear any existing regeneration
  if (regenInterval) {
    clearInterval(regenInterval);
    regenInterval = null;
    state.isRegenerating = false;
  }
  
  if (state.current < state.tapMultiplier) {
    console.log('Not enough taps for multiplier:', {
      current: state.current,
      required: state.tapMultiplier
    });
    return false;
  }

  console.log('Tap stats before:', {
    current: state.current,
    totalTaps: state.totalTaps,
    multiplier: state.tapMultiplier
  });

  state.current -= state.tapMultiplier;
  
  const tapIncrease = 1 * state.tapMultiplier;
  state.totalTaps += tapIncrease;

  console.log('Tap stats after:', {
    current: state.current,
    totalTaps: state.totalTaps,
  });
  
  // Only start regeneration if we're at 0
  if (state.current === 0) {
    startRegeneration(userId);
  }
  
  notifySubscribers();

  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = setTimeout(async () => {
    await updateBackend(userId);
    notifySubscribers();
    
    // Only start regeneration after update if we're at 0
    if (state.current === 0 && !state.isRegenerating) {
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
            if (state.current > newMaxTaps) {
              state.current = newMaxTaps;
            }
  
            notifySubscribers();
            console.log('Updated state:', state);
  
            await updateDoc(userRef, {
              'energy.current': state.current,
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
      current: state.current,
      maxTaps: state.maxTaps,
      totalTaps: state.totalTaps,
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
      current: 0,
      maxTaps: TAP_CONFIG.DEFAULT_MAX_TAPS,
      totalTaps: 0,
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
      current: tapState.current,
      maxTaps: tapState.maxTaps,
      totalTaps: tapState.totalTaps,
      isRegenerating: tapState.isRegenerating,
      tapMultiplier: tapState.tapMultiplier,
      handleTap,
      refreshMaxTaps
    };
  };
  