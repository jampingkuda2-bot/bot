const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a song from the queue by its position')
    .addIntegerOption((o) => o.setName('position').setDescription('Position in the queue (use /queue to see numbers)').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || !queue.songs.length) return interaction.reply({ content: '❌ The queue is empty.', ephemeral: true });

    const position = interaction.options.getInteger('position');
    const song = queue.songs[position];
    if (!song) return interaction.reply({ content: '❌ No song found at that position.', ephemeral: true });

    queue.songs.splice(position, 1);
    await interaction.reply(`🗑️ Removed **${song.title}** from the queue.`);
  },
};
