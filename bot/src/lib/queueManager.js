const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');
const { getStream } = require('./ytdlpStream');
const { buildNowPlayingEmbed } = require('./nowPlayingEmbed');

const guildQueues = new Map();

function getQueue(guildId) {
  return guildQueues.get(guildId);
}

function createQueue(guildId, voiceChannel, textChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  const player = createAudioPlayer();
  connection.subscribe(player);

  player.on('debug', (msg) => console.log('[AudioPlayer debug]', msg));
  connection.on('debug', (msg) => console.log('[VoiceConnection debug]', msg));
  connection.on('error', (err) => console.error('[VoiceConnection error]', err));

  const queue = {
    connection,
    player,
    textChannel,
    songs: [],
    volume: 100,
    loop: 'none', // 'none' | 'track' | 'queue'
    playing: false,
    currentResource: null,
  };
  guildQueues.set(guildId, queue);

  player.on(AudioPlayerStatus.Idle, () => handleTrackEnd(guildId));
  player.on('error', (error) => {
    console.error('Player error:', error);
    queue.textChannel?.send(`❌ Playback error: \`${(error.message || 'unknown').slice(0, 300)}\``);
    handleTrackEnd(guildId);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5000),
      ]);
    } catch {
      destroyQueue(guildId);
    }
  });

  return queue;
}

function destroyQueue(guildId) {
  const queue = guildQueues.get(guildId);
  if (!queue) return;
  try {
    queue.connection.destroy();
  } catch {}
  guildQueues.delete(guildId);
}

async function playNext(guildId) {
  const queue = guildQueues.get(guildId);
  if (!queue) return;

  if (queue.songs.length === 0) {
    queue.playing = false;
    queue.textChannel?.send('👋 Queue finished and voice channel idle, leaving...');
    destroyQueue(guildId);
    return;
  }

  const song = queue.songs[0];
  queue.playing = true;

  try {
    const stream = await getStream(song.url);
    const resource = createAudioResource(stream, { inputType: StreamType.Raw, inlineVolume: true });
    resource.volume.setVolume(queue.volume / 100);
    queue.currentResource = resource;
    queue.player.play(resource);
    queue.textChannel?.send(buildNowPlayingEmbed(queue));
  } catch (error) {
    console.error('Failed to start stream:', error);
    queue.textChannel?.send(`❌ Failed to play **${song.title}**, skipping...`);
    queue.songs.shift();
    return playNext(guildId);
  }
}

function handleTrackEnd(guildId) {
  const queue = guildQueues.get(guildId);
  if (!queue) return;

  if (queue.loop === 'queue') {
    const finished = queue.songs.shift();
    if (finished) queue.songs.push(finished);
  } else if (queue.loop !== 'track') {
    queue.songs.shift();
  }

  playNext(guildId);
}

module.exports = { getQueue, createQueue, destroyQueue, playNext, guildQueues };
