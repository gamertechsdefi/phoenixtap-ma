import crypto from 'crypto';

// Use environment variable for BOT_TOKEN
const BOT_TOKEN = process.env.BOT_TOKEN;

export function verifyTelegramWebAppData(initData) {
  const parsed = Object.fromEntries(new URLSearchParams(initData));
  const hash = parsed.hash;
  delete parsed.hash;

  const sorted = Object.keys(parsed)
    .sort()
    .reduce((result, key) => {
      result[key] = parsed[key];
      return result;
    }, {});

  const dataCheckString = Object.keys(sorted)
    .map(key => `${key}=${sorted[key]}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();

  const signature = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return signature === hash;
}

export function extractUserData(initData) {
  const parsed = Object.fromEntries(new URLSearchParams(initData));
  
  // Log parsed data for debugging
  console.log(parsed);

  if (parsed.user) {
    return JSON.parse(parsed.user);
  }
  
  return null;
}