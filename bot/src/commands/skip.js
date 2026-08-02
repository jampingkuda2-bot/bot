const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || !queue.songs.length) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }
    queue.player.stop(); // triggers Idle -> auto plays next
    await interaction.reply('⏭️ Skipped!');
  },
};
