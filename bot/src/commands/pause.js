const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current song'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || !queue.playing) return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    queue.player.pause();
    await interaction.reply('⏸️ Paused.');
  },
};
