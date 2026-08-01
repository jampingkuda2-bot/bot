const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the current song queue'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({ content: '❌ The queue is empty.', ephemeral: true });
    }

    const upcoming = player.queue
      .slice(0, 15)
      .map((track, i) => `**${i + 1}.** ${track.title} - \`${client.formatDuration(track.length)}\``)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor('Purple')
      .setTitle('🎵 Current Queue')
      .setDescription(
        `🎶 **Now Playing:** ${player.queue.current.title} - \`${client.formatDuration(player.queue.current.length)}\`\n\n` +
          (upcoming || '_No more songs queued_')
      )
      .setFooter({
        text: `${player.queue.length} song(s) queued | Volume: ${player.volume}% | Loop: ${player.loop}`,
      });

    await interaction.reply({ embeds: [embed] });
  },
};
