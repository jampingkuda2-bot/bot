const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');
const { buildNowPlayingEmbed } = require('../lib/nowPlayingEmbed');

module.exports = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show info about the currently playing song'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || !queue.songs.length) return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });

    await interaction.reply(buildNowPlayingEmbed(queue));
  },
};
