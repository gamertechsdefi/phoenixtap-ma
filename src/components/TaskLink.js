'use client'

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import TaskCard from '@/components/cards/tasksCard';
import StackCard from '@/components/stacks/StackCard';
import StackInfo from '@/components/stacks/StackInfo';
import { useStackAvailability } from '@/components/stacks/StackHandler';

export default function TaskList({ 
  category, 
  onTaskComplete,
  userId,
  taskHistory = {}
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { stackAvailable } = useStackAvailability();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      if (category === 'partners') {
        // For partners, first get all documents
        const partnersRef = collection(db, 'partners');
        const partnerSnapshot = await getDocs(partnersRef);
        const partnerList = [];

        partnerSnapshot.forEach((doc) => {
          const data = doc.data();
          // Only include if active is true
          if (data.active) {
            const completionData = taskHistory[doc.id];
            partnerList.push({ 
              id: doc.id, 
              ...data,
              category: 'partners',
              type: 'partner',
              completed: !!completionData
            });
          }
        });

        // Sort in memory
        partnerList.sort((a, b) => {
          if (a.completed === b.completed) {
            return (a.position || 0) - (b.position || 0);
          }
          return a.completed ? 1 : -1;
        });
        
        setTasks(partnerList);
      } else {
        // For regular tasks, first get all tasks for the category
        const tasksRef = collection(db, 'tasks');
        const basicQuery = query(tasksRef, where('category', '==', category));
        const taskSnapshot = await getDocs(basicQuery);
        
        const taskList = [];
        taskSnapshot.forEach((doc) => {
          const data = doc.data();
          // Only include if active is true
          if (data.active) {
            const completionData = taskHistory[doc.id];
            taskList.push({ 
              id: doc.id, 
              ...data,
              type: 'task',
              category: category,
              completed: !!completionData
            });
          }
        });

        // Sort in memory
        taskList.sort((a, b) => {
          // First by completion status
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          // Then by creation date if available
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
        });
        
        setTasks(taskList);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [category, taskHistory]);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [fetchTasks, userId, taskHistory]);

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-400">
        Loading tasks...
      </div>
    );
  }

  const handleTaskClick = (task) => {
    // Don't allow completion if already completed
    if (task.completed) return;
    
    onTaskComplete(task);
  };

  return (
    <div className="space-y-2">
      {category === 'stacks' && (
        stackAvailable ? (
          <StackCard 
            onTaskComplete={() => handleTaskClick({ 
              id: 'stack', 
              category: 'stacks',
              type: 'stack',
              title: 'Daily Stack'
            })}
            disabled={!!taskHistory['stack']}
          />
        ) : (
          <StackInfo />
        )
      )}
      
      {tasks.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          {category === 'partners' ? 'No partners available yet' : 'No tasks available'}
        </div>
      ) : (
        tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={() => handleTaskClick(task)}
            disabled={task.completed}
          />
        ))
      )}
    </div>
  );
}