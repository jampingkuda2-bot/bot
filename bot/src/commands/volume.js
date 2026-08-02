const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume')
    .addIntegerOption((o) => o.setName('level').setDescription('Volume level (0-100)').setRequired(true).setMinValue(0).setMaxValue(100)),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });

    const level = interaction.options.getInteger('level');
    queue.volume = level;
    if (queue.currentResource?.volume) queue.currentResource.volume.setVolume(level / 100);
    await interaction.reply(`🔊 Volume set to **${level}%**`);
  },
};
