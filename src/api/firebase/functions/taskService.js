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
    serverTimestamp 
  } from 'firebase/firestore';
  import { db } from '@/api/firebase/triggers';
  
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
  
    async completeTask(userId, taskId, category) {
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
  
    async completePartnerTask(userId, partnerId) {
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
  
    async checkPartnerTaskCompletion(userId, partnerId) {
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