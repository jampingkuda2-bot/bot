const { spawn } = require('child_process');
const { getRandomProxy } = require('./proxyPool');

// Spawns yt-dlp -> ffmpeg as a pipeline and returns ffmpeg's stdout as a
// raw PCM stream ready for @discordjs/voice. A fresh random proxy is picked
// for every single track, so consecutive plays don't reuse the same IP.
function spawnStream(url) {
  const proxy = getRandomProxy();

  const ytArgs = ['-f', 'bestaudio', '-o', '-', '--no-playlist', '--quiet', '--no-warnings'];
  if (proxy) {
    ytArgs.push('--proxy', proxy);
    console.log(`🔄 Streaming via proxy: ${proxy.replace(/\/\/.*@/, '//<hidden>@')}`);
  } else {
    console.log('🔄 Streaming with no proxy (WEBSHARE_PROXIES not set)');
  }
  ytArgs.push(url);

  const ytdlp = spawn('yt-dlp', ytArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
  ytdlp.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg) console.error('[yt-dlp]', msg.slice(0, 300));
  });

  const ffmpeg = spawn(
    'ffmpeg',
    ['-i', 'pipe:0', '-analyzeduration', '0', '-loglevel', '0', '-f', 's16le', '-ar', '48000', '-ac', '2', 'pipe:1'],
    { stdio: ['pipe', 'pipe', 'pipe'] }
  );

  ytdlp.stdout.pipe(ffmpeg.stdin);
  ffmpeg.stderr.on('data', () => {}); // ffmpeg logging suppressed (loglevel 0 already quiets most)

  const cleanup = () => {
    try { ytdlp.kill('SIGKILL'); } catch {}
    try { ffmpeg.kill('SIGKILL'); } catch {}
  };
  ffmpeg.on('close', cleanup);
  ffmpeg.stdout.on('close', cleanup);

  return ffmpeg.stdout;
}

module.exports = { spawnStream };
