const fs = require('fs');
const path = require('path');
const os = require('os');

let cookiesPath = null;

function setupCookies() {
  const b64 = process.env.YOUTUBE_COOKIES_BASE64;
  if (!b64) {
    console.log('ℹ️ YOUTUBE_COOKIES_BASE64 not set — running without YouTube cookies.');
    return null;
  }

  try {
    const content = Buffer.from(b64, 'base64').toString('utf-8');
    const filePath = path.join(os.tmpdir(), 'yt-cookies.txt');
    fs.writeFileSync(filePath, content);
    cookiesPath = filePath;
    console.log('🍪 YouTube cookies loaded successfully.');
    return filePath;
  } catch (e) {
    console.error('❌ Failed to write cookies file:', e.message);
    return null;
  }
}

function getCookiesPath() {
  return cookiesPath;
}

module.exports = { setupCookies, getCookiesPath };
