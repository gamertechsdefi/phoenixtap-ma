import crypto from 'crypto';

/**
 * Parse and validate Telegram Mini App init data
 * @param {string} initData - Raw init data from Telegram.WebApp.initData
 * @param {string} botToken - Your Telegram bot token
 * @returns {Object} Parsed and validated data
 * @throws {Error} If validation fails
 */

const BOT_TOKEN = process.env.BOT_TOKEN;

export const validateTelegramInitData = (initData, BOT_TOKEN) => {
  try {
    // Validate input
    if (!initData || !BOT_TOKEN) {
      throw new Error('Missing required parameters');
    }

    // Convert init data to object
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      throw new Error('Hash not found in init data');
    }

    // Remove hash from data before checking
    urlParams.delete('hash');
    
    // Sort parameters alphabetically
    const paramsList = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b));
    
    // Create data check string
    const dataCheckString = paramsList
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create HMAC-SHA-256
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
    
    const generatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Validate hash
    if (generatedHash !== hash) {
      throw new Error('Invalid hash');
    }

    // Check init data timestamp (must be within last day)
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime - authDate > 86400) {
      throw new Error('Init data expired');
    }

    // Parse user data if present
    const userStr = urlParams.get('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // Return parsed and validated data
    return {
      user,
      authDate,
      queryId: urlParams.get('query_id'),
      startParam: urlParams.get('start_param'),
      canSendAfter: urlParams.get('can_send_after'),
      chatType: urlParams.get('chat_type'),
      chatInstance: urlParams.get('chat_instance'),
      isValid: true
    };

  } catch (error) {
    console.error('Init data validation error:', error);
    throw new Error(`Failed to validate init data: ${error.message}`);
  }
};

/**
 * Extract and format Telegram user data
 * @param {Object} user - User object from init data
 * @returns {Object} Formatted user data
 */
export const extractTelegramUserData = (user) => {
  if (!user) {
    throw new Error('No user data provided');
  }

  return {
    id: user.id.toString(),
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    username: user.username || '',
    languageCode: user.language_code || 'en',
    isPremium: user.is_premium || false,
    allowsWriteToPm: user.allows_write_to_pm || false,
    photoUrl: user.photo_url || null
  };
};