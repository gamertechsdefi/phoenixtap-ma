import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';

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
          },
          settings: userData.settings || {},
          energy: userData.energy || {},
          createdAt: userData.createdAt,
          lastActive: userData.lastActive
        }
      };
    } catch (error) {
      console.error('Error fetching user details:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user details'
      };
    }
  },

  updateUserSettings: async (userId, settings) => {
    try {
      if (!userId) throw new Error('No user ID provided');
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings object');
      }

      const userRef = doc(db, 'users', String(userId));
      await updateDoc(userRef, {
        settings: settings,
        lastUpdated: serverTimestamp()
      });

      return {
        success: true,
        message: 'Settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating user settings:', error);
      return {
        success: false,
        error: error.message || 'Failed to update settings'
      };
    }
  },

  updateUserProfile: async (userId, profileData) => {
    try {
      if (!userId) throw new Error('No user ID provided');
      if (!profileData || typeof profileData !== 'object') {
        throw new Error('Invalid profile data');
      }

      const userRef = doc(db, 'users', String(userId));
      await updateDoc(userRef, {
        ...profileData,
        lastUpdated: serverTimestamp()
      });

      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  },

  updateLastActive: async (userId) => {
    try {
      if (!userId) return false;

      const userRef = doc(db, 'users', String(userId));
      await updateDoc(userRef, {
        lastActive: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating last active:', error);
      return false;
    }
  },

  checkUserExists: async (userId) => {
    try {
      if (!userId) return false;

      const userSnap = await getDoc(doc(db, 'users', String(userId)));
      return userSnap.exists();
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }
};