const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from the queue by its position')
    .addIntegerOption((option) =>
      option
        .setName('position')
        .setDescription('Position in the queue (use /queue to see numbers)')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.length) {
      return interaction.reply({ content: '❌ The queue is empty.', ephemeral: true });
    }

    const position = interaction.options.getInteger('position');
    const track = player.queue[position - 1];

    if (!track) {
      return interaction.reply({ content: '❌ No song found at that position.', ephemeral: true });
    }

    player.queue.splice(position - 1, 1);
    await interaction.reply(`🗑️ Removed **${track.title}** from the queue.`);
  },
};
