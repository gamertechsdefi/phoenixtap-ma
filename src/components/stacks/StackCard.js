import TaskCard from '@/components/cards/tasksCard';
import { stackTask, handleStackComplete } from './StackHandler';

export default function StackCard({ onTaskComplete, disabled }) {
  return (
    <TaskCard
      task={stackTask}
      onComplete={() => handleStackComplete(onTaskComplete)}
      disabled={disabled}
    />
  );
}