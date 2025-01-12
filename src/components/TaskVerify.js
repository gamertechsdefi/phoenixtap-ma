'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheck = () => {
    const timeSpent = (Date.now() - startTime) / 1000;
    
    if (timeSpent >= seconds) {
      setStatus('success');
      onComplete?.();
    } else {
      setStatus('failed');
      setTimeout(() => {
        setStatus('waiting');
      }, 2000); // Reset to waiting state after 2 seconds
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
    >
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative bg-neutral-900 rounded-lg p-6 max-w-sm w-full shadow-xl">
        <div className="text-center">
          
          <h3 className="text-lg font-semibold mb-2">
            {status === 'success' && 'Task Verified!'}
            {status === 'failed' && 'Verification Failed'}
            {status === 'waiting' && `Verifying ${taskTitle}`}
          </h3>

          {status === 'waiting' && (
            <>              
              <button
                onClick={handleCheck}
                className="bg-neutral-100 hover:bg-neutral-200 
                  text-neutral-900 px-6 py-2 rounded-lg 
                  transition-colors duration-200"
              >
                Check Task
              </button>
            </>
          )}

          {status === 'failed' && (
            <p className="text-red-400 text-sm mb-4">
              Complete task and try again
            </p>
          )}

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