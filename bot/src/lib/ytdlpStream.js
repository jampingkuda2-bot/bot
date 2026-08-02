const { spawn } = require('child_process');
const { PassThrough } = require('stream');
const { getRandomProxy } = require('./proxyPool');

// Spawns yt-dlp -> ffmpeg as a pipeline and returns a raw PCM stream ready
// for @discordjs/voice. A fresh random proxy is picked for every track.
// If no audio bytes arrive within a few seconds (dead proxy, blocked video,
// etc.) this emits an 'error' on the returned stream instead of hanging
// forever silently.
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
  let ytErr = '';
  ytdlp.stderr.on('data', (d) => (ytErr += d.toString()));
  ytdlp.on('close', (code) => {
    if (code !== 0) console.error(`[yt-dlp] exited with code ${code}: ${ytErr.trim().slice(0, 500)}`);
  });
  ytdlp.on('error', (e) => console.error('[yt-dlp] spawn error:', e.message));

  const ffmpeg = spawn(
    'ffmpeg',
    ['-i', 'pipe:0', '-analyzeduration', '0', '-loglevel', 'error', '-f', 's16le', '-ar', '48000', '-ac', '2', 'pipe:1'],
    { stdio: ['pipe', 'pipe', 'pipe'] }
  );

  ytdlp.stdout.pipe(ffmpeg.stdin);

  let ffErr = '';
  ffmpeg.stderr.on('data', (d) => (ffErr += d.toString()));
  ffmpeg.on('close', (code) => {
    if (code !== 0) console.error(`[ffmpeg] exited with code ${code}: ${ffErr.trim().slice(0, 500)}`);
  });
  ffmpeg.on('error', (e) => console.error('[ffmpeg] spawn error:', e.message));

  const output = new PassThrough();
  let receivedData = false;

  ffmpeg.stdout.on('data', (chunk) => {
    receivedData = true;
    output.write(chunk);
  });
  ffmpeg.stdout.on('end', () => output.end());

  const watchdog = setTimeout(() => {
    if (!receivedData) {
      console.error('[stream] No audio data received within 8s — aborting this track.');
      cleanup();
      output.emit('error', new Error('No audio data received (proxy may have failed or track is blocked)'));
    }
  }, 8000);

  function cleanup() {
    clearTimeout(watchdog);
    try { ytdlp.kill('SIGKILL'); } catch {}
    try { ffmpeg.kill('SIGKILL'); } catch {}
  }

  ffmpeg.on('close', cleanup);
  output.on('close', cleanup);

  return output;
}

module.exports = { spawnStream };
