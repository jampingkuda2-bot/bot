const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the paused song'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    queue.player.unpause();
    await interaction.reply('▶️ Resumed.');
  },
};
