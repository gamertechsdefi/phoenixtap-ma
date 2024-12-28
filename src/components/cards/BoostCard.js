'use client';

const BoostCard = ({ 
  title, 
  description,
  cost, 
  onBoost, 
  isLoading, 
  disabled,
  icon
}) => (
  <button
    onClick={onBoost}
    disabled={disabled || isLoading}
    className={`w-full text-left ${
      disabled || isLoading
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-neutral-800 active:bg-neutral-700'
    } bg-neutral-900 bg-opacity-50 rounded-lg shadow-md p-4 transition-colors duration-200`}
  >
    <div className="flex justify-between gap-2 items-center">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-orange-400">{icon}</span>
          <span className="font-semibold text-sm text-white">{title}</span>
        </div>
        <p className="text-xs text-gray-400">{description}</p>
      </div>

      <div className="flex gap-2 w-16 items-center">
        <span className="px-2 py-1 bg-orange-100 text-neutral-800 rounded-md text-xs font-medium">
          {cost.toLocaleString()} points
        </span>
      </div>
    </div>
  </button>
);

export default BoostCard;