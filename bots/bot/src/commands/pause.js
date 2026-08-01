const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current song'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }

    if (player.paused) {
      return interaction.reply({ content: 'ℹ️ Playback is already paused.', ephemeral: true });
    }

    player.pause(true);
    await interaction.reply('⏸️ Paused.');
  },
};
