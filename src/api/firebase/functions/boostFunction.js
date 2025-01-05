import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../triggers';
import { BOOST_CONFIG } from '../constants';

const calculateBoostCost = (boostCount) => {
  if (boostCount === 0) return BOOST_CONFIG.BASE_COST;
  return BOOST_CONFIG.BASE_COST * Math.pow(2, boostCount);
};

const applyCurrentTapBoost = async (userId) => {
  console.log('Starting current tap boost for user:', userId);
  
  try {
    if (!userId) {
      return { success: false, message: 'No user ID provided' };
    }

    const userRef = doc(db, 'users', String(userId));
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, message: 'User not found' };
    }

    const userData = userSnap.data();
    console.log('User data before boost:', userData);

    const totalTaps = userData.stats?.totalTaps || 0;
    const currentTapBoostCount = userData.stats?.currentTapBoostCount || 0;
    const currentEnergy = userData.energy?.current || 0;
    const maxEnergy = userData.energy?.max || BOOST_CONFIG.DEFAULT_MAX_TAPS;
    
    const boostCost = calculateBoostCost(currentTapBoostCount);
    console.log('Boost state:', { totalTaps, currentTapBoostCount, currentEnergy, maxEnergy, boostCost });

    if (totalTaps < boostCost) {
      return { 
        success: false, 
        message: `Need ${boostCost.toLocaleString()} total taps to refill. You have ${totalTaps.toLocaleString()} taps.` 
      };
    }

    if (currentEnergy >= maxEnergy) {
      return {
        success: false,
        message: 'Energy is already at maximum capacity'
      };
    }

    const updateData = {
      'energy.current': maxEnergy,
      'stats.totalTaps': increment(-boostCost),
      'stats.currentTapBoostCount': increment(1),
      lastUpdated: serverTimestamp()
    };

    console.log('Applying update:', updateData);
    await updateDoc(userRef, updateData);

    // Verify the update was successful
    const verifySnap = await getDoc(userRef);
    const updatedData = verifySnap.data();
    console.log('User data after boost:', updatedData);

    return { 
      success: true, 
      message: `Successfully refilled energy to ${maxEnergy}`,
      stats: {
        currentTapBoostCount: currentTapBoostCount + 1,
        totalTaps: totalTaps - boostCost,
        current: maxEnergy,
        maxTaps: maxEnergy
      }
    };

  } catch (error) {
    console.error('Error applying current tap boost:', error);
    return { success: false, message: 'Error applying boost: ' + error.message };
  }
};

const applyMaxTapBoost = async (userId) => {
  console.log('Starting max tap boost for user:', userId);
  
  try {
    if (!userId) {
      return { success: false, message: 'No user ID provided' };
    }

    const userRef = doc(db, 'users', String(userId));
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, message: 'User not found' };
    }

    const userData = userSnap.data();
    console.log('User data before boost:', userData);

    const totalTaps = userData.stats?.totalTaps || 0;
    const maxTapBoostCount = userData.stats?.maxTapBoostCount || 0;
    const currentMax = userData.energy?.max || BOOST_CONFIG.DEFAULT_MAX_TAPS;
    const currentEnergy = userData.energy?.current || 0;
    
    const boostCost = calculateBoostCost(maxTapBoostCount);
    console.log('Boost state:', { totalTaps, maxTapBoostCount, currentMax, boostCost });

    if (totalTaps < boostCost) {
      return { 
        success: false, 
        message: `Need ${boostCost.toLocaleString()} total taps to increase capacity. You have ${totalTaps.toLocaleString()} taps.` 
      };
    }

    if (currentMax + BOOST_CONFIG.TAP_INCREASE > BOOST_CONFIG.MAX_BOOST_LIMIT) {
      return {
        success: false,
        message: `Maximum energy capacity limit (${BOOST_CONFIG.MAX_BOOST_LIMIT.toLocaleString()}) would be exceeded`
      };
    }

    const newMaxTaps = currentMax + BOOST_CONFIG.TAP_INCREASE;

    const updateData = {
      'energy.max': newMaxTaps,
      'energy.current': newMaxTaps,
      'stats.totalTaps': increment(-boostCost),
      'stats.maxTapBoostCount': increment(1),
      lastUpdated: serverTimestamp()
    };

    console.log('Applying update:', updateData);
    await updateDoc(userRef, updateData);

    // Verify the update was successful
    const verifySnap = await getDoc(userRef);
    const updatedData = verifySnap.data();
    console.log('User data after boost:', updatedData);

    return { 
      success: true, 
      message: `Maximum energy capacity increased by ${BOOST_CONFIG.TAP_INCREASE.toLocaleString()}`,
      stats: {
        maxTapBoostCount: maxTapBoostCount + 1,
        totalTaps: totalTaps - boostCost,
        current: newMaxTaps,
        maxTaps: newMaxTaps
      }
    };

  } catch (error) {
    console.error('Error applying max tap boost:', error);
    return { success: false, message: 'Error applying boost: ' + error.message };
  }
};

export { calculateBoostCost, applyCurrentTapBoost, applyMaxTapBoost };

export default {
  calculateBoostCost,
  applyCurrentTapBoost,
  applyMaxTapBoost
};