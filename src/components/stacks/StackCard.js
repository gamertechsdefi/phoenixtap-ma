// components/StackTask/StackCard.js
import TaskCard from '@/components/cards/tasksCard';
import { stackTask, handleStackComplete } from './StackHandler';

export default function StackCard({ onTaskComplete }) {
  return (
    <TaskCard
      key={stackTask.id}
      task={stackTask}
      onComplete={() => handleStackComplete(onTaskComplete)}
    />
  );
}