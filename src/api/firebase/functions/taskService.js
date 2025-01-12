import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  increment,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';

const isTaskAvailable = (lastCompletedAt, taskType) => {
  if (!lastCompletedAt) return true;

  const now = new Date();
  const resetTime = new Date(now);
  resetTime.setHours(0, 0, 0, 0); // Start of current day

  const completionDate = lastCompletedAt.toDate();

  switch (taskType) {
    case 'daily':
    case 'stacks':
      return completionDate < resetTime;
    case 'socials':
    case 'partners':
      return false;
    default:
      return true;
  }
};

export const taskService = {
  async fetchTasks(category) {
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

  async fetchPartnerTasks() {
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

  async getUserTaskState(userId, taskId, category) {
    try {
      const taskHistoryRef = doc(db, 'users', userId, 'taskHistory', taskId);
      const snapshot = await getDoc(taskHistoryRef);
      
      if (!snapshot.exists()) {
        return { completed: false, available: true };
      }

      const data = snapshot.data();
      const available = isTaskAvailable(data.lastCompletedAt, category);

      return {
        completed: !available,
        available,
        lastCompletedAt: data.lastCompletedAt
      };
    } catch (error) {
      console.error('Error getting task state:', error);
      return { completed: false, available: true };
    }
  },

  async completeTask(userId, taskId, category) {
    try {
      // Check task availability first
      const taskState = await this.getUserTaskState(userId, taskId, category);
      if (!taskState.available) {
        return { 
          success: false, 
          error: 'Task is not available for completion' 
        };
      }
aa
      const userRef = doc(db, 'users', userId);
      const taskRef = doc(db, 'tasks', taskId);
      const taskHistoryRef = doc(db, 'users', userId, 'taskHistory', taskId);

      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        throw new Error('Task not found');
      }

      const taskData = taskSnap.data();
      const xpReward = taskData.xpReward || 0;

      // Update task history
      await setDoc(taskHistoryRef, {
        lastCompletedAt: serverTimestamp(),
        type: category,
        xpReward,
        taskId,
        completedAt: serverTimestamp()
      }, { merge: true });

      // Update user stats
      await updateDoc(userRef, {
        [`stats.completedTasks.${category}`]: increment(1),
        'stats.currentXP': increment(xpReward),
        'stats.totalXP': increment(xpReward),
        lastUpdated: serverTimestamp()
      });

      // For one-time tasks, mark them as inactive
      if (category === 'socials') {
        await updateDoc(taskRef, {
          active: false,
          lastCompletedAt: serverTimestamp(),
          lastCompletedBy: userId
        });
      }

      return { success: true, xpEarned: xpReward };
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, error: error.message };
    }
  },

  async completePartnerTask(userId, partnerId) {
    try {
      // Check if already completed
      const isCompleted = await this.checkPartnerTaskCompletion(userId, partnerId);
      if (isCompleted) {
        return { 
          success: false, 
          error: 'Partner task already completed' 
        };
      }

      const userRef = doc(db, 'users', userId);
      const partnerRef = doc(db, 'partners', partnerId);
      const taskHistoryRef = doc(db, 'users', userId, 'taskHistory', partnerId);

      const partnerSnap = await getDoc(partnerRef);
      if (!partnerSnap.exists()) {
        throw new Error('Partner not found');
      }

      const partnerData = partnerSnap.data();
      const xpReward = partnerData.xpReward || 0;

      // Update task history
      await setDoc(taskHistoryRef, {
        lastCompletedAt: serverTimestamp(),
        type: 'partners',
        xpReward,
        taskId: partnerId,
        completedAt: serverTimestamp()
      }, { merge: true });

      // Update user data
      await updateDoc(userRef, {
        [`completedPartners.${partnerId}`]: {
          completedAt: serverTimestamp(),
          xpEarned: xpReward
        },
        'stats.currentXP': increment(xpReward),
        'stats.totalXP': increment(xpReward),
        lastUpdated: serverTimestamp()
      });

      // Mark partner task as inactive
      await updateDoc(partnerRef, {
        active: false,
        lastCompletedAt: serverTimestamp(),
        lastCompletedBy: userId
      });

      return { success: true, xpEarned: xpReward };
    } catch (error) {
      console.error('Error completing partner task:', error);
      return { success: false, error: error.message };
    }
  },

  async checkPartnerTaskCompletion(userId, partnerId) {
    try {
      const taskHistoryRef = doc(db, 'users', userId, 'taskHistory', partnerId);
      const snapshot = await getDoc(taskHistoryRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking partner task completion:', error);
      return false;
    }
  },

  async getTaskHistory(userId) {
    try {
      const historyRef = collection(db, 'users', userId, 'taskHistory');
      const snapshot = await getDocs(historyRef);
      
      const history = {};
      snapshot.forEach(doc => {
        history[doc.id] = doc.data();
      });
      
      return history;
    } catch (error) {
      console.error('Error getting task history:', error);
      return {};
    }
  }
};