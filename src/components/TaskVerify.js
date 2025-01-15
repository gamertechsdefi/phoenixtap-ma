'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timer, CheckCircle2, XCircle } from 'lucide-react';

const TaskVerificationTimer = ({ 
  onComplete, 
  onCancel,
  seconds = 10,
  taskTitle
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [startTime] = useState(Date.now());
  const [status, setStatus] = useState('waiting'); // 'waiting', 'success', 'failed'
  const [canCheck, setCanCheck] = useState(false);

  // Handle timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = Math.max(0, prev - 1);
        if (newTime === 0) {
          setCanCheck(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle task verification
  const handleCheck = useCallback(() => {
    const timeSpent = (Date.now() - startTime) / 1000;
    
    if (timeSpent >= seconds) {
      setStatus('success');
      setTimeout(() => {
        onComplete?.();
      }, 1000); // Slight delay to show success state
    } else {
      setStatus('failed');
      setTimeout(() => {
        setStatus('waiting');
      }, 2000); // Reset to waiting state after 2 seconds
    }
  }, [startTime, seconds, onComplete]);



  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
    >
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative bg-neutral-900 rounded-lg p-6 max-w-sm w-full shadow-xl">
        <div className="text-center">
          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            {status === 'success' && (
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            )}
            {status === 'failed' && (
              <XCircle className="w-12 h-12 text-red-500" />
            )}
            {status === 'waiting' && (
              <Timer className="w-12 h-12 text-orange-500" />
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-semibold mb-2">
            {status === 'success' && 'Task Verified!'}
            {status === 'failed' && 'Verification Failed'}
            {status === 'waiting' && `Verifying ${taskTitle}`}
          </h3>

          {/* Timer Display */}
          {status === 'waiting' && (
            <>
              <button
                onClick={handleCheck}
                disabled={!canCheck}
                className={`w-full mb-2 px-6 py-2 rounded-lg transition-all duration-200
                  ${canCheck 
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 cursor-pointer'
                    : 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                  }`}
              >
                {canCheck ? 'Verify Task' : 'Please Wait...'}
              </button>
            </>
          )}

          {/* Error Message */}
          {status === 'failed' && (
            <p className="text-red-400 text-sm mb-4">
              Please complete the task
            </p>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <p className="text-green-400 text-sm mb-4">
              Task successfully verified!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskVerificationTimer;