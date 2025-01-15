const StackComponent = ({ userId }) => {
    const [loading, setLoading] = useState(false);
    const [verifyingTask, setVerifyingTask] = useState(null);
    const { updateXP } = useXPManager(userId);
    const tg = window.Telegram.WebApp;
  
    const handleShareStory = async () => {
      try {
        // Check if story sharing is available
        WebApp.shareToStory({
          media: {
            type: 'photo',
            file: 'https://i.ibb.co/your-image-id/phoenix-tap.png' // Replace with your image
          },
          text: 'Join me in Phoenix Tap! 🎮✨'
        });
        
        await taskService.completeTask(userId, 'stack_share', 'stacks');
        await updateXP(50);
        
        tg.showPopup({
          title: 'Success!',
          message: 'You earned 50 XP for sharing!',
          buttons: [{ type: 'ok' }]
        });
      } catch (error) {
        console.error('Error sharing story:', error);
        tg.showPopup({
          title: 'Error',
          message: 'Failed to share story. Please try again.',
          buttons: [{ type: 'ok' }]
        });
      }
    };
  
    const handleWatchAd = async () => {
      try {
        setLoading(true);
        // Here you would integrate with your ad provider
        // For now, simulating ad watch
        
        await taskService.completeTask(userId, 'stack_ad', 'stacks');
        await updateXP(50);
        
        tg.showPopup({
          title: 'Success!',
          message: 'You earned 50 XP for watching the ad!',
          buttons: [{ type: 'ok' }]
        });
      } catch (error) {
        console.error('Error watching ad:', error);
        tg.showPopup({
          title: 'Error',
          message: 'Failed to complete ad task. Please try again.',
          buttons: [{ type: 'ok' }]
        });
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="space-y-4">
        {/* Watch Ad Card */}
        <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-400 mb-1">Watch Ad</h3>
              <p className="text-sm text-neutral-400">Watch an ad to earn XP</p>
              <div className="mt-2">
                <span className="px-2 py-1 bg-orange-100 text-neutral-800 rounded-md text-xs">
                  50 XP
                </span>
              </div>
            </div>
            <button
              onClick={handleWatchAd}
              disabled={loading}
              className={`px-4 py-2 rounded-lg transition-colors duration-200
                ${loading 
                  ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                }`}
            >
              {loading ? 'Loading...' : 'Watch'}
            </button>
          </div>
        </div>
  
        {/* Share Story Card */}
        <div className="bg-neutral-900 bg-opacity-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-400 mb-1">Share Story</h3>
              <p className="text-sm text-neutral-400">Share to earn XP</p>
              <div className="mt-2">
                <span className="px-2 py-1 bg-orange-100 text-neutral-800 rounded-md text-xs">
                  50 XP
                </span>
              </div>
            </div>
            <button
              onClick={handleShareStory}
              className="bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-lg text-neutral-900 transition-colors duration-200"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default StackComponent;