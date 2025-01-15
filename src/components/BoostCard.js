const BoostCard = ({ 
    title, 
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-sm text-white">{title}</span>
        </div>
  
        <div className="flex gap-2 items-center">
          <span className="px-2 py-1 bg-orange-100 text-neutral-800 rounded-md text-xs font-medium">
            {cost.toLocaleString()} taps
          </span>
          <div className={`${
            disabled || isLoading
              ? 'bg-neutral-700 text-neutral-400'
              : 'bg-neutral-100 text-neutral-900'
            } px-4 py-2 rounded-lg text-sm`}
          >
            {isLoading ? 'Applying...' : 'Apply'}
          </div>
        </div>
      </div>
    </button>
  );
  
  export default BoostCard;