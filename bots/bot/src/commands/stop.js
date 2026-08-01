const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music and clear the entire queue'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }

    player.queue.clear();
    player.skip();
    await interaction.reply('⏹️ Stopped playback and cleared the queue.');
  },
};
