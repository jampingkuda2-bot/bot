const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Stop music and leave the voice channel'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({ content: '❌ I am not in a voice channel.', ephemeral: true });
    }

    player.destroy();
    await interaction.reply('👋 Left the voice channel.');
  },
};
