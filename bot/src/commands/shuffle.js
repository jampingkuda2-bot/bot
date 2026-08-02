const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the current queue'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || queue.songs.length < 3) {
      return interaction.reply({ content: '❌ Not enough songs in the queue to shuffle.', ephemeral: true });
    }
    const [current, ...rest] = queue.songs;
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    queue.songs = [current, ...rest];
    await interaction.reply('🔀 Queue shuffled!');
  },
};
