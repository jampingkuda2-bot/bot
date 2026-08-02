const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const LOOP_LABEL = { none: 'Off', track: 'Song', queue: 'Queue' };

function buildNowPlayingEmbed(queue) {
  const song = queue.songs[0];
  const upNext = queue.songs[1];

  const embed = new EmbedBuilder()
    .setColor('#1DB954')
    .setAuthor({ name: '🎶 Now Playing' })
    .setTitle(song.title)
    .setURL(song.url)
    .setThumbnail(song.thumbnail || null)
    .addFields(
      { name: 'Duration', value: song.durationText, inline: true },
      { name: 'Volume', value: `${queue.volume}%`, inline: true },
      { name: 'Loop', value: LOOP_LABEL[queue.loop], inline: true }
    )
    .setFooter({ text: `Requested by ${song.requesterTag}`, iconURL: song.requesterAvatar || undefined });

  if (upNext) {
    embed.addFields({ name: '⏭️ Up Next', value: upNext.title });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music_pauseresume').setEmoji('⏯️').setLabel('Pause/Resume').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setLabel('Skip').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setLabel('Stop').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('music_queue').setEmoji('📜').setLabel('Queue').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = { buildNowPlayingEmbed };
