export const TAP_CONFIG = {
  INACTIVITY_DELAY: 5000,    // 5 seconds before starting regen
  REGEN_INTERVAL: 1000,       // Regenerate every 100ms for smoother animation
  REGEN_AMOUNT: 1,           // Smaller amount but more frequent
  UPDATE_THRESHOLD: 50,      // Update backend every 50 taps
  DEFAULT_MAX_TAPS: 2500,
  UPDATE_DEBOUNCE: 200      // Debounce updates by 200ms
};
  
  export const BOOST_CONFIG = {
    MAX_BOOST_LIMIT: 10000,
    BASE_COST: 1000,
    TAP_INCREASE: 500
  };
  
  export const XP_CONFIG = {
    REFERRAL_BONUS: {
      REFERRER: 100,
      REFERRED: 50
    }
  };