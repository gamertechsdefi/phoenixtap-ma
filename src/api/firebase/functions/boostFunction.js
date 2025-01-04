import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import { BOOST_CONFIG } from '@/api/firebase/constants';

export const calculateBoostCost = (boostCount) => {
  if (boostCount === 0) return BOOST_CONFIG.BASE_COST;
  return BOOST_CONFIG.BASE_COST * Math.pow(2, boostCount);
};

export const applyCurrentTapBoost = async (userId) => {
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
    const { totalTaps, currentTapBoostCount, currentTaps } = userData.stats || {};
    const maxTaps = userData.energy?.max || BOOST_CONFIG.DEFAULT_MAX_TAPS;
    const boostCost = calculateBoostCost(currentTapBoostCount || 0);

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
        currentTapBoostCount: (currentTapBoostCount || 0) + 1,
        maxTaps,
        totalTaps: totalTaps - boostCost
      }
    };

  } catch (error) {
    console.error('Error applying current tap boost:', error);
    return { success: false, message: 'Error applying boost' };
  }
};

export const applyMaxTapBoost = async (userId) => {
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
    const { totalTaps, maxTapBoostCount } = userData.stats || {};
    const currentMax = userData.energy?.max || BOOST_CONFIG.DEFAULT_MAX_TAPS;
    
    const boostCost = calculateBoostCost(maxTapBoostCount || 0);

    if (totalTaps < boostCost) {
      return { 
        success: false, 
        message: `Need ${boostCost.toLocaleString()} total taps to increase capacity. You have ${totalTaps.toLocaleString()} taps.` 
      };
    }

    if (currentMax + BOOST_CONFIG.TAP_INCREASE > BOOST_CONFIG.MAX_BOOST_LIMIT) {
      return {
        success: false,
        message: `Maximum tap capacity limit (${BOOST_CONFIG.MAX_BOOST_LIMIT.toLocaleString()}) would be exceeded`
      };
    }

    const newMaxTaps = currentMax + BOOST_CONFIG.TAP_INCREASE;

    await updateDoc(userRef, {
      'energy.max': newMaxTaps,
      'stats.currentTaps': increment(BOOST_CONFIG.TAP_INCREASE),
      'stats.totalTaps': increment(-boostCost),
      'stats.maxTapBoostCount': increment(1),
      lastUpdated: serverTimestamp()
    });

    return { 
      success: true, 
      message: `Maximum tap capacity increased by ${BOOST_CONFIG.TAP_INCREASE.toLocaleString()}`,
      stats: {
        maxTapBoostCount: (maxTapBoostCount || 0) + 1,
        maxTaps: newMaxTaps,
        totalTaps: totalTaps - boostCost
      }
    };

  } catch (error) {
    console.error('Error applying max tap boost:', error);
    return { success: false, message: 'Error applying boost' };
  }
};

export const boostFunctions = {
  calculateBoostCost,
  applyCurrentTapBoost,
  applyMaxTapBoost
};