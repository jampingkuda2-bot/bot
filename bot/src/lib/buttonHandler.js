const { AudioPlayerStatus } = require('@discordjs/voice');
const { getQueue } = require('./queueManager');

const LOOP_LABEL = { none: 'Off', track: 'Song', queue: 'Queue' };

async function handleButton(interaction) {
  const queue = getQueue(interaction.guildId);
  if (!queue) {
    return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
  }

  switch (interaction.customId) {
    case 'music_pauseresume': {
      if (queue.player.state.status === AudioPlayerStatus.Paused) {
        queue.player.unpause();
        await interaction.reply({ content: '▶️ Resumed.', ephemeral: true });
      } else {
        queue.player.pause();
        await interaction.reply({ content: '⏸️ Paused.', ephemeral: true });
      }
      break;
    }
    case 'music_skip': {
      queue.player.stop();
      await interaction.reply({ content: '⏭️ Skipped!', ephemeral: true });
      break;
    }
    case 'music_stop': {
      queue.songs = [];
      queue.loop = 'none';
      queue.player.stop();
      await interaction.reply({ content: '⏹️ Stopped and cleared the queue.', ephemeral: true });
      break;
    }
    case 'music_queue': {
      if (!queue.songs.length) {
        await interaction.reply({ content: 'Queue is empty.', ephemeral: true });
        break;
      }
      const list = queue.songs
        .slice(0, 10)
        .map((s, i) => (i === 0 ? `🎶 **Now Playing:** ${s.title}` : `**${i}.** ${s.title}`))
        .join('\n');
      await interaction.reply({
        content: `${list}\n\n_${queue.songs.length} song(s) total | Volume: ${queue.volume}% | Loop: ${LOOP_LABEL[queue.loop]}_`,
        ephemeral: true,
      });
      break;
    }
    default:
      await interaction.reply({ content: 'Unknown action.', ephemeral: true });
  }
}

module.exports = { handleButton };
