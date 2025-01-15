import { CheckCircle2 } from 'lucide-react';

const openExternalUrl = (url) => {
  try {
    const twa = window.Telegram?.WebApp;
    
    if (!url) {
      console.warn('No URL provided to open');
      return;
    }

    const urlLower = url.toLowerCase();
    
    if (twa) {
      if (urlLower.startsWith('https://t.me/') || urlLower.startsWith('tg://')) {
        twa.openTelegramLink(url);
      } else {
        twa.openLink(url);
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Error opening URL:', error);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Final fallback failed:', e);
    }
  }
};

const BaseTaskCard = ({
  task,
  onComplete,
  disabled,
  badgeColor,
  badgeText,
  buttonText = "Start"
}) => {
  const handleAction = (e) => {
    e.stopPropagation();
    if (disabled) return;

    // For all task types, first handle the URL if it exists
    if (task.url) {
      openExternalUrl(task.url);
    }

    // Always trigger verification/completion flow
    onComplete(task);
  };

  return (
    <div
      className={`bg-neutral-900 bg-opacity-50 rounded-lg shadow-md p-4 
        transition-all duration-200 
        ${disabled ? 'opacity-60' : 'hover:bg-opacity-70'}`}
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
              ${disabled ? 'bg-neutral-800 text-neutral-400' : 'bg-green-100 text-neutral-800'}`}
            >
              {task.xpReward} XP
            </span>
            {badgeText && (
              <span className={`px-2 py-1 rounded-md text-sm ${badgeColor}`}>
                {badgeText}
              </span>
            )}
          </div>
        </div>

        {!disabled && (
          <button
            onClick={handleAction}
            className="bg-neutral-100 hover:bg-neutral-200 
              px-4 py-2 rounded-lg text-neutral-900 
              transition-colors duration-200"
          >
            {task.url ? 'Visit' : buttonText}
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
};

export function DailyTaskCard({ task, onComplete, disabled }) {
  return (
    <BaseTaskCard
      task={task}
      onComplete={onComplete}
      disabled={disabled}
      badgeColor="bg-yellow-100 text-neutral-800"
      badgeText="Daily"
      buttonText="Start"
    />
  );
}

export function SocialTaskCard({ task, onComplete, disabled }) {
  return (
    <BaseTaskCard
      task={task}
      onComplete={onComplete}
      disabled={disabled}
      badgeColor="bg-blue-100 text-neutral-800"
      badgeText="Social"
      buttonText={task.url ? 'Visit' : 'Start'}
    />
  );
}

export function PartnerTaskCard({ task, onComplete, disabled }) {
  return (
    <BaseTaskCard
      task={task}
      onComplete={onComplete}
      disabled={disabled}
      badgeColor="bg-orange-100 text-neutral-800"
      badgeText="Partner"
      buttonText={task.url ? 'Visit' : 'Start'}
    />
  );
}

export default function TaskCard({ task, onComplete, disabled }) {
  const CardComponent = {
    'daily': DailyTaskCard,
    'social': SocialTaskCard,
    'partner': PartnerTaskCard
  }[task.type] || BaseTaskCard;

  return (
    <CardComponent
      task={task}
      onComplete={onComplete}
      disabled={disabled}
    />
  );
}

