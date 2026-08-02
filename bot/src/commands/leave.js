const { SlashCommandBuilder } = require('discord.js');
const { getQueue, destroyQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder().setName('leave').setDescription('Stop music and leave the voice channel'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ I am not in a voice channel.', ephemeral: true });
    destroyQueue(interaction.guildId);
    await interaction.reply('👋 Left the voice channel.');
  },
};
