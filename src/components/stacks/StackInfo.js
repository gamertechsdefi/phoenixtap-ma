// components/StackTask/StackInfo.js
import { useStackAvailability } from './StackHandler';

export default function StackInfo() {
  const { resetTime } = useStackAvailability();

  if (!resetTime) return null;

  const timeRemaining = resetTime - new Date();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="font-semibold text-lg">{stackTask.title}</h3>
      <p className="text-gray-600 mt-1">
        Available in {hoursRemaining}h {minutesRemaining}m
      </p>
    </div>
  );
}