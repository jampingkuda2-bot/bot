const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the current queue'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || player.queue.length < 2) {
      return interaction.reply({ content: '❌ Not enough songs in the queue to shuffle.', ephemeral: true });
    }

    player.queue.shuffle();
    await interaction.reply('🔀 Queue shuffled!');
  },
};
