const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show info about the currently playing song'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }

    const track = player.queue.current;
    const embed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle('🎶 Now Playing')
      .setDescription(`**${track.title}**`)
      .addFields(
        { name: 'Duration', value: client.formatDuration(track.length), inline: true },
        { name: 'Requested by', value: `${track.requester}`, inline: true },
        { name: 'Volume', value: `${player.volume}%`, inline: true }
      )
      .setThumbnail(track.thumbnail || null);

    await interaction.reply({ embeds: [embed] });
  },
};
