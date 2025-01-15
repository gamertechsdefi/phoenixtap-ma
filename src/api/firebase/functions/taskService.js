import { 
  doc, 
  collection, 
  getDocs, 
  getDoc, 
  setDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';

export const taskService = {
  /**
   * Get tasks with completion status
   * @param {string} userId User ID
   * @param {string} category Task category/type
   * @returns {Promise<Array>} Array of tasks with completion status
   */
  async getTasksWithStatus(userId, category) {
    try {
      // Debug logs
      console.log('=== getTasksWithStatus ===');
      console.log('Parameters:', { userId, category });

      // Basic tasks query
      const tasksRef = collection(db, 'tasks');
      console.log('Collection reference:', tasksRef.path);

      // Create query
      const q = query(tasksRef, where('type', '==', category));
      console.log('Query created for type:', category);

      // Execute query
      console.log('Executing query...');
      const querySnapshot = await getDocs(q);
      console.log('Query executed. Found docs:', querySnapshot.size);

      // Get completed tasks for the user
      const completedTasksRef = collection(db, 'users', userId, 'completed_tasks');
      const completedSnapshot = await getDocs(completedTasksRef);
      const completedTasks = {};
      
      completedSnapshot.forEach(doc => {
        completedTasks[doc.id] = doc.data();
      });

      // Process results and check completion status
      const tasks = [];
      querySnapshot.forEach(doc => {
        console.log('Processing doc:', doc.id, doc.data());
        const taskData = doc.data();
        const completionData = completedTasks[doc.id];
        
        let isCompleted = false;
        if (completionData?.lastCompleted) {
          const lastCompletionTime = completionData.lastCompleted.toDate();
          const now = new Date();
          isCompleted = (now - lastCompletionTime) < 24 * 60 * 60 * 1000;
        }

        tasks.push({
          id: doc.id,
          ...taskData,
          completed: isCompleted
        });
      });

      console.log('Processed tasks:', tasks);
      return tasks;

    } catch (error) {
      console.error('Error in getTasksWithStatus:', error);
      console.error('Full error:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      return [];
    }
  },

  /**
   * Get partner tasks with completion status
   */
  /**
   * Complete a regular task
   */
  async completeTask(userId, taskId, category) {
    try {
      console.log('Completing task:', { userId, taskId, category });
      
      // Get task details first
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        return { success: false, error: 'Task not found' };
      }

      const taskData = taskDoc.data();

      // Check if task was already completed today
      const completedTaskRef = doc(db, 'users', userId, 'completed_tasks', taskId);
      const completedTaskDoc = await getDoc(completedTaskRef);
      
      if (completedTaskDoc.exists()) {
        const completionData = completedTaskDoc.data();
        const lastCompletionTime = completionData.lastCompleted?.toDate() || new Date(0);
        const now = new Date();
        
        if (now - lastCompletionTime < 24 * 60 * 60 * 1000) {
          return { success: false, error: 'Task already completed today' };
        }
      }

      // Use a batch to ensure atomic updates
      const batch = writeBatch(db);
      
      // Update user stats
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        'stats.tasksCompleted': increment(1),
        'stats.currentXP': increment(taskData.xpReward),
        'stats.totalXP': increment(taskData.xpReward),
        lastUpdated: serverTimestamp()
      });

      // Record task completion
      batch.set(completedTaskRef, {
        taskId,
        category,
        xpEarned: taskData.xpReward,
        lastCompleted: serverTimestamp(),
        completionCount: increment(1)
      }, { merge: true });

      await batch.commit();
      console.log('Task completed successfully');

      return { 
        success: true, 
        xpEarned: taskData.xpReward 
      };

    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, error: 'Failed to complete task' };
    }
  },

  /**
   * Complete a partner task
   */
  async completePartnerTask(userId, partnerId) {
    try {
      // Get partner details first
      const partnerRef = doc(db, 'partners', partnerId);
      const partnerDoc = await getDoc(partnerRef);
      
      if (!partnerDoc.exists()) {
        return { success: false, error: 'Partner not found' };
      }

      const partnerData = partnerDoc.data();
      
      // Check if task was already completed
      const completedTaskRef = doc(db, 'users', userId, 'completed_tasks', partnerId);
      const completedTaskDoc = await getDoc(completedTaskRef);
      
      if (completedTaskDoc.exists()) {
        return { success: false, error: 'Partner task already completed' };
      }

      // Use a batch to ensure atomic updates
      const batch = writeBatch(db);
      
      // Update user stats
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        'stats.tasksCompleted': increment(1),
        'stats.currentXP': increment(partnerData.xpReward),
        'stats.totalXP': increment(partnerData.xpReward),
        lastUpdated: serverTimestamp()
      });

      // Record task completion
      batch.set(completedTaskRef, {
        partnerId,
        category: 'partners',
        xpEarned: partnerData.xpReward,
        completedAt: serverTimestamp(),
        completionCount: 1
      });

      await batch.commit();

      return { 
        success: true, 
        xpEarned: partnerData.xpReward 
      };

    } catch (error) {
      console.error('Error completing partner task:', error);
      return { success: false, error: 'Failed to complete partner task' };
    }
  },

  /**
   * Complete a stack task
   */
  
};

export default taskService;