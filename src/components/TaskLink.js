'use client'

import { useState, useEffect, useCallback } from 'react';
import TaskCard from '@/components/TaskCards';
import { taskService } from "@/api/firebase/functions/taskService";

export default function TaskList({ 
  category, 
  onTaskComplete,
  userId
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching tasks for:', category, 'userId:', userId);

      const tasksWithStatus = await taskService.getTasksWithStatus(userId, category);
      console.log('Fetched tasks:', tasksWithStatus);

      setTasks(tasksWithStatus);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [category, userId]);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [fetchTasks, userId, category]); // Added category to dependencies

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-400">
        Loading tasks...
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="text-center py-4 text-gray-400">
        {category === 'partner' ? 'No partners available yet' : 'No tasks available'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={{
            ...task,
            type: category // Ensure type matches the category
          }}
          onComplete={onTaskComplete}
          disabled={task.completed}
        />
      ))}
    </div>
  );
}