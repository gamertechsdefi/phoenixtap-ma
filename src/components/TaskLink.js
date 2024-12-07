// components/TaskList.js
'use client'

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/api/firebase/triggers';
import TaskCard from '@/components/cards/tasksCard';

export default function TaskList({ category, onTaskComplete }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [category]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // First, let's try a simpler query without orderBy
      const q = query(
        collection(db, 'tasks'),
        where('category', '==', category)
      );

      const querySnapshot = await getDocs(q);
      const taskList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only add active tasks
        if (data.active !== false) {
          taskList.push({ id: doc.id, ...data });
        }
      });
      
      // Sort tasks by createdAt client-side
      taskList.sort((a, b) => {
        return b.createdAt?.seconds - a.createdAt?.seconds;
      });
      
      setTasks(taskList);
    } catch (error) {
      console.error('Specific error:', error.message);
      alert(`Error fetching tasks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center text-gray-500">No tasks available</div>
      ) : (
        tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={onTaskComplete}
          />
        ))
      )}
    </div>
  );
}