const { spawn } = require('child_process');
const { getRandomProxy } = require('./proxyPool');
const { getCookiesPath } = require('./cookies');

// Resolves a search term or direct URL (YouTube/SoundCloud/etc, anything
// yt-dlp supports) into basic track info, using a random proxy per call.
function resolve(query) {
  return new Promise((resolvePromise, reject) => {
    const isUrl = /^https?:\/\//i.test(query);
    const target = isUrl ? query : `ytsearch1:${query}`;
    const proxy = getRandomProxy();

    const args = ['-j', '--no-playlist', '--no-warnings', '--quiet'];
    const cookies = getCookiesPath();
    if (cookies) args.push('--cookies', cookies);
    if (proxy) args.push('--proxy', proxy);
    args.push(target);

    const proc = spawn('yt-dlp', args);
    let data = '';
    let err = '';
    proc.stdout.on('data', (d) => (data += d));
    proc.stderr.on('data', (d) => (err += d));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0 || !data) {
        return reject(new Error(err.trim().slice(0, 300) || 'yt-dlp failed to resolve track'));
      }
      try {
        const firstLine = data.trim().split('\n')[0];
        const info = JSON.parse(firstLine);
        resolvePromise({
          title: info.title || 'Unknown title',
          url: info.webpage_url || info.original_url || target,
          duration: info.duration || 0,
          thumbnail: info.thumbnail || null,
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = { resolve };
