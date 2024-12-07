export default function GameButton({ onTap, disabled }) {
    return (
      <button
        onClick={onTap}
        disabled={disabled}
        className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 
                   text-white font-bold py-6 px-12 rounded-full
                   shadow-lg transform active:scale-95 transition-all
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Tap to Earn!
      </button>
    );
  }