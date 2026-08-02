const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');

const LOOP_LABEL = { none: 'Off', track: 'Song', queue: 'Queue' };

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the current song queue'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || !queue.songs.length) return interaction.reply({ content: '❌ The queue is empty.', ephemeral: true });

    const current = queue.songs[0];
    const upcoming =
      queue.songs
        .slice(1, 15)
        .map((s, i) => `**${i + 1}.** ${s.title} \`${s.durationText}\``)
        .join('\n') || '_No more songs queued_';

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setAuthor({ name: '🎵 Music Queue' })
      .setThumbnail(current.thumbnail || null)
      .setDescription(`**Now Playing:**\n🎶 ${current.title} \`${current.durationText}\`\n\n**Up Next:**\n${upcoming}`)
      .setFooter({
        text: `${queue.songs.length} song(s) total | Volume: ${queue.volume}% | Loop: ${LOOP_LABEL[queue.loop]}`,
      });

    await interaction.reply({ embeds: [embed] });
  },
};
