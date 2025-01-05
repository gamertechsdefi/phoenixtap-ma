'use client';

const LoadingState = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-900">
    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-neutral-300 animate-pulse">Loading game...</p>
  </div>
);

export default LoadingState;