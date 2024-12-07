// components/TaskCard.js
export default function TaskCard({ task, onComplete }) {
    const handleTaskClick = () => {
      if (task.url) {
        window.Telegram.WebApp.openLink(task.url);
      }
    };
  
    return (
      <div 
        className="bg-neutral-900 bg-opacity-50 rounded-lg shadow-md p-4 cursor-pointer"
        onClick={handleTaskClick}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-sm">{task.title}</h3>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-green-100 text-neutral-800 rounded-md text-sm">
                {task.xpReward} XP
              </span>
            </div>
          </div>
          {!task.completed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task);
              }}
              className="bg-neutral-100 px-4 py-2 rounded-lg text-neutral-900"
            >
              {task.category === 'socials' ? 'Start' : 'Start'}
            </button>
          )}
        </div>
      </div>
    );
  }