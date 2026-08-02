const { spawn } = require('child_process');
const { PassThrough } = require('stream');
const { getProxyList } = require('./proxyPool');
const { getCookiesPath } = require('./cookies');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function spawnAttempt(url, proxy, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const ytArgs = ['-f', 'bestaudio', '-o', '-', '--no-playlist', '--quiet', '--no-warnings', '--extractor-args', 'youtube:player_client=android,web'];
    const cookies = getCookiesPath();
    if (cookies) ytArgs.push('--cookies', cookies);
    if (proxy) ytArgs.push('--proxy', proxy);
    ytArgs.push(url);

    const ytdlp = spawn('yt-dlp', ytArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let ytErr = '';
    ytdlp.stderr.on('data', (d) => (ytErr += d.toString()));
    ytdlp.on('error', (e) => finish(new Error(`yt-dlp spawn error: ${e.message}`)));

    const ffmpeg = spawn(
      'ffmpeg',
      ['-i', 'pipe:0', '-analyzeduration', '0', '-loglevel', 'error', '-f', 's16le', '-ar', '48000', '-ac', '2', 'pipe:1'],
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );
    ytdlp.stdout.pipe(ffmpeg.stdin);

    let ffErr = '';
    ffmpeg.stderr.on('data', (d) => (ffErr += d.toString()));
    ffmpeg.on('error', (e) => finish(new Error(`ffmpeg spawn error: ${e.message}`)));

    const output = new PassThrough();
    let settled = false;
    let bytesReceived = 0;
    const MIN_BYTES_TO_CONFIRM = 65536;

    function cleanupProcs() {
      try { ytdlp.kill('SIGKILL'); } catch {}
      try { ffmpeg.kill('SIGKILL'); } catch {}
    }

    function finish(err) {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      if (err) {
        cleanupProcs();
        reject(err);
      } else {
        resolve(output);
      }
    }

    ffmpeg.stdout.on('data', (chunk) => {
      output.write(chunk);
      bytesReceived += chunk.length;
      if (!settled && bytesReceived >= MIN_BYTES_TO_CONFIRM) {
        finish();
      }
    });
    ffmpeg.stdout.on('end', () => {
      output.end();
      if (!settled) {
        finish(new Error(`Stream ended too early (only ${bytesReceived} bytes received)`));
      }
    });

    ffmpeg.on('close', (code) => {
      if (!settled) {
        finish(new Error(`No audio (ffmpeg code ${code}): ${(ffErr || ytErr).trim().slice(0, 300) || 'no output'}`));
      }
    });

    const watchdog = setTimeout(() => {
      finish(new Error(`Timed out after ${timeoutMs / 1000}s waiting for audio`));
    }, timeoutMs);
  });
}

async function getStream(url) {
  const proxies = getProxyList();
  const candidates = shuffle([...proxies]);
  candidates.push(null);

  let lastError;
  for (const proxy of candidates) {
    const label = proxy ? proxy.replace(/\/\/.*@/, '//<hidden>@') : 'direct connection';
    console.log(`🔄 Trying stream via ${label}...`);
    try {
      const stream = await spawnAttempt(url, proxy);
      console.log(`✅ Stream established via ${label}`);
      return stream;
    } catch (err) {
      console.error(`⚠️ Failed via ${label}: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError || new Error('All streaming attempts failed');
}

module.exports = { getStream };
