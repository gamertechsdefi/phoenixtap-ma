export default function ErrorDisplay({ message, onRetry }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="text-red-500 mb-4">Error: {message}</div>
        <button 
          onClick={onRetry}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }