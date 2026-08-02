const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop music and clear the entire queue'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    queue.songs = [];
    queue.loop = 'none';
    queue.player.stop();
    await interaction.reply('⏹️ Stopped playback and cleared the queue.');
  },
};
