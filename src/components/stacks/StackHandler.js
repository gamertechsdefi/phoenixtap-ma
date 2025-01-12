import { useState, useEffect } from 'react';

// Define the stack task configuration
export const stackTask = {
  id: 'stack',
  title: 'Daily Stack Task',
  description: 'Complete your daily stack task',
  category: 'stacks',
  type: 'stack',
  xpReward: 100
};

// Handler for stack completion
export const handleStackComplete = async (onTaskComplete) => {
  if (onTaskComplete) {
    onTaskComplete(stackTask);
  }
};

// Custom hook to check stack availability
export const useStackAvailability = () => {
  const [stackAvailable, setStackAvailable] = useState(true);

  useEffect(() => {
    // You can add logic here to check if stack is available
    // For example, checking if user has already completed today's stack
    setStackAvailable(true);
  }, []);

  return { stackAvailable };
};