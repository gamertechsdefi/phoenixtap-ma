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
    <div className="flex justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-white">{icon}</h1>
          <div className="flex flex-col font-semibold text-sm text-white">
            <span>{title}</span>
            <span>{cost.toLocaleString()} pts</span>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <div className={`${
          disabled || isLoading
            ? 'bg-neutral-700 text-neutral-400'
            : 'bg-neutral-100 text-neutral-900'
          } px-4 py-2 rounded-lg text-sm font-medium`}
        >
          {isLoading ? 'Applying...' : 'Apply'}
        </div>
      </div>
    </div>
  </button>
);

export default BoostCard;