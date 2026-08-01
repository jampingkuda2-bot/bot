const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the paused song'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }

    if (!player.paused) {
      return interaction.reply({ content: 'ℹ️ Playback is not paused.', ephemeral: true });
    }

    player.pause(false);
    await interaction.reply('▶️ Resumed.');
  },
};
