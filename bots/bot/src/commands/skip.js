const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }

    const hasNext = player.queue.length > 0;
    player.skip();
    await interaction.reply(hasNext ? '⏭️ Skipped!' : '⏭️ Skipped! That was the last song in the queue.');
  },
};
