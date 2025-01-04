import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import { TAP_CONFIG } from '@/api/firebase/constants';
import { useState, useEffect, useRef, useCallback } from 'react';

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
  