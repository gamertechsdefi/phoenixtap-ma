import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';

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