import { CheckCircle2 } from 'lucide-react';

export default function TaskCard({ task, onComplete, disabled }) {
  const handleTaskClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onComplete(task);
  };

  return (
    <div 
      className={`bg-neutral-900 bg-opacity-50 rounded-lg shadow-md p-4 
        transition-all duration-200 
        ${disabled ? 'opacity-60' : 'hover:bg-opacity-70 cursor-pointer'}`}
      onClick={handleTaskClick}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {task.title}
            {disabled && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </h3>
          <div className="flex gap-2 mt-2">
            <span className={`px-2 py-1 rounded-md text-sm
              ${disabled 
                ? 'bg-neutral-800 text-neutral-400' 
                : 'bg-green-100 text-neutral-800'}`}
            >
              {task.xpReward} XP
            </span>
            {task.category === 'socials' && (
              <span className="px-2 py-1 bg-blue-100 text-neutral-800 rounded-md text-sm">
                Social
              </span>
            )}
            {task.type === 'partner' && (
              <span className="px-2 py-1 bg-orange-100 text-neutral-800 rounded-md text-sm">
                Partner
              </span>
            )}
          </div>
        </div>

        {!disabled && (
          <button
            onClick={handleTaskClick}
            className="bg-neutral-100 hover:bg-neutral-200 
              px-4 py-2 rounded-lg text-neutral-900 
              transition-colors duration-200"
          >
            {task.type === 'partner' ? 'Visit' : 'Start'}
          </button>
        )}

        {disabled && (
          <span className="text-sm text-neutral-500 px-4 py-2">
            Completed
          </span>
        )}
      </div>
    </div>
  );
}